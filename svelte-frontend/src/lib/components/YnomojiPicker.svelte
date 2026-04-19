<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { ynomojiConfig, getYnomojiUrl, matchYnomojiIds } from '$lib/stores/ynomoji';
  import { tooltipLabel } from './Tooltip.svelte';

  let {
    onInsert,
    inputValue = '',
    selectionEnd = 0,
    inputRef
  }: {
    onInsert: (id: string) => void;
    inputValue?: string;
    selectionEnd?: number;
    inputRef?: HTMLInputElement;
  } = $props();

  let visibleYnomojis = $state<string[]>([]);
  let containerVisible = $state(false);
  let container = $state<HTMLDivElement>();
  let pickerStyle = $state('');
  let inputWidth = $state(0);

  const MAX_ROWS = 4;
  const BUTTON_SIZE = 36; // 32px + 4px margin

  let autoShowTimer: ReturnType<typeof setTimeout> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let rafId: number | null = null;

  onMount(() => {
    if (!inputRef) return;

    resizeObserver = new ResizeObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    });
    resizeObserver.observe(inputRef);
    updatePosition();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  });

  function updatePosition() {
    if (!inputRef || !container) return;

    const inputRect = inputRef.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    inputWidth = inputRect.width;
    const inputTop = inputRect.top + scrollTop;

    pickerStyle = `
      position: fixed;
      bottom: ${window.innerHeight - inputTop}px;
      left: ${scrollLeft + inputRect.left}px;
      width: ${inputWidth}px;
      z-index: 100;
    `;
  }

  $effect(() => {
    const config = $ynomojiConfig;
    const _inputWidth = inputWidth;
    if (!config || Object.keys(config).length === 0) {
      visibleYnomojis = [];
      containerVisible = false;
      return;
    }

    const ynomojiPattern = /:([a-z0-9-]+(?::|$)|$)/gi;
    const textBeforeCursor = inputValue?.slice(0, selectionEnd) || '';
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    while ((match = ynomojiPattern.exec(textBeforeCursor)) !== null) {
      lastMatch = match;
    }

    if (!lastMatch) {
      // No colon found at all - hide picker
      visibleYnomojis = [];
      containerVisible = false;
      return;
    }

    if (!lastMatch[1]) {
      // Colon found with nothing after it - show all ynomojis
      const numColumns = Math.max(1, Math.floor((_inputWidth || 300) / BUTTON_SIZE));
      const maxButtons = MAX_ROWS * numColumns;
      visibleYnomojis = Object.keys(config).slice(0, maxButtons);
      containerVisible = true;
      return;
    }

    if (lastMatch[1].endsWith(':')) {
      // Match ends with colon - hide picker
      visibleYnomojis = [];
      containerVisible = false;
      return;
    }

    // Filter by partial match
    const partialMatch = lastMatch[1];
    const filtered = matchYnomojiIds(config, partialMatch);
    const numColumns = Math.max(1, Math.floor((_inputWidth || 300) / BUTTON_SIZE));
    const maxButtons = MAX_ROWS * numColumns;
    visibleYnomojis = filtered.slice(0, maxButtons);
    containerVisible = filtered.length > 0;
  });

  // Auto-show all ynomojis after 1 second of inactivity
  $effect(() => {
    const config = $ynomojiConfig;
    const _inputWidth = inputWidth;
    if (!config || Object.keys(config).length === 0) return;

    const ynomojiPattern = /:([a-z0-9-]+(?::|$)|$)/gi;
    const textBeforeCursor = inputValue?.slice(0, selectionEnd) || '';
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    while ((match = ynomojiPattern.exec(textBeforeCursor)) !== null) {
      lastMatch = match;
    }

    if (autoShowTimer) {
      clearTimeout(autoShowTimer);
      autoShowTimer = null;
    }

    if (lastMatch && !lastMatch[1]) {
      autoShowTimer = setTimeout(() => {
        const currentText = inputValue?.slice(0, selectionEnd);
        if (currentText === textBeforeCursor) {
          const numColumns = Math.max(1, Math.floor((_inputWidth || 300) / BUTTON_SIZE));
          const maxButtons = MAX_ROWS * numColumns;
          visibleYnomojis = Object.keys(config).slice(0, maxButtons);
          containerVisible = true;
        }
      }, 1000);
    }

    return () => {
      if (autoShowTimer) {
        clearTimeout(autoShowTimer);
        autoShowTimer = null;
      }
    };
  });

  // Update position when visibility changes
  $effect(() => {
    if (containerVisible && container && inputRef) {
      void tick().then(() => {
        updatePosition();
      });
    }
  });

  function handleYnomojiClick(id: string) {
    onInsert(id);
  }
</script>

{#if containerVisible && visibleYnomojis.length > 0}
  <div id="ynomojiContainer" bind:this={container} class="scrollableContainer ynomojiPickerVisible" style={pickerStyle}>
    {#each visibleYnomojis as ynomojiId (ynomojiId)}
      {@const imageUrl = getYnomojiUrl(ynomojiId)}
      {#if imageUrl}
        <span
          class="ynomojiButton"
          data-ynomoji-id={ynomojiId}
          role="button"
          tabindex="0"
          onclick={() => handleYnomojiClick(ynomojiId)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleYnomojiClick(ynomojiId);
            }
          }}
        >
          <img src={imageUrl} class="ynomoji" alt={ynomojiId} {...tooltipLabel(`:${ynomojiId}:`)} loading="lazy" />
        </span>
      {/if}
    {/each}
  </div>
{/if}
