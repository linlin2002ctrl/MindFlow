import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { SessionType } from '@/hooks/useConversationManager';
import { showError } from '@/utils/toast';

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
  conversation: Message[];
  ai_analysis: { text: string } | null;
  tags: string[] | null;
  is_encrypted: boolean;
  sync_status: 'pending' | 'synced' | 'paused';
  entry_text: string;
}

export const journalService = {
  /**
   * Creates a new journal entry.
   * @param {Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>} entryData
   * @returns {Promise<JournalEntry | null>}
   */
  createEntry: async (entryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<JournalEntry | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('journal_entries').insert(entryData).select().single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error creating journal entry:", error.message);
      showError(`Failed to create journal entry: ${error.message}`);
      return null;
    }
  },

  /**
   * Fetches a journal entry by ID.
   * @param {string} id
   * @returns {Promise<JournalEntry | null>}
   */
  getEntry: async (id: string): Promise<JournalEntry | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('journal_entries').select('*').eq('id', id).single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching journal entry:", error.message);
      showError(`Failed to fetch journal entry: ${error.message}`);
      return null;
    }
  },

  /**
   * Fetches all journal entries for a user.
   * @param {string} userId
   * @returns {Promise<JournalEntry[] | null>}
   */
  getEntriesByUser: async (userId: string): Promise<JournalEntry[] | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching journal entries by user:", error.message);
      showError(`Failed to fetch journal entries: ${error.message}`);
      return null;
    }
  },

  /**
   * Updates an existing journal entry.
   * @param {string} id
   * @param {Partial<Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>>} updateData
   * @returns {Promise<JournalEntry | null>}
   */
  updateEntry: async (id: string, updateData: Partial<Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>>): Promise<JournalEntry | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('journal_entries').update(updateData).eq('id', id).select().single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error updating journal entry:", error.message);
      showError(`Failed to update journal entry: ${error.message}`);
      return null;
    }
  },

  /**
   * Deletes a journal entry by ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  deleteEntry: async (id: string): Promise<boolean> => {
    try {
      const { error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('journal_entries').delete().eq('id', id)
      );
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error deleting journal entry:", error.message);
      showError(`Failed to delete journal entry: ${error.message}`);
      return false;
    }
  },
};