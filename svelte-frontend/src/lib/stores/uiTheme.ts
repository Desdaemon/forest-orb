import { writable, get } from 'svelte/store';
import { allGameUiThemes, allGameFullBgUiThemes, type AllGameThemes, type GameId } from '../allGameUiThemes';

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

/** Whether high-contrast mode is enabled. */
export const highContrastMode = writable<boolean>(false);

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

interface ContainerThemeAssets {
  resolvedTheme: string;
  baseBg: RgbColor;
  shadow: RgbColor;
}

interface FontThemeColors {
  resolvedTheme: string;
  colors: RgbColor[];
}

const uiThemeContainerAssets: Record<string, Record<string, ContainerThemeAssets>> = {};
const uiThemeFontColors: Record<string, Record<string, Record<number, FontThemeColors>>> = {};

function getThemesForGame(gameId: string): readonly string[] {
  const themesByGame = allGameUiThemes as unknown as Record<string, readonly string[]>;
  return themesByGame[gameId] ?? [];
}

// ---------- pure helpers ----------

function getColorRgb(color: [number, number, number]): string {
  return `${color[0]}, ${color[1]}, ${color[2]}`;
}

type RgbColor = [number, number, number];
type HslColor = [number, number, number];

const black: RgbColor = [0, 0, 0];
const white: RgbColor = [255, 255, 255];
const wcagAaNormalTextContrast = 4.5;

// Shadow-opacity tuning parameters:
// - Keep a non-zero floor so pixel-font shadows remain visible.
// - Use weighted contrast+luminance-distance as the base separation signal.
// - Reduce opacity for vivid colors, with stronger penalty when source shadow is near pure black/white.
const highContrastShadowOpacityTuning = {
  floor: 0.35,
  ceil: 1,
  contrastRangeMin: 1.05,
  contrastRangeMax: 1.6,
  distanceRangeMin: 0.02,
  distanceRangeMax: 0.09,
  contrastWeight: 0.62,
  distanceWeight: 0.38,
  saturationStart: 0.35,
  saturationSpan: 0.65,
  vividPenaltyBase: 0.35,
  vividPenaltyExtremeBonus: 0.3
} as const;

/** Toggle whether high-contrast debug CSS vars are exposed on :root. */
const DEBUG_HIGH_CONTRAST = false;

const activeHighContrastDebugCssVars = [
  '--debug-hc-shadow-opacity',
  '--debug-hc-shadow-opacity-reason',
  '--debug-hc-shadow-contrast',
  '--debug-hc-shadow-luminance-distance',
  '--debug-hc-base-text-saturation',
  '--debug-hc-source-shadow',
  '--debug-hc-source-shadow-luminance',
  '--debug-hc-source-shadow-is-extreme',
  '--debug-hc-shadow-separation-score',
  '--debug-hc-shadow-vivid-penalty',
  '--debug-hc-shadow-opacity-raw'
] as const;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeRange(value: number, min: number, max: number): number {
  return clamp01((value - min) / (max - min));
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function colorsEqual(a: RgbColor, b: RgbColor): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function toLinearSrgb(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance([r, g, b]: RgbColor): number {
  return 0.2126 * toLinearSrgb(r) + 0.7152 * toLinearSrgb(g) + 0.0722 * toLinearSrgb(b);
}

function getContrastRatio(foreground: RgbColor, background: RgbColor): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHsl([r, g, b]: RgbColor): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return [h, s, l];
}

function hslToRgb([h, s, l]: HslColor): RgbColor {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp >= 1 && hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp >= 2 && hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp >= 3 && hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp >= 4 && hp < 5) [r1, g1, b1] = [x, 0, c];
  else if (hp >= 5 && hp < 6) [r1, g1, b1] = [c, 0, x];

  const m = l - c / 2;
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255)
  ];
}

function blendRgb(from: RgbColor, to: RgbColor, t: number): RgbColor {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t)
  ];
}

function getLuminanceDistance(a: RgbColor, b: RgbColor): number {
  return Math.abs(getRelativeLuminance(a) - getRelativeLuminance(b));
}

