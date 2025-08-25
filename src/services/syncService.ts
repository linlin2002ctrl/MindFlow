import { showError, showSuccess } from '@/utils/toast';
import { storageService } from './storageService';
// Removed: import { useTranslation } from '@/i18n/i18n.tsx';

export const syncService = {
  /**
   * Attempts to synchronize all pending journal entries when the app comes online.
   * @param {string} userId
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   */
  syncPendingJournalEntries: async (userId: string, t: (key: string, ...args: (string | number)[]) => string) => {
    if (!navigator.onLine) {
      console.log("Still offline, cannot sync.");
      return;
    }

    console.log("Attempting to sync pending journal entries...");
    try {
      await storageService.syncWithCloud(userId, t);
    } catch (err: any) {
      console.error("Error during journal entry synchronization:", err.message);
      showError(t('errorSyncingPendingEntries', err.message));
    }
  },
};