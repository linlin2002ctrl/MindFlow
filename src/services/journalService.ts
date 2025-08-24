import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { SessionType } from '@/hooks/useConversationManager';
import { showError } from '@/utils/toast';
import { storageService } from './storageService'; // Import storageService

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface JournalEntry {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  session_type: SessionType;
  mood_rating: number | null;
  conversation: Message[] | string; // Can be Message[] or encrypted string
  ai_analysis: { text: string } | null;
  tags: string[] | null;
  is_encrypted: boolean; // New field
  sync_status: 'pending' | 'synced' | 'paused'; // New field
  entry_text: string | null; // Can be string or encrypted string
}

export const journalService = {
  /**
   * Creates a new journal entry, saving it locally first and then attempting to sync.
   * @param {Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'is_encrypted'>} entryData
   * @returns {Promise<JournalEntry | null>}
   */
  createEntry: async (entryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'is_encrypted'>): Promise<JournalEntry | null> => {
    const newEntry: JournalEntry = {
      ...entryData,
      id: crypto.randomUUID(), // Generate UUID client-side for local storage
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_encrypted: false, // Will be set to true by storageService if encrypted
      sync_status: navigator.onLine ? 'synced' : 'pending',
    };

    // Save to local storage first
    const locallySavedEntry = await storageService.saveJournalEntry(newEntry, newEntry.user_id);
    if (!locallySavedEntry) {
      showError("Failed to save journal entry locally.");
      return null;
    }

    // If online, attempt to sync with Supabase immediately
    if (navigator.onLine) {
      try {
        // Decrypt locallySavedEntry before sending to Supabase
        const decryptedEntryForSupabase = await storageService.getJournalEntry(locallySavedEntry.id, locallySavedEntry.user_id);
        if (!decryptedEntryForSupabase) throw new Error("Failed to decrypt entry for Supabase sync.");

        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('journal_entries').insert(decryptedEntryForSupabase).select().single()
        );
        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error("Error creating journal entry in Supabase, marking as pending:", error.message);
        showError(`Failed to sync entry to cloud: ${error.message}. It will sync when online.`);
        // Update local entry status to pending if Supabase failed
        await storageService.saveJournalEntry({ ...locallySavedEntry, sync_status: 'pending' }, locallySavedEntry.user_id);
        return { ...locallySavedEntry, sync_status: 'pending' };
      }
    }
    return locallySavedEntry;
  },

  /**
   * Fetches a journal entry by ID, prioritizing local storage.
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<JournalEntry | null>}
   */
  getEntry: async (id: string, userId: string): Promise<JournalEntry | null> => {
    // Try local storage first
    const localEntry = await storageService.getJournalEntry(id, userId);
    if (localEntry) return localEntry;

    // If not found locally and online, try Supabase
    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('journal_entries').select('*').eq('id', id).single()
        );
        if (error) throw error;
        // Cache in local storage for future offline access
        if (data) {
          await storageService.saveJournalEntry({ ...data, is_encrypted: false, sync_status: 'synced' }, userId); // Mark as not encrypted for storageService to encrypt
        }
        return data;
      } catch (error: any) {
        console.error("Error fetching journal entry from Supabase:", error.message);
        showError(`Failed to fetch entry from cloud: ${error.message}`);
        return null;
      }
    }
    return null; // Not found locally or remotely
  },

  /**
   * Fetches all journal entries for a user, combining local and remote.
   * @param {string} userId
   * @returns {Promise<JournalEntry[] | null>}
   */
  getEntriesByUser: async (userId: string): Promise<JournalEntry[] | null> => {
    const localEntries = await storageService.getJournalEntries(userId);
    let remoteEntries: JournalEntry[] = [];

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        );
        if (error) throw error;
        remoteEntries = data || [];

        // Update local storage with remote entries (and mark as synced)
        for (const entry of remoteEntries) {
          await storageService.saveJournalEntry({ ...entry, is_encrypted: false, sync_status: 'synced' }, userId);
        }
      } catch (error: any) {
        console.error("Error fetching journal entries by user from Supabase:", error.message);
        showError(`Failed to fetch cloud entries: ${error.message}. Showing local data.`);
      }
    }

    // Combine and deduplicate (local entries take precedence if IDs match)
    const combinedEntriesMap = new Map<string, JournalEntry>();
    localEntries.forEach(entry => combinedEntriesMap.set(entry.id, entry));
    remoteEntries.forEach(entry => {
      if (!combinedEntriesMap.has(entry.id) || combinedEntriesMap.get(entry.id)?.sync_status === 'pending') {
        combinedEntriesMap.set(entry.id, entry);
      }
    });

    return Array.from(combinedEntriesMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Updates an existing journal entry, updating locally and then attempting to sync.
   * @param {string} id
   * @param {Partial<Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>>} updateData
   * @param {string} userId
   * @returns {Promise<JournalEntry | null>}
   */
  updateEntry: async (id: string, updateData: Partial<Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>>, userId: string): Promise<JournalEntry | null> => {
    const existingEntry = await storageService.getJournalEntry(id, userId);
    if (!existingEntry) {
      showError("Entry not found for update.");
      return null;
    }

    const updatedEntry: JournalEntry = {
      ...existingEntry,
      ...updateData,
      updated_at: new Date().toISOString(),
      sync_status: navigator.onLine ? (updateData.sync_status || 'synced') : 'pending',
      is_encrypted: false, // Will be set to true by storageService if encrypted
    };

    // Save to local storage
    const locallyUpdatedEntry = await storageService.saveJournalEntry(updatedEntry, userId);
    if (!locallyUpdatedEntry) {
      showError("Failed to update journal entry locally.");
      return null;
    }

    // If online, attempt to sync with Supabase
    if (navigator.onLine) {
      try {
        // Decrypt locallyUpdatedEntry before sending to Supabase
        const decryptedEntryForSupabase = await storageService.getJournalEntry(locallyUpdatedEntry.id, locallyUpdatedEntry.user_id);
        if (!decryptedEntryForSupabase) throw new Error("Failed to decrypt entry for Supabase sync.");

        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('journal_entries').update(decryptedEntryForSupabase).eq('id', id).select().single()
        );
        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error("Error updating journal entry in Supabase, marking as pending:", error.message);
        showError(`Failed to sync update to cloud: ${error.message}. It will sync when online.`);
        // Update local entry status to pending if Supabase failed
        await storageService.saveJournalEntry({ ...locallyUpdatedEntry, sync_status: 'pending' }, userId);
        return { ...locallyUpdatedEntry, sync_status: 'pending' };
      }
    }
    return locallyUpdatedEntry;
  },

  /**
   * Deletes a journal entry by ID, deleting locally and then attempting to sync.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  deleteEntry: async (id: string): Promise<boolean> => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      showError("User not authenticated to delete entry.");
      return false;
    }

    // Delete from local storage first
    const locallyDeleted = await storageService.deleteJournalEntry(id);
    if (!locallyDeleted) {
      showError("Failed to delete journal entry locally.");
      return false;
    }

    // If online, attempt to delete from Supabase
    if (navigator.onLine) {
      try {
        const { error } = await withSupabaseRetry(async () =>
          await supabase.from('journal_entries').delete().eq('id', id)
        );
        if (error) throw error;
        return true;
      } catch (error: any) {
        console.error("Error deleting journal entry from Supabase:", error.message);
        showError(`Failed to delete entry from cloud: ${error.message}. It might reappear on other devices.`);
        return false; // Indicate remote deletion failed
      }
    }
    return true; // Successfully deleted locally
  },
};