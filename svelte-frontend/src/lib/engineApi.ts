/**
 * Engine API Bridge
 *
 * Exports functions that the EasyRPG engine calls from JavaScript.
 * These are stubs for now—they'll be wired to the actual implementations
 * as the migration progresses.
 */

import { browser } from '$app/environment';
import { toast } from '$lib/stores/toast';

export interface EngineAPI {
  // Save sync
  onSaveSlotUpdated(slotId: number): void;

  // Preloads
  onRequestFile(url: string): void;

  // Player data & connection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  syncPlayerData(uuid: string, rank: number, account: boolean, badge: string | null, medals: any, id: number): void;
  shouldConnectPlayer(uuid: string): boolean;
  onPlayerConnectedOrUpdated(systemName: string, name: string, id: number): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPlayerSpriteUpdated(sprite: any, idx: number, id: number): void;
  onPlayerDisconnected(id: number): void;

  // UI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showClientToastMessage(key: string, icon: any): void;
  onUpdateSystemGraphic(name: string): void;

  // Badges
  onBadgeUpdateRequested(): Promise<void>;

  onUpdateConnectionStatus(connected: boolean): void;
  onNametagModeUpdated(mode: number): void;

  // Ingame
  onLoadMap(mapName: string): void;
  onPlayerTeleported(mapId: string, x: number, y: number): void;
  onRoomSwitch(): void;
  onReceiveInputFeedback(inputId: number): void;
}

// Store handlers that can be registered from the migrated modules
const apiHandlers: Partial<EngineAPI> = {};

export function registerEngineAPIHandler<K extends keyof EngineAPI>(key: K, handler: EngineAPI[K]) {
  apiHandlers[key] = handler;
}

/**
 * Create the engine API object for the EasyRPG player
 */
export function createEngineAPI() {
  if (!browser) return;
  Object.assign(window, {
    onSaveSlotUpdated(slotId) {
      apiHandlers.onSaveSlotUpdated?.(slotId);
    },

    onRequestFile(url) {
      apiHandlers.onRequestFile?.(url);
    },

    syncPlayerData(uuid, rank, account, badge, medals, id) {
      apiHandlers.syncPlayerData?.(uuid, rank, account, badge, medals, id);
    },

    shouldConnectPlayer(uuid) {
      return apiHandlers.shouldConnectPlayer?.(uuid) ?? true;
    },

    onPlayerConnectedOrUpdated(systemName, name, id) {
      apiHandlers.onPlayerConnectedOrUpdated?.(systemName, name, id);
    },

    onPlayerSpriteUpdated(sprite, idx, id) {
      apiHandlers.onPlayerSpriteUpdated?.(sprite, idx, id);
    },

    onPlayerDisconnected(id) {
      apiHandlers.onPlayerDisconnected?.(id);
    },

    showClientToastMessage(key, icon) {
      apiHandlers.showClientToastMessage?.(key, icon);
    },

    onUpdateSystemGraphic(name) {
      apiHandlers.onUpdateSystemGraphic?.(name);
    },

    async onBadgeUpdateRequested() {
      await apiHandlers.onBadgeUpdateRequested?.();
    },

    async onUpdateConnectionStatus(connected) {
      apiHandlers.onUpdateConnectionStatus?.(connected);
    },

    async onNametagModeUpdated(mode) {
      apiHandlers.onNametagModeUpdated?.(mode);
    },

    onLoadMap(mapName) {
      apiHandlers.onLoadMap?.(mapName);
    },

    onPlayerTeleported(mapId, x, y) {
      apiHandlers.onPlayerTeleported?.(mapId, x, y);
    },

    onRoomSwitch() {
      apiHandlers.onRoomSwitch?.();
    },

    onReceiveInputFeedback(inputId) {
      apiHandlers.onReceiveInputFeedback?.(inputId);
    }
  } satisfies EngineAPI);
}

// Default handler: maps engine showClientToastMessage calls to the Svelte toast store
registerEngineAPIHandler('showClientToastMessage', (key: string, icon: string) => {
  toast.system(key, icon);
});