function adjustColorForContrast(source: RgbColor, background: RgbColor, minContrast: number): RgbColor {
  const initialContrast = getContrastRatio(source, background);
  if (initialContrast >= minContrast) return source;

  const [h, s, l] = rgbToHsl(source);
  const isDarkBg = getRelativeLuminance(background) < 0.5;
  const attempts: Array<{ lighten: boolean; saturBoost: number }> = [
    { lighten: isDarkBg, saturBoost: 0.2 },
    { lighten: isDarkBg, saturBoost: 0.35 },
    { lighten: !isDarkBg, saturBoost: 0.15 },
    { lighten: !isDarkBg, saturBoost: 0 }
  ];

  let best = source;
  let bestContrast = initialContrast;

  for (const attempt of attempts) {
    for (let i = 1; i <= 30; i += 1) {
      const t = i / 30;
      const nextL = attempt.lighten ? l + (1 - l) * t : l * (1 - t);
      const nextS = clamp01(s + attempt.saturBoost * (1 - t * 0.4));
      const candidate = hslToRgb([h, nextS, clamp01(nextL)]);
      const contrast = getContrastRatio(candidate, background);

      if (contrast > bestContrast) {
        best = candidate;
        bestContrast = contrast;
      }

      if (contrast >= minContrast) return candidate;
    }
  }

  const whiteContrast = getContrastRatio(white, background);
  const blackContrast = getContrastRatio(black, background);
  if (whiteContrast > bestContrast || blackContrast > bestContrast) {
    return whiteContrast >= blackContrast ? white : black;
  }

  return best;
}

function getAccessibleAccentColor(background: RgbColor, baseText: RgbColor, sourceAccent: RgbColor): RgbColor {
  const adjusted = adjustColorForContrast(sourceAccent, background, wcagAaNormalTextContrast);
  if (!colorsEqual(adjusted, baseText)) return adjusted;

  const [h, s, l] = rgbToHsl(sourceAccent);
  const shifted = hslToRgb([(h + 36) % 360, clamp01(Math.max(s, 0.35)), l]);
  const shiftedAdjusted = adjustColorForContrast(shifted, background, wcagAaNormalTextContrast);
  if (!colorsEqual(shiftedAdjusted, baseText)) return shiftedAdjusted;

  return adjusted;
}

function getReadableShadowColor(background: RgbColor, text: RgbColor, sourceShadow: RgbColor): RgbColor {
  const sourceTextContrast = getContrastRatio(sourceShadow, text);
  const sourceDistance = getLuminanceDistance(sourceShadow, text);
  const [textHue, textSat] = rgbToHsl(text);
  const sourceLuminance = getRelativeLuminance(sourceShadow);
  const sourceIsExtreme = sourceLuminance <= 0.02 || sourceLuminance >= 0.98;

  // Avoid harsh black/white shadows for vivid text colors even if contrast passes.
  if (sourceIsExtreme && textSat >= 0.45) {
    const isLightText = getRelativeLuminance(text) > 0.5;
    const tintedCandidate = hslToRgb([textHue, clamp01(textSat * 0.35), isLightText ? 0.12 : 0.88]);
    const softenedExtreme = blendRgb(sourceShadow, tintedCandidate, 0.32);
    if (
      getContrastRatio(softenedExtreme, text) >= 1.08 &&
      getLuminanceDistance(softenedExtreme, text) >= 0.035
    ) {
      return softenedExtreme;
    }
  }

  // Preserve theme character if the original shadow already separates from text enough.
  if (sourceTextContrast >= 1.08 && sourceDistance >= 0.04) return sourceShadow;

  const adjustedSource = adjustColorForContrast(sourceShadow, background, 1.6);
  if (getContrastRatio(adjustedSource, text) >= 1.12 && getLuminanceDistance(adjustedSource, text) >= 0.05) {
    return blendRgb(sourceShadow, adjustedSource, 0.28);
  }

  const isLightText = getRelativeLuminance(text) > 0.5;
  const candidate = hslToRgb([textHue, clamp01(textSat * 0.4), isLightText ? 0.14 : 0.86]);
  const adjustedCandidate = adjustColorForContrast(candidate, background, 1.6);
  const softenedCandidate = blendRgb(sourceShadow, adjustedCandidate, 0.22);
  if (getContrastRatio(softenedCandidate, text) >= 1.1 && getLuminanceDistance(softenedCandidate, text) >= 0.04) {
    return softenedCandidate;
  }

  // Last resort: lightly nudge toward black/white instead of switching hard.
  const softFallback = isLightText
    ? blendRgb(sourceShadow, black, 0.24)
    : blendRgb(sourceShadow, white, 0.24);
  if (getContrastRatio(softFallback, text) >= 1.08 && getLuminanceDistance(softFallback, text) >= 0.035) {
    return softFallback;
  }

  return sourceShadow;
}

