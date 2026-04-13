import { writable, type Readable, type Writable } from 'svelte/store';

const LOADER_SHOW_DELAY = 150;
const defaultVisibleTargets = new Set(['loadingOverlay']);

type LoaderEntry = {
  active: Writable<boolean>;
  showTimer: ReturnType<typeof setTimeout> | null;
};

const loaders = new Map<string, LoaderEntry>();

function isDefaultVisible(targetId: string) {
  return defaultVisibleTargets.has(targetId);
}

function getLoader(targetId: string) {
  let loader = loaders.get(targetId);
  if (!loader) {
    loader = {
      active: writable(isDefaultVisible(targetId)),
      showTimer: null
    };
    loaders.set(targetId, loader);
  }
  return loader;
}

export function addLoader(targetId: string) {
  const loader = getLoader(targetId);

  if (loader.showTimer) {
    return;
  }

  if (isDefaultVisible(targetId)) {
    loader.active.set(true);
    return;
  }

  loader.showTimer = setTimeout(() => {
    loader.showTimer = null;
    loader.active.set(true);
  }, LOADER_SHOW_DELAY);
}

export function removeLoader(targetId: string) {
  const loader = getLoader(targetId);

  if (loader.showTimer) {
    clearTimeout(loader.showTimer);
    loader.showTimer = null;
  }

  loader.active.set(false);
}

export function loaderActive(targetId: string): Readable<boolean> {
  return getLoader(targetId).active;
}
