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
  import { onMount, tick } from 'svelte';
  import type { Snippet as TooltipSnippet } from 'svelte';
  import { computePosition, flip, offset, shift } from '@floating-ui/dom';
  import { scale } from 'svelte/transition';

  type TooltipState = 'closed' | 'open' | 'onTooltip';

  const VALID_TRANSITIONS: Record<TooltipState, readonly TooltipState[]> = {
    closed: ['open', 'closed'],
    open: ['open', 'closed', 'onTooltip'],
    onTooltip: ['closed']
  };

  const TRANSITION_DURATION = 80;

  let tooltipEl = $state<HTMLElement | null>(null);
  let content = $state<string | TooltipSnippet | null>(null);
  let themeClass = $state('');
  let currentState = $state<TooltipState>('closed');
  let left = $state(0);
  let top = $state(0);
  let pendingClose: Promise<void> | undefined = $state();

  async function setState(nextState: TooltipState) {
    const allowed = VALID_TRANSITIONS[currentState as keyof typeof VALID_TRANSITIONS] ?? [];
    if (!allowed.includes(nextState)) {
      console.log('invalid transition', { currentState, nextState });
    }
    if (nextState === 'open') {
      if (currentState === 'open') {
        // force this state first to ensure the CSS transition plays out
        await setState('closed');
      }
      await pendingClose;
    }
    if (nextState === 'closed') {
      pendingClose = new Promise((resolve) => setTimeout(resolve, TRANSITION_DURATION));
    }
    console.log('[Tooltip]', currentState, '->', nextState);
    currentState = nextState;
  }

  async function show(anchor: HTMLElement, nextContent: string | TooltipSnippet, nextThemeClass?: string) {
    content = nextContent;
    themeClass = nextThemeClass || '';
    await setState('open');

    requestAnimationFrame(() => {
      if (!tooltipEl) return;
      computePosition(anchor, tooltipEl, {
        placement: 'top',
        middleware: [offset(6), flip(), shift(), shift({ padding: 8 })]
      }).then(({ x, y }) => {
        left = x;
        top = y;
      });
    });
  }

  async function hide() {
    await tick(); // DO NOT REMOVE UNDER ANY CIRCUMSTANCES
    if (currentState === 'onTooltip') return;
    setState('closed');
  }

  onMount(() => {
    const onShow = (event: Event) => {
      const custom = event as CustomEvent<{
        anchor: HTMLElement;
        content: string | TooltipSnippet;
        themeClass?: string;
      }>;
      show(custom.detail.anchor, custom.detail.content, custom.detail.themeClass);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onHide = (_event: Event) => {
      hide();
    };

    window.addEventListener(TOOLTIP_SHOW_EVENT, onShow as EventListener);
    window.addEventListener(TOOLTIP_HIDE_EVENT, onHide as EventListener);

    return () => {
      window.removeEventListener(TOOLTIP_SHOW_EVENT, onShow as EventListener);
      window.removeEventListener(TOOLTIP_HIDE_EVENT, onHide as EventListener);
    };
  });

  function onEnterTooltip() {
    setState('onTooltip');
  }

  function onExitTooltip() {
    setState('closed');
  }
</script>

{#if currentState !== 'closed'}
  <div
    id="tooltip"
    role="tooltip"
    class={['unselectable', `tooltip${themeClass ? ` ${themeClass}` : ''}`]}
    style="left:{left}px;top:{top}px;position:fixed;"
    transition:scale={{ duration: TRANSITION_DURATION, start: 0.8 }}
    bind:this={tooltipEl}
    onmouseenter={onEnterTooltip}
    onmouseleave={onExitTooltip}
  >
    {#if typeof content === 'string'}
      <span class="tooltipContent">{content}</span>
    {:else}
      {@render content?.()}
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
    color: #d4c8d8;
    background: var(--container-bg-image-url, #3d3239) !important;
    border: 6px solid transparent;
    border-image: var(
        --border-image-url,
        linear-gradient(45deg, #8b7a8f 25%, transparent 25%, transparent 75%, #8b7a8f 75%, #8b7a8f),
        linear-gradient(45deg, #8b7a8f 25%, transparent 25%, transparent 75%, #8b7a8f 75%, #8b7a8f)
      )
      8 repeat !important;
    border-image-width: 2 !important;
    box-shadow: none;
    text-shadow: none;
    image-rendering: pixelated;
    white-space: normal;
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 150ms ease,
      transform 150ms ease;
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