interface HighContrastShadowOpacityDebug {
  value: string;
  reason: string;
  contrast: number;
  distance: number;
  textSaturation: number;
  sourceShadowLuminance: number;
  sourceShadowIsExtreme: boolean;
  separationScore: number;
  vividPenalty: number;
  rawOpacity: number;
}

function getHighContrastShadowOpacity(text: RgbColor, shadow: RgbColor, sourceShadow: RgbColor | undefined, debug: true): [string, HighContrastShadowOpacityDebug];
function getHighContrastShadowOpacity(text: RgbColor, shadow: RgbColor, sourceShadow: RgbColor | undefined, debug?: boolean): [string, HighContrastShadowOpacityDebug | undefined];
function getHighContrastShadowOpacity(
  text: RgbColor,
  shadow: RgbColor,
  sourceShadow: RgbColor | undefined,
  debug?: boolean,
): [string, HighContrastShadowOpacityDebug | undefined] {
  const tuning = highContrastShadowOpacityTuning;
  const contrast = getContrastRatio(text, shadow);
  const distance = getLuminanceDistance(text, shadow);
  const [, textSat] = rgbToHsl(text);
  const sourceLuminance = getRelativeLuminance(sourceShadow ?? shadow);
  const sourceIsExtreme = sourceLuminance <= 0.02 || sourceLuminance >= 0.98;

  // Base separation score (0..1), combining perceptual darkness gap and contrast ratio.
  const contrastNorm = normalizeRange(contrast, tuning.contrastRangeMin, tuning.contrastRangeMax);
  const distanceNorm = normalizeRange(distance, tuning.distanceRangeMin, tuning.distanceRangeMax);
  const separationScore = contrastNorm * tuning.contrastWeight + distanceNorm * tuning.distanceWeight;

  // Vivid colors can look like doubled text; damp opacity more aggressively in that regime.
  const saturationFactor = normalizeRange(textSat, tuning.saturationStart, tuning.saturationStart + tuning.saturationSpan);
  const vividPenaltyBase =
    tuning.vividPenaltyBase + (sourceIsExtreme ? tuning.vividPenaltyExtremeBonus : 0);
  // sqrt(1 - separation) keeps penalties stronger for marginal separation and softer when clearly separated.
  const vividPenalty = saturationFactor * vividPenaltyBase * Math.sqrt(1 - separationScore);

  const rawOpacity = tuning.floor + separationScore * (tuning.ceil - tuning.floor) - vividPenalty;
  const clampedOpacity = Math.min(tuning.ceil, Math.max(tuning.floor, rawOpacity));
  const value = `${roundTo(clampedOpacity, 2)}`;

  if (!debug) return [value, undefined];

  const reason = clampedOpacity <= tuning.floor + 1e-6 ? 'formula-floor' : 'formula';
  return [value, {
    value,
    reason,
    contrast,
    distance,
    textSaturation: textSat,
    sourceShadowLuminance: sourceLuminance,
    sourceShadowIsExtreme: sourceIsExtreme,
    separationScore,
    vividPenalty,
    rawOpacity
  }];
}

interface HighContrastThemeStyle {
  baseText: RgbColor;
  altText: RgbColor;
  sourceShadow: RgbColor;
  shadow: RgbColor;
  shadowOpacity: string;
  debug?: HighContrastShadowOpacityDebug;
}

async function getHighContrastThemeStyle(
  uiTheme: string,
  themeGameId: string,
  fontStyle: number
): Promise<HighContrastThemeStyle> {
  const containerAssets = await getContainerThemeAssets(uiTheme, themeGameId);
  const themeBg = containerAssets.baseBg;
  const baseThemeColor = (await getFontColors(uiTheme, themeGameId, fontStyle)).colors[8];

  const defaultAltFontStyleIndex = 1;
  const defaultFallbackAltFontStyleIndex = 3;
  const altFontStyle =
    fontStyle !== defaultAltFontStyleIndex ? defaultAltFontStyleIndex : defaultAltFontStyleIndex - 1;
  let altThemeColor = (await getFontColors(uiTheme, themeGameId, altFontStyle)).colors[8];
  if (colorsEqual(altThemeColor, baseThemeColor)) {
    const fallback =
      fontStyle !== defaultFallbackAltFontStyleIndex
        ? defaultFallbackAltFontStyleIndex
        : defaultFallbackAltFontStyleIndex - 1;
    altThemeColor = (await getFontColors(uiTheme, themeGameId, fallback)).colors[8];
  }

  const finalBaseText = getContrastRatio(baseThemeColor, themeBg) >= wcagAaNormalTextContrast
    ? baseThemeColor
    : adjustColorForContrast(baseThemeColor, themeBg, wcagAaNormalTextContrast);

  const finalAltText = getContrastRatio(altThemeColor, themeBg) >= wcagAaNormalTextContrast
    ? altThemeColor
    : getAccessibleAccentColor(themeBg, finalBaseText, altThemeColor);

  const sourceShadow = containerAssets.shadow;
  const finalShadow = getReadableShadowColor(themeBg, finalBaseText, sourceShadow);
  const [shadowOpacity, opacityDebug] = getHighContrastShadowOpacity(finalBaseText, finalShadow, sourceShadow, DEBUG_HIGH_CONTRAST);

  return {
    baseText: finalBaseText,
    altText: finalAltText,
    sourceShadow,
    shadow: finalShadow,
    shadowOpacity,
    debug: opacityDebug
  };
}

