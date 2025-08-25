import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { showSuccess, showError } from '@/utils/toast';
import { useTranslation } from '@/i18n/i18n.tsx'; // Import useTranslation
import { I18nProvider } from '@/i18n/i18n.tsx'; // Import I18nProvider

const SUPABASE_URL = "https://jonovuoyxyzcqmpsqzdf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvbm92dW95eHl6Y3FtcHNxemRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNjA1NDQsImV4cCI6MjA2OTYzNjU0NH0.c5usZAG6fDSRZjsSUkYQcS18bI21SeBJwVnWR1xO69Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/**
 * Tests the Supabase connection by attempting to fetch a small piece of data.
 * @returns {Promise<boolean>} True if connection is successful, false otherwise.
 */
export async function testSupabaseConnection(): Promise<boolean> {
  const { t } = useTranslation();
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error("Supabase connection test failed:", error.message);
      showError(t('errorSupabaseConnection', error.message));
      return false;
    }
    console.log("Supabase connection successful.");
    return true;
  } catch (err) {
    console.error("Supabase connection test failed due to unexpected error:", err);
    showError(t('errorSupabaseConnectionFailed'));
    return false;
  }
}

/**
 * A utility function to retry Supabase operations with exponential backoff.
 * @param {Function} fn The Supabase operation to retry.
 * @param {number} [retries=3] Number of retries.
 * @param {number} [delay=1000] Initial delay in ms.
 * @returns {Promise<T>} The result of the Supabase operation.
 */
export async function withSupabaseRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  const { t } = useTranslation();
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && navigator.onLine) {
      console.warn(`Supabase operation failed, retrying in ${delay}ms. Retries left: ${retries}`);
      await new Promise(res => setTimeout(res, delay));
      return withSupabaseRetry(fn, retries - 1, delay * 2);
    }
    showError(t('errorSupabaseOperationFailed'));
    throw error;
  }
}