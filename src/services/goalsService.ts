import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
// Removed: import { useTranslation } from '@/i18n/i18n';

export type GoalCategory = 'Emotional' | 'Career' | 'Health' | 'Relationships' | 'General';
export type GoalType = 'Habit Goal' | 'Mood Goal' | 'Insight Goal' | 'Growth Goal' | 'Wellness Goal' | 'Other';
export type GoalStatus = 'active' | 'completed' | 'archived';

export interface UserGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  status: GoalStatus;
  category: GoalCategory;
  type: GoalType;
  related_journal_entries: string[] | null;
  created_at: string;
  updated_at: string;
}

export const goalsService = {
  /**
   * Creates a new user goal.
   * @param {Omit<UserGoal, 'id' | 'created_at' | 'updated_at'>} goalData
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<UserGoal | null>}
   */
  createGoal: async (goalData: Omit<UserGoal, 'id' | 'created_at' | 'updated_at'>, t: (key: string, ...args: (string | number)[]) => string): Promise<UserGoal | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () =>
        await supabase.from('user_goals').insert(goalData).select().single(), t
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error creating user goal:", error.message);
      showError(t('errorCreatingGoal', error.message));
      return null;
    }
  },

  /**
   * Fetches a user goal by ID.
   * @param {string} id
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<UserGoal | null>}
   */
  getGoal: async (id: string, t: (key: string, ...args: (string | number)[]) => string): Promise<UserGoal | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () =>
        await supabase.from('user_goals').select('*').eq('id', id).single(), t
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching user goal:", error.message);
      showError(t('errorFetchingGoal', error.message));
      return null;
    }
  },

  /**
   * Fetches all user goals for a user.
   * @param {string} userId
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<UserGoal[] | null>}
   */
  getGoalsByUser: async (userId: string, t: (key: string, ...args: (string | number)[]) => string): Promise<UserGoal[] | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () =>
        await supabase.from('user_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }), t
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching user goals by user:", error.message);
      showError(t('errorFetchingGoals', error.message));
      return null;
    }
  },

  /**
   * Fetches user goals by status for a user.
   * @param {string} userId
   * @param {GoalStatus} status
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<UserGoal[] | null>}
   */
  getGoalsByStatus: async (userId: string, status: GoalStatus, t: (key: string, ...args: (string | number)[]) => string): Promise<UserGoal[] | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () =>
        await supabase.from('user_goals').select('*').eq('user_id', userId).eq('status', status).order('created_at', { ascending: false }), t
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error(`Error fetching user goals with status ${status}:`, error.message);
      showError(t('errorFetchingGoalsByStatus', error.message));
      return null;
    }
  },

  /**
   * Updates an existing user goal.
   * @param {string} id
   * @param {Partial<Omit<UserGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>} updateData
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<UserGoal | null>}
   */
  updateGoal: async (id: string, updateData: Partial<Omit<UserGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>, t: (key: string, ...args: (string | number)[]) => string): Promise<UserGoal | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () =>
        await supabase.from('user_goals').update(updateData).eq('id', id).select().single(), t
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error updating user goal:", error.message);
      showError(t('errorUpdatingGoal', error.message));
      return null;
    }
  },

  /**
   * Deletes a user goal by ID.
   * @param {string} id
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<boolean>}
   */
  deleteGoal: async (id: string, t: (key: string, ...args: (string | number)[]) => string): Promise<boolean> => {
    try {
      const { error } = await withSupabaseRetry(async () =>
        await supabase.from('user_goals').delete().eq('id', id), t
      );
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error deleting user goal:", error.message);
      showError(t('errorDeletingGoal', error.message));
      return false;
    }
  },
};