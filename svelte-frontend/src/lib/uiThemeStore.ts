import { writable, get } from 'svelte/store';
import { allGameUiThemes, allGameFullBgUiThemes } from './allGameUiThemes';

export { allGameUiThemes, allGameFullBgUiThemes };

export interface ActivatedTheme {
  gameId: string;
  uiTheme: string;
}

/** All themes that have ever been activated. This list only grows — entries are never removed. */
export const activatedThemes = writable<ActivatedTheme[]>([]);

/** The name of the currently selected UI theme for the active game. 'auto' means follow the in-game system graphic. */
export const selectedUiTheme = writable<string | null>(null);

/** The currently selected font style index (0-based). */
export const selectedFontStyle = writable<number>(0);

/** The player's current in-game system graphic name, used to resolve the 'auto' theme. */
export const currentSystemName = writable<string | null>(null);

// ---------- canvas ----------

let extractCanvas: HTMLCanvasElement | null = null;

function getExtractCanvas(): HTMLCanvasElement {
  if (!extractCanvas) {
    extractCanvas = document.createElement('canvas');
    extractCanvas.width = 16;
    extractCanvas.height = 16;
  }
  return extractCanvas;
}

// ---------- caches (mirror system.js globals) ----------

const uiThemeBgColors: Record<string, Record<string, [number, number, number]>> = {};
const uiThemeFontShadows: Record<string, Record<string, [number, number, number]>> = {};
const uiThemeFontColors: Record<string, Record<string, Record<number, [number, number, number][]>>> = {};

// ---------- pure helpers ----------

function getColorRgb(color: [number, number, number]): string {
  return `${color[0]}, ${color[1]}, ${color[2]}`;
}

function getGradientText(colors: [number, number, number][], smooth?: boolean): string {
  let lastColor = colors[0];
  let ret = `rgb(${getColorRgb(lastColor)}) 0 `;
  colors.forEach((color, c) => {
    if (color[0] !== lastColor[0] || color[1] !== lastColor[1] || color[2] !== lastColor[2]) {
      const percent = Math.floor(((c + 1) / colors.length) * 10000) / 100;
      ret += `${percent}%, rgb(${getColorRgb(color)}) `;
      if (!smooth) ret += `${percent}% `;
      lastColor = color;
    }
  });
  ret += '100%';
  return ret;
}

function getSvgGradientStop(color: [number, number, number], offset: number): SVGStopElement {
  const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop.setAttribute('stop-color', `rgb(${getColorRgb(color)})`);
  stop.setAttribute('offset', `${offset}%`);
  return stop;
}

function updateSvgGradient(gradient: SVGLinearGradientElement, colors: [number, number, number][]) {
  gradient.innerHTML = '';
  let lastColor = colors[0];
  gradient.appendChild(getSvgGradientStop(lastColor, 0));
  colors.forEach((color, c) => {
    if (color[0] !== lastColor[0] || color[1] !== lastColor[1] || color[2] !== lastColor[2]) {
      const offset = Math.floor(((c + 1) / colors.length) * 10000) / 100;
      gradient.appendChild(getSvgGradientStop(color, offset));
      lastColor = color;
    }
  });
}

function addSystemSvgGradient(
  uiTheme: string,
  themeGameId: string,
  gameId: string,
  colors: [number, number, number][],
  alt?: boolean,
) {
  const gradientId = `${alt ? 'alt' : 'base'}Gradient_${themeGameId !== gameId ? `${themeGameId}_` : ''}${uiTheme.replace(/[ ()]/g, '_')}`;
  if (document.getElementById(gradientId)) return;
  const svgDefs = document.getElementById('svgDefs');
  if (!svgDefs) return;
  const svgGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient') as SVGLinearGradientElement;
  svgGradient.id = gradientId;
  svgGradient.setAttribute('x1', '0%');
  svgGradient.setAttribute('y1', '0%');
  svgGradient.setAttribute('x2', '0%');
  svgGradient.setAttribute('y2', '100%');
  updateSvgGradient(svgGradient, colors);
  svgDefs.appendChild(svgGradient);
}

