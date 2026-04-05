import { registerConfigHook } from './stores/config';
import { selectTheme, allGameUiThemes, setHighContrastMode } from './stores/uiTheme';
import { loadLocaleAsync } from '../i18n/i18n-util.async';
import { setLocale } from '../i18n/i18n-svelte';
import { baseLocale, isLocale, loadedLocales } from '../i18n/i18n-util';
import type { GameId } from './allGameUiThemes';

registerConfigHook('uiTheme', (value, gameId) => {
  const validThemes = (allGameUiThemes as Record<string, readonly string[]>)[gameId] ?? [];
  const theme = typeof value === 'string' && validThemes.includes(value) ? value : validThemes[0];
  if (theme) selectTheme(gameId as GameId, theme as any);
});

registerConfigHook('lang', async (value) => {
  const lang = typeof value === 'string' && isLocale(value) ? value : baseLocale;
  if (!(lang in loadedLocales)) await loadLocaleAsync(lang);
  setLocale(lang);
});

registerConfigHook('highContrast', async (value, gameId) => {
  await setHighContrastMode(Boolean(value), gameId);
});
