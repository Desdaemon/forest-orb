export const gameIds = [
  '2kki',
  'amillusion',
  'braingirl',
  'unconscious',
  'deepdreams',
  'flow',
  'fog',
  'genie',
  'if',
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
] as const;

export type GameId = (typeof gameIds)[number];

export const gameNameMap: Record<GameId, string> = {
  '2kki': 'Yume 2kki',
  amillusion: 'Amillusion',
  braingirl: 'Braingirl',
  unconscious: 'Collective Unconscious',
  deepdreams: 'Deep Dreams',
  flow: '.flow',
  fog: 'FOG',
  genie: 'Dream Genie',
  if: 'If',
  mikan: 'Mikan Muzou',
  muma: 'Muma Rope',
  nostalgic: 'nostAlgic',
  oversomnia: 'Oversomnia',
  oneshot: 'OneShot',
  prayers: 'Answered Prayers',
  sheawaits: 'She Awaits',
  someday: 'Someday',
  tsushin: 'Yume Tsushin',
  ultraviolet: 'Ultra Violet',
  unaccomplished: 'Unaccomplished',
  unevendream: 'Uneven Dream',
  yume: 'Yume Nikki'
};

export type InitPayload = {
  gameId?: GameId;
  gameName?: string;
  isMobile?: boolean;
  isFirefox?: boolean;
};

export const isBrowser = typeof window !== 'undefined';

export function getInitPayload(): InitPayload {
  if (!isBrowser) return {};
  return (window as any).YNO_INIT || {};
}

export function inferGameId(payload: InitPayload = {}): GameId {
  const candidate = (payload.gameId || '').toString();
  if (candidate && gameIds.includes(candidate as GameId)) {
    return candidate as GameId;
  }
  if (isBrowser) {
    const query = new URLSearchParams(window.location.search).get('game');
    if (query && gameIds.includes(query as GameId)) return query as GameId;
  }
  return '2kki';
}

export function inferGameName(gameId: GameId, payload: InitPayload = {}) {
  return payload.gameName || gameNameMap[gameId] || 'Yume 2kki';
}

export function getApiBase(gameId: GameId) {
  return `https://connect.ynoproject.net/${gameId}/`;
  // return `/connect/${gameId}/`;
}

export function getApiUrl(gameId: GameId) {
  return `${getApiBase(gameId)}/api`;
}

export function getAdminApiUrl(gameId: GameId) {
  return `${getApiBase(gameId)}/admin`;
}

export function getSessionId() {
  if (!isBrowser) return '';
  const match = document.cookie.match(/(?:^|; )ynoproject_sessionId=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export const hasTouchscreen = isBrowser ? window.matchMedia('(hover: none), (pointer: coarse)').matches : false;

export const tippyConfig = {
  arrow: false,
  animation: 'scale',
  allowHTML: true,
  touch: ['hold', 400] as ['hold', number]
};

export const sessionIdKey = 'ynoproject_sessionId';

export function getGameInitState() {
  const payload = getInitPayload();
  const gameId = inferGameId(payload);
  const ynoGameId = /dev/.test(typeof window !== 'undefined' ? window.location.href : '') ? gameId : gameId;
  return {
    payload,
    gameId,
    ynoGameId,
    gameName: inferGameName(gameId, payload),
    isMobile: payload.isMobile ?? false,
    isFirefox: payload.isFirefox ?? false,
    serverUrl: getApiBase(gameId),
    apiUrl: getApiUrl(gameId),
    adminApiUrl: getAdminApiUrl(gameId),
    sessionId: getSessionId()
  };
}