function addSystemSvgDropShadow(uiTheme: string, themeGameId: string, gameId: string, color: string) {
  const dropShadowFilterId = `dropShadow_${themeGameId !== gameId ? `${themeGameId}_` : ''}${uiTheme.replace(/[ ()]/g, '_')}`;
  if (document.getElementById(dropShadowFilterId)) return;
  const svgDefs = document.getElementById('svgDefs');
  if (!svgDefs) return;
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.id = dropShadowFilterId;
  const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
  feDropShadow.setAttribute('dx', '1');
  feDropShadow.setAttribute('dy', '1');
  feDropShadow.setAttribute('stdDeviation', '0.2');
  feDropShadow.setAttribute('flood-color', `rgb(${color})`);
  filter.appendChild(feDropShadow);
  svgDefs.appendChild(filter);
}

// ---------- async image loaders (mirror system.js) ----------

async function getBaseBgColor(uiTheme: string, themeGameId: string): Promise<string> {
  if (!uiThemeBgColors[themeGameId]) uiThemeBgColors[themeGameId] = {};
  const cached = uiThemeBgColors[themeGameId][uiTheme];
  if (cached) return getColorRgb(cached);

  const img = new Image();
  img.src = `images/ui/${themeGameId}/${uiTheme}/containerbg.png`;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });
  await img.decode();

  const ctx = getExtractCanvas().getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const p1 = ctx.getImageData(0, 0, 1, 1).data;
  const p2 = ctx.getImageData(4, 4, 1, 1).data;
  const p3 = ctx.getImageData(8, 8, 1, 1).data;
  const pixel: [number, number, number] = [
    Math.round((p1[0] + p2[0] + p3[0]) / 3),
    Math.round((p1[1] + p2[1] + p3[1]) / 3),
    Math.round((p1[2] + p2[2] + p3[2]) / 3),
  ];
  uiThemeBgColors[themeGameId][uiTheme] = pixel;
  return getColorRgb(pixel);
}

async function getFontShadow(uiTheme: string, themeGameId: string): Promise<string> {
  if (!uiThemeFontShadows[themeGameId]) uiThemeFontShadows[themeGameId] = {};
  const cached = uiThemeFontShadows[themeGameId][uiTheme];
  if (cached) return getColorRgb(cached);

  const img = new Image();
  img.src = `images/ui/${themeGameId}/${uiTheme}/fontshadow.png`;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });
  await img.decode();

  const ctx = getExtractCanvas().getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const p = ctx.getImageData(0, 8, 1, 1).data;
  const pixel: [number, number, number] = [p[0], p[1], p[2]];
  uiThemeFontShadows[themeGameId][uiTheme] = pixel;
  return getColorRgb(pixel);
}

async function getFontColors(
  uiTheme: string,
  themeGameId: string,
  fontStyle: number,
): Promise<[number, number, number][]> {
  if (!uiThemeFontColors[themeGameId]) uiThemeFontColors[themeGameId] = {};
  if (!uiThemeFontColors[themeGameId][uiTheme]) uiThemeFontColors[themeGameId][uiTheme] = {};
  const cached = uiThemeFontColors[themeGameId][uiTheme][fontStyle];
  if (cached) return cached;

  const img = new Image();
  img.src = `images/ui/${themeGameId}/${uiTheme}/font${fontStyle + 1}.png`;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });
  await img.decode();

  const ctx = getExtractCanvas().getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, 1, 16).data;
  const colors: [number, number, number][] = Array.from(
    { length: data.length / 4 },
    (_, i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]],
  );
  uiThemeFontColors[themeGameId][uiTheme][fontStyle] = colors;
  return colors;
}

// ---------- init functions (mirror system.js) ----------

