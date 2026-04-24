// place files you want to import through the `$lib` alias in this folder.

export const isBrowser = typeof document !== 'undefined';

export const gameIds = [
	'2kki',
	'amillusion',
	'braingirl',
	'cold',
	'unconscious',
	'deepdreams',
	'flow',
	'fog',
	'genie',
	'if',
	'loveyou',
	'mikan',
	'muma',
	'nostalgic',
	'oversomnia',
	'oneshot',
	'prayers',
	'sheawaits',
	'someday',
	'tsushin',
	'ultraviolet',
	'unaccomplished',
	'unevendream',
	'yume'
];
const gameIdMatch =
	isBrowser && new RegExp('(?:' + gameIds.join('|') + ')').exec(String(window.location));
export const gameId = '2kki'; // gameIdMatch ? gameIdMatch[0] : gameIds[0];
export const ynoGameId =
	gameIdMatch || (isBrowser && !new RegExp('dev').exec(String(window.location))) ? gameId : 'dev';

export const gameDefaultSprite = {
	'2kki': 'syujinkou1',
	amillusion: { sprite: 'parapluie ', idx: 1 },
	braingirl: 'mikan2',
	cold: { sprite: 'TH_1', idx: 2 },
	unconscious: 'protag_main_01',
	deepdreams: 'main',
	flow: 'sabituki',
	fog: 'FOG_leon',
	if: 'syujinkou',
	loveyou: 'effects',
	genie: 'syujinkou1',
	mikan: 'syuzinkou_01',
	muma: 'muma1',
	nostalgic: 'syujinkou',
	oneshot: { sprite: 'niko1', idx: 4 },
	oversomnia: 'player-01',
	prayers: 'Flourette',
	sheawaits: 'sprite-noelia',
	someday: 'itsuki1',
	tsushin: 'actor',
	ultraviolet: 'ch-主人公1',
	unaccomplished: 'YM_1',
	unevendream: 'kubo',
	yume: '0000000078'
}[gameId];

export const extractCanvas = isBrowser && document.createElement('canvas');

export const loggedInKey = 'ynoproject_loggedIn';
export const hostBase = 'ynoproject.net';
export const serverUrlBase = `api.${hostBase}`;
export const serverUrl = `https://${serverUrlBase}/${ynoGameId}`;
export const authApiUrl = `https://auth.${hostBase}`;
export const cdnUrl = `https://cdn.${hostBase}`;
export const ugcUrl = `https://ugc.${hostBase}`;
export const rankUrl = `https://rank.${hostBase}`;
export const apiUrl = `${serverUrl}/api`;
export const adminApiUrl = `${serverUrl}/admin`;
export const ynomojiUrlPrefix = 'images/ynomoji/';
