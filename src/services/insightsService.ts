import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface AiInsight {
  id: string;
  user_id: string;
  journal_entry_id: string | null;
  insight_type: string;
  content: string;
  generated_at: string;
}

export const insightsService = {
  /**
   * Creates a new AI insight.
   * @param {Omit<AiInsight, 'id' | 'generated_at'>} insightData
   * @returns {Promise<AiInsight | null>}
   */
  createInsight: async (insightData: Omit<AiInsight, 'id' | 'generated_at'>): Promise<AiInsight | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('ai_insights').insert(insightData).select().single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error creating AI insight:", error.message);
      showError(`Failed to create AI insight: ${error.message}`);
      return null;
    }
  },

  /**
   * Fetches AI insights for a user.
   * @param {string} userId
   * @returns {Promise<AiInsight[] | null>}
   */
  getInsightsByUser: async (userId: string): Promise<AiInsight[] | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('ai_insights').select('*').eq('user_id', userId).order('generated_at', { ascending: false })
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching AI insights:", error.message);
      showError(`Failed to fetch AI insights: ${error.message}`);
      return null;
    }
  },

  /**
   * Fetches AI insights for a specific journal entry.
   * @param {string} entryId
   * @returns {Promise<AiInsight[] | null>}
   */
  getInsightsByJournalEntry: async (entryId: string): Promise<AiInsight[] | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('ai_insights').select('*').eq('journal_entry_id', entryId).order('generated_at', { ascending: false })
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching AI insights by journal entry:", error.message);
      showError(`Failed to fetch AI insights for entry: ${error.message}`);
      return null;
    }
  },
};