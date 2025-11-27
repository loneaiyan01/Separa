/**
 * Web Push Notifications Service
 * Handles notification permissions, subscriptions, and sending notifications
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

/**
 * Check if notifications are supported in the current browser
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from user
 * @returns Promise that resolves to true if permission granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was previously denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Subscribe user to push notifications
 * @returns Promise that resolves to the subscription object
 */
export async function subscribeUserToPush(): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('User is already subscribed:', subscription);
      return subscription;
    }

    // Get VAPID public key from environment
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      console.error('VAPID public key not found. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env');
      return null;
    }

    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Send subscription to backend
    await saveSubscriptionToServer(subscription);

    console.log('User subscribed to push notifications:', subscription);
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe user from push notifications
 */
export async function unsubscribeUserFromPush(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('User is not subscribed');
      return true;
    }

    // Unsubscribe from push
    const successful = await subscription.unsubscribe();

    if (successful) {
      // Remove subscription from server
      await removeSubscriptionFromServer(subscription);
      console.log('User unsubscribed successfully');
    }

    return successful;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Send a local notification (doesn't require push server)
 */
export function sendLocalNotification(payload: NotificationPayload): void {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction,
      silent: false,
    });

    // Auto close after 10 seconds if not requireInteraction
    if (!payload.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();

      // Handle custom data if present
      if (payload.data?.url) {
        window.location.href = payload.data.url;
      }
    };
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Save push subscription to server
 */
async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription to server');
    }

    console.log('Subscription saved to server');
  } catch (error) {
    console.error('Error saving subscription to server:', error);
    throw error;
  }
}

/**
 * Remove push subscription from server
 */
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription from server');
    }

    console.log('Subscription removed from server');
  } catch (error) {
    console.error('Error removing subscription from server:', error);
  }
}

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Predefined notification templates for common use cases
 */
export const NotificationTemplates = {
  roomStarting: (roomName: string, minutes: number): NotificationPayload => ({
    title: 'Room Starting Soon',
    body: `"${roomName}" will start in ${minutes} minute${minutes !== 1 ? 's' : ''}`,
    icon: '/icons/icon-192x192.png',
    tag: 'room-starting',
    data: { type: 'room-starting', roomName },
    requireInteraction: false,
  }),

  participantJoined: (participantName: string, roomName: string): NotificationPayload => ({
    title: 'New Participant',
    body: `${participantName} joined "${roomName}"`,
    icon: '/icons/icon-192x192.png',
    tag: 'participant-joined',
    data: { type: 'participant-joined', participantName, roomName },
    requireInteraction: false,
  }),

  hostRequiresAttention: (roomName: string): NotificationPayload => ({
    title: 'Host Needs Your Attention',
    body: `The host is requesting attention in "${roomName}"`,
    icon: '/icons/icon-192x192.png',
    tag: 'host-attention',
    data: { type: 'host-attention', roomName },
    requireInteraction: true,
  }),

  roomEnding: (roomName: string, minutes: number): NotificationPayload => ({
    title: 'Room Ending Soon',
    body: `"${roomName}" will end in ${minutes} minute${minutes !== 1 ? 's' : ''}`,
    icon: '/icons/icon-192x192.png',
    tag: 'room-ending',
    data: { type: 'room-ending', roomName },
    requireInteraction: false,
  }),

  messageReceived: (senderName: string, preview: string): NotificationPayload => ({
    title: `Message from ${senderName}`,
    body: preview,
    icon: '/icons/icon-192x192.png',
    tag: 'message-received',
    data: { type: 'message', senderName },
    requireInteraction: false,
  }),
};
