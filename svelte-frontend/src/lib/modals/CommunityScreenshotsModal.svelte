<script lang="ts">
  import { LL } from '$lib';
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api';
  import Modal from '$lib/components/Modal.svelte';
  import { getGameInitState } from '$lib/init';

  type Screenshot = {
    id: string;
    uuid: string;
    owner: {
      name: string;
      systemName: string;
      rank: string;
      badge: string;
      uuid: string;
    };
    timestamp: number;
    game: string;
    spoiler: boolean;
    liked: boolean;
    likeCount: number;
    mapId: string | null;
    mapX: number;
    mapY: number;
  };

  let loading = $state(true);
  let error = $state<string | null>(null);
  let games = $state<string[]>([]);
  let selectedGame = $state('');
  let selectedSortOrder = $state('recent');
  let selectedInterval = $state('day');
  let sentinel: HTMLDivElement | undefined = $state();

  const { gameId } = getGameInitState();
  const SCREENSHOTS_PAYLOAD_LIMIT = 10;

  let screenshots = $state<Screenshot[]>([]);
  let offset = $state(0);
  let offsetId: string | null = null;
  let hasMore = $state(true);
  let pendingLoad: Promise<void> | undefined;
  let shouldLoad = $state(false);

  let scrollContainer = $state<HTMLElement | null>(null);
  let observer: IntersectionObserver | null = null;

  async function fetchGames() {
    try {
      const response = await fetch('/badge.json');
      if (!response.ok) return;
      const data = (await response.json()) as any[];
      games = Array.from(new Set(data.map((b) => b.game).filter(Boolean))).sort();
    } catch (e) {
      console.error('Failed to fetch games', e);
    }
  }

  async function fetchScreenshots(
    game: string = selectedGame,
    sortOrder: string = selectedSortOrder,
    interval: string = selectedInterval,
    existingLoad = pendingLoad,
  ) {
    if (!hasMore) return;

    // await existingLoad;
    if (existingLoad) {
      console.log('hold up!');
      await existingLoad;
    }

    try {
      const url = `screenshot?command=getScreenshotFeed&offset=${offset}${offsetId ? `&offsetId=${offsetId}` : ''}${game ? `&game=${game}` : ''}${sortOrder ? `&sortOrder=${sortOrder}` : ''}${interval ? `&interval=${interval}` : ''}`;
      const newScreenshots = await apiFetch<Screenshot[] | null>(url);

      if (!newScreenshots?.length) {
        hasMore = false;
      } else {
        const nextOffset = offset + newScreenshots.length;
        const nextOffsetId = newScreenshots[newScreenshots.length - 1].id;

        screenshots = [...screenshots, ...newScreenshots];
        if (offset === nextOffset) throw new Error();
        offset = nextOffset;
        offsetId = nextOffsetId;

        console.log('got new screenshots', newScreenshots.length);
        if (newScreenshots.length < SCREENSHOTS_PAYLOAD_LIMIT) {
          hasMore = false;
        }
      }
    } catch (e) {
      error = 'Failed to load screenshots';
      console.error(e);
    } finally {
      loading = false;
      pendingLoad = undefined;
    }
  }

  // Watch for filter changes
  $effect(() => {
    if (shouldLoad) {
      pendingLoad = fetchScreenshots(selectedGame, selectedSortOrder, selectedInterval);
      shouldLoad = false;
    }
  });

  onMount(async () => {
    await fetchGames();
    offset = 0;
    offsetId = null;
    screenshots = [];
    hasMore = true;
    pendingLoad = fetchScreenshots();
  });

  function requestLoad() {
    shouldLoad = true;
  }

  $effect(() => {
    if (!scrollContainer || !sentinel) return;

    observer = new IntersectionObserver(
      async ([{ isIntersecting }]) => {
        if (isIntersecting) requestLoad();
      },
      { root: scrollContainer, threshold: 0.1 }
    );

    observer.observe(sentinel);

    return () => observer?.disconnect();
  });
</script>

<Modal aria-label="Community Screenshots" fullscreen>
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.communityScreenshots.title()}</h1>
    <div class="uiControls wrap">
      <div class="uiControl">
        <label for="communityScreenshotsGame" class="unselectable">Game:</label>
        <select id="communityScreenshotsGame" bind:value={selectedGame}>
          <option value="">All</option>
          {#each games as game}
            <option value={game}>{game}</option>
          {/each}
        </select>
      </div>
      <div class="uiControl">
        <select bind:value={selectedSortOrder}>
          <option value="recent">Newest</option>
          <option value="likes">Most Liked</option>
        </select>
      </div>
      <div class="uiControl">
        <select bind:value={selectedInterval}>
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="">All Time</option>
        </select>
      </div>
    </div>
  </div>
  <div class="modalContent infiniteScrollContainer itemContainer" bind:this={scrollContainer}>
    {#if loading && screenshots.length === 0}
      <div class="loading">Loading...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else}
      {#each screenshots as screenshot (screenshot.id)}
        <div class="screenshotItem">
          <img
            src="/connect/{gameId}/screenshots/{screenshot.owner.uuid}/{screenshot.id}.png"
            alt="Screenshot"
            class="screenshotThumbnail"
          />
          {#if screenshot.spoiler}
            <div class="spoilerLabel">Spoiler</div>
          {/if}
          <div class="screenshotControls">
            <button
              class="likeButton"
              onclick={() => {
                /* handle like */
              }}
            >
              <span class={screenshot.liked ? 'fillIcon' : ''}>❤️</span>
              {screenshot.likeCount}
            </button>
          </div>
          <div class="screenshotInfo">
            <div class="playerName">{screenshot.owner.name}</div>
            {#if screenshot.mapId}
              <div class="location">Map: {screenshot.mapId}</div>
            {/if}
          </div>
        </div>
      {/each}
      {#if pendingLoad}
        <div class="loading-more">Loading more...</div>
      {/if}
    {/if}
    <div class="js_sentinel" bind:this={sentinel}></div>
  </div>
</Modal>

<style>
  .js_sentinel {
    width: 1px;
    height: 1px;
  }
</style>
