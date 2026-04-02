import { writable } from "svelte/store";

export type ModalId =
    | "loginModal"
    | "registerModal"
    | "settingsModal"
    | "blocklistModal"
    | "chatSettingsModal"
    | "screenshotSettingsModal"
    | "notificationSettingsModal"
    | "cacheSettingsModal"
    | "accountSettingsModal"
    | "createPartyModal"
    | "partyModal"
    | "uiThemesModal"
    | "scoreModal"
    | "rankingsModal"
    | "eventsModal"
    | "locationsModal"
    | "schedulesModal"
    | "communityScreenshotsModal"
    | "badgesModal"
    | "screenshotModal"
    | "confirmModal"
    | "newModal";

export interface ModalState {
    activeModal: ModalId | null;
    modalData?: Record<string, any>;
    stack: ModalId[];
    open: boolean;
}

const initialState: ModalState = {
    activeModal: null,
    modalData: undefined,
    stack: [],
    open: false,
};

const { subscribe, update, set } = writable<ModalState>(initialState);

export const modal = {
    subscribe,

    open(modalId: ModalId, modalData: Record<string, any> = {}, lastModalId?: ModalId) {
        update((state) => {
            const nextStack = [...state.stack];
            if (state.activeModal && state.activeModal !== modalId) {
                nextStack.push(state.activeModal);
            }
            if (lastModalId) {
                nextStack.push(lastModalId);
            }
            return {
                activeModal: modalId,
                modalData,
                stack: nextStack,
                open: true,
            };
        });
    },

    close() {
        update((state) => {
            if (!state.open) return state;
            if (state.stack.length > 0) {
                const nextStack = [...state.stack];
                const prevModal = nextStack.pop() as ModalId;
                return {
                    ...state,
                    activeModal: prevModal,
                    stack: nextStack,
                    modalData: {},
                    open: true,
                };
            }
            return {
                activeModal: null,
                modalData: undefined,
                stack: [],
                open: false,
            };
        });
    },

    confirm(message: string, onOk: () => void, onCancel?: () => void) {
        update(() => ({
            activeModal: "confirmModal",
            modalData: { message, onOk, onCancel },
            stack: [],
            open: true,
        }));
    },

    reset() {
        set(initialState);
    },
};
