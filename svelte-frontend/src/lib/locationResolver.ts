import { getGameInitState } from './init';

type Coords = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

type MapTitle = {
  title: string;
  urlTitle?: string;
  coords?: Coords;
  explorer?: boolean;
};

type MapDescriptor =
  | string
  | MapTitle
  | Array<string | MapTitle>
  | Record<string, string | MapTitle | Array<string | MapTitle>>;

type MapDescriptorRecord = Record<string, MapDescriptor>;

type LocationConfigResponse = {
  urlRoot?: string;
  mapLocations?: MapDescriptorRecord;
  locationUrlTitles?: Record<string, string>;
};

type LocationState = {
  urlRoot: string;
  mapLocations: MapDescriptorRecord;
  localizedMapLocations: MapDescriptorRecord;
  sourcePath: string;
};

type ResolvedLocationInfo = {
  name: string;
  url: string | null;
};

type ResolveLocationInput = {
  gameId?: string;
  lang?: string;
  mapId: string;
  prevMapId?: string;
  prevLocationsStr?: string;
  x?: number;
  y?: number;
};

type InitLocationResolverInput = {
  gameId?: string;
  lang?: string;
};

type Legacy2kkiLocation = {
  title?: string;
  titleJP?: string;
  urlTitle?: string;
  urlTitleJP?: string;
};

type Legacy2kkiPrevLocation = {
  title: string;
};

const stateCache = new Map<string, Promise<LocationState>>();
const pending2kkiRequests = new Map<string, Promise<unknown>>();
const locationCache2kki: Record<string, Legacy2kkiLocation[]> = {};
const EXPLORER_PROXY_BASE = '/explorer';

function getCacheKey(gameId: string, lang: string): string {
  return `${gameId}:${lang}`;
}

function normalizeMapId(mapId?: string): string {
  const raw = String(mapId || '0000').trim();
  if (!raw) return '0000';
  return raw.padStart(4, '0');
}

function decodePrevLocations(prevLocationsStr?: string, prevMapId?: string): Legacy2kkiPrevLocation[] | null {
  if (!prevLocationsStr || normalizeMapId(prevMapId) === '0000') return null;
  if (typeof window === 'undefined') return null;

  try {
    const decoded = decodeURIComponent(window.atob(prevLocationsStr));
    const locations = decoded
      .split('|')
      .map((title) => title.trim())
      .filter(Boolean)
      .map((title) => ({ title }));
    return locations.length ? locations : null;
  } catch (_err) {
    return null;
  }
}

function toWikiPath(title: string): string {
  return title.trim().replace(/\s+/g, '_');
}

function buildLocationUrl(urlRoot: string, value?: string): string | null {
  if (!urlRoot || !value) return null;
  const root = /\/$/.test(urlRoot) ? urlRoot : `${urlRoot}/`;
  return `${root}${value}`;
}