function getSelectedThemeForGame(gameId: string): string | null {
  const availableThemes = getThemesForGame(gameId);
  const theme = get(selectedUiTheme);
  const isAuto = theme === 'auto';
  const resolvedTheme = isAuto
    ? (get(currentSystemName) ?? availableThemes[0])
    : (theme ?? availableThemes[0]);

  if (!resolvedTheme || !availableThemes.includes(resolvedTheme)) return null;
  return resolvedTheme;
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
  alt?: boolean
) {
  const gradientId = `${alt ? 'alt' : 'base'}Gradient_${themeGameId !== gameId ? `${themeGameId}_` : ''}${uiTheme.replace(/[ ()]/g, '_')}`;
  if (document.getElementById(gradientId)) return;
  const svgDefs = document.getElementById('svgDefs');
  if (!svgDefs) return;
  const svgGradient = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'linearGradient'
  ) as SVGLinearGradientElement;
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

function getThemeAssetPath(themeGameId: string, uiTheme: string, fileName: string): string {
  return `images/ui/${themeGameId}/${uiTheme}/${fileName}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        await img.decode();
        resolve(img);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function loadThemeImages(
  uiTheme: string,
  themeGameId: string,
  fileNames: readonly string[]
): Promise<{ resolvedTheme: string; images: Record<string, HTMLImageElement> }> {
  const loadForTheme = async (themeName: string) => {
    const pairs = await Promise.all(
      fileNames.map(async (fileName) => [fileName, await loadImage(getThemeAssetPath(themeGameId, themeName, fileName))] as const)
    );
    return Object.fromEntries(pairs) as Record<string, HTMLImageElement>;
  };

  try {
    return {
      resolvedTheme: uiTheme,
      images: await loadForTheme(uiTheme)
    };
  } catch (error) {
    const defaultTheme = getThemesForGame(themeGameId)[0];
    if (!defaultTheme || defaultTheme === uiTheme) throw error;
    console.warn(`Failed to load theme assets for theme "${uiTheme}", falling back to default theme ${defaultTheme}.`, error);
    return {
      resolvedTheme: defaultTheme,
      images: await loadForTheme(defaultTheme)
    };
  }
}

async function getContainerThemeAssets(uiTheme: string, themeGameId: string): Promise<ContainerThemeAssets> {
  if (!uiThemeContainerAssets[themeGameId]) uiThemeContainerAssets[themeGameId] = {};
  const cached = uiThemeContainerAssets[themeGameId][uiTheme];
  if (cached) return cached;

  const { resolvedTheme, images } = await loadThemeImages(uiTheme, themeGameId, [
    'containerbg.png',
    'fontshadow.png',
    'border.png'
  ]);
  const containerBg = images['containerbg.png'];
  const fontShadow = images['fontshadow.png'];

  const ctx = getExtractCanvas().getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(containerBg, 0, 0);
  const p1 = ctx.getImageData(0, 0, 1, 1).data;
  const p2 = ctx.getImageData(4, 4, 1, 1).data;
  const p3 = ctx.getImageData(8, 8, 1, 1).data;
  const baseBg: RgbColor = [
    Math.round((p1[0] + p2[0] + p3[0]) / 3),
    Math.round((p1[1] + p2[1] + p3[1]) / 3),
    Math.round((p1[2] + p2[2] + p3[2]) / 3)
  ];
  ctx.drawImage(fontShadow, 0, 0);
  const p = ctx.getImageData(0, 8, 1, 1).data;
  const shadow: RgbColor = [p[0], p[1], p[2]];

  const assets = {
    resolvedTheme,
    baseBg,
    shadow
  };
  uiThemeContainerAssets[themeGameId][uiTheme] = assets;
  return assets;
}

async function getFontColors(
  uiTheme: string,
  themeGameId: string,
  fontStyle: number
): Promise<FontThemeColors> {
  if (!uiThemeFontColors[themeGameId]) uiThemeFontColors[themeGameId] = {};
  if (!uiThemeFontColors[themeGameId][uiTheme]) uiThemeFontColors[themeGameId][uiTheme] = {};
  const cached = uiThemeFontColors[themeGameId][uiTheme][fontStyle];
  if (cached) return cached;

  const fileName = `font${fontStyle + 1}.png`;
  const { resolvedTheme, images } = await loadThemeImages(uiTheme, themeGameId, [fileName]);
  const img = images[fileName];

  const ctx = getExtractCanvas().getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, 1, 16).data;
  const colors: RgbColor[] = Array.from({ length: data.length / 4 }, (_, i) => [
    data[i * 4],
    data[i * 4 + 1],
    data[i * 4 + 2]
  ]);
  const fontThemeColors = {
    resolvedTheme,
    colors
  };
  uiThemeFontColors[themeGameId][uiTheme][fontStyle] = fontThemeColors;
  return fontThemeColors;
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
  const baseBgColorProp = `--base-bg-color-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const shadowColorProp = `--shadow-color-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const highContrastShadowColorProp = `--shadow-color-hc-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const highContrastShadowOpacityProp = `--shadow-opacity-hc-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastShadowOpacityProp = `--debug-hc-shadow-opacity-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastShadowOpacityReasonProp = `--debug-hc-shadow-opacity-reason-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastShadowContrastProp = `--debug-hc-shadow-contrast-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastShadowDistanceProp = `--debug-hc-shadow-luminance-distance-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastBaseTextSaturationProp = `--debug-hc-base-text-saturation-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastSourceShadowProp = `--debug-hc-source-shadow-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastSourceShadowLuminanceProp = `--debug-hc-source-shadow-luminance-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastSourceShadowExtremeProp = `--debug-hc-source-shadow-is-extreme-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastSeparationScoreProp = `--debug-hc-shadow-separation-score-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastVividPenaltyProp = `--debug-hc-shadow-vivid-penalty-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const debugHighContrastRawOpacityProp = `--debug-hc-shadow-opacity-raw-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const svgShadowProp = `--svg-shadow-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const containerBgImageUrlProp = `--container-bg-image-url-${themeGamePropSuffix}${parsedUiTheme}` as const;
  const borderImageUrlProp = `--border-image-url-${themeGamePropSuffix}${parsedUiTheme}` as const;

  const containerAssets = await getContainerThemeAssets(uiTheme, themeGameId);
  const color = getColorRgb(containerAssets.baseBg);
  const shadow = getColorRgb(containerAssets.shadow);

  const root = document.documentElement.style;
  if (!root.getPropertyValue(baseBgColorProp)) {
    addSystemSvgDropShadow(uiTheme, themeGameId, gameId, shadow);
    root.setProperty(baseBgColorProp, color);
    root.setProperty(shadowColorProp, shadow);
    root.setProperty(
      svgShadowProp,
      `url(#dropShadow_${themeGameId !== gameId ? `${themeGameId}_` : ''}${parsedUiTheme})`
    );
    root.setProperty(
      containerBgImageUrlProp,
      `url('${getThemeAssetPath(themeGameId, containerAssets.resolvedTheme, 'containerbg.png')}')`
    );
    root.setProperty(
      borderImageUrlProp,
      `url('${getThemeAssetPath(themeGameId, containerAssets.resolvedTheme, 'border.png')}')`
    );
  }

  // Functional HC vars are always maintained; debug vars are optional and controlled by the toggle.
  const missingBaseHighContrastProps = !root.getPropertyValue(highContrastShadowColorProp);
  const missingDebugProps = !root.getPropertyValue(debugHighContrastShadowOpacityProp);

  if (missingBaseHighContrastProps || (DEBUG_HIGH_CONTRAST && missingDebugProps)) {
    const highContrastStyle = await getHighContrastThemeStyle(uiTheme, themeGameId, 0);
    root.setProperty(highContrastShadowColorProp, getColorRgb(highContrastStyle.shadow));
    root.setProperty(highContrastShadowOpacityProp, highContrastStyle.shadowOpacity);

    if (DEBUG_HIGH_CONTRAST && highContrastStyle.debug) {
      root.setProperty(debugHighContrastShadowOpacityProp, highContrastStyle.shadowOpacity);
      root.setProperty(debugHighContrastShadowOpacityReasonProp, highContrastStyle.debug.reason);
      root.setProperty(debugHighContrastShadowContrastProp, highContrastStyle.debug.contrast.toFixed(4));
      root.setProperty(debugHighContrastShadowDistanceProp, highContrastStyle.debug.distance.toFixed(4));
      root.setProperty(debugHighContrastBaseTextSaturationProp, highContrastStyle.debug.textSaturation.toFixed(4));
      root.setProperty(debugHighContrastSourceShadowProp, getColorRgb(highContrastStyle.sourceShadow));
      root.setProperty(debugHighContrastSourceShadowLuminanceProp, highContrastStyle.debug.sourceShadowLuminance.toFixed(4));
      root.setProperty(debugHighContrastSourceShadowExtremeProp, highContrastStyle.debug.sourceShadowIsExtreme ? '1' : '0');
      root.setProperty(debugHighContrastSeparationScoreProp, highContrastStyle.debug.separationScore.toFixed(4));
      root.setProperty(debugHighContrastVividPenaltyProp, highContrastStyle.debug.vividPenalty.toFixed(4));
      root.setProperty(debugHighContrastRawOpacityProp, highContrastStyle.debug.rawOpacity.toFixed(4));
    }
  }

  if (!DEBUG_HIGH_CONTRAST) {
    // Remove per-theme debug vars when disabled to avoid stale diagnostics.
    root.removeProperty(debugHighContrastShadowOpacityProp);
    root.removeProperty(debugHighContrastShadowOpacityReasonProp);
    root.removeProperty(debugHighContrastShadowContrastProp);
    root.removeProperty(debugHighContrastShadowDistanceProp);
    root.removeProperty(debugHighContrastBaseTextSaturationProp);
    root.removeProperty(debugHighContrastSourceShadowProp);
    root.removeProperty(debugHighContrastSourceShadowLuminanceProp);
    root.removeProperty(debugHighContrastSourceShadowExtremeProp);
    root.removeProperty(debugHighContrastSeparationScoreProp);
    root.removeProperty(debugHighContrastVividPenaltyProp);
    root.removeProperty(debugHighContrastRawOpacityProp);
  }

  if (setTheme && themeGameId === gameId) {
    root.setProperty('--base-bg-color', `var(${baseBgColorProp})`);
    root.setProperty(
      '--shadow-color',
      get(highContrastMode) ? `var(${highContrastShadowColorProp})` : `var(${shadowColorProp})`
    );
    root.setProperty(
      '--high-contrast-shadow-opacity',
      get(highContrastMode) ? `var(${highContrastShadowOpacityProp})` : '1'
    );
    if (DEBUG_HIGH_CONTRAST) {
      root.setProperty('--debug-hc-shadow-opacity', `var(${debugHighContrastShadowOpacityProp})`);
      root.setProperty('--debug-hc-shadow-opacity-reason', `var(${debugHighContrastShadowOpacityReasonProp})`);
      root.setProperty('--debug-hc-shadow-contrast', `var(${debugHighContrastShadowContrastProp})`);
      root.setProperty('--debug-hc-shadow-luminance-distance', `var(${debugHighContrastShadowDistanceProp})`);
      root.setProperty('--debug-hc-base-text-saturation', `var(${debugHighContrastBaseTextSaturationProp})`);
      root.setProperty('--debug-hc-source-shadow', `var(${debugHighContrastSourceShadowProp})`);
      root.setProperty('--debug-hc-source-shadow-luminance', `var(${debugHighContrastSourceShadowLuminanceProp})`);
      root.setProperty('--debug-hc-source-shadow-is-extreme', `var(${debugHighContrastSourceShadowExtremeProp})`);
      root.setProperty('--debug-hc-shadow-separation-score', `var(${debugHighContrastSeparationScoreProp})`);
      root.setProperty('--debug-hc-shadow-vivid-penalty', `var(${debugHighContrastVividPenaltyProp})`);
      root.setProperty('--debug-hc-shadow-opacity-raw', `var(${debugHighContrastRawOpacityProp})`);
    } else {
      activeHighContrastDebugCssVars.forEach((propName) => root.removeProperty(propName));
    }
    root.setProperty('--svg-shadow', `var(${svgShadowProp})`);
    root.setProperty('--container-bg-image-url', `var(${containerBgImageUrlProp})`);
    root.setProperty('--border-image-url', `var(${borderImageUrlProp})`);
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
  const baseColorProp = `--base-color-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const altColorProp = `--alt-color-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const highContrastBaseColorProp = `--base-color-hc-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const highContrastAltColorProp = `--alt-color-hc-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const baseGradientProp = `--base-gradient-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const baseGradientBProp = `--base-gradient-b-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const altGradientProp = `--alt-gradient-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const altGradientBProp = `--alt-gradient-b-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const highContrastBaseGradientProp = `--base-gradient-hc-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const highContrastBaseGradientBProp = `--base-gradient-b-hc-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const highContrastAltGradientProp = `--alt-gradient-hc-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const highContrastAltGradientBProp = `--alt-gradient-b-hc-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const svgBaseGradientProp = `--svg-base-gradient-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const svgAltGradientProp = `--svg-alt-gradient-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;
  const baseColorImageUrlProp = `--base-color-image-url-${themeGamePropSuffix}${parsedUiTheme}${fsSuffix}` as const;

  const defaultAltFontStyleIndex = 1;
  const defaultFallbackAltFontStyleIndex = 3;

  const baseFontColors = await getFontColors(uiTheme, themeGameId, fontStyle);
  const baseColors = baseFontColors.colors;
  const altFontStyle = fontStyle !== defaultAltFontStyleIndex ? defaultAltFontStyleIndex : defaultAltFontStyleIndex - 1;
  let altColors = (await getFontColors(uiTheme, themeGameId, altFontStyle)).colors;
  if (
    altColors[8][0] === baseColors[8][0] &&
    altColors[8][1] === baseColors[8][1] &&
    altColors[8][2] === baseColors[8][2]
  ) {
    const fallback =
      fontStyle !== defaultFallbackAltFontStyleIndex
        ? defaultFallbackAltFontStyleIndex
        : defaultFallbackAltFontStyleIndex - 1;
    altColors = (await getFontColors(uiTheme, themeGameId, fallback)).colors;
  }

  const root = document.documentElement.style;
  if (!root.getPropertyValue(baseColorProp)) {
    addSystemSvgGradient(uiTheme, themeGameId, gameId, baseColors);
    addSystemSvgGradient(uiTheme, themeGameId, gameId, altColors, true);
    root.setProperty(baseColorProp, getColorRgb(baseColors[8]));
    root.setProperty(altColorProp, getColorRgb(altColors[8]));
    root.setProperty(baseGradientProp, `linear-gradient(to bottom, ${getGradientText(baseColors)})`);
    root.setProperty(baseGradientBProp, `linear-gradient(to bottom, ${getGradientText(baseColors, true)})`);
    root.setProperty(altGradientProp, `linear-gradient(to bottom, ${getGradientText(altColors)})`);
    root.setProperty(altGradientBProp, `linear-gradient(to bottom, ${getGradientText(altColors, true)})`);
    root.setProperty(
      svgBaseGradientProp,
      `url(#baseGradient_${themeGameId !== gameId ? `${themeGameId}_` : ''}${parsedUiTheme})`
    );
    root.setProperty(
      svgAltGradientProp,
      `url(#altGradient_${themeGameId !== gameId ? `${themeGameId}_` : ''}${parsedUiTheme})`
    );
    root.setProperty(
      baseColorImageUrlProp,
      `url('${getThemeAssetPath(themeGameId, baseFontColors.resolvedTheme, `font${fontStyle + 1}.png`)}')`
    );
  }

  if (!root.getPropertyValue(highContrastBaseColorProp)) {
    const highContrastStyle = await getHighContrastThemeStyle(uiTheme, themeGameId, fontStyle);
    root.setProperty(highContrastBaseColorProp, getColorRgb(highContrastStyle.baseText));
    root.setProperty(highContrastAltColorProp, getColorRgb(highContrastStyle.altText));
    root.setProperty(
      highContrastBaseGradientProp,
      `linear-gradient(to bottom, rgb(${getColorRgb(highContrastStyle.baseText)}) 0 100%)`
    );
    root.setProperty(
      highContrastBaseGradientBProp,
      `linear-gradient(to bottom, rgb(${getColorRgb(highContrastStyle.baseText)}) 0 100%)`
    );
    root.setProperty(
      highContrastAltGradientProp,
      `linear-gradient(to bottom, rgb(${getColorRgb(highContrastStyle.altText)}) 0 100%)`
    );
    root.setProperty(
      highContrastAltGradientBProp,
      `linear-gradient(to bottom, rgb(${getColorRgb(highContrastStyle.altText)}) 0 100%)`
    );
  }

  if (setTheme && themeGameId === gameId) {
    root.setProperty('--base-color', get(highContrastMode) ? `var(${highContrastBaseColorProp})` : `var(${baseColorProp})`);
    root.setProperty('--alt-color', get(highContrastMode) ? `var(${highContrastAltColorProp})` : `var(${altColorProp})`);
    root.setProperty('--base-gradient', get(highContrastMode) ? `var(${highContrastBaseGradientProp})` : `var(${baseGradientProp})`);
    root.setProperty('--base-gradient-b', get(highContrastMode) ? `var(${highContrastBaseGradientBProp})` : `var(${baseGradientBProp})`);
    root.setProperty('--alt-gradient', get(highContrastMode) ? `var(${highContrastAltGradientProp})` : `var(${altGradientProp})`);
    root.setProperty('--alt-gradient-b', get(highContrastMode) ? `var(${highContrastAltGradientBProp})` : `var(${altGradientBProp})`);
    root.setProperty('--svg-base-gradient', `var(${svgBaseGradientProp})`);
    root.setProperty('--svg-alt-gradient', `var(${svgAltGradientProp})`);
    root.setProperty('--base-color-image-url', `var(${baseColorImageUrlProp})`);
  }
}

