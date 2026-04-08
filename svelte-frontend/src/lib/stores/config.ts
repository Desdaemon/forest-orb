import { writable } from 'svelte/store';
import { defaultGlobalConfig, defaultUserConfig, loadConfigFromStorage, saveConfigToStorage } from '../play';
import type { GlobalConfig, GlobalToggles, UserConfig, UserToggles } from '../config';

// A hook receives the raw stored value (or `undefined` if the key was absent) and the game id.
export type ConfigHook = (value: unknown, gameId: string) => void | Promise<void>;

const _hooks = new Map<string, Set<ConfigHook>>();
let _gameId = '';

/** Register a side-effect hook that fires for a config key on init and on every update. */
export function registerConfigHook(key: string, hook: ConfigHook): void {
  const hooks = _hooks.get(key) ?? new Set<ConfigHook>();
  hooks.add(hook);
  _hooks.set(key, hooks);
}

export const globalConfig = writable<GlobalConfig>({ ...defaultGlobalConfig });
export const userConfig = writable<UserConfig>({ ...defaultUserConfig });

/** Load config from localStorage into the stores and run all registered hooks. */
export async function initConfig(gameId: string): Promise<void> {
  _gameId = gameId;
  const stored: Record<string, unknown> = loadConfigFromStorage(gameId) ?? {};

  globalConfig.set({ ...defaultGlobalConfig, ...stored });
  userConfig.set({ ...defaultUserConfig, ...stored });

  const pending: Promise<void>[] = [];
  for (const [key, hooks] of _hooks) {
    for (const hook of hooks) {
      try {
        const result = hook(stored[key], gameId);
        if (result instanceof Promise) {
          pending.push(result.catch((err) => console.error(`configStore: hook error for "${key}"`, err)));
        }
      } catch (err) {
        console.error(`configStore: hook error for "${key}"`, err);
      }
    }
  }
  await Promise.all(pending);
}

/** Update a typed GlobalConfig key, persist it, and run its hook if one is registered. */
export function setGlobalSetting<K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]): void {
  globalConfig.update((c) => ({ ...c, [key]: value }));
  saveConfigToStorage(_gameId, { [key]: value });
  _runHook(key as string, value);
}

export function toggleGlobal<K extends GlobalToggles>(key: K) {
  globalConfig.update((c) => {
    const val = !c[key];
    saveConfigToStorage(_gameId, { [key]: val });
    _runHook(key, val);
    return { ...c, [key]: val };
  });
}

/** Update a typed UserConfig key, persist it, and run its hook if one is registered. */
export function setUserSetting<K extends keyof UserConfig>(key: K, value: UserConfig[K]): void {
  userConfig.update((c) => ({ ...c, [key]: value }));
  saveConfigToStorage(_gameId, { [key]: value });
  _runHook(key as string, value);
}

export function toggleUser<K extends UserToggles>(key: K) {
  userConfig.update((c) => {
    const val = !c[key];
    saveConfigToStorage(_gameId, { [key]: val });
    _runHook(key, val);
    return { ...c, [key]: val };
  });
}

/**
 * Persist an arbitrary config key (e.g. one not present in the typed schema like `uiTheme` or
 * `lang`) and run its hook if one is registered.
 */
export function setConfigValue(key: string, value: unknown): void {
  saveConfigToStorage(_gameId, { [key]: value } as Partial<GlobalConfig & UserConfig>);
  _runHook(key, value);
}

function _runHook(key: string, value: unknown): void {
  const hooks = _hooks.get(key);
  if (!hooks?.size) return;
  for (const hook of hooks) {
    try {
      const result = hook(value, _gameId);
      if (result instanceof Promise) {
        result.catch((err) => console.error(`configStore: hook error for "${key}"`, err));
      }
    } catch (err) {
      console.error(`configStore: hook error for "${key}"`, err);
    }
  }
}
