import { get, writable } from 'svelte/store';

export type YnomojiConfig = Record<string, string>;

const YNOMOJI_URL_PREFIX = '/images/ynomoji/';

export const ynomojiConfig = writable<YnomojiConfig>({});

export async function loadYnomojiConfig(): Promise<void> {
  try {
    const response = await fetch('/ynomoji.json');
    if (!response.ok) throw new Error(`Failed to fetch ynomoji.json: ${response.status}`);
    const config = (await response.json()) as YnomojiConfig;
    ynomojiConfig.set(config);
  } catch (err) {
    console.error('Failed to load ynomoji config:', err);
  }
}

export function getYnomojiUrl(id: string): string {
  const config = get(ynomojiConfig);
  const filename = config[id];
  if (!filename) return '';
  return `${YNOMOJI_URL_PREFIX}${filename}`;
}

export function matchYnomojiIds(config: YnomojiConfig, partialMatch: string): string[] {
  if (!partialMatch) return Object.keys(config);
  const lcMatch = partialMatch.toLowerCase();
  return Object.keys(config).filter((ynomojiId) => {
    const matchStrings: string[] = [ynomojiId];
    const uppercasePattern = /[A-Z0-9]+/g;
    let matchResult;
    while ((matchResult = uppercasePattern.exec(ynomojiId)) !== null) {
      if (matchResult.index > 0) {
        matchStrings.push(ynomojiId.slice(matchResult.index));
      }
    }
    return matchStrings.some((s) => s.toLowerCase().startsWith(lcMatch));
  });
}
