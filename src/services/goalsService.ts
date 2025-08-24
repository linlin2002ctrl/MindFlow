import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface UserGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null; // ISO date string
  progress: number;
  status: string;
  related_journal_entries: string[] | null; // Array of UUIDs
  created_at: string;
  updated_at: string;
}

export const goalsService = {
  /**
   * Creates a new user goal.
   * @param {Omit<UserGoal, 'id' | 'created_at' | 'updated_at'>} goalData
   * @returns {Promise<UserGoal | null>}
   */
  createGoal: async (goalData: Omit<UserGoal, 'id' | 'created_at' | 'updated_at'>): Promise<UserGoal | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('user_goals').insert(goalData).select().single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error creating user goal:", error.message);
      showError(`Failed to create goal: ${error.message}`);
      return null;
    }
  },

  /**
   * Fetches a user goal by ID.
   * @param {string} id
   * @returns {Promise<UserGoal | null>}
   */
  getGoal: async (id: string): Promise<UserGoal | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('user_goals').select('*').eq('id', id).single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching user goal:", error.message);
      showError(`Failed to fetch goal: ${error.message}`);
      return null;
    }
  },

  /**
   * Fetches all user goals for a user.
   * @param {string} userId
   * @returns {Promise<UserGoal[] | null>}
   */
  getGoalsByUser: async (userId: string): Promise<UserGoal[] | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('user_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching user goals by user:", error.message);
      showError(`Failed to fetch goals: ${error.message}`);
      return null;
    }
  },

  /**
   * Updates an existing user goal.
   * @param {string} id
   * @param {Partial<Omit<UserGoal, 'id' | 'user_id' | 'created_at'>>} updateData
   * @returns {Promise<UserGoal | null>}
   */
  updateGoal: async (id: string, updateData: Partial<Omit<UserGoal, 'id' | 'user_id' | 'created_at'>>): Promise<UserGoal | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('user_goals').update(updateData).eq('id', id).select().single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error updating user goal:", error.message);
      showError(`Failed to update goal: ${error.message}`);
      return null;
    }
  },

  /**
   * Deletes a user goal by ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  deleteGoal: async (id: string): Promise<boolean> => {
    try {
      const { error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('user_goals').delete().eq('id', id)
      );
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error deleting user goal:", error.message);
      showError(`Failed to delete goal: ${error.message}`);
      return false;
    }
  },
};