// ---------- public API ----------

export async function setUiTheme(uiTheme: string, gameId: string, fontStyle: number = 0): Promise<void> {
  if (typeof document === 'undefined') return;

  await Promise.all([
    initUiThemeContainerStyles(uiTheme, gameId, gameId, true),
    initUiThemeFontStyles(uiTheme, gameId, gameId, fontStyle, true)
  ]);

  const isFullBg = (allGameFullBgUiThemes[gameId] ?? []).includes(uiTheme);
  document.querySelectorAll<HTMLElement>('.container').forEach((el) => el.classList.toggle('fullBg', isFullBg));
  document.getElementById('header')?.classList.toggle('fullBg', isFullBg);
  document.body.classList.toggle('fullBg', isFullBg);

}

/** Add a theme to the activated set (no-op if already present) and select it. */
export function selectTheme<Game extends GameId, Theme extends AllGameThemes[GameId][number]>(gameId: Game, uiTheme: Theme | 'auto'): void {
  const isAuto = uiTheme === 'auto';
  const resolvedTheme = isAuto ? (get(currentSystemName) ?? (allGameUiThemes[gameId] ?? [])[0] ?? uiTheme) : uiTheme;

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
  const resolvedTheme = getSelectedThemeForGame(gameId);
  if (!resolvedTheme) return;
  await initUiThemeFontStyles(resolvedTheme, gameId, gameId, fontStyle, true);
  selectedFontStyle.set(fontStyle);

}

