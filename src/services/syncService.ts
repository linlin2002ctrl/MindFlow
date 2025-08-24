import { showError, showSuccess } from '@/utils/toast';
import { storageService } from './storageService'; // Import storageService

export const syncService = {
  /**
   * Attempts to synchronize all pending journal entries when the app comes online.
   */
  syncPendingJournalEntries: async (userId: string) => {
    if (!navigator.onLine) {
      console.log("Still offline, cannot sync.");
      return;
    }

    console.log("Attempting to sync pending journal entries...");
    try {
      await storageService.syncWithCloud(userId);
    } catch (err: any) {
      console.error("Error during journal entry synchronization:", err.message);
      showError(`Failed to sync pending entries: ${err.message}`);
    }
  },
};