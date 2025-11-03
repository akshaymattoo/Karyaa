import { useState, useEffect, useCallback } from 'react';
import { 
  registerServiceWorker, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  checkNotificationPermission,
  requestNotificationPermission 
} from '@/lib/serviceWorker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const initPermission = async () => {
      const currentPermission = await checkNotificationPermission();
      setPermission(currentPermission);
    };
    initPermission();
  }, []);

  useEffect(() => {
    const initServiceWorker = async () => {
      const reg = await registerServiceWorker();
      setRegistration(reg);
      
      if (reg) {
        const subscription = await reg.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    };
    initServiceWorker();
  }, []);

  const subscribe = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to enable notifications');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentPermission = await requestNotificationPermission();
      setPermission(currentPermission);

      if (currentPermission !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      if (!registration) {
        setError('Service worker not registered');
        setIsLoading(false);
        return false;
      }

      const response = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await response.json();

      if (!publicKey) {
        setError('VAPID public key not available');
        setIsLoading(false);
        return false;
      }

      const subscription = await subscribeToPushNotifications(registration, publicKey);
      
      if (!subscription) {
        setError('Failed to subscribe to push notifications');
        setIsLoading(false);
        return false;
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('No auth token');
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error subscribing to push notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      setIsLoading(false);
      return false;
    }
  }, [user, registration]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!registration) {
        setError('Service worker not registered');
        setIsLoading(false);
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        setIsLoading(false);
        return true;
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('No auth token');
      }

      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await unsubscribeFromPushNotifications(registration);
      
      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      setIsLoading(false);
      return false;
    }
  }, [registration]);

  const sendTestNotification = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to send notifications');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('No auth token');
      }

      await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification from Karyaa!',
        }),
      });

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to send notification');
      setIsLoading(false);
      return false;
    }
  }, [user]);

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
