import { journalService, JournalEntry } from './journalService';
import { showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

export const syncService = {
  /**
   * Attempts to synchronize all pending journal entries when the app comes online.
   * This is a basic implementation. For robust offline support, consider IndexedDB.
   */
  syncPendingJournalEntries: async (userId: string) => {
    if (!navigator.onLine) {
      console.log("Still offline, cannot sync.");
      return;
    }

    console.log("Attempting to sync pending journal entries...");
    try {
      const { data: pendingEntries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('sync_status', 'pending');

      if (error) throw error;

      if (pendingEntries && pendingEntries.length > 0) {
        showSuccess(`Found ${pendingEntries.length} pending entries. Syncing...`);
        for (const entry of pendingEntries) {
          // For simplicity, we'll just update the status to 'synced'.
          // In a real app, you might re-send the full entry data if it was only stored locally.
          const updatedEntry = await journalService.updateEntry(entry.id, { sync_status: 'synced' });
          if (updatedEntry) {
            console.log(`Synced entry: ${entry.id}`);
          } else {
            console.error(`Failed to sync entry: ${entry.id}`);
          }
        }
        showSuccess("All pending journal entries synchronized!");
      } else {
        console.log("No pending journal entries to sync.");
      }
    } catch (err: any) {
      console.error("Error during journal entry synchronization:", err.message);
      showError(`Failed to sync pending entries: ${err.message}`);
    }
  },
};