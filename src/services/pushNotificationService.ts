import { supabase, withSupabaseRetry } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useTranslation } from '@/i18n/i18n'; // Import useTranslation

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
    const { t } = useTranslation();
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showError(t('errorPushNotificationsNotSupported'));
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        const { data: existingRecord, error: fetchError } = await withSupabaseRetry(async () =>
          await supabase.from('push_subscriptions').select('*').eq('user_id', userId).eq('subscription->>endpoint', existingSubscription.endpoint).single()
        );

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingRecord) {
          showSuccess(t('alreadySubscribed'));
          return existingSubscription;
        } else {
          const subscriptionData: PushSubscriptionData = JSON.parse(JSON.stringify(existingSubscription));
          const { data, error } = await withSupabaseRetry(async () =>
            await supabase.from('push_subscriptions').insert({ user_id: userId, subscription: subscriptionData }).select().single()
          );
          if (error) throw error;
          showSuccess(t('reRegisteredNotifications'));
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

      showSuccess(t('subscribedNotifications'));
      return newSubscription;
    } catch (error: any) {
      console.error("Error subscribing to push notifications:", error);
      showError(t('errorSubscribingNotifications', error.message));
      return null;
    }
  },

  /**
   * Unsubscribes the user from push notifications and removes the subscription from Supabase.
   * @param {string} userId The ID of the authenticated user.
   * @returns {Promise<boolean>} True if unsubscribed successfully, false otherwise.
   */
  unsubscribeUser: async (userId: string): Promise<boolean> => {
    const { t } = useTranslation();
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showError(t('errorPushNotificationsNotSupported'));
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
          showSuccess(t('unsubscribedNotifications'));
          return true;
        } else {
          showError(t('errorUnsubscribingNotifications', 'browser failed'));
          return false;
        }
      } else {
        showSuccess(t('notCurrentlySubscribed'));
        return true;
      }
    } catch (error: any) {
      console.error("Error unsubscribing from push notifications:", error);
      showError(t('errorUnsubscribingNotifications', error.message));
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

  /**
   * Sends a test push notification to the current user via the Edge Function.
   * This function assumes the user is already subscribed.
   * @param {string} userId The ID of the authenticated user.
   * @param {string} title The title of the notification.
   * @param {string} body The body text of the notification.
   * @param {string} [url='/'] The URL to open when the notification is clicked.
   * @returns {Promise<boolean>} True if the notification was sent successfully, false otherwise.
   */
  sendTestNotification: async (userId: string, title: string, body: string, url: string = '/'): Promise<boolean> => {
    const { t } = useTranslation();
    try {
      const { data: subscriptionRecord, error: fetchError } = await withSupabaseRetry(async () =>
        await supabase.from('push_subscriptions').select('subscription').eq('user_id', userId).single()
      );

      if (fetchError || !subscriptionRecord) {
        showError(t('errorNoActiveSubscription'));
        return false;
      }

      const subscription = subscriptionRecord.subscription;
      const payload = { title, body, url };

      const { data: { session } } = await supabase.auth.getSession();

      const edgeFunctionUrl = `https://jonovuoyxyzcqmpsqzdf.supabase.co/functions/v1/send-push-notification`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ subscription, payload }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('errorSendingNotificationEdge'));
      }

      showSuccess(t('testNotificationSent'));
      return true;
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      showError(t('errorSendingTestNotification'));
      return false;
    }
  },
};