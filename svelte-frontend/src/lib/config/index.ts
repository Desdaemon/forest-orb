import type { GameId } from '$lib/allGameUiThemes';
import { easyrpgPlayer, LATIN_EX_LANGS } from '$lib/play';
import { globalConfig, registerConfigHook, userConfig } from '$lib/stores/config';
import { allGameUiThemes, selectTheme, setHighContrastMode } from '$lib/stores/uiTheme';
import { get } from 'svelte/store';
import { locale, setLocale } from '../../i18n/i18n-svelte';
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { baseLocale, isLocale, loadedLocales } from '../../i18n/i18n-util';
import { loadLocaleAsync } from '../../i18n/i18n-util.async';
import {
  group,
  gval,
  makeTabBuilder,
  defineSettingsSchema,
  flattenTab,
  type TabBuilder,
  ubool,
  type TabConfig
} from './impl';
import { registerEngineAPIHandler } from '$lib/engineApi';
import { activeSession } from '$lib/chatSession';
export * from './impl';

function syncSessionPrivacyState() {
  const session = get(activeSession);
  if (!session) return;

  const { privateMode, singleplayerMode, hideLocation } = get(userConfig);
  const level = privateMode ? (singleplayerMode ? 2 : 1) : 0;
  session.sendCommand('pr', [String(level)]);

  if (hideLocation || singleplayerMode) {
    session.sendCommand('hl', [singleplayerMode ? '1' : hideLocation ? '1' : '0']);
  }
}

const CHAT_HISTORY_KEYS = ['0', '25', '50', '100', '250', '500', '1000', '2500'] as const;
const CHAT_HISTORY_VALUES = [25, 50, 100, 250, 500, 1000, 2500, 0] as const;

const chatHistoryOptions = CHAT_HISTORY_VALUES.map((value) => ({
  label: (LL: TranslationFunctions) =>
    LL.ui.modal.chatSettings.fields.chatHistoryLimit.values[String(value) as (typeof CHAT_HISTORY_KEYS)[number]](),
  value
}));

// if a setting shouldn't live in settings, its store can live here instead

export const soundVolume = gval('soundVolume');

export const mute = ubool('mute');
export const privateMode = ubool('privateMode');
export const disableChat = ubool('disableChat');
export const hideLocation = ubool('hideLocation');

