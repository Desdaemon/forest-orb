import { get, writable } from 'svelte/store';

export interface ToastMessage {
  id: number;
  message: string;
  icon?: string;
  persist?: boolean;
}

let toastId = 0;

export const toasts = writable<ToastMessage[]>([]);

const autoCloseTimers = new Map<number, ReturnType<typeof setTimeout>>();

function clearAutoClose(id: number): void {
  const timer = autoCloseTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    autoCloseTimers.delete(id);
  }
}

function scheduleAutoClose(id: number, message: string, persist: boolean): void {
  clearAutoClose(id);
  if (persist) return;
  const timer = setTimeout(() => {
    toasts.update((t) => t.filter((toast) => toast.id !== id));
    autoCloseTimers.delete(id);
  }, 10000);
  autoCloseTimers.set(id, timer);
}

export const toast = {
  show(message: string, icon?: string, persist = false): number {
    const id = ++toastId;
    toasts.update((t) => [...t, { id, message, icon, persist }]);
    scheduleAutoClose(id, message, persist);
    return id;
  },

  close(id?: number): void {
    if (id !== undefined) {
      clearAutoClose(id);
      toasts.update((t) => t.filter((toast) => toast.id !== id));
    } else {
      for (const id of autoCloseTimers.keys()) {
        clearAutoClose(id);
      }
      toasts.set([]);
    }
  },

  system(key: string, icon?: string): void {
    const existing = get(toasts).find((t) => t.persist && t.message === key);
    if (existing) return;
    toast.show(key, icon, true);
  },

  client(key: string, icon?: string): void {
    toast.system(key, icon);
  }
};

export function addToast(message: string, icon?: string, persist = false): void {
  toast.show(message, icon, persist);
}

export function removeToast(id: number): void {
  toast.close(id);
}
