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
  let showRefreshIndicator = $state(false);

  const { gameId } = getGameInitState();
  const SCREENSHOTS_PAYLOAD_LIMIT = 10;

  let screenshots = $state<Screenshot[]>([]);
  let offset = $state(0);
  let offsetId: string | null = null;
  let hasMore = $state(true);
  let pendingLoad: Promise<void> | undefined = $state();
  let shouldLoad = $state(false);

  let scrollContainer = $state<HTMLElement | null>(null);
  let observer: IntersectionObserver | null = null;

  function resetFeed() {
    loading = true;
    error = null;
    showRefreshIndicator = false;
    screenshots = [];
    offset = 0;
    offsetId = null;
    hasMore = true;
    pendingLoad = undefined;
    shouldLoad = true;
  }

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
    existingLoad = pendingLoad
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
    resetFeed();
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
    <div id="communityScreenshotsControls" class="uiControls wrap">
      <div class="uiControl">
        <label
          for="communityScreenshotsGame"
          class="unselectable"
          data-i18n="[html]modal.communityScreenshots.fields.game.label"
          >{@html $LL.ui.modal.communityScreenshots.fields.game.label()}</label
        >
        <select id="communityScreenshotsGame" class="gameSelect" bind:value={selectedGame} onchange={resetFeed}>
          <option value="" data-i18n="[html]modal.communityScreenshots.fields.game.values.all"
            >{$LL.ui.modal.communityScreenshots.fields.game.values.all()}</option
          >
          {#each games as game}
            <option value={game}>{game}</option>
          {/each}
        </select>
      </div>
      <div class="uiControl">
        <span></span>
        <select id="communityScreenshotsSortOrder" bind:value={selectedSortOrder} onchange={resetFeed}>
          <option value="recent" data-i18n="[html]modal.communityScreenshots.fields.sortOrder.values.recent"
            >{$LL.ui.modal.communityScreenshots.fields.sortOrder.values.recent()}</option
          >
          <option value="likes" data-i18n="[html]modal.communityScreenshots.fields.sortOrder.values.likes"
            >{$LL.ui.modal.communityScreenshots.fields.sortOrder.values.likes()}</option
          >
        </select>
      </div>
      <div class="uiControl">
        <span></span>
        <select id="communityScreenshotsInterval" bind:value={selectedInterval} onchange={resetFeed}>
          <option value="day" data-i18n="[html]modal.communityScreenshots.fields.interval.values.day"
            >{$LL.ui.modal.communityScreenshots.fields.interval.values.day()}</option
          >
          <option value="week" data-i18n="[html]modal.communityScreenshots.fields.interval.values.week"
            >{$LL.ui.modal.communityScreenshots.fields.interval.values.week()}</option
          >
          <option value="month" data-i18n="[html]modal.communityScreenshots.fields.interval.values.month"
            >{$LL.ui.modal.communityScreenshots.fields.interval.values.month()}</option
          >
          <option value="year" data-i18n="[html]modal.communityScreenshots.fields.interval.values.year"
            >{$LL.ui.modal.communityScreenshots.fields.interval.values.year()}</option
          >
          <option value="" data-i18n="[html]modal.communityScreenshots.fields.interval.values.all"
            >{$LL.ui.modal.communityScreenshots.fields.interval.values.all()}</option
          >
        </select>
      </div>
    </div>
    <div class="infiniteScrollRefreshIndicator unselectable" class:transparent={!showRefreshIndicator}>
      <span class="infoLabel" data-i18n="[html]modal.communityScreenshots.scrollToRefresh"
        >{$LL.ui.modal.communityScreenshots.scrollToRefresh()}</span
      >
    </div>
  </div>
  <div
    class="modalContent infiniteScrollContainer itemContainer"
    class:end={!loading && screenshots.length === 0}
    bind:this={scrollContainer}
  >
    {#if loading && screenshots.length === 0}
      <div class="messageContainer themeText">Loading screenshots...</div>
    {:else if error}
      <div class="messageContainer themeText">{error}</div>
    {:else if screenshots.length === 0}
      <div class="messageContainer themeText">No screenshots found.</div>
    {:else}
      {#each screenshots as screenshot (screenshot.id)}
        <div class="screenshotItem imageItem item" class:spoiler={screenshot.spoiler}>
          <div class="screenshotThumbnailContainer imageThumbnailContainer">
            <img
              src="/connect/{gameId}/screenshots/{screenshot.owner.uuid}/{screenshot.id}.png"
              alt="Screenshot"
              class="screenshotThumbnail imageThumbnail unselectable"
            />
            <h3 class="spoilerLabel infoLabel unselectable" data-i18n="[html]screenshots.spoiler.label">Spoiler</h3>
          </div>

          <div class="screenshotControls imageControls">
            <div class="likeContainer">
              <button
                class="likeIcon icon iconButton toggleButton altToggleButton"
                class:fillIcon={screenshot.liked}
                aria-label={screenshot.liked ? 'Unlike' : 'Like'}
              >
                <svg viewBox="0 0 18 18" width="24" height="24">
                  <path
                    d="m16.65 2c-1.875-2.025-4.875-1.95-6.825 0.075l-0.825 0.975-0.825-0.975c-1.95-2.025-4.95-2.1-6.75-0.075h-0.075c-1.8 1.95-1.8 5.25 0.15 7.275l4.05 4.425 3.45 3.675 3.3-3.6 4.2-4.5c1.95-2.025 1.95-5.325 0.15-7.275z"
                  ></path>
                </svg>
              </button>
              <span class="infoLabel likeCount unselectable">{screenshot.likeCount}</span>
            </div>
          </div>

          {#if screenshot.mapId}
            <span class="screenshotLocation imageItemLocation infoText">{screenshot.mapId}</span>
          {/if}

          <span class="nameTextContainer infoText">{screenshot.owner.name}</span>
        </div>
      {/each}
      <!-- {#if pendingLoad}
        <div class="messageContainer themeText">Loading more screenshots...</div>
      {/if} -->
    {/if}
    <div class="js_sentinel" bind:this={sentinel}></div>
  </div>
</Modal>

<style>
  #communityScreenshotsControls {
    margin-top: 8px;
  }

  .nameTextContainer {
    display: block;
    padding-top: 4px;
    text-align: center;
  }

  .likeContainer {
    display: flex;
    align-items: center;
  }

  .likeCount {
    margin-inline-start: 8px;
    font-size: 1.2em;
  }

  .js_sentinel {
    width: 1px;
    height: 1px;
  }
</style>
