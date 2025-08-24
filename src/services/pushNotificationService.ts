import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

// Replace with your actual VAPID public key
// You'll need to generate VAPID keys for your application.
// Example: web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE'; 

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  subscription: PushSubscriptionData;
  created_at: string;
}

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const pushNotificationService = {
  /**
   * Subscribes the user to push notifications and stores the subscription in Supabase.
   * @param {string} userId The ID of the authenticated user.
   * @returns {Promise<PushSubscription | null>} The new push subscription object, or null if failed.
   */
  subscribeUser: async (userId: string): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showError("Push notifications are not supported by your browser.");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        // Check if the existing subscription is already in Supabase
        const { data: existingRecord, error: fetchError } = await withSupabaseRetry(async () =>
          await supabase.from('push_subscriptions').select('*').eq('user_id', userId).eq('subscription->>endpoint', existingSubscription.endpoint).single()
        );

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw fetchError;
        }

        if (existingRecord) {
          showSuccess("You are already subscribed to push notifications.");
          return existingSubscription;
        } else {
          // If subscription exists locally but not in DB, save it
          const subscriptionData: PushSubscriptionData = JSON.parse(JSON.stringify(existingSubscription));
          const { data, error } = await withSupabaseRetry(async () =>
            await supabase.from('push_subscriptions').insert({ user_id: userId, subscription: subscriptionData }).select().single()
          );
          if (error) throw error;
          showSuccess("Successfully re-registered for push notifications!");
          return existingSubscription;
        }
      }

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      const subscriptionData: PushSubscriptionData = JSON.parse(JSON.stringify(newSubscription));

      const { data, error } = await withSupabaseRetry(async () =>
        await supabase.from('push_subscriptions').insert({ user_id: userId, subscription: subscriptionData }).select().single()
      );

      if (error) throw error;

      showSuccess("Successfully subscribed to push notifications!");
      return newSubscription;
    } catch (error: any) {
      console.error("Error subscribing to push notifications:", error);
      showError(`Failed to subscribe to push notifications: ${error.message}. Please ensure your browser allows notifications.`);
      return null;
    }
  },

  /**
   * Unsubscribes the user from push notifications and removes the subscription from Supabase.
   * @param {string} userId The ID of the authenticated user.
   * @returns {Promise<boolean>} True if unsubscribed successfully, false otherwise.
   */
  unsubscribeUser: async (userId: string): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showError("Push notifications are not supported by your browser.");
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const { error } = await withSupabaseRetry(async () =>
          await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('subscription->>endpoint', subscription.endpoint)
        );

        if (error) throw error;

        const success = await subscription.unsubscribe();
        if (success) {
          showSuccess("Successfully unsubscribed from push notifications.");
          return true;
        } else {
          showError("Failed to unsubscribe from browser push notifications.");
          return false;
        }
      } else {
        showSuccess("You are not currently subscribed to push notifications.");
        return true; // Already unsubscribed or never subscribed
      }
    } catch (error: any) {
      console.error("Error unsubscribing from push notifications:", error);
      showError(`Failed to unsubscribe from push notifications: ${error.message}`);
      return false;
    }
  },

  /**
   * Checks if the user is currently subscribed to push notifications.
   * @param {string} userId The ID of the authenticated user.
   * @returns {Promise<boolean>} True if subscribed, false otherwise.
   */
  isUserSubscribed: async (userId: string): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const { data, error } = await withSupabaseRetry(async () =>
          await supabase.from('push_subscriptions').select('id').eq('user_id', userId).eq('subscription->>endpoint', subscription.endpoint).single()
        );
        return !!data && !error;
      }
      return false;
    } catch (error) {
      console.error("Error checking push subscription status:", error);
      return false;
    }
  },
};