import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { storageService } from './storageService';
// Removed: import { useTranslation } from '@/i18n/i18n';

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
   * Fetches the current user's profile, prioritizing local cache.
   * @param {string} userId
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<Profile | null>}
   */
  getProfile: async (userId: string, t: (key: string, ...args: (string | number)[]) => string): Promise<Profile | null> => {
    const localProfile = await storageService.getUserProfile(userId); // Removed 't' parameter
    if (localProfile) return localProfile;

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('profiles').select('*').eq('id', userId).maybeSingle(), t
        );
        if (error) throw error;
        if (data) {
          await storageService.cacheUserProfile(data, t);
        }
        return data;
      } catch (error: any) {
        console.error("Error fetching user profile from Supabase:", error.message);
        showError(t('errorFetchingProfileFromCloud', error.message));
        return null;
      }
    }
    return null;
  },

  /**
   * Updates the current user's profile, updating locally and then syncing.
   * @param {string} userId
   * @param {Partial<Omit<Profile, 'id' | 'updated_at'>>} updateData
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<Profile | null>}
   */
  updateProfile: async (userId: string, updateData: Partial<Omit<Profile, 'id' | 'updated_at'>>, t: (key: string, ...args: (string | number)[]) => string): Promise<Profile | null> => {
    const existingProfile = await storageService.getUserProfile(userId); // Removed 't' parameter
    const updatedProfile = { ...existingProfile, ...updateData, id: userId, updated_at: new Date().toISOString() };

    await storageService.cacheUserProfile(updatedProfile, t);

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('profiles').update(updateData).eq('id', userId).select().single(), t
        );
        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error("Error updating user profile in Supabase:", error.message);
        showError(t('errorUpdatingProfileToCloud', error.message));
        return updatedProfile;
      }
    }
    return updatedProfile;
  },

  /**
   * Fetches the current user's preferences, prioritizing local cache.
   * @param {string} userId
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<UserPreferences | null>}
   */
  getPreferences: async (userId: string, t: (key: string, ...args: (string | number)[]) => string): Promise<UserPreferences | null> => {
    const localPreferences = await storageService.getUserPreferences(userId); // No 't' needed for this specific storage call
    if (localPreferences) return localPreferences;

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(), t
        );
        if (error) throw error;
        if (data) {
          await storageService.cacheUserPreferences(data, t);
        }
        return data;
      } catch (error: any) {
        console.error("Error fetching user preferences from Supabase:", error.message);
        showError(t('errorFetchingPreferencesFromCloud', error.message));
        return null;
      }
    }
    return null;
  },

  /**
   * Updates the current user's preferences, updating locally and then syncing.
   * @param {string} userId
   * @param {Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>} updateData
   * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
   * @returns {Promise<UserPreferences | null>}
   */
  updatePreferences: async (userId: string, updateData: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>, t: (key: string, ...args: (string | number)[]) => string): Promise<UserPreferences | null> => {
    const existingPreferences = await storageService.getUserPreferences(userId); // No 't' needed for this specific storage call
    const updatedPreferences = { ...existingPreferences, ...updateData, user_id: userId, updated_at: new Date().toISOString() };

    await storageService.cacheUserPreferences(updatedPreferences, t);

    if (navigator.onLine) {
      try {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('user_preferences').update(updateData).eq('user_id', userId).select().single(), t
        );
        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error("Error updating user preferences in Supabase:", error.message);
        showError(t('errorUpdatingPreferencesToCloud', error.message));
        return updatedPreferences;
      }
    }
    return updatedPreferences;
  },
};