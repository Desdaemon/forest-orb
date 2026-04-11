import { getGameInitState } from './init';
import { createEngineAPI } from './engineApi';
import type { GlobalConfig, UserConfig } from './config';

export const defaultGlobalConfig = {
  lang: 'en',
  name: '',
  soundVolume: 100,
  musicVolume: 100,
  wikiLinkMode: 1,
  saveReminder: 60,
  badgeHints: true,
  playBadgeHintSound: true,
  chatTipIndex: -1,
  gameChat: true,
  gameChatGlobal: false,
  gameChatParty: true,
  tabToChat: true,
  mapChatHistoryLimit: 100,
  globalChatHistoryLimit: 100,
  partyChatHistoryLimit: 250,
  mobileControls: true,
  mobileControlsType: 'default',
  playMentionSound: true,
  blurScreenshotEmbeds: false,
  locationDisplay: false,
  hideRankings: false,
  hideSchedules: false,
  autoDownloadScreenshots: false,
  screenshotResolution: 1,
  preloads: false,
  questionablePreloads: false,
  rulesReviewed: false,
  badgeToolsData: null,
  pushNotificationToastDismissed: false,
  highContrast: false,
  unicodeFont: false,
  notifications: true,
  notificationScreenPosition: 'bottomRight',
  nametagMode: false,
};

export const defaultUserConfig = {
  privateMode: false,
  singleplayerMode: false,
  disableChat: false,
  mute: false,
  hideLocation: false,
  nametagMode: 1,
  disablePlayerSounds: false,
  immersionMode: false,
  chatTabIndex: 0,
  playersTabIndex: 0,
  globalMessage: false,
  hideGlobalMessageLocations: false,
  filterMentions: false,
  trackedLocationId: null,

  badgeHints: false,
  playBadgeHintSound: false,
  questionablePreloads: false,

  // 2kki only
  last2kkiVersion: null,
  explorer: false,
  enableExplorer: false,
};

export const LATIN_EX_LANGS = ['vi', 'ru', 'uk'];

export type ConfigScope = 'global' | 'user';
export type ConfigByScope = {
  global: GlobalConfig;
  user: UserConfig;
};
export type ConfigKey<TScope extends ConfigScope> = keyof ConfigByScope[TScope];
export type AllConfigKeys = keyof typeof defaultGlobalConfig | keyof typeof defaultUserConfig;

export const easyrpgPlayerLoadFuncs: (() => void)[] = [];

export function loadConfigFromStorage(gameId: string) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`ynoproject_config_${gameId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('failed to parse config from storage', err);
    return null;
  }
}

export function saveConfigToStorage(gameId: string, config: Partial<GlobalConfig | UserConfig>) {
  if (typeof localStorage === 'undefined') return;
  const existing = loadConfigFromStorage(gameId) || {};
  localStorage.setItem(`ynoproject_config_${gameId}`, JSON.stringify({ ...existing, ...config }));
}

type EasyRpgPlayerApi = {
  setMusicVolume(vol: number): void;
  setSoundVolume(vol: number): void;
  saveConfig(): void;
  setNametagMode(mode: number): void;
  sessionReady(): void;
  toggleMute(): void;
  preloadFile(dir: string, file: string, graphic: boolean): void;
  getPlayerCoords(): [number, number];
  requestReset(): void;
  resetCanvas(): void;
}

type EasyRpgPlayer = {
  initialized: boolean;
  game: string;
  saveFs: any;
  wsUrl: string;
  /** Initialized by {@linkcode initEasyRpgEngine} */
  api?: EasyRpgPlayerApi,
} & {
  [K in EasyRpgPlayerApiFuncs]: EasyRpgPlayerApi[K];
}

type EasyRpgPlayerApiFuncs = keyof EasyRpgPlayerApi;

const rawEasyRpgModule: any = { __proxy: true };
export let easyrpgPlayer: EasyRpgPlayer = new Proxy(rawEasyRpgModule, {
  get(raw, prop) {
    if (prop in raw) return raw[prop];
    return (...args: any[]) => {
      easyrpgPlayerLoadFuncs.push(() => {
        try {
          (raw.api[prop] || raw[prop])(...args);
        } catch (err) {
          console.error(err, prop, ...args);
        }
      })
    }
  }
}) as any;

if (import.meta.hot) {
  // explicitly refuse HMR for this module
  import.meta.hot.accept(() => {
    window.location.reload();
  })
}

export async function initEasyRpgEngine() {
  if (!(easyrpgPlayer as any).__proxy) return;

  const state = getGameInitState();
  console.log({ state });
  createEngineAPI();

  const easyrpgPlayerInit = {
    initialized: false,
    game: state.ynoGameId || state.gameId,
    saveFs: undefined,
    wsUrl: `${state.serverUrl}`,
  } satisfies Partial<EasyRpgPlayer> as any;

  easyrpgPlayerLoadFuncs.push(() => {
    easyrpgPlayer.initialized = true;
    easyrpgPlayer.setMusicVolume(0);
  });

  const module = await createEasyRpgPlayer(easyrpgPlayerInit);
  module.initApi();
  delete rawEasyRpgModule.__proxy;
  Object.assign(rawEasyRpgModule, module, module.api);
  for (const fn of easyrpgPlayerLoadFuncs) {
    try {
      fn();
    } catch (err) {
      console.error('easyrpgPlayer hook error', { fn, err, easyrpgPlayer });
    }
  }

  return easyrpgPlayer;
}

export function setPlayerName(name: string) {
  if (typeof window !== 'undefined') {
    defaultGlobalConfig.name = name;
    saveConfigToStorage(getGameInitState().gameId, { name });
  }
}
