<script module lang="ts">
  import type { Snippet } from 'svelte';
  import { createAttachmentKey, type Attachment } from 'svelte/attachments';

  const TOOLTIP_SHOW_EVENT = 'ynoproject:tooltip-show';
  const TOOLTIP_HIDE_EVENT = 'ynoproject:tooltip-hide';

  type TooltipContent = string | Snippet;

  export function tooltip(content: TooltipContent): Attachment {
    return (el) => {
      const show = () => {
        window.dispatchEvent(new CustomEvent(TOOLTIP_SHOW_EVENT, { detail: { anchor: el, content } }));
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
  import { onMount } from 'svelte';
  import type { Snippet as TooltipSnippet } from 'svelte';

  const TOOLTIP_SHOW_EVENT = 'ynoproject:tooltip-show';
  const TOOLTIP_HIDE_EVENT = 'ynoproject:tooltip-hide';

  let tooltipEl = $state<HTMLElement | null>(null);
  let content = $state<string | TooltipSnippet | null>(null);
  let isVisible = $state(false);
  let left = $state(0);
  let top = $state(0);
  let activeAnchor = $state<HTMLElement | null>(null);
  let showTimeout: ReturnType<typeof setTimeout> | null = null;
  let hoveredAnchor = $state<HTMLElement | null>(null);

  async function show(anchor: HTMLElement, nextContent: string | TooltipSnippet) {
    if (!tooltipEl)
      return;

    hoveredAnchor = anchor;

    // Clear any pending hide
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }

    // Delay before showing
    showTimeout = setTimeout(async () => {
      // Only show if still hovering the same anchor
      if (hoveredAnchor !== anchor) {
        showTimeout = null;
        return;
      }

      activeAnchor = anchor;
      content = nextContent;
      isVisible = true;

      if (!tooltipEl) return;

      const { x, y } = await computePosition(anchor, tooltipEl, {
        strategy: 'fixed',
        placement: 'top',
        middleware: [offset(8), flip(), shift({ padding: 4 })]
      });

      left = x;
      top = y;
      showTimeout = null;
    }, 300);
  }

  function hide(anchor?: HTMLElement) {
    if (anchor) {
      hoveredAnchor = null;
    }
    
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }
    
    if (anchor && anchor !== activeAnchor)
      return;

    activeAnchor = null;
    isVisible = false;
    content = null;
  }

  onMount(() => {
    const onShow = (event: Event) => {
      const custom = event as CustomEvent<{ anchor: HTMLElement; content: string | TooltipSnippet }>;
      void show(custom.detail.anchor, custom.detail.content);
    };

    const onHide = (event: Event) => {
      const custom = event as CustomEvent<{ anchor?: HTMLElement }>;
      hide(custom.detail.anchor);
    };

    window.addEventListener(TOOLTIP_SHOW_EVENT, onShow as EventListener);
    window.addEventListener(TOOLTIP_HIDE_EVENT, onHide as EventListener);

    return () => {
      window.removeEventListener(TOOLTIP_SHOW_EVENT, onShow as EventListener);
      window.removeEventListener(TOOLTIP_HIDE_EVENT, onHide as EventListener);
    };
  });
</script>

<div
  class="tooltip"
  class:hidden={!isVisible}
  style:left="{left}px"
  style:top="{top}px"
  bind:this={tooltipEl}
>
  {#if typeof content === 'string'}
    {content}
  {:else if content}
    {@render content()}
  {/if}
</div>

<style>
  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes tooltipFadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .tooltip {
    width: max-content;
    max-width: min(80vw, 350px);
    position: fixed;
    left: 0;
    top: 0;
    z-index: 9999;
    pointer-events: none;
    padding: 6px 8px;
    font-size: 14px;
    font-weight: normal;
    line-height: 1.3;
    color: #d4c8d8;
    background: var(--container-bg-image-url, #3d3239) !important;
    border: 6px solid transparent;
    border-image: var(--border-image-url, linear-gradient(45deg, #8b7a8f 25%, transparent 25%, transparent 75%, #8b7a8f 75%, #8b7a8f), linear-gradient(45deg, #8b7a8f 25%, transparent 25%, transparent 75%, #8b7a8f 75%, #8b7a8f)) 8 repeat !important;
    border-image-width: 2 !important;
    box-shadow: none;
    text-shadow: none;
    image-rendering: pixelated;
    white-space: nowrap;
    animation: tooltipFadeIn 150ms ease-in-out forwards;
  }

  .tooltip.hidden {
    animation: tooltipFadeOut 150ms ease-in-out forwards;
    pointer-events: none;
  }
</style>