export async function initUiThemeContainerStyles(
  uiTheme: string,
  themeGameId: string,
  gameId: string,
  setTheme: boolean,
): Promise<void> {
  const parsedUiTheme = uiTheme.replace(/[ ()]/g, '_');
  const themeGamePropSuffix = themeGameId !== gameId ? `${themeGameId}-` : '';
  const baseBgColorProp         = `--base-bg-color-${themeGamePropSuffix}${parsedUiTheme}`;
  const shadowColorProp         = `--shadow-color-${themeGamePropSuffix}${parsedUiTheme}`;
  const svgShadowProp           = `--svg-shadow-${themeGamePropSuffix}${parsedUiTheme}`;
  const containerBgImageUrlProp = `--container-bg-image-url-${themeGamePropSuffix}${parsedUiTheme}`;
  const borderImageUrlProp      = `--border-image-url-${themeGamePropSuffix}${parsedUiTheme}`;

  const [color, shadow] = await Promise.all([
    getBaseBgColor(uiTheme, themeGameId),
    getFontShadow(uiTheme, themeGameId),
  ]);

  const root = document.documentElement.style;
  if (!root.getPropertyValue(baseBgColorProp)) {
    addSystemSvgDropShadow(uiTheme, themeGameId, gameId, shadow);
    root.setProperty(baseBgColorProp, color);
    root.setProperty(shadowColorProp, shadow);
    root.setProperty(svgShadowProp, `url(#dropShadow_${themeGameId !== gameId ? `${themeGameId}_` : ''}${parsedUiTheme})`);
    root.setProperty(containerBgImageUrlProp, `url('images/ui/${themeGameId}/${uiTheme}/containerbg.png')`);
    root.setProperty(borderImageUrlProp, `url('images/ui/${themeGameId}/${uiTheme}/border.png')`);
  }

  if (setTheme && themeGameId === gameId) {
    root.setProperty('--base-bg-color',         `var(${baseBgColorProp})`);
    root.setProperty('--shadow-color',           `var(${shadowColorProp})`);
    root.setProperty('--svg-shadow',             `var(${svgShadowProp})`);
    root.setProperty('--container-bg-image-url', `var(${containerBgImageUrlProp})`);
    root.setProperty('--border-image-url',       `var(${borderImageUrlProp})`);
  }
}

export async function initUiThemeFontStyles(
  uiTheme: string,
  themeGameId: string,
  gameId: string,
  fontStyle: number,
  setTheme: boolean,
): Promise<void> {
  const parsedUiTheme = uiTheme.replace(/[ ()]/g, '_');
  const themeGamePropSuffix = themeGameId !== gameId ? `${themeGameId}-` : '';
  // fontStyle=0 is falsy → no suffix, matching system.js `if (fontStyle)` check
  const fsSuffix = fontStyle ? `-${fontStyle}` : '';
  const baseColorProp         = `--base-color-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}`;
  const altColorProp          = `--alt-color-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}`;
  const baseGradientProp      = `--base-gradient-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}`;
  const baseGradientBProp     = `--base-gradient-b-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}`;
  const altGradientProp       = `--alt-gradient-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}`;
  const altGradientBProp      = `--alt-gradient-b-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}`;
  const svgBaseGradientProp   = `--svg-base-gradient-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}`;
  const svgAltGradientProp    = `--svg-alt-gradient-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}`;
  const baseColorImageUrlProp = `--base-color-image-url-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}`;

  const defaultAltFontStyleIndex = 1;
  const defaultFallbackAltFontStyleIndex = 3;

  const baseColors = await getFontColors(uiTheme, themeGameId, fontStyle);
  const altFontStyle = fontStyle !== defaultAltFontStyleIndex ? defaultAltFontStyleIndex : defaultAltFontStyleIndex - 1;
  let altColors = await getFontColors(uiTheme, themeGameId, altFontStyle);
  if (
    altColors[8][0] === baseColors[8][0] &&
    altColors[8][1] === baseColors[8][1] &&
    altColors[8][2] === baseColors[8][2]
  ) {
    const fallback = fontStyle !== defaultFallbackAltFontStyleIndex ? defaultFallbackAltFontStyleIndex : defaultFallbackAltFontStyleIndex - 1;
    altColors = await getFontColors(uiTheme, themeGameId, fallback);
  }

  const root = document.documentElement.style;
  if (!root.getPropertyValue(baseColorProp)) {
    addSystemSvgGradient(uiTheme, themeGameId, gameId, baseColors);
    addSystemSvgGradient(uiTheme, themeGameId, gameId, altColors, true);
    root.setProperty(baseColorProp,         getColorRgb(baseColors[8]));
    root.setProperty(altColorProp,          getColorRgb(altColors[8]));
    root.setProperty(baseGradientProp,      `linear-gradient(to bottom, ${getGradientText(baseColors)})`);
    root.setProperty(baseGradientBProp,     `linear-gradient(to bottom, ${getGradientText(baseColors, true)})`);
    root.setProperty(altGradientProp,       `linear-gradient(to bottom, ${getGradientText(altColors)})`);
    root.setProperty(altGradientBProp,      `linear-gradient(to bottom, ${getGradientText(altColors, true)})`);
    root.setProperty(svgBaseGradientProp,   `url(#baseGradient_${themeGameId !== gameId ? `${themeGameId}_` : ''}${parsedUiTheme})`);
    root.setProperty(svgAltGradientProp,    `url(#altGradient_${themeGameId !== gameId ? `${themeGameId}_` : ''}${parsedUiTheme})`);
    root.setProperty(baseColorImageUrlProp, `url('images/ui/${themeGameId}/${uiTheme}/font${fontStyle + 1}.png')`);
  }

  if (setTheme && themeGameId === gameId) {
    root.setProperty('--base-color',           `var(${baseColorProp})`);
    root.setProperty('--alt-color',            `var(${altColorProp})`);
    root.setProperty('--base-gradient',        `var(${baseGradientProp})`);
    root.setProperty('--base-gradient-b',      `var(${baseGradientBProp})`);
    root.setProperty('--alt-gradient',         `var(${altGradientProp})`);
    root.setProperty('--alt-gradient-b',       `var(${altGradientBProp})`);
    root.setProperty('--svg-base-gradient',    `var(${svgBaseGradientProp})`);
    root.setProperty('--svg-alt-gradient',     `var(${svgAltGradientProp})`);
    root.setProperty('--base-color-image-url', `var(${baseColorImageUrlProp})`);
  }
}

