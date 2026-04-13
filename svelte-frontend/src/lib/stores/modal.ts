import type { Schedule } from '$lib/components/ScheduleItem.svelte';
import { writable } from 'svelte/store';

// export type ModalId =

export type ModalId = keyof ModalDefs;
type ModalDefs = {
  loginModal: never;
  registerModal: never;
  settingsModal: never;
  blocklistModal: never;
  chatSettingsModal: never;
  screenshotSettingsModal: never;
  notificationSettingsModal: never;
  cacheSettingsModal: never;
  accountSettingsModal: never;
  createPartyModal: never;
  partyModal: never;
  uiThemesModal: never;
  scoreModal: never;
  rankingsModal: never;
  eventsModal: never;
  locationsModal: never;
  schedulesModal: never;
  editEventModal: Partial<Schedule>;
  communityScreenshotsModal: never;
  badgesModal: never;
  badgePresetModal: never;
  screenshotModal: never;
  confirmModal: never;
  newModal: never;
  testStage1: never;
  testStage2: never;
};

type ModalResponses = {
  testStage2: string;
}

type ModalItem = {
  [K in ModalId]: {
    id: K,
    data: ModalDefs[K],
    promise: {
      resolve(item?: unknown): void;
      reject(error?: unknown): void;
    }
  }
}[ModalId]

export interface ModalState {
  stack: ModalItem[];
  open: boolean;
}

const initialState: ModalState = {
  stack: [],
  open: false
};

const { subscribe, update, set } = writable<ModalState>(initialState);

type OpenArgs<K extends ModalId> = ModalDefs[K] extends never ? [K] : [K, ModalDefs[K]];
type CloseArgs<K> = K extends keyof ModalResponses ? [K, ModalResponses[K]] : [K]

export const modal = {
  subscribe,

  open<K extends ModalId>(...[id, data]: OpenArgs<K>) {
    return new Promise<K extends keyof ModalResponses ? ModalResponses[K] : void>((resolve, reject) => {
      update((state) => {
        return {
          stack: [...state.stack, { id, data, promise: { resolve, reject } } as ModalItem],
          open: true
        };
      });
    })
  },

  close<K extends ModalId>(...[currentId, data]: CloseArgs<K>) {
    update((state) => {
      if (!state.open) return state;
      if (state.stack.length > 0) {
        const nextStack = [...state.stack];
        const { id, promise } = nextStack.pop() || {};
        if (currentId && id !== currentId) {
          console.error('BUG: called modal.close with wrong id, expected:', id);
        }
        promise?.resolve(data);
        return {
          ...state,
          stack: nextStack,
          open: true
        };
      }
      // Don't set open: false yet — let the container finish transitions first
      return {
        ...state,
        activeModal: null,
        modalData: {},
        stack: []
      };
    });
  },

  finalizeClose() {
    update((state) => ({
      ...state,
      stack: [],
      open: false
    }));
  },

  confirm(message: string, onOk: () => void, onCancel?: () => void) {
    // TODO
    // update(() => ({
    //   activeModal: 'confirmModal',
    //   modalData: { message, onOk, onCancel },
    //   stack: [],
    //   open: true
    // }));
  },

  reset() {
    set(initialState);
  }
};
