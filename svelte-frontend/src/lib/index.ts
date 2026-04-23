// place files you want to import through the `$lib` alias in this folder.

export const isBrowser = typeof document !== 'undefined';

export const gameIds = [ '2kki', 'amillusion', 'braingirl', 'cold', 'unconscious', 'deepdreams', 'flow', 'fog', 'genie', 'if', 'loveyou', 'mikan', 'muma', 'nostalgic', 'oversomnia', 'oneshot', 'prayers', 'sheawaits', 'someday', 'tsushin', 'ultraviolet', 'unaccomplished', 'unevendream', 'yume' ];
const gameIdMatch = isBrowser && new RegExp('(?:' + gameIds.join('|') + ')').exec(String(window.location));
export const gameId = '2kki'; // gameIdMatch ? gameIdMatch[0] : gameIds[0];
export const ynoGameId = gameIdMatch || isBrowser && !new RegExp('dev').exec(String(window.location)) ? gameId : 'dev';