// everything else must go here
// conditional visibility is handled in SettingsModal with settingVisibilityOverrides
export const tabFields = {
  general(tab) {
    return {
      nametagMode: tab.gsel(
        (LL) => LL.ui.modal.settings.fields.nametagMode.label(),
        [
          { label: (LL) => LL.ui.modal.settings.fields.nametagMode.values.none(), value: 0 },
          { label: (LL) => LL.ui.modal.settings.fields.nametagMode.values.classic(), value: 1 },
          { label: (LL) => LL.ui.modal.settings.fields.nametagMode.values.compact(), value: 2 },
          { label: (LL) => LL.ui.modal.settings.fields.nametagMode.values.slim(), value: 3 }
        ]
      ),
      wikiLinkMode: tab.gsel(
        (LL) => LL.ui.modal.settings.fields.wikiLinkMode.label(),
        [
          { label: (LL) => LL.ui.modal.settings.fields.wikiLinkMode.values.always(), value: 2 },
          { label: (LL) => LL.ui.modal.settings.fields.wikiLinkMode.values.fullscreen(), value: 1 },
          { label: (LL) => LL.ui.modal.settings.fields.wikiLinkMode.values.never(), value: 0 }
        ]
      ),
      saveReminder: tab.gsel(
        (LL) => LL.ui.modal.settings.fields.saveReminder.label(),
        [
          { label: (LL) => LL.ui.modal.settings.fields.saveReminder.interval.minutes(10), value: 10 },
          { label: (LL) => LL.ui.modal.settings.fields.saveReminder.interval.minutes(15), value: 15 },
          { label: (LL) => LL.ui.modal.settings.fields.saveReminder.interval.minutes(20), value: 20 },
          { label: (LL) => LL.ui.modal.settings.fields.saveReminder.interval.minutes(30), value: 30 },
          { label: (LL) => LL.ui.modal.settings.fields.saveReminder.interval.minutes(45), value: 45 },
          { label: (LL) => LL.ui.modal.settings.fields.saveReminder.interval.minutes(60), value: 60 },
          { label: (LL) => LL.ui.modal.settings.fields.saveReminder.interval.minutes(90), value: 90 },
          { label: (LL) => LL.ui.modal.settings.fields.saveReminder.interval.minutes(120), value: 120 },
          { label: (LL) => LL.ui.modal.settings.fields.saveReminder.interval.never(), value: 0 }
        ]
      ),
      soundVolume: tab.grange((LL) => LL.ui.modal.settings.fields.soundVolume(), { min: 0, max: 100, step: 5 }),
      musicVolume: tab.grange((LL) => LL.ui.modal.settings.fields.musicVolume(), { min: 0, max: 100, step: 5 }),
      disablePlayerSounds: tab.ubool((LL) => LL.ui.modal.settings.fields.togglePlayerSounds(), { invert: true }),
      badgeHints: tab.ubool((LL) => LL.ui.modal.settings.fields.toggleEnableBadgeHints.label(), {
        tooltip: (LL) => LL.ui.modal.settings.fields.toggleEnableBadgeHints.helpText()
      }),
      playBadgeHintSound: tab.ubool((LL) => LL.ui.modal.settings.fields.togglePlayBadgeHintSound(), {
        indent: true
      }),
      enableExplorer: tab.ubool((LL) => LL.ui.modal.settings.fields.toggleEnableExplorer.label(), {
        tooltip: (LL) => LL.ui.modal.settings.fields.toggleEnableExplorer.helpText()
      }),
      immersionMode: tab.ubool((LL) => LL.ui.modal.settings.fields.toggleImmersionMode.label(), {
        tooltip: (LL) => LL.ui.modal.settings.fields.toggleImmersionMode.helpText()
      }),
      singleplayerMode: tab.ubool((LL) => LL.ui.modal.settings.fields.toggleSingleplayerMode.label(), {
        tooltip: (LL) => LL.ui.modal.settings.fields.toggleSingleplayerMode.helpText()
      }),
      mobileControls: tab.gbool((LL) => LL.ui.modal.settings.fields.toggleMobileControls()),
      mobileControlsType: tab.gsel(
        (LL) => LL.ui.modal.settings.fields.mobileControlsType.label(),
        [
          { label: (LL) => LL.ui.modal.settings.fields.mobileControlsType.default(), value: 'default' },
          { label: (LL) => LL.ui.modal.settings.fields.mobileControlsType.joystick(), value: 'joystick' },
          { label: (LL) => LL.ui.modal.settings.fields.mobileControlsType.dpad(), value: 'dpad' }
        ],
        {
          tooltip: (LL) => LL.ui.tooltips.mobileControlsType()
        }
      ),
      locationDisplay: tab.gbool((LL) => LL.ui.modal.settings.fields.toggleLocationDisplay()),
      hideRankings: tab.gbool((LL) => LL.ui.modal.settings.fields.toggleRankings(), { invert: true }),
      hideSchedules: tab.gbool((LL) => LL.ui.modal.settings.fields.toggleSchedules(), { invert: true }),
      preloads: tab.gbool((LL) => LL.ui.modal.settings.fields.togglePreloads.label(), {
        tooltip: (LL) => LL.ui.modal.settings.fields.togglePreloads.helpText()
      }),
      questionablePreloads: tab.ubool((LL) => LL.ui.modal.settings.fields.toggleQuestionablePreloads(), {
        indent: true
      }),
      unicodeFont: tab.gbool((LL) => LL.ui.modal.settings.fields.unicodeFont()),
      highContrast: tab.gbool((LL) => LL.ui.modal.settings.fields.highContrast())
    } satisfies TabConfig;
  },

  chat(tab) {
    return {
      overlay: group({
        gameChat: tab.gbool((LL) => LL.ui.modal.chatSettings.fields.toggleGameChat.label()),
        gameChatGlobal: tab.gbool((LL) => LL.ui.modal.chatSettings.fields.toggleGameChat.global(), {
          indent: true
        }),
        gameChatParty: tab.gbool((LL) => LL.ui.modal.chatSettings.fields.toggleGameChat.party(), {
          indent: true
        })
      }),
      tabToChat: tab.gbool((LL) => LL.ui.modal.chatSettings.fields.toggleTabToChat()),
      playMentionSound: tab.gbool((LL) => LL.ui.modal.chatSettings.fields.togglePlayMentionSound()),
      blurScreenshotEmbeds: tab.gbool((LL) => LL.ui.modal.chatSettings.fields.blurScreenshotEmbeds()),
      history: group({
        mapChatHistoryLimit: tab.gsel(
          (LL) => LL.ui.modal.chatSettings.fields.mapChatHistoryLimit.label(),
          chatHistoryOptions
        ),
        globalChatHistoryLimit: tab.gsel(
          (LL) => LL.ui.modal.chatSettings.fields.globalChatHistoryLimit.label(),
          chatHistoryOptions
        ),
        partyChatHistoryLimit: tab.gsel(
          (LL) => LL.ui.modal.chatSettings.fields.partyChatHistoryLimit.label(),
          chatHistoryOptions
        )
      })
    } satisfies TabConfig;
  },

  screenshots(tab) {
    return {
      autoDownloadScreenshots: tab.gbool((LL) => LL.ui.modal.screenshotSettings.fields.autoDownloadScreenshots()),
      screenshotResolution: tab.gsel(
        (LL) => LL.ui.modal.screenshotSettings.fields.screenshotResolution.label(),
        [
          { label: (LL) => LL.ui.modal.screenshotSettings.fields.screenshotResolution.values['1'](), value: 1 },
          { label: (LL) => LL.ui.modal.screenshotSettings.fields.screenshotResolution.values['2'](), value: 2 },
          { label: (LL) => LL.ui.modal.screenshotSettings.fields.screenshotResolution.values['3'](), value: 3 },
          { label: (LL) => LL.ui.modal.screenshotSettings.fields.screenshotResolution.values['4'](), value: 4 }
        ]
      )
    } satisfies TabConfig;
  },

  notifications(tab) {
    return {
      notifications: tab.gbool((LL) => LL.ui.modal.notificationSettings.fields.toggleNotifications()),
      notificationScreenPosition: tab.gsel(
        (LL) => LL.ui.modal.notificationSettings.fields.screenPosition.label(),
        [
          {
            label: (LL) => LL.ui.modal.notificationSettings.fields.screenPosition.values.bottomLeft(),
            value: 'bottomLeft'
          },
          {
            label: (LL) => LL.ui.modal.notificationSettings.fields.screenPosition.values.bottomRight(),
            value: 'bottomRight'
          },
          { label: (LL) => LL.ui.modal.notificationSettings.fields.screenPosition.values.topLeft(), value: 'topLeft' },
          { label: (LL) => LL.ui.modal.notificationSettings.fields.screenPosition.values.topRight(), value: 'topRight' }
        ],
        { size: 4 }
      )
    } satisfies TabConfig;
  },

  cache() {
    return {} satisfies TabConfig;
  },

  account() {
    return {} satisfies TabConfig;
  }
} satisfies Record<string, (tab: TabBuilder) => TabConfig>;

