import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { storageService } from './storageService';
// Removed: import { useTranslation } from '@/i18n/i18n.tsx';

export interface AiInsight {
  id: string;
  user_id: string;
  entry_id: string | null;
  insight_type: string;
  content: string;
  created_at: string;
  sync_status: 'pending' | 'synced';
}

export const insightsService = {
  /**
   * Creates a new AI insight, saving it locally and then attempting to sync.
   * @param {Omit<AiInsight, 'id' | 'created_at' | 'sync_status'>} insightData
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<AiInsight | null>}
   */
  createInsight: async (insightData: Omit<AiInsight, 'id' | 'created_at' | 'sync_status'>, t: (key: string, ...args: (string | number)[]) => string): Promise<AiInsight | null> => {
    const newInsight: AiInsight = {
      ...insightData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      sync_status: navigator.onLine ? 'synced' : 'pending',
    };

    await storageService.cacheAiInsight(newInsight, t);

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('ai_insights').insert(newInsight).select().single(), t
        );
        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error("Error creating AI insight in Supabase, marking as pending:", error.message);
        showError(t('errorSavingInsightToCloud', error.message));
        await storageService.cacheAiInsight({ ...newInsight, sync_status: 'pending' }, t);
        return { ...newInsight, sync_status: 'pending' };
      }
    }
    return newInsight;
  },

  /**
   * Fetches AI insights for a user, prioritizing local cache.
   * @param {string} userId
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<AiInsight[] | null>}
   */
  getInsightsByUser: async (userId: string, t: (key: string, ...args: (string | number)[]) => string): Promise<AiInsight[] | null> => {
    const localInsights = await storageService.getAiInsights(userId); // No 't' needed for this specific storage call
    let remoteInsights: AiInsight[] = [];

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('ai_insights').select('*').eq('user_id', userId).order('created_at', { ascending: false }), t
        );
        if (error) throw error;
        remoteInsights = data || [];

        for (const insight of remoteInsights) {
          await storageService.cacheAiInsight({ ...insight, sync_status: 'synced' }, t);
        }
      } catch (error: any) {
        console.error("Error fetching AI insights from Supabase:", error.message);
        showError(t('errorFetchingCloudInsights', error.message));
      }
    }

    const combinedInsightsMap = new Map<string, AiInsight>();
    localInsights.forEach(insight => combinedInsightsMap.set(insight.id, insight));
    remoteInsights.forEach(insight => {
      if (!combinedInsightsMap.has(insight.id) || combinedInsightsMap.get(insight.id)?.sync_status === 'pending') {
        combinedInsightsMap.set(insight.id, insight);
      }
    });

    return Array.from(combinedInsightsMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Fetches AI insights for a specific journal entry, prioritizing local cache.
   * @param {string} entryId
   * @param {string} userId
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<AiInsight[] | null>}
   */
  getInsightsByJournalEntry: async (entryId: string, userId: string, t: (key: string, ...args: (string | number)[]) => string): Promise<AiInsight[] | null> => {
    const localInsights = (await storageService.getAiInsights(userId)).filter(i => i.entry_id === entryId); // No 't' needed for this specific storage call
    let remoteInsights: AiInsight[] = [];

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('ai_insights').select('*').eq('entry_id', entryId).order('created_at', { ascending: false }), t
        );
        if (error) throw error;
        remoteInsights = data || [];

        for (const insight of remoteInsights) {
          await storageService.cacheAiInsight({ ...insight, sync_status: 'synced' }, t);
        }
      } catch (error: any) {
        console.error("Error fetching AI insights by journal entry from Supabase:", error.message);
        showError(t('errorFetchingCloudInsightsForEntry', error.message));
      }
    }

    const combinedInsightsMap = new Map<string, AiInsight>();
    localInsights.forEach(insight => combinedInsightsMap.set(insight.id, insight));
    remoteInsights.forEach(insight => {
      if (!combinedInsightsMap.has(insight.id) || combinedInsightsMap.get(insight.id)?.sync_status === 'pending') {
        combinedInsightsMap.set(insight.id, insight);
      }
    });

    return Array.from(combinedInsightsMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
};