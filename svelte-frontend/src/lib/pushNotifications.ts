import { browser } from '$app/environment';
import { apiJsonPost } from '$lib/api';
import { getGameInitState } from '$lib/init';
import { get } from 'svelte/store';
import { globalConfig, userConfig } from '$lib/stores/config';

const SERVICE_WORKER_PATH = '/service-worker.js';

let swRegistration: ServiceWorkerRegistration | null = null;
let vapidPublicKey: string | null = null;
let initialized = false;

async function getVapidPublicKey(): Promise<string> {
  if (vapidPublicKey) return vapidPublicKey;
  const resp = await fetch('/connect/2kki/api/vapidpublickey');
  const key = await resp.text();
  vapidPublicKey = key;
  return key;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!browser || !('serviceWorker' in navigator)) return null;
  if (swRegistration) return swRegistration;

  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: '/'
    });
    swRegistration = registration;

    // Send game info and session to the service worker
    const sendToWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const initState = getGameInitState();
      const sessionId = (window as any).YNO_AUTH_TOKEN || '';
      worker.postMessage({ game: initState.gameId, sessionId });
    };

    if (registration.active) {
      sendToWorker(registration.active);
    } else {
      // Wait for a service worker to become available
      const onControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        sendToWorker(navigator.serviceWorker.controller);
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    }

    return registration;
  } catch (err) {
    console.error('Failed to register service worker:', err);
    return null;
  }
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!swRegistration) return null;
  return swRegistration.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<boolean> {
  if (!swRegistration) return false;

  const subscription = await swRegistration.pushManager.getSubscription();
  if (subscription) return true;

  const permissions = await swRegistration.pushManager.permissionState({
    userVisibleOnly: true,
    applicationServerKey: await getVapidPublicKey()
  });

  if (permissions === 'denied') return false;

  try {
    const newSubscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: await getVapidPublicKey()
    });

    await apiJsonPost('registernotification', newSubscription.toJSON());
    return true;
  } catch (err) {
    console.error('Failed to subscribe to push notifications:', err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!swRegistration) return false;

  const subscription = await swRegistration.pushManager.getSubscription();
  if (!subscription) return false;

  try {
    const unsubscribed = await subscription.unsubscribe();
    if (unsubscribed) {
      await apiJsonPost('unregisternotification', { endpoint: subscription.endpoint });
    }
    return unsubscribed;
  } catch (err) {
    console.error('Failed to unsubscribe from push notifications:', err);
    return false;
  }
}

export function setupServiceWorkerMessageListener(
  onToast: (message: string, icon?: string, persist?: boolean) => void
): void {
  if (!browser || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    const _type = (data as Record<string, unknown>)._type as string | undefined;
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const args = data.args as unknown[] | undefined;

    if (_type === 'toast') {
      if (!Array.isArray(args)) return;
      if (!(get(globalConfig).notifications && (get(userConfig).pushNotifications ?? true))) return;
      if (metadata && typeof metadata === 'object' && 'category' in metadata && 'type' in metadata) {
        const cat = String(metadata.category);
        const type = String(metadata.type);
        const userNotifConfig = get(userConfig) as unknown as Record<string, unknown>;
        const catConfig = userNotifConfig[cat] as Record<string, boolean> | undefined;
        if (catConfig?.[type] === false) return;
      }
      const persistVal = args[2] as boolean | undefined;
      onToast(String(args[0] ?? ''), args[1] as string | undefined, persistVal);
    }
  });
}

export async function initPushNotifications(
  onToast: (message: string, icon?: string, persist?: boolean) => void
): Promise<void> {
  if (initialized) return;
  if (!browser) return;

  initialized = true;

  if (!get(globalConfig).notifications || !get(userConfig).pushNotifications) return;

  const registration = await registerServiceWorker();
  if (!registration) return;

  setupServiceWorkerMessageListener(onToast);

  const hasExistingSubscription = await getPushSubscription();
  if (!hasExistingSubscription) {
    await subscribeToPush();
  }
}