function updateUnicodeFont(lang: string) {
  if (LATIN_EX_LANGS.includes(lang) !== get(globalConfig).unicodeFont)
    document.documentElement.style.setProperty(
      '--font-override',
      '-apple-system, BlinkMacSystemFont, xlatin-sans, PGothic, JF-Dot-Shinonome, sans-serif'
    );
  else document.documentElement.style.setProperty('--font-override', 'unset');
}

registerConfigHook('uiTheme', (value, gameId) => {
  const validThemes = (allGameUiThemes as Record<string, readonly string[]>)[gameId] ?? [];
  const theme = typeof value === 'string' && validThemes.includes(value) ? value : validThemes[0];
  if (theme) selectTheme(gameId as GameId, theme as any);
});

registerEngineAPIHandler('onUpdateSystemGraphic', (theme) => {
  if (get(userConfig).uiTheme === 'auto') {
    selectTheme('2kki', theme as any);
  }
});

registerConfigHook('lang', async (value) => {
  const lang = typeof value === 'string' && isLocale(value) ? value : baseLocale;
  if (!(lang in loadedLocales)) await loadLocaleAsync(lang);
  setLocale(lang);
  updateUnicodeFont(lang);
});

registerConfigHook('highContrast', async (value, gameId) => {
  await setHighContrastMode(Boolean(value), gameId);
});

registerConfigHook('unicodeFont', (value) => {
  updateUnicodeFont(get(locale));
});

registerConfigHook('mute', (value) => {
  if (value) {
    easyrpgPlayer.setSoundVolume(0);
    easyrpgPlayer.setMusicVolume(0);
  } else {
    const { soundVolume, musicVolume } = get(globalConfig);
    easyrpgPlayer.setSoundVolume(soundVolume);
    easyrpgPlayer.setMusicVolume(musicVolume);
  }
  easyrpgPlayer.saveConfig();
});

registerConfigHook('soundVolume', (value) => {
  if (!get(userConfig).mute) {
    easyrpgPlayer.setSoundVolume(+(value as string));
    easyrpgPlayer.saveConfig();
  }
});

registerConfigHook('musicVolume', (value) => {
  if (!get(userConfig).mute) {
    easyrpgPlayer.setMusicVolume(+(value as string));
    easyrpgPlayer.saveConfig();
  }
});

registerConfigHook('privateMode', (value) => {
  syncSessionPrivacyState();
});

registerConfigHook('hideLocation', (value) => {
  syncSessionPrivacyState();
});

registerConfigHook('singleplayerMode', (value) => {
  syncSessionPrivacyState();
});

// --- config end ---

export const settingsSchema = defineSettingsSchema({
  general: tabFields.general(makeTabBuilder('general')),
  chat: tabFields.chat(makeTabBuilder('chat')),
  screenshots: tabFields.screenshots(makeTabBuilder('screenshots')),
  notifications: tabFields.notifications(makeTabBuilder('notifications')),
  cache: tabFields.cache(),
  account: tabFields.account()
});

export const settingsFieldsByTab = {
  general: flattenTab(settingsSchema.general),
  chat: flattenTab(settingsSchema.chat),
  screenshots: flattenTab(settingsSchema.screenshots),
  notifications: flattenTab(settingsSchema.notifications),
  cache: flattenTab(settingsSchema.cache),
  account: flattenTab(settingsSchema.account)
};
