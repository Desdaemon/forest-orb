<script module lang="ts">
  import type { Snippet } from 'svelte';
  import { createAttachmentKey, type Attachment } from 'svelte/attachments';

  const TOOLTIP_SHOW_EVENT = 'ynoproject:tooltip-show';
  const TOOLTIP_HIDE_EVENT = 'ynoproject:tooltip-hide';

  type TooltipContent = string | Snippet;
  type TooltipOptions = {
    themeClass?: string;
  };

  export function tooltip(content: TooltipContent, options?: TooltipOptions): Attachment {
    return (el) => {
      const show = () => {
        window.dispatchEvent(
          new CustomEvent(TOOLTIP_SHOW_EVENT, { detail: { anchor: el, content, themeClass: options?.themeClass } })
        );
      };

      const hide = () => {
        window.dispatchEvent(new CustomEvent(TOOLTIP_HIDE_EVENT, { detail: { anchor: el } }));
      };

      el.addEventListener('mouseenter', show);
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focus', show);
      el.addEventListener('blur', hide);

      return () => {
        el.removeEventListener('mouseenter', show);
        el.removeEventListener('mouseleave', hide);
        el.removeEventListener('focus', show);
        el.removeEventListener('blur', hide);
      };
    };
  }

  export function tooltipLabel(content: string) {
    return {
      'aria-label': content,
      [createAttachmentKey()]: tooltip(content)
    };
  }
</script>

<script lang="ts">
  import { computePosition, flip, offset, shift } from '@floating-ui/dom';
  import { onMount, tick } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import type { TransitionConfig } from 'svelte/transition';
  import type { Snippet as TooltipSnippet } from 'svelte';

  const DEBUG_CTRL_CLICK_FREEZE_ENABLED = true;
  const SHOW_DELAY_MS = 300;
  const HIDE_GRACE_MS = 80;

  let tooltipEl = $state<HTMLElement | null>(null);
  let content = $state<string | TooltipSnippet | null>(null);
  let themeClass = $state('');
  let isVisible = $state(false);
  let left = $state(0);
  let top = $state(0);
  let shownAbove: boolean;
  let activeAnchor = $state<HTMLElement | null>(null);
  let pendingShow = $state<{ anchor: HTMLElement; content: string | TooltipSnippet; themeClass?: string } | null>(null);
  let showTimeout: ReturnType<typeof setTimeout> | null = null;
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let tooltipHovered = $state(false);
  let tooltipFrozen = $state(false);

  function clearHideTimeout() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  function isAnchorStillEligible(anchor: HTMLElement): boolean {
    return anchor.matches(':hover') || document.activeElement === anchor;
  }

  function forceHide() {
    clearHideTimeout();
    tooltipHovered = false;
    activeAnchor = null;
    isVisible = false;
  }

  async function showNow(anchor: HTMLElement, nextContent: string | TooltipSnippet, nextThemeClass?: string) {
    activeAnchor = anchor;
    content = nextContent;
    themeClass = nextThemeClass || '';
    isVisible = true;

    let attempts = 0;
    do {
      await tick();
      attempts++;
    } while (!tooltipEl);

    if (attempts > 1) {
      console.error(`Tooltip: waited ${attempts} ticks for tooltip element to be available`);
    }

    const { x, y } = await computePosition(anchor, tooltipEl, {
      strategy: 'fixed',
      placement: 'top',
      middleware: [offset(6), flip(), shift({ padding: 4 })]
    });

    shownAbove = y < anchor.getBoundingClientRect().y;
    left = x;
    top = y;
  }

  function scheduleHide(anchorToHide: HTMLElement | null) {
    if (tooltipFrozen) {
      return;
    }

    clearHideTimeout();
    hideTimeout = setTimeout(() => {
      if (tooltipFrozen) {
        return;
      }
      if (tooltipHovered) {
        return;
      }
      if (anchorToHide && activeAnchor !== anchorToHide) {
        return;
      }
      if (activeAnchor && isAnchorStillEligible(activeAnchor)) {
        return;
      }
      forceHide();
    }, HIDE_GRACE_MS);
  }

  async function show(anchor: HTMLElement, nextContent: string | TooltipSnippet, nextThemeClass?: string) {
    if (tooltipFrozen) {
      return;
    }

    // Clear any pending hide
    clearHideTimeout();

    // A newer hover should always supersede previously queued anchors.
    pendingShow = null;

    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }

    if (isVisible && activeAnchor && activeAnchor !== anchor) {
      pendingShow = { anchor, content: nextContent, themeClass: nextThemeClass };
      forceHide();
      return;
    }

    // Delay before showing
    showTimeout = setTimeout(async () => {
      await showNow(anchor, nextContent, nextThemeClass);
      showTimeout = null;
    }, SHOW_DELAY_MS);
  }

  function hide(anchor?: HTMLElement) {
    if (tooltipFrozen) {
      return;
    }

    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }

    const anchorToHide = anchor ?? activeAnchor;
    scheduleHide(anchorToHide);
  }

  function onTooltipMouseEnter() {
    tooltipHovered = true;
    clearHideTimeout();
  }

  function onTooltipMouseLeave() {
    tooltipHovered = false;
    if (tooltipFrozen) return;
    scheduleHide(activeAnchor);
  }

  function onTooltipOutroEnd() {
    if (isVisible) return;
    content = null;
    themeClass = '';

    const nextShow = pendingShow;
    pendingShow = null;
    if (!nextShow || showTimeout) return;

    void showNow(nextShow.anchor, nextShow.content, nextShow.themeClass);
  }

  function onTooltipClick(event: MouseEvent) {
    if (!(DEBUG_CTRL_CLICK_FREEZE_ENABLED && event.ctrlKey && isVisible)) return;

    event.preventDefault();
    event.stopPropagation();

    tooltipFrozen = !tooltipFrozen;
    if (tooltipFrozen) clearHideTimeout();
  }

  $effect(() => {
    if (!tooltipEl) return;

    const el = tooltipEl;
    el.addEventListener('click', onTooltipClick);

    return () => {
      el.removeEventListener('click', onTooltipClick);
    };
  });

  onMount(() => {
    const onShow = (event: Event) => {
      const custom = event as CustomEvent<{
        anchor: HTMLElement;
        content: string | TooltipSnippet;
        themeClass?: string;
      }>;
      void show(custom.detail.anchor, custom.detail.content, custom.detail.themeClass);
    };

    const onHide = (event: Event) => {
      const custom = event as CustomEvent<{ anchor?: HTMLElement }>;
      hide(custom.detail.anchor);
    };

    window.addEventListener(TOOLTIP_SHOW_EVENT, onShow as EventListener);
    window.addEventListener(TOOLTIP_HIDE_EVENT, onHide as EventListener);

    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      clearHideTimeout();
      window.removeEventListener(TOOLTIP_SHOW_EVENT, onShow as EventListener);
      window.removeEventListener(TOOLTIP_HIDE_EVENT, onHide as EventListener);
    };
  });

  function scaleAwayFromMouse(node: HTMLElement, params?: { duration?: number; start?: number }): TransitionConfig {
    const { duration = 180, start = 0.7 } = params || {};
    const transformOrigin = shownAbove ? 'center bottom' : 'center top';

    return {
      duration,
      easing: cubicOut,
      css: (t) => {
        const scaleValue = start + (1 - start) * t;
        return `
          transform-origin: ${transformOrigin};
          transform: scale(${scaleValue});
          opacity: ${t};
        `;
      }
    };
  }