async function send2kkiApiRequest<T>(url: string): Promise<T | null> {
  const pendingRequest = pending2kkiRequests.get(url);
  if (pendingRequest) {
    return pendingRequest as Promise<T | null>;
  }

  const request = fetch(url, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`${url}: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .catch(() => null)
    .finally(() => {
      pending2kkiRequests.delete(url);
    });

  pending2kkiRequests.set(url, request);
  return request;
}

function buildExplorerProxyUrl(path: string, params: URLSearchParams): string {
  const normalizedPath = path.replace(/^\/+/, '');
  const query = params.toString();
  return `${EXPLORER_PROXY_BASE}/${normalizedPath}${query ? `?${query}` : ''}`;
}

async function queryConnected2kkiLocationNames(locationName: string, connLocationNames: string[]): Promise<string[]> {
  if (!locationName || !connLocationNames.length) {
    return [];
  }

  const params = new URLSearchParams();
  params.set('locationName', locationName);
  for (const name of connLocationNames) {
    params.append('connLocationNames', name);
  }
  const url = buildExplorerProxyUrl('getConnectedLocations', params);
  const response = await send2kkiApiRequest(url);

  if (Array.isArray(response)) {
    return response.filter((value): value is string => typeof value === 'string' && value.length > 0);
  }

  return [];
}

async function queryAndSet2kkiLocation(
  mapId: string,
  prevMapId: string | null,
  prevLocations: Legacy2kkiPrevLocation[] | null
): Promise<Legacy2kkiLocation[] | null> {
  const params = new URLSearchParams();
  params.set('mapId', mapId);
  if (prevMapId) {
    params.set('prevMapId', prevMapId);
    if (prevLocations && prevLocations.length) {
      for (const location of prevLocations) {
        params.append('prevLocationNames', location.title);
      }
    }
  }
  const url = buildExplorerProxyUrl('getMapLocationNames', params);
  const responseLocations = await send2kkiApiRequest<Legacy2kkiLocation[]>(url);

  if (responseLocations && responseLocations.length) {
    const locations: Legacy2kkiLocation[] = [];
    let location = responseLocations[0];
    let usePrevLocations = false;

    if (responseLocations.length > 1 && prevLocations && prevLocations.length) {
      for (const candidate of responseLocations) {
        if (candidate.title && candidate.title === prevLocations[0].title) {
          location = candidate;
          usePrevLocations = true;
          break;
        }
      }
    }

    if (usePrevLocations) {
      locations.push(location);
    } else {
      for (const candidate of responseLocations) locations.push(candidate);
    }

    if (usePrevLocations && location.title) {
      const remainingNames = responseLocations
        .filter((candidate) => candidate.title && candidate.title !== location.title)
        .map((candidate) => candidate.title as string);

      try {
        const connectedNames = await queryConnected2kkiLocationNames(location.title, remainingNames);
        const connectedLocations = responseLocations.filter(
          (candidate) => candidate.title && connectedNames.includes(candidate.title)
        );
        return [...locations, ...connectedLocations];
      } catch (_err) {
        return locations.length ? locations : null;
      }
    }

    return locations.length ? locations : null;
  }

  if (prevMapId) {
    await queryAndSet2kkiLocation(mapId, null, null);
    return null;
  }

  return null;
}

async function getOrQuery2kkiLocations(
  mapId: string,
  prevMapId: string | null,
  prevLocations: Legacy2kkiPrevLocation[] | null
): Promise<Legacy2kkiLocation[] | null> {
  const normalizedPrevMapId = prevMapId || '0000';
  const locationKey = `${normalizedPrevMapId}_${mapId}`;

  const cached = locationCache2kki[locationKey];
  if (cached?.length) {
    return cached;
  }

  try {
    const locations = await queryAndSet2kkiLocation(
      mapId,
      normalizedPrevMapId !== '0000' ? normalizedPrevMapId : null,
      prevLocations
    );

    if (locations?.length) {
      locationCache2kki[locationKey] = locations;
    }

    return locations;
  } catch (_err) {
    return null;
  }
}

function query2kkiLocations(
  mapId: string,
  prevMapId: string,
  prevLocationsStr?: string
): Promise<Legacy2kkiLocation[] | null> {
  const prevLocations = decodePrevLocations(prevLocationsStr, prevMapId);
  return getOrQuery2kkiLocations(mapId, prevMapId === '0000' ? null : prevMapId, prevLocations);
}

function logResolvedMapName(mapId: string, prevMapId: string, mapName: string, source: string): void {
  // console.info(`[locationResolver:${source}] mapId=${mapId} prevMapId=${prevMapId} -> ${mapName}`);
}

function toAltMapIds(mapId: string): string[] {
  const compact = mapId.replace(/^0+/, '') || '0';
  const numeric = Number.parseInt(mapId, 10);
  const variants = [mapId, compact];
  if (!Number.isNaN(numeric)) {
    variants.push(String(numeric));
  }
  return Array.from(new Set(variants));
}

function isMapTitle(value: unknown): value is MapTitle {
  return !!value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'title');
}

function massageMapLocations(mapLocations: unknown, locationUrlTitles?: Record<string, string> | null): void {
  if (!mapLocations || typeof mapLocations !== 'object') return;

  if (Array.isArray(mapLocations)) {
    for (let i = 0; i < mapLocations.length; i += 1) {
      const mapLocation = mapLocations[i];
      if (typeof mapLocation === 'string') {
        const next: MapTitle = { title: mapLocation };
        if (locationUrlTitles && Object.prototype.hasOwnProperty.call(locationUrlTitles, mapLocation)) {
          next.urlTitle = locationUrlTitles[mapLocation];
        }
        mapLocations[i] = next;
      }
    }
    return;
  }

  if (isMapTitle(mapLocations)) {
    if (locationUrlTitles && Object.prototype.hasOwnProperty.call(locationUrlTitles, mapLocations.title)) {
      mapLocations.urlTitle = locationUrlTitles[mapLocations.title];
    }
    return;
  }

  for (const key of Object.keys(mapLocations)) {
    const mapLocation = (mapLocations as Record<string, unknown>)[key];
    if (typeof mapLocation === 'string') {
      const next: MapTitle = { title: mapLocation };
      if (locationUrlTitles && Object.prototype.hasOwnProperty.call(locationUrlTitles, mapLocation)) {
        next.urlTitle = locationUrlTitles[mapLocation];
      }
      (mapLocations as Record<string, unknown>)[key] = next;
    } else {
      massageMapLocations(mapLocation, locationUrlTitles ?? null);
    }
  }
}

function getMapLocationsFromArray(locations: Array<string | MapTitle>, x?: number, y?: number): MapTitle[] {
  const normalized = locations.filter((location): location is MapTitle => isMapTitle(location));
  if (!normalized.length) return [];

  const hasCoords = normalized[0]?.coords;
  const hasPoint = Number.isFinite(x) && Number.isFinite(y);

  if (hasCoords && hasPoint) {
    const coordLocation = normalized.find((location) => {
      if (!location.coords) return false;
      const xMatch =
        (location.coords.x1 === -1 && location.coords.x2 === -1) ||
        (location.coords.x1 <= (x as number) && location.coords.x2 >= (x as number));
      const yMatch =
        (location.coords.y1 === -1 && location.coords.y2 === -1) ||
        (location.coords.y1 <= (y as number) && location.coords.y2 >= (y as number));
      return xMatch && yMatch;
    });

    if (coordLocation) return [coordLocation];

    const noCoordLocations = normalized.filter((location) => !location.coords);
    if (noCoordLocations.length) return noCoordLocations;
  }

  return normalized;
}

function getLocationsArray(
  locationsByMap: MapDescriptorRecord,
  mapId: string,
  prevMapId: string,
  x?: number,
  y?: number
): MapTitle[] {
  const descriptor = toAltMapIds(mapId)
    .map((id) => locationsByMap[id])
    .find((entry) => !!entry);
  if (!descriptor) return [];

  if (isMapTitle(descriptor)) {
    return [descriptor];
  }

  if (Array.isArray(descriptor)) {
    return getMapLocationsFromArray(descriptor, x, y);
  }

  if (typeof descriptor === 'object') {
    const byPrev = toAltMapIds(prevMapId)
      .map((id) => descriptor[id])
      .find((entry) => !!entry);
    if (byPrev) {
      if (Array.isArray(byPrev)) return getMapLocationsFromArray(byPrev, x, y);
      if (isMapTitle(byPrev)) return [byPrev];
    }

    const fallback = descriptor.else;
    if (fallback) {
      if (Array.isArray(fallback)) return getMapLocationsFromArray(fallback, x, y);
      if (isMapTitle(fallback)) return [fallback];
    }
  }

  return [];
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`${path}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function fetchFirstAvailableJson<T>(paths: string[]): Promise<{ data: T; path: string }> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      const data = await fetchJson<T>(path);
      return { data, path };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to fetch location data');
}

function getPathCandidates(gameId: string, fileName: string): string[] {
  const roots = ['/', '', './', '../', '../../', '../../../'];
  const paths = roots.map((root) => `${root}locations/${gameId}/${fileName}`.replace(/\/{2,}/g, '/'));
  return Array.from(new Set(paths));
}

async function loadLocationState(gameId: string, lang: string): Promise<LocationState> {
  const baseRes = await fetchFirstAvailableJson<LocationConfigResponse>(getPathCandidates(gameId, 'config.json'));
  const baseConfig = baseRes.data;
  const urlRoot = baseConfig.urlRoot || '';
  const baseMapLocations = baseConfig.mapLocations || {};
  massageMapLocations(baseMapLocations, baseConfig.locationUrlTitles || null);

  if (lang === 'en') {
    return {
      urlRoot,
      mapLocations: baseMapLocations,
      localizedMapLocations: baseMapLocations,
      sourcePath: baseRes.path
    };
  }

  try {
    const localizedRes = await fetchFirstAvailableJson<LocationConfigResponse>(
      getPathCandidates(gameId, `${lang}.json`)
    );
    const localizedConfig = localizedRes.data;
    const langMapLocations = localizedConfig.mapLocations || {};
    massageMapLocations(langMapLocations, localizedConfig.locationUrlTitles || null);

    const localizedMapLocations: MapDescriptorRecord = {};
    for (const mapId of Object.keys(baseMapLocations)) {
      const baseEntry = baseMapLocations[mapId];
      const localizedEntry = langMapLocations[mapId];
      if (localizedEntry) {
        localizedMapLocations[mapId] = localizedEntry;

        if (Array.isArray(baseEntry) && Array.isArray(localizedEntry) && baseEntry.length === localizedEntry.length) {
          for (let i = 0; i < baseEntry.length; i += 1) {
            const baseLocation = baseEntry[i];
            const localizedLocation = localizedEntry[i];
            if (isMapTitle(baseLocation) && isMapTitle(localizedLocation) && baseLocation.coords) {
              localizedLocation.coords = baseLocation.coords;
            }
          }
        }
      } else {
        localizedMapLocations[mapId] = baseEntry;
      }
    }

    return {
      urlRoot,
      mapLocations: baseMapLocations,
      localizedMapLocations,
      sourcePath: localizedRes.path
    };
  } catch (_err) {
    return {
      urlRoot,
      mapLocations: baseMapLocations,
      localizedMapLocations: baseMapLocations,
      sourcePath: baseRes.path
    };
  }
}

async function getLocationState(gameId: string, lang: string): Promise<LocationState> {
  const key = getCacheKey(gameId, lang);
  let pending = stateCache.get(key);
  if (!pending) {
    pending = loadLocationState(gameId, lang).catch((err) => {
      stateCache.delete(key);
      throw err;
    });
    stateCache.set(key, pending);
  }
  return pending;
}

async function ensureInitialized(input: InitLocationResolverInput = {}): Promise<LocationState> {
  const init = getGameInitState();
  const gameId = input.gameId || init.gameId;
  const lang = (input.lang || document.documentElement.lang || 'en').toLowerCase();

  return getLocationState(gameId, lang);
}

export const locationResolver = {
  async init(input: InitLocationResolverInput = {}): Promise<void> {
    await ensureInitialized(input);
  },
  async resolveCurrentLocationInfo(input: ResolveLocationInput): Promise<ResolvedLocationInfo> {
    const init = getGameInitState();
    const gameId = input.gameId || init.gameId;
    const lang = (input.lang || document.documentElement.lang || 'en').toLowerCase();
    const mapId = normalizeMapId(input.mapId);
    const prevMapId = normalizeMapId(input.prevMapId || '0000');

    if (mapId === '0000') return { name: '', url: null };

    if (gameId === '2kki') {
      try {
        const locations = await query2kkiLocations(mapId, prevMapId, input.prevLocationsStr);
        const filtered = (locations || []).filter((location) => (location.title || '').trim().length > 0);
        const resolved = filtered.map((location) => (location.title || '').trim()).join(' | ');

        if (resolved) {
          const first = filtered[0];
          const path = first?.urlTitle || toWikiPath(first?.title || '');
          const url = buildLocationUrl('https://yume.wiki/2kki/', path);
          logResolvedMapName(mapId, prevMapId, resolved, '2kki');
          return { name: resolved, url };
        }
      } catch (err) {
        console.warn('Failed to resolve 2kki location via getOrQuery2kkiLocations:', err);
      }
    }

    try {
      const { localizedMapLocations, urlRoot } = await ensureInitialized({ gameId, lang });
      const resolvedLocations = getLocationsArray(localizedMapLocations, mapId, prevMapId, input.x, input.y);
      const resolved = resolvedLocations
        .map((location) => location.title)
        .filter(Boolean)
        .join(' | ');

      if (resolved) {
        const first = resolvedLocations[0];
        const path = first?.urlTitle || toWikiPath(first?.title || '');
        const url = buildLocationUrl(urlRoot, path);
        logResolvedMapName(mapId, prevMapId, resolved, 'config');
        return { name: resolved, url };
      }
    } catch (err) {
      console.warn('Failed to resolve map location label:', err);
    }

    const fallback = `Unknown Location (MAP${mapId})`;
    logResolvedMapName(mapId, prevMapId, fallback, 'fallback');
    return { name: fallback, url: null };
  },
  async resolveCurrentLocationName(input: ResolveLocationInput): Promise<string> {
    const info = await locationResolver.resolveCurrentLocationInfo(input);
    return info.name;
  }
};

// Backward-compatible alias; prefer locationResolver.
export const locationResolverStore = locationResolver;

export async function resolveCurrentLocationName(input: ResolveLocationInput): Promise<string> {
  return locationResolver.resolveCurrentLocationName(input);
}
