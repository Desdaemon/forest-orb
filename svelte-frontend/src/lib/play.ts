import { getGameInitState } from './init';
import { createEngineAPI } from './engine-api';
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
  notificationScreenPosition: 'bottomRight'
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

let easyrpgPlayer: any = null;
let easyrpgPlayerLoadFuncs: Array<() => void> = [];
let initBlocker: Promise<void> = Promise.resolve();

export async function initEasyRpgEngine() {
  if (easyrpgPlayer) return;

  const createFunc = (window as any).createEasyRpgPlayer;
  if (typeof createFunc !== 'function') {
    return new Promise((resolve) => setTimeout(() => resolve(initEasyRpgEngine()), 100));
  }

  const state = getGameInitState();
  createEngineAPI();

  easyrpgPlayer = {
    initialized: false,
    game: state.ynoGameId || state.gameId,
    saveFs: undefined,
    wsUrl: `${state.serverUrl}/session`
  };

  easyrpgPlayerLoadFuncs = [];
  easyrpgPlayerLoadFuncs.push(() => {
    if (!easyrpgPlayer || !easyrpgPlayer.api) return;
    easyrpgPlayer.initialized = true;
    if (typeof easyrpgPlayer.api.setNametagMode === 'function')
      easyrpgPlayer.api.setNametagMode(defaultUserConfig.nametagMode);
    if (typeof easyrpgPlayer.api.setSoundVolume === 'function')
      easyrpgPlayer.api.setSoundVolume(defaultGlobalConfig.soundVolume);
    if (typeof easyrpgPlayer.api.setMusicVolume === 'function')
      easyrpgPlayer.api.setMusicVolume(defaultGlobalConfig.musicVolume);
  });

  await initBlocker;

  const module = await createFunc(easyrpgPlayer);
  if (module && typeof module.initApi === 'function') {
    module.initApi();
  }
  if (module) easyrpgPlayer = module;
  for (const fn of easyrpgPlayerLoadFuncs) {
    try {
      fn();
    } catch (err) {
      console.error('easyrpgPlayer hook error', err);
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