export async function setHighContrastMode(enabled: boolean, gameId: string): Promise<void> {
  highContrastMode.set(enabled);

  if (typeof document === 'undefined') return;
  document.body.classList.toggle('highContrast', enabled);

  const resolvedTheme = getSelectedThemeForGame(gameId);
  if (!resolvedTheme) return;

  await setUiTheme(resolvedTheme, gameId, get(selectedFontStyle));
}

// async function benchmark<T>(fn: () => Promise<T>): Promise<T> {
//   const start = performance.now();
//   try {
//     return await fn();
//   } finally {
//     const end = performance.now();
//     console.log(`${fn.name}: ${end - start}ms`);
//   }
// }

/**
 * @param gameId the current game's ID, used to get cross-game themes
 */
export async function activateTheme(uiTheme: string, themeGameId: string, gameId: string = themeGameId) {
  // return void await benchmark(async function activateTheme() {
  activatedThemes.update((themes) => {
    if (themes.some((t) => t.gameId === themeGameId && t.uiTheme === uiTheme)) return themes;
    return [...themes, { gameId: themeGameId, uiTheme }];
  });

  await Promise.all([
    initUiThemeContainerStyles(uiTheme, themeGameId, gameId, false),
    initUiThemeFontStyles(uiTheme, themeGameId, gameId, 0, false),
  ]);
  // });
}
