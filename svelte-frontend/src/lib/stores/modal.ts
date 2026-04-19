import { writable } from 'svelte/store';

// export type ModalId =

export type ModalId = keyof ModalDefs;
export type ScreenshotModalData = {
  url: string;
  date: Date;
  screenshotData?: {
    id?: string;
    mapId?: string | null;
    mapX?: number;
    mapY?: number;
    game?: string;
    owner?: { uuid: string; name: string };
    public?: boolean;
    spoiler?: boolean;
    liked?: boolean;
    likeCount?: number;
    timestamp?: number;
  };
  lastModal?: string;
};

type ConfirmModalData = {
  message: string;
  onOk: () => void;
  onCancel: () => void;
};

type WikiModalData = {
  url: string;
};

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
  uiThemesModal: App.UiThemeModalData | undefined;
  scoreModal: never;
  rankingsModal: never;
  eventsModal: never;
  locationsModal: never;
  schedulesModal: never;
  editEventModal: App.EditEventModalData;
  communityScreenshotsModal: never;
  badgesModal: never;
  badgePresetModal: never;
  saveDataModal: never;
  screenshotModal: ScreenshotModalData;
  myScreenshotsModal: never;
  confirmModal: ConfirmModalData;
  newModal: never;
  testStage1: never;
  testStage2: never;
  wikiModal: WikiModalData;
};

type ModalResponses = {
  testStage2: string;
  uiThemesModal: string;
};

type ModalItem = {
  [K in ModalId]: {
    id: K;
    data: ModalDefs[K];
    closing: boolean;
    promise: {
      resolve(item?: unknown): void;
      reject(error?: unknown): void;
    };
  };
}[ModalId];

export interface ModalState {
  stack: ModalItem[];
  open: boolean;
  lastClosedModalId: string | null;
}

const initialState: ModalState = {
  stack: [],
  open: false,
  lastClosedModalId: null
};

const { subscribe, update, set } = writable<ModalState>(initialState);

type OpenArgs<K extends ModalId> = ModalDefs[K] extends never ? [K] : [K, ModalDefs[K]];
type CloseArgs<K> = K extends keyof ModalResponses ? [K, ModalResponses[K]] : [K, undefined];

function close(): void;
function close<K extends keyof ModalResponses>(..._: CloseArgs<K>): void;
function close<K>(...args: CloseArgs<K>) {
  update((state) => {
    if (!state.open) return state;
    if (state.stack.length > 0) {
      const nextStack = [...state.stack];
      const last = nextStack[nextStack.length - 1];
      const { id, promise } = last;
      const currentId = args[0];
      if (currentId && id !== currentId) {
        console.error('BUG: called modal.close with wrong id, expected:', id);
      }
      promise?.resolve(args[1]);
      // Mark as closing instead of popping — keeps it in DOM for transition
      nextStack[nextStack.length - 1] = { ...last, closing: true };
      return {
        ...state,
        stack: nextStack,
        open: true,
        lastClosedModalId: id || null
      };
    }
    return state;
  });
}

export const modal = {
  subscribe,

  open<K extends ModalId>(...[id, data]: OpenArgs<K>) {
    return new Promise<K extends keyof ModalResponses ? ModalResponses[K] | undefined : void>((resolve, reject) => {
      update((state) => {
        return {
          ...state,
          stack: [...state.stack, { id, data, closing: false, promise: { resolve, reject } } as ModalItem],
          open: true
        };
      });
    });
  },

  close,

  finalizeClose() {
    update((state) => {
      const nextStack = state.stack.filter((m) => !m.closing);
      if (nextStack.length === 0) {
        return { ...state, stack: [], open: false, lastClosedModalId: null };
      }
      return { ...state, stack: nextStack };
    });
  },

  confirm(message: string, onOk: () => void, onCancel?: () => void) {
    update((state) => {
      return {
        ...state,
        stack: [
          ...state.stack,
          {
            id: 'confirmModal',
            data: { message, onOk, onCancel },
            closing: false,
            promise: { resolve: () => {}, reject: () => {} }
          } as ModalItem
        ],
        open: true
      };
    });
  },

  reset() {
    set(initialState);
  }
};
