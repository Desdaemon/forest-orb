/**
 * Engine API Bridge
 *
 * Exports functions that the EasyRPG engine calls from JavaScript.
 * These are stubs for now—they'll be wired to the actual implementations
 * as the migration progresses.
 */

import { browser } from '$app/environment';

export interface EngineAPI {
  // Save sync
  onSaveSlotUpdated(slotId: number): void;

  // Preloads
  onRequestFile(url: string): void;

  // Player data & connection
  syncPlayerData(uuid: string, rank: number, account: boolean, badge: string | null, medals: any, id: number): void;
  shouldConnectPlayer(uuid: string): boolean;
  onPlayerConnectedOrUpdated(systemName: string, name: string, id: number): void;
  onPlayerSpriteUpdated(sprite: any, idx: number, id: number): void;
  onPlayerDisconnected(id: number): void;

  // UI
  showClientToastMessage(key: string, icon: any): void;
  onUpdateSystemGraphic(name: string): void;

  // Badges
  onBadgeUpdateRequested(): Promise<void>;

  onUpdateConnectionStatus?(connected: boolean): void;
  onNametagModeUpdated?(mode: number): void;
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
    onSaveSlotUpdated(slotId: number) {
      apiHandlers.onSaveSlotUpdated?.(slotId);
    },

    onRequestFile(url: string) {
      apiHandlers.onRequestFile?.(url);
    },

    syncPlayerData(uuid: string, rank: number, account: boolean, badge: string | null, medals: any, id: number) {
      apiHandlers.syncPlayerData?.(uuid, rank, account, badge, medals, id);
    },

    shouldConnectPlayer(uuid: string): boolean {
      return apiHandlers.shouldConnectPlayer?.(uuid) ?? true;
    },

    onPlayerConnectedOrUpdated(systemName: string, name: string, id: number) {
      apiHandlers.onPlayerConnectedOrUpdated?.(systemName, name, id);
    },

    onPlayerSpriteUpdated(sprite: any, idx: number, id: number) {
      apiHandlers.onPlayerSpriteUpdated?.(sprite, idx, id);
    },

    onPlayerDisconnected(id: number) {
      apiHandlers.onPlayerDisconnected?.(id);
    },

    showClientToastMessage(key: string, icon: any) {
      apiHandlers.showClientToastMessage?.(key, icon);
    },

    onUpdateSystemGraphic(name: string) {
      apiHandlers.onUpdateSystemGraphic?.(name);
    },

    async onBadgeUpdateRequested() {
      await apiHandlers.onBadgeUpdateRequested?.();
    },

    async onUpdateConnectionStatus(connected: boolean) {
      apiHandlers.onUpdateConnectionStatus?.(connected);
    },

    async onNametagModeUpdated(mode: number) {
      apiHandlers.onNametagModeUpdated?.(mode);
    }
  });
}