</script>

{#if content && isVisible}
  <div
    role="tooltip"
    class={['unselectable', `tooltip${themeClass ? ` ${themeClass}` : ''}`]}
    class:frozen={tooltipFrozen}
    style:left="{left}px"
    style:top="{top}px"
    onmouseenter={onTooltipMouseEnter}
    onmouseleave={onTooltipMouseLeave}
    onoutroend={onTooltipOutroEnd}
    transition:scaleAwayFromMouse
    bind:this={tooltipEl}
  >
    {#if typeof content === 'string'}
      <span class="tooltipContent">{content}</span>
    {:else}
      {@render content()}
    {/if}
  </div>
{/if}

<style>
  .tooltip {
    width: max-content;
    max-width: min(80vw, 350px);
    position: fixed;
    left: 0;
    top: 0;
    z-index: 11000;
    pointer-events: auto;
    padding: 6px 8px;
    font-size: 14px;
    font-weight: normal;
    line-height: 1.3;
    background-image: var(--container-bg-image-url) !important;
    border: 6px solid transparent;
    border-image: var(--border-image-url) 8 repeat !important;
    border-image-width: 2 !important;
    box-shadow: none;
    text-shadow: none;
    image-rendering: pixelated;
    white-space: normal;
  }

  :global(.fullBg) .tooltip {
    background-size: auto 100% !important;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    height: 24px;
  }

  .tooltip :global(.tooltipContent) {
    display: inline;
    background-image: var(--base-gradient) !important;
    filter: drop-shadow(1.5px 1.5px rgb(var(--shadow-color)));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tooltip :global(.tooltipContent.noShadow) {
    filter: unset;
  }

  .tooltip :global(.tooltipContent.altText) {
    background-image: var(--alt-gradient) !important;
  }

  .tooltip :global(.tooltipTitle) {
    margin: 0 0 8px 0;
    text-align: center;
  }

  .tooltip :global(.tooltipSpacer) {
    margin-top: 4px;
  }

  .tooltip :global(.tooltipLocation) {
    display: block;
    margin-bottom: 8px;
  }

  .tooltip :global(.tooltipLabel),
  .tooltip :global(.tooltipContent:first-child) {
    font-size: 16px;
  }

  .tooltip :global(.tooltipFooter) {
    display: block;
    text-align: center;
    margin-top: 8px;
  }

  .tooltip :global(.tooltipTitle + .tooltipFooter) {
    margin-top: 0;
  }

  .tooltip :global(.tooltipCornerText) {
    display: flex;
    justify-content: right;
    font-size: x-small;
  }
</style>
