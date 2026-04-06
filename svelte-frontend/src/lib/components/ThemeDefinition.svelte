<script lang="ts">
  import { allGameFullBgUiThemes } from '$lib/allGameUiThemes';

  const {
    uiTheme,
    themeGameId,
    gameId
  }: {
    uiTheme: string;
    themeGameId: string;
    gameId: string;
  } = $props();

  // Normalize like system theme helpers so class/var names are stable.
  const parsedUiTheme = $derived(uiTheme.replace(/[ ()]/g, '_'));
  // $derived ensures Svelte 5 does not warn about capturing $props() values outside closures.
  const themeSuffix = $derived(`_${themeGameId !== gameId ? `${themeGameId}___` : ''}${parsedUiTheme}`);
  const themePropSuffix = $derived(`-${themeGameId !== gameId ? `${themeGameId}-` : ''}${parsedUiTheme}`);
  // const styleId = $derived(`theme${themeSuffix}`);
  const isFullBg = $derived((allGameFullBgUiThemes[themeGameId] ?? []).includes(uiTheme));
  let css = $state('');

  // Mirrors themeStyleTemplate from system.js
  const themeStyleTemplate = `
    .listEntry.theme{THEME}, .screenshotItem.theme{THEME} .screenshotControls, .toast.theme{THEME} {
      background-image: var(--container-bg-image-url{THEME_PROP}) !important;
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
    }

    .theme{THEME} .infoLabel, .theme{THEME} .infoText, .toast.theme{THEME} .toastMessage, h1.theme{THEME}, .theme{THEME} h1, h2.theme{THEME}, .theme{THEME} h2, h3.theme{THEME}, .theme{THEME} h3, h4.theme{THEME}, .theme{THEME} h4, .theme{THEME} a:not(.listEntryAction), .theme{THEME} label {
      background-image: var(--base-gradient{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color{THEME_PROP})));
    }

    body.highContrast .theme{THEME} .infoLabel, body.highContrast .theme{THEME} .infoText, body.highContrast .toast.theme{THEME} .toastMessage, body.highContrast h1.theme{THEME}, body.highContrast .theme{THEME} h1, body.highContrast h2.theme{THEME}, body.highContrast .theme{THEME} h2, body.highContrast h3.theme{THEME}, body.highContrast .theme{THEME} h3, body.highContrast h4.theme{THEME}, body.highContrast .theme{THEME} h4, body.highContrast .theme{THEME} a:not(.listEntryAction), body.highContrast .theme{THEME} label {
      background-image: var(--base-gradient-hc{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgba(var(--shadow-color-hc{THEME_PROP}), var(--shadow-opacity-hc{THEME_PROP}, 1)));
    }

    .theme{THEME} a:not(.modalClose):not(.listEntryAction) {
      background-image: var(--alt-gradient{THEME_PROP}) !important;
    }

    .nameText.theme{THEME}, .theme{THEME} .nameText, .theme{THEME} .partyListEntryMemberCountText, .theme{THEME} .themeText {
      color: rgb(var(--base-color{THEME_PROP}));
      background-image: var(--base-gradient{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color{THEME_PROP})));
    }

    body.highContrast .nameText.theme{THEME}, body.highContrast .theme{THEME} .nameText, body.highContrast .theme{THEME} .partyListEntryMemberCountText, body.highContrast .theme{THEME} .themeText {
      color: rgb(var(--base-color-hc{THEME_PROP}));
      background-image: var(--base-gradient-hc{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgba(var(--shadow-color-hc{THEME_PROP}), var(--shadow-opacity-hc{THEME_PROP}, 1)));
    }

    .theme{THEME} .nameMarker {
      color: rgb(var(--alt-color{THEME_PROP}));
      background-image: var(--alt-gradient{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color{THEME_PROP})));
    }

    body.highContrast .theme{THEME} .nameMarker {
      color: rgb(var(--alt-color-hc{THEME_PROP}));
      background-image: var(--alt-gradient-hc{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgba(var(--shadow-color-hc{THEME_PROP}), var(--shadow-opacity-hc{THEME_PROP}, 1)));
    }

    .theme{THEME} .checkbox {
      color: rgb(var(--base-color{THEME_PROP})) !important;
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
      background-color: rgb(var(--base-bg-color{THEME_PROP})) !important;
      text-shadow: 1.5px 1.5px rgb(var(--shadow-color{THEME_PROP}));
    }

    body.highContrast .theme{THEME} .checkbox {
      color: rgb(var(--base-color-hc{THEME_PROP})) !important;
      text-shadow: 1.5px 1.5px rgba(var(--shadow-color-hc{THEME_PROP}), var(--shadow-opacity-hc{THEME_PROP}, 1));
    }

    .theme{THEME}.icon path, .theme{THEME} .icon path {
      stroke: var(--svg-base-gradient{THEME_PROP});
      filter: var(--svg-shadow{THEME_PROP});
    }

    .theme{THEME}.fillIcon path, .theme{THEME} .fillIcon path {
      stroke: none;
      fill: var(--svg-base-gradient{THEME_PROP});
      filter: var(--svg-shadow{THEME_PROP});
    }

    .itemContainer .badgeItem.theme{THEME} > .badgeContainer {
      background-color: rgb(var(--base-bg-color{THEME_PROP})) !important;
    }

    .modalContent.itemContainer .badgeItem.theme{THEME} > .badgeContainer {
      background-color: rgb(var(--base-bg-color{THEME_PROP})) !important;
    }

    .modalContent.itemContainer .badgeItem.theme{THEME} > .badgeContainer.special {
      background-image: var(--alt-gradient-b{THEME_PROP});
    }

    .itemContainer .badgeItem.theme{THEME} > .badgeContainer > div, .imageItem.theme{THEME} > .imageThumbnailContainer {
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
    }

    .modalContent.itemContainer .badgeItem.locked.theme{THEME} > .badgeContainer > div:first-child {
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
    }

    .badge.theme{THEME} > .badgeOverlay, .theme{THEME} .badge > .badgeOverlay {
      background: var(--base-gradient{THEME_PROP});
    }

    .badge.theme{THEME} > .badgeOverlayBase, .theme{THEME} .badge > .badgeOverlayBase {
      background: rgb(var(--base-color{THEME_PROP}));
    }

    .badge.theme{THEME} > .badgeOverlayAlt, .theme{THEME} .badge > .badgeOverlayAlt {
      background: rgb(var(--alt-color{THEME_PROP}));
    }

    .badge.theme{THEME} > .badgeOverlayBg, .theme{THEME} .badge > .badgeOverlayBg {
      background: rgb(var(--base-bg-color{THEME_PROP}));
    }

    .eventVmListEntry.theme{THEME} .vmContainer .vmImage {
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
    }

    .tippy-box.theme{THEME} {
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
      background-image: var(--container-bg-image-url{THEME_PROP}) !important;
      {FULL_BG|background-origin: border-box; background-size: cover;}
    }

    .tooltip.theme{THEME} {
      border-image-source: var(--border-image-url{THEME_PROP}) !important;
      background-image: var(--container-bg-image-url{THEME_PROP}) !important;
      {FULL_BG|background-origin: border-box; background-size: cover;}
    }

    .tippy-box.theme{THEME} .tippy-content .tooltipContent {
      background-image: var(--base-gradient{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color{THEME_PROP})));
    }

    .tooltip.theme{THEME} .tooltipContent {
      background-image: var(--base-gradient{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color{THEME_PROP})));
    }

    body.highContrast .tippy-box.theme{THEME} .tippy-content .tooltipContent {
      background-image: var(--base-gradient-hc{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgba(var(--shadow-color-hc{THEME_PROP}), var(--shadow-opacity-hc{THEME_PROP}, 1)));
    }

    body.highContrast .tooltip.theme{THEME} .tooltipContent {
      background-image: var(--base-gradient-hc{THEME_PROP}) !important;
      filter: drop-shadow(1.5px 1.5px rgba(var(--shadow-color-hc{THEME_PROP}), var(--shadow-opacity-hc{THEME_PROP}, 1)));
    }

    .tippy-box.theme{THEME} .tippy-content .tooltipContent.noShadow {
      filter: unset;
    }

    .tooltip.theme{THEME} .tooltipContent.noShadow {
      filter: unset;
    }

    .tippy-box.theme{THEME} .tippy-content .tooltipContent.altText {
      background-image: var(--alt-gradient{THEME_PROP}) !important;
    }

    .tooltip.theme{THEME} .tooltipContent.altText {
      background-image: var(--alt-gradient{THEME_PROP}) !important;
    }

    body.highContrast .tippy-box.theme{THEME} .tippy-content .tooltipContent.altText {
      background-image: var(--alt-gradient-hc{THEME_PROP}) !important;
    }

    body.highContrast .tooltip.theme{THEME} .tooltipContent.altText {
      background-image: var(--alt-gradient-hc{THEME_PROP}) !important;
    }
  `;

  const DEBUG: boolean = false;

  let alt,
    systemGameId = gameId,
    systemName = '';
  const gradientId = $derived(
    `${alt ? 'alt' : 'base'}Gradient_${systemGameId !== gameId ? `${systemGameId}_` : ''}${systemName.replace(/[ ()]/g, '_')}`
  );

  $effect(() => {
    css = themeStyleTemplate
      .replaceAll('{THEME}', themeSuffix)
      .replaceAll('{THEME_PROP}', themePropSuffix)
      .replace(/\{FULL_BG\|(.*?)\}/, isFullBg ? '$1' : '');
  });

  type Color = [number, number, number];

  function rgbString(color: Color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
</script>

<svelte:head>
  <svelte:element this={'style'}>
    {@html css}
  </svelte:element>
</svelte:head>

{#snippet svgGradient(systemName: string, systemGameId: string, colors: Color[], alt: boolean)}
  {@const id = `${alt ? 'alt' : 'base'}Gradient_${systemGameId !== gameId ? `${systemGameId}_` : ''}${systemName.replace(/[ ()]/g, '_')}`}
  <linearGradient xmlns="http://www.w3.org/2000/svg" {id} x1="0%" y1="0%" x2="0%" y2="100%">
    {#each colors as color, idx}
      {@const offset = idx === 0 ? 0 : Math.floor(((idx + 1) / colors.length) * 10000) / 100}
      <stop stop-color={rgbString(color)} offset="{offset}%" />
    {/each}
  </linearGradient>
{/snippet}

{#snippet svgDropShadow(systemName: string, systemGameId: string, color: Color)}
  {@const id = `dropShadow_${systemGameId !== gameId ? `${systemGameId}_` : ''}${systemName.replace(/[ ()]/g, '_')}`}
  <filter xmlns="http://www.w3.org/2000/svg" {id}>
    <feDropShadow x="1" dy="1" stdDeviation="0.2" flood-color={rgbString(color)} />
  </filter>
{/snippet}
