<script module lang="ts">
  export type VirtualListController = {
    isScrolledToBottom: (threshold?: number) => boolean;
    scrollToBottom: () => void;
  };
</script>

<script lang="ts" generics="TItem = unknown">
  import { onMount, tick, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    items = [],
    row,
    empty,
    estimatedItemHeight = 64,
    overscan = 4,
    visible = true,
    onScrollStateChange,
    ...props
  }: {
    items?: TItem[];
    row?: Snippet<[TItem, number]>;
    empty?: Snippet;
    estimatedItemHeight?: number;
    overscan?: number;
    visible?: boolean;
    onScrollStateChange?: (isAtBottom: boolean) => void;
  } & HTMLAttributes<HTMLDivElement> = $props();

  let containerEl = $state<HTMLElement | null>(null);
  let viewportHeight = $state(0);
  let scrollTop = $state(0);
  let measuredHeights = $state<Map<number, number>>(new Map());

  const itemCount = $derived(items.length);

  const heights = $derived.by(() => {
    const next = new Array<number>(itemCount);
    for (let i = 0; i < itemCount; i += 1) {
      next[i] = measuredHeights.get(i) ?? estimatedItemHeight;
    }
    return next;
  });

  const offsets = $derived.by(() => {
    const next = new Array<number>(itemCount + 1);
    next[0] = 0;
    for (let i = 0; i < itemCount; i += 1) {
      next[i + 1] = next[i] + heights[i];
    }
    return next;
  });

  const totalHeight = $derived(offsets[itemCount] ?? 0);

  function findIndexForOffset(offset: number) {
    let low = 0;
    let high = itemCount;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (offsets[mid] <= offset) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return Math.max(0, low - 1);
  }

  const visibleStart = $derived.by(() => {
    if (!itemCount) return 0;
    return Math.max(0, findIndexForOffset(scrollTop) - overscan);
  });

  const visibleEnd = $derived.by(() => {
    if (!itemCount) return 0;
    const maxOffset = scrollTop + viewportHeight;
    return Math.min(itemCount, findIndexForOffset(maxOffset) + overscan + 1);
  });

  const visibleItems = $derived(items.slice(visibleStart, visibleEnd));

  function setContainerMetrics() {
    if (!containerEl) return;
    viewportHeight = containerEl.clientHeight;
  }

  function onScroll(event: Event) {
    scrollTop = (event.currentTarget as HTMLElement).scrollTop;
    onScrollStateChange?.(isScrolledToBottom());
  }

  export function isScrolledToBottom(threshold = 16) {
    if (!containerEl) return true;
    const distanceFromBottom = containerEl.scrollHeight - containerEl.scrollTop - containerEl.clientHeight;
    return distanceFromBottom <= threshold;
  }

  export function scrollToBottom() {
    if (!containerEl) return;
    containerEl.scrollTop = containerEl.scrollHeight;
    scrollTop = containerEl.scrollTop;
    onScrollStateChange?.(isScrolledToBottom());
  }

  function measureRow(node: HTMLElement, index: number) {
    let rowIndex = index;

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      if (!nextHeight) return;
      if (measuredHeights.get(rowIndex) === nextHeight) return;
      const nextMap = new Map(measuredHeights);
      nextMap.set(rowIndex, nextHeight);
      measuredHeights = nextMap;
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(node);

    return {
      update(nextIndex: number) {
        rowIndex = nextIndex;
        updateHeight();
      },
      destroy() {
        observer.disconnect();
      }
    };
  }

  onMount(() => {
    if (!containerEl) return;

    const observer = new ResizeObserver(() => {
      setContainerMetrics();
    });

    observer.observe(containerEl);
    setContainerMetrics();
    onScrollStateChange?.(isScrolledToBottom());

    return () => {
      observer.disconnect();
    };
  });

  $effect(() => {
    const currentCount = itemCount;
    if (measuredHeights.size === 0) return;

    let changed = false;
    const nextMap = new Map<number, number>();
    for (const [index, height] of measuredHeights.entries()) {
      if (index >= 0 && index < currentCount) {
        nextMap.set(index, height);
      } else {
        changed = true;
      }
    }

    if (changed) {
      measuredHeights = nextMap;
    }
  });

  $effect(() => {
    if (!visible) return;
    void tick().then(() => {
      setContainerMetrics();
      if (!containerEl) return;
      if (containerEl.scrollTop !== scrollTop) {
        containerEl.scrollTop = scrollTop;
      }
    });
  });

  $effect(() => {
    if (!containerEl) return;
    const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
    if (scrollTop > maxScrollTop) {
      scrollTop = maxScrollTop;
      containerEl.scrollTop = maxScrollTop;
    }
  });
</script>

<div role="list" {...props} bind:this={containerEl} onscroll={onScroll}>
  {#if itemCount === 0}
    {@render empty?.()}
  {:else}
    <div style="position: relative; height: {totalHeight}px;">
      {#each visibleItems as item, localIndex (visibleStart + localIndex)}
        {@const index = visibleStart + localIndex}
        <div role="listitem" style="position: absolute; inset-inline: 0; top: {offsets[index]}px;" use:measureRow={index}>
          {@render row?.(item, index)}
        </div>
      {/each}
    </div>
  {/if}
</div>
