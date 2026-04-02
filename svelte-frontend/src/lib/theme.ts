import { get, writable } from "svelte/store";

export type UiThemeName = "default" | "rose" | "dark" | "auto";

export interface UiThemeConfig {
    baseColor: [number, number, number];
    altColor: [number, number, number];
    baseBgColor: [number, number, number];
    shadowColor: [number, number, number];
}

// Theme state management
export const uiTheme = writable<UiThemeName>("default");
export const uiThemeIndex = writable(0);

export const uiThemeList: UiThemeName[] = ["default", "rose", "dark", "auto"];

export const uiThemes: Record<Exclude<UiThemeName, "auto">, UiThemeConfig> = {
    default: {
        baseColor: [216, 216, 216],
        altColor: [255, 255, 157],
        baseBgColor: [45, 17, 23],
        shadowColor: [0, 0, 0],
    },
    rose: {
        baseColor: [214, 182, 206],
        altColor: [255, 208, 220],
        baseBgColor: [40, 15, 20],
        shadowColor: [0, 0, 0],
    },
    dark: {
        baseColor: [180, 190, 220],
        altColor: [170, 230, 255],
        baseBgColor: [12, 12, 30],
        shadowColor: [0, 0, 0],
    },
};

function rgb(tuple: [number, number, number]): string {
    return `rgb(${tuple.join(",")})`;
}

function createSvgGradient(id: string, color: [number, number, number]) {
    const svgDefs = document.getElementById("svgDefs");
    if (!svgDefs) return;
    let element = document.getElementById(
        id,
    ) as SVGLinearGradientElement | null;
    if (!element) {
        element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "linearGradient",
        ) as SVGLinearGradientElement;
        element.id = id;
        element.setAttribute("x1", "0%");
        element.setAttribute("y1", "0%");
        element.setAttribute("x2", "0%");
        element.setAttribute("y2", "100%");
        const stop1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "stop",
        );
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", rgb(color));
        const stop2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "stop",
        );
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", rgb(color));
        element.appendChild(stop1);
        element.appendChild(stop2);
        svgDefs.appendChild(element);
    }
}

function createSvgDropShadow(id: string, color: [number, number, number]) {
    const svgDefs = document.getElementById("svgDefs");
    if (!svgDefs) return;
    if (document.getElementById(id)) return;
    const filter = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "filter",
    );
    filter.id = id;
    const feDropShadow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feDropShadow",
    );
    feDropShadow.setAttribute("dx", "1");
    feDropShadow.setAttribute("dy", "1");
    feDropShadow.setAttribute("stdDeviation", "0.2");
    feDropShadow.setAttribute("flood-color", rgb(color));
    filter.appendChild(feDropShadow);
    svgDefs.appendChild(filter);
}

function resolveThemeValue(theme: UiThemeName) {
    return theme === "auto" ? uiThemes.default : uiThemes[theme];
}

export function applyTheme(expectedTheme: UiThemeName = "default") {
    if (expectedTheme === "auto") expectedTheme = "default";
    if (!uiThemes[expectedTheme]) expectedTheme = "default";
    uiTheme.set(expectedTheme);
    const theme = resolveThemeValue(expectedTheme);
    const root = document.documentElement.style;
    root.setProperty("--base-color", theme.baseColor.join(","));
    root.setProperty("--alt-color", theme.altColor.join(","));
    root.setProperty("--base-bg-color", theme.baseBgColor.join(","));
    root.setProperty("--shadow-color", theme.shadowColor.join(","));
    root.setProperty("--svg-base-gradient", "url(#baseGradient)");
    root.setProperty("--svg-alt-gradient", "url(#altGradient)");
    root.setProperty("--svg-shadow", "url(#dropShadow)");
    createSvgGradient("baseGradient", theme.baseColor);
    createSvgGradient("altGradient", theme.altColor);
    createSvgDropShadow("dropShadow", theme.shadowColor);
}

export function cycleUiTheme() {
    uiThemeIndex.update(index => {
        const nextIndex = (index + 1) % uiThemeList.length;
        applyTheme(uiThemeList[nextIndex]);
        return nextIndex;
    });
}
