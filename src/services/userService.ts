import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { showError } from '@/utils/toast';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  language: string;
  theme: string;
  notifications: boolean;
  memory_retention_period: string;
  chat_speed: string;
  memory_emotions: boolean;
  memory_personal_info: boolean;
  memory_goals: boolean;
  memory_relationships: boolean;
  share_analytics: boolean;
  created_at: string;
  updated_at: string;
}

export const userService = {
  /**
   * Fetches the current user's profile.
   * @param {string} userId
   * @returns {Promise<Profile | null>}
   */
  getProfile: async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('profiles').select('*').eq('id', userId).single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching user profile:", error.message);
      showError(`Failed to fetch profile: ${error.message}`);
      return null;
    }
  },

  /**
   * Updates the current user's profile.
   * @param {string} userId
   * @param {Partial<Omit<Profile, 'id' | 'updated_at'>>} updateData
   * @returns {Promise<Profile | null>}
   */
  updateProfile: async (userId: string, updateData: Partial<Omit<Profile, 'id' | 'updated_at'>>): Promise<Profile | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('profiles').update(updateData).eq('id', userId).select().single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error updating user profile:", error.message);
      showError(`Failed to update profile: ${error.message}`);
      return null;
    }
  },

  /**
   * Fetches the current user's preferences.
   * @param {string} userId
   * @returns {Promise<UserPreferences | null>}
   */
  getPreferences: async (userId: string): Promise<UserPreferences | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('user_preferences').select('*').eq('user_id', userId).single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching user preferences:", error.message);
      showError(`Failed to fetch preferences: ${error.message}`);
      return null;
    }
  },

  /**
   * Updates the current user's preferences.
   * @param {string} userId
   * @param {Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>} updateData
   * @returns {Promise<UserPreferences | null>}
   */
  updatePreferences: async (userId: string, updateData: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserPreferences | null> => {
    try {
      const { data, error } = await withSupabaseRetry(async () => // Added async and await
        await supabase.from('user_preferences').update(updateData).eq('user_id', userId).select().single()
      );
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error updating user preferences:", error.message);
      showError(`Failed to update preferences: ${error.message}`);
      return null;
    }
  },
};