// ---------- public API ----------

export async function setUiTheme(uiTheme: string, gameId: string, fontStyle: number = 0): Promise<void> {
  if (typeof document === 'undefined') return;

  await Promise.all([
    initUiThemeContainerStyles(uiTheme, gameId, gameId, true),
    initUiThemeFontStyles(uiTheme, gameId, gameId, fontStyle, true),
  ]);

  const isFullBg = (allGameFullBgUiThemes[gameId] ?? []).includes(uiTheme);
  document.querySelectorAll<HTMLElement>('.container').forEach((el) => el.classList.toggle('fullBg', isFullBg));
  document.getElementById('header')?.classList.toggle('fullBg', isFullBg);
  document.body.classList.toggle('fullBg', isFullBg);
}

/** Add a theme to the activated set (no-op if already present) and select it. */
export function selectTheme(uiTheme: string, gameId: string): void {
  const isAuto = uiTheme === 'auto';
  const resolvedTheme = isAuto
    ? (get(currentSystemName) ?? (allGameUiThemes[gameId] ?? [])[0] ?? uiTheme)
    : uiTheme;

  activatedThemes.update((themes) => {
    const themeToActivate = isAuto ? resolvedTheme : uiTheme;
    if (themes.some((t) => t.gameId === gameId && t.uiTheme === themeToActivate)) return themes;
    return [...themes, { gameId, uiTheme: themeToActivate }];
  });
  selectedUiTheme.set(uiTheme);
  setUiTheme(resolvedTheme, gameId, get(selectedFontStyle));
}

/** Change the font style for the current theme. */
export async function setFontStyle(gameId: string, fontStyle: number): Promise<void> {
  if (typeof document === 'undefined') return;
  const theme = get(selectedUiTheme);
  const isAuto = theme === 'auto';
  const resolvedTheme = isAuto
    ? (get(currentSystemName) ?? (allGameUiThemes[gameId] ?? [])[0])
    : (theme ?? (allGameUiThemes[gameId] ?? [])[0]);
  if (!resolvedTheme || !(allGameUiThemes[gameId] ?? []).includes(resolvedTheme)) return;
  await initUiThemeFontStyles(resolvedTheme, gameId, gameId, fontStyle, true);
  selectedFontStyle.set(fontStyle);
}

/** Add a theme to the activated set without changing the selection. */
export function activateTheme(uiTheme: string, gameId: string): void {
  activatedThemes.update((themes) => {
    if (themes.some((t) => t.gameId === gameId && t.uiTheme === uiTheme)) return themes;
    return [...themes, { gameId, uiTheme }];
  });
}
