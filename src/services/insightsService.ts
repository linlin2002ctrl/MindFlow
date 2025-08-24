import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { storageService } from './storageService'; // Import storageService

export interface AiInsight {
  id: string;
  user_id: string;
  entry_id: string | null; // Renamed from journal_entry_id to match schema
  insight_type: string;
  content: string;
  created_at: string; // Renamed from generated_at to match schema
}

export const insightsService = {
  /**
   * Creates a new AI insight, saving it locally and then attempting to sync.
   * @param {Omit<AiInsight, 'id' | 'created_at'>} insightData
   * @returns {Promise<AiInsight | null>}
   */
  createInsight: async (insightData: Omit<AiInsight, 'id' | 'created_at'>): Promise<AiInsight | null> => {
    const newInsight: AiInsight = {
      ...insightData,
      id: crypto.randomUUID(), // Generate UUID client-side
      created_at: new Date().toISOString(),
    };

    await storageService.cacheAiInsight(newInsight);

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('ai_insights').insert(newInsight).select().single()
        );
        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error("Error creating AI insight in Supabase:", error.message);
        showError(`Failed to save insight to cloud: ${error.message}. It will sync when online.`);
        return newInsight; // Return locally saved insight
      }
    }
    return newInsight;
  },

  /**
   * Fetches AI insights for a user, prioritizing local cache.
   * @param {string} userId
   * @returns {Promise<AiInsight[] | null>}
   */
  getInsightsByUser: async (userId: string): Promise<AiInsight[] | null> => {
    const localInsights = await storageService.getAiInsights(userId);
    let remoteInsights: AiInsight[] = [];

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('ai_insights').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        );
        if (error) throw error;
        remoteInsights = data || [];

        // Cache remote insights locally
        for (const insight of remoteInsights) {
          await storageService.cacheAiInsight(insight);
        }
      } catch (error: any) {
        console.error("Error fetching AI insights from Supabase:", error.message);
        showError(`Failed to fetch cloud insights: ${error.message}. Showing local data.`);
      }
    }

    // Combine and deduplicate (local insights take precedence)
    const combinedInsightsMap = new Map<string, AiInsight>();
    localInsights.forEach(insight => combinedInsightsMap.set(insight.id, insight));
    remoteInsights.forEach(insight => combinedInsightsMap.set(insight.id, insight));

    return Array.from(combinedInsightsMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Fetches AI insights for a specific journal entry, prioritizing local cache.
   * @param {string} entryId
   * @param {string} userId
   * @returns {Promise<AiInsight[] | null>}
   */
  getInsightsByJournalEntry: async (entryId: string, userId: string): Promise<AiInsight[] | null> => {
    const localInsights = (await storageService.getAiInsights(userId)).filter(i => i.entry_id === entryId);
    let remoteInsights: AiInsight[] = [];

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('ai_insights').select('*').eq('entry_id', entryId).order('created_at', { ascending: false })
        );
        if (error) throw error;
        remoteInsights = data || [];

        // Cache remote insights locally
        for (const insight of remoteInsights) {
          await storageService.cacheAiInsight(insight);
        }
      } catch (error: any) {
        console.error("Error fetching AI insights by journal entry from Supabase:", error.message);
        showError(`Failed to fetch cloud insights for entry: ${error.message}. Showing local data.`);
      }
    }

    const combinedInsightsMap = new Map<string, AiInsight>();
    localInsights.forEach(insight => combinedInsightsMap.set(insight.id, insight));
    remoteInsights.forEach(insight => combinedInsightsMap.set(insight.id, insight));

    return Array.from(combinedInsightsMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
};