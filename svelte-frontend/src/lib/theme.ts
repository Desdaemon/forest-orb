import { writable } from 'svelte/store';

export type UiThemeName = 'default' | 'rose' | 'dark' | 'auto';

export interface UiThemeConfig {
  baseColor: [number, number, number];
  altColor: [number, number, number];
  baseBgColor: [number, number, number];
  shadowColor: [number, number, number];
}

// Theme state management
export const uiTheme = writable<UiThemeName>('default');
export const uiThemeIndex = writable(0);

export const uiThemeList: UiThemeName[] = ['default', 'rose', 'dark', 'auto'];

export const uiThemes: Record<Exclude<UiThemeName, 'auto'>, UiThemeConfig> = {
  default: {
    baseColor: [216, 216, 216],
    altColor: [255, 255, 157],
    baseBgColor: [45, 17, 23],
    shadowColor: [0, 0, 0]
  },
  rose: {
    baseColor: [214, 182, 206],
    altColor: [255, 208, 220],
    baseBgColor: [40, 15, 20],
    shadowColor: [0, 0, 0]
  },
  dark: {
    baseColor: [180, 190, 220],
    altColor: [170, 230, 255],
    baseBgColor: [12, 12, 30],
    shadowColor: [0, 0, 0]
  }
};

function rgb(tuple: [number, number, number]): string {
  return `rgb(${tuple.join(',')})`;
}

function createSvgGradient(id: string, color: [number, number, number]) {
  const svgDefs = document.getElementById('svgDefs');
  if (!svgDefs) return;
  let element = document.getElementById(id) as SVGLinearGradientElement | null;
  if (!element) {
    element = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient') as SVGLinearGradientElement;
    element.id = id;
    element.setAttribute('x1', '0%');
    element.setAttribute('y1', '0%');
    element.setAttribute('x2', '0%');
    element.setAttribute('y2', '100%');
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    element.appendChild(stop1);
    element.appendChild(stop2);
    svgDefs.appendChild(element);
  }

  const stops = element.querySelectorAll('stop');
  const colorValue = rgb(color);
  if (stops[0]) stops[0].setAttribute('stop-color', colorValue);
  if (stops[1]) stops[1].setAttribute('stop-color', colorValue);
}

function createSvgDropShadow(id: string, color: [number, number, number]) {
  const svgDefs = document.getElementById('svgDefs');
  if (!svgDefs) return;
  let filter = document.getElementById(id) as SVGFilterElement | null;
  if (!filter) {
    filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.id = id;
    const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    feDropShadow.setAttribute('dx', '1');
    feDropShadow.setAttribute('dy', '1');
    feDropShadow.setAttribute('stdDeviation', '0.2');
    filter.appendChild(feDropShadow);
    svgDefs.appendChild(filter);
  }

  const feDropShadow = filter.querySelector('feDropShadow');
  if (feDropShadow) feDropShadow.setAttribute('flood-color', rgb(color));
}

function resolveThemeValue(theme: UiThemeName) {
  return theme === 'auto' ? uiThemes.default : uiThemes[theme];
}

const inheritedThemeStyleProps = [
  'base-color',
  'alt-color',
  'base-bg-color',
  'shadow-color',
  'base-gradient',
  'alt-gradient',
  'base-gradient-b',
  'alt-gradient-b',
  'svg-base-gradient',
  'svg-alt-gradient',
  'svg-shadow',
  'base-color-image-url',
  'container-bg-image-url',
  'border-image-url'
] as const;

function syncScopedThemeVars(root: CSSStyleDeclaration) {
  for (const prop of inheritedThemeStyleProps) {
    root.setProperty(`--modal-${prop}`, `var(--${prop})`);
    root.setProperty(`--party-${prop}`, `var(--${prop})`);
  }
}

export function applyTheme(expectedTheme: UiThemeName = 'default') {
  if (expectedTheme === 'auto') expectedTheme = 'default';
  if (!uiThemes[expectedTheme]) expectedTheme = 'default';
  uiTheme.set(expectedTheme);
  const theme = resolveThemeValue(expectedTheme);
  const root = document.documentElement.style;
  root.setProperty('--base-color', theme.baseColor.join(','));
  root.setProperty('--alt-color', theme.altColor.join(','));
  root.setProperty('--base-bg-color', theme.baseBgColor.join(','));
  root.setProperty('--shadow-color', theme.shadowColor.join(','));
  root.setProperty('--base-gradient', `linear-gradient(to bottom, ${rgb(theme.baseColor)} 0% 100%)`);
  root.setProperty('--alt-gradient', `linear-gradient(to bottom, ${rgb(theme.altColor)} 0% 100%)`);
  root.setProperty('--base-gradient-b', `linear-gradient(to bottom, ${rgb(theme.baseColor)} 0% 100%)`);
  root.setProperty('--alt-gradient-b', `linear-gradient(to bottom, ${rgb(theme.altColor)} 0% 100%)`);
  root.setProperty('--svg-base-gradient', 'url(#baseGradient)');
  root.setProperty('--svg-alt-gradient', 'url(#altGradient)');
  root.setProperty('--svg-shadow', 'url(#dropShadow)');

  createSvgGradient('baseGradient', theme.baseColor);
  createSvgGradient('altGradient', theme.altColor);
  createSvgDropShadow('dropShadow', theme.shadowColor);

  syncScopedThemeVars(root);
}

export function cycleUiTheme() {
  uiThemeIndex.update((index) => {
    const nextIndex = (index + 1) % uiThemeList.length;
    applyTheme(uiThemeList[nextIndex]);
    return nextIndex;
  });
}
