import { ynoGameId } from "$lib";
import { hasTouchscreen } from "./init";

export let globalConfig = {
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
	warningsReviewed: false,
	badgeToolsData: null,
	pushNotificationToastDismissed: false,
	unicodeFont: false
};

export let config = {
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
	hideUnnamedPlayers: false,

	fontStyle: 0,
	uiTheme: 'Default'
};

const rtlLangs = ['ar'];
const latinExLangs = ['vi', 'ru', 'uk'];
export function setLang(lang, isInit) {
	if (rtlLangs.includes(lang)) document.documentElement.setAttribute('dir', 'rtl');
	else document.documentElement.removeAttribute('dir');

	setExtendedLatinFonts(lang);

	globalConfig.lang = lang;
	initBlocker = initBlocker.then(() =>
		withTimeout(
			800,
			fetchNewest(`${cdnUrl}/${gameId}/Language/${lang}/meta.ini`).then((response) => {
				// Prevent a crash when the --language argument is used and the game doesn't have a Language folder
				if (response.ok && response.status < 400 && isInit && gameIds.indexOf(gameId) > -1) {
					easyrpgPlayer.language = (
						gameDefaultLangs.hasOwnProperty(gameId)
							? gameDefaultLangs[gameId] !== lang
							: lang !== 'en'
					)
						? lang
						: 'default';
				}
			})
		)
	);
	initLocalization(isInit);
	if (!isInit) {
		updateConfig(globalConfig, true);
		if (document.fullscreenElement) {
			updateCanvasFullscreenSize();
		}
	}
}

function setExtendedLatinFonts(lang) {
	if (latinExLangs.includes(lang) !== globalConfig.unicodeFont)
		document.documentElement.style.setProperty(
			'--font-override',
			'-apple-system, BlinkMacSystemFont, xlatin-sans, PGothic, JF-Dot-Shinonome, sans-serif'
		);
	else document.documentElement.style.setProperty('--font-override', 'unset');
}

function setSaveReminder(saveReminder, isInit) {
	globalConfig.saveReminder = saveReminder;
	if (!isInit) updateConfig(globalConfig, true);
	resetSaveReminder();
}

export function setName(name, isInit) {
	globalConfig.name = name;
	if (!isInit) updateConfig(globalConfig, true);
}

export function setSoundVolume(value, isInit) {
	if (isNaN(value)) return;
	if (easyrpgPlayer.initialized && !config.mute) {
		easyrpgPlayer.api.setSoundVolume(value);
		debounce(easyrpgPlayer.api.saveConfig);
	}
	globalConfig.soundVolume = value;
	if (!isInit) updateConfig(globalConfig, true);
}

export function setMusicVolume(value, isInit) {
	if (isNaN(value)) return;
	if (easyrpgPlayer.initialized && !config.mute) {
		easyrpgPlayer.api.setMusicVolume(value);
		debounce(easyrpgPlayer.api.saveConfig);
	}
	globalConfig.musicVolume = value;
	if (!isInit) updateConfig(globalConfig, true);
}

export function setWikiLinkMode(wikiLinkMode, isInit) {
	globalConfig.wikiLinkMode = wikiLinkMode;
	if (!isInit) updateConfig(globalConfig, true);
}

export function setMapChatHistoryLimit(limit, isInit) {
	globalConfig.mapChatHistoryLimit = limit;
	if (!isInit) updateConfig(globalConfig, true);
}

export function setGlobalChatHistoryLimit(limit, isInit) {
	globalConfig.globalChatHistoryLimit = limit;
	if (!isInit) updateConfig(globalConfig, true);
}

export function setPartyChatHistoryLimit(limit, isInit) {
	globalConfig.partyChatHistoryLimit = limit;
	if (!isInit) updateConfig(globalConfig, true);
}

export function setMobileControlType(value, isInit) {
	if (!hasTouchscreen) return;
	globalConfig.mobileControlsType = value;
	if (!isInit) updateConfig(globalConfig, true);

	updateMobileControlType();
}

export function updateConfig(configObj: unknown = config, global = false, configName?: string) {
	if (!configName) configName = 'config';
	try {
		window.localStorage[global ? configName : `${configName}_${ynoGameId}`] =
			JSON.stringify(configObj);
	} catch (error) {
		console.error(error);
	}
}
