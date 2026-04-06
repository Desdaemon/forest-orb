<script lang="ts">
  import { LL } from '$lib';
  import { onMount, tick } from 'svelte';
  import { modal } from '$lib/stores/modal';
  import { selectedBadge } from '$lib/stores/badge';
  // import { apiFetch } from '$lib/api';
  import Modal from '$lib/components/Modal.svelte';
  import BadgeItem from '$lib/components/BadgeItem.svelte';

  type Badge = {
    badgeId: string;
    game: string;
    group?: string;
    mapId?: number | string;
    mapX?: number;
    mapY?: number;
    art?: string;
    tags?: string[];
    bp?: number;
    percent?: number;
    unlocked?: boolean;
    secret?: boolean;
    hidden?: boolean;
  };

  let filteredBadges = $state<Badge[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let sortOrder = $state<'badgeId' | 'bp' | 'percent'>('badgeId');
  let unlockFilter = $state<'all' | 'unlocked' | 'locked'>('all');
  let searchMode = $state<'name' | 'location' | 'artist'>('name');
  let searchTerm = $state('');
  let showSearchOptions = $state(false);
  let selectedGame = $state('all');
  let selectedGroup = $state('all');
  let games = $state<string[]>([]);
  let groupsByGame = $state<Record<string, string[]>>({});
  let hideSearchOptionsTimer: ReturnType<typeof setTimeout> | null = null;

  // Virtual scroll state
  let scrollContainer = $state<HTMLElement | null>(null);
  let containerHeight = $state(0);
  let containerWidth = $state(0);
  let scrollTop = $state(0);

  const ITEM_HEIGHT = 150;
  const OVERSCAN_ROWS = 2;
  const EXTRA_OVERSCAN_ROW = 1;

  let columnCount = $state(4);
  let totalRows = $state(0);
  let totalHeight = $state(0);
  let virtualStart = $state(0);
  let virtualEnd = $state(0);
  let startIndex = $state(0);
  let endIndex = $state(0);
  let topOffset = $state(0);
  let visibleRows = $state(0);
  let visibleBadges = $state<Badge[]>([]);

  async function fetchBadges(): Promise<Badge[]> {
    try {
      loading = true;
      const response = await fetch('/badge.json');
      if (!response.ok) throw new Error('badge meta not available');
      const data = (await response.json()) as Badge[];
      return data.filter((b) => !b.hidden);
    } catch (err) {
      console.error('Failed to load badges', err);
      return [];
    } finally {
      loading = false;
    }
  }

  let badgesPromise = $state(fetchBadges());
  const badges = $derived(await badgesPromise);

  const unsubscribe = selectedBadge.subscribe((value) => {
    // just to keep reactivity in header. no need to store locally here.
  });

  onMount(() => {
    try {
      // If /badge.json exists in static, use it.
      // const response = await fetch('/badge.json');
      // if (!response.ok) throw new Error('badge meta not available');
      // const data = (await response.json()) as Badge[];
      // badges = data.filter((b) => !b.hidden);
      games = Array.from(new Set(badges.map((b) => b.game).filter(Boolean))).sort();
      const groupMap: Record<string, Set<string>> = {};
      for (const badge of badges) {
        const game = badge.game || 'unknown';
        const group = badge.group || 'ungrouped';
        groupMap[game] ??= new Set();
        if (group && group !== 'null') groupMap[game].add(group);
      }
      groupsByGame = Object.fromEntries(Object.entries(groupMap).map(([game, set]) => [game, Array.from(set).sort()]));
      updateFiltered();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load badges';
    }
  });

  $effect(() => {
    if (!scrollContainer) return;

    let cancelled = false;
    const element = scrollContainer;
    const resizeObserver = new ResizeObserver(() => {
      if (!cancelled) setContainerSize();
    });

    resizeObserver.observe(element);

    void tick().then(() => {
      if (!cancelled) setContainerSize();
    });

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  });

  const currentGroups = $derived(
    selectedGame === 'all'
      ? Array.from(new Set(Object.values(groupsByGame).flat())).sort()
      : (groupsByGame[selectedGame] ?? [])
  );

  const normalizedSearchTerm = $derived.by(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return { exactMatch: false, value: '' };
    if (trimmed.startsWith('=')) {
      return {
        exactMatch: true,
        value: trimmed.slice(1).trim()
      };
    }
    return { exactMatch: false, value: trimmed };
  });

  const searchPreview = $derived(normalizedSearchTerm.value || searchTerm.trim());

  function selectGame(game: string) {
    selectedGame = game;
    selectedGroup = 'all';
    updateFiltered();
  }

  function selectGroup(group: string) {
    selectedGroup = group;
    updateFiltered();
  }

  function getBadgeLocationTerms(badge: Badge): string[] {
    if (badge.mapId === undefined || badge.mapId === null || badge.mapId === '') return [];

    const mapId = String(badge.mapId).toLowerCase();
    const x = badge.mapX ?? 0;
    const y = badge.mapY ?? 0;

    return [mapId, `${mapId}:${x}:${y}`, `${mapId},${x},${y}`, `${mapId} ${x} ${y}`, `${x},${y}`, `${x} ${y}`];
  }

  function getBadgeSearchTerms(badge: Badge, mode: 'name' | 'location' | 'artist'): string[] {
    switch (mode) {
      case 'artist':
        return badge.art ? [badge.art.toLowerCase()] : [];
      case 'location':
        return getBadgeLocationTerms(badge);
      case 'name':
      default:
        return [badge.badgeId, badge.group, badge.game, ...(badge.tags ?? [])]
          .filter((value): value is string => !!value)
          .map((value) => value.toLowerCase());
    }
  }

  function matchesSearchTerm(badge: Badge) {
    if (!normalizedSearchTerm.value) return true;

    const searchTerms = getBadgeSearchTerms(badge, searchMode);
    if (!searchTerms.length) return false;

    if (normalizedSearchTerm.exactMatch) {
      return searchTerms.some((term) => term === normalizedSearchTerm.value);
    }

    return searchTerms.some((term) => term.includes(normalizedSearchTerm.value));
  }

  function onSearchFocus() {
    if (hideSearchOptionsTimer) {
      clearTimeout(hideSearchOptionsTimer);
      hideSearchOptionsTimer = null;
    }
    showSearchOptions = !!searchTerm.trim();
  }

  function onSearchBlur() {
    hideSearchOptionsTimer = setTimeout(() => {
      showSearchOptions = false;
      hideSearchOptionsTimer = null;
    }, 80);
  }

  function applySearchMode(mode: 'name' | 'location' | 'artist') {
    searchMode = mode;
    showSearchOptions = false;
    updateFiltered();
  }

  function clearSearch() {
    searchTerm = '';
    showSearchOptions = false;
    updateFiltered();
  }

  function getSearchModeLabel(mode: 'name' | 'location' | 'artist') {
    if (mode === 'location') return $LL.ui.modal.badges.fields.search.location();
    if (mode === 'artist') return 'Artist';
    return $LL.ui.modal.badges.fields.search.name();
  }

  function updateVirtualScroll() {
    const width = scrollContainer?.clientWidth || containerWidth || 800;
    columnCount = Math.max(1, Math.floor((width + 10) / 120));
    visibleRows = Math.max(1, Math.ceil(containerHeight / ITEM_HEIGHT));
    totalRows = Math.max(0, Math.ceil(filteredBadges.length / columnCount));
    totalHeight = totalRows * ITEM_HEIGHT;

    virtualStart = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN_ROWS - EXTRA_OVERSCAN_ROW);
    virtualEnd = Math.min(totalRows, virtualStart + visibleRows + OVERSCAN_ROWS * 2 + EXTRA_OVERSCAN_ROW);

    startIndex = virtualStart * columnCount;
    endIndex = Math.min(filteredBadges.length, virtualEnd * columnCount);
    topOffset = virtualStart * ITEM_HEIGHT;

    visibleBadges = filteredBadges.slice(startIndex, endIndex);
  }

  function setContainerSize() {
    if (!scrollContainer) return;
    const rect = scrollContainer.getBoundingClientRect();
    containerHeight = rect.height;
    containerWidth = rect.width;
    updateVirtualScroll();
  }

  function onScroll(event: Event) {
    scrollTop = (event.currentTarget as HTMLElement).scrollTop;
    updateVirtualScroll();
  }

  function getSortText(b: Badge) {
    if (sortOrder === 'bp') return b.bp ?? 0;
    if (sortOrder === 'percent') return b.percent ?? 0;
    return b.badgeId.toLowerCase();
  }

  function updateFiltered() {
    let list = [...badges];
    if (selectedGame !== 'all') list = list.filter((b) => b.game === selectedGame);
    if (unlockFilter === 'unlocked') list = list.filter((b) => b.unlocked);
    if (unlockFilter === 'locked') list = list.filter((b) => !b.unlocked);
    if (selectedGroup !== 'all') list = list.filter((b) => (b.group ?? 'ungrouped') === selectedGroup);
    list = list.filter(matchesSearchTerm);

    list.sort((a, b) => {
      if (sortOrder === 'badgeId') return (a.badgeId ?? '').localeCompare(b.badgeId ?? '');
      const aVal = getSortText(a) as number;
      const bVal = getSortText(b) as number;
      return bVal - aVal;
    });

    scrollTop = 0;
    if (scrollContainer) scrollContainer.scrollTop = 0;

    filteredBadges = list;
    updateVirtualScroll();
  }

  async function setBadge(badge: Badge) {
    try {
      // await apiFetch('/badge?command=set&id=' + encodeURIComponent(badgeId), { method: 'POST' });
      selectedBadge.set(badge);
      modal.close();
    } catch (err) {
      console.error('set badge failed', err);
      error = 'Could not set badge';
    }
  }
</script>

<Modal aria-label="Badges" fullscreen>
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.badges.title()}</h1>
    <div id="badgeControls" class="uiControls wrap">
      <div class="uiControl">
        <label for="badgeUnlockStatus" class="unselectable"
          >{@html $LL.ui.modal.badges.fields.unlockStatus.label()}</label
        >
        <select id="badgeUnlockStatus" bind:value={unlockFilter} onchange={updateFiltered}>
          <option value="all">{$LL.ui.modal.badges.fields.unlockStatus.values.all()}</option>
          <option value="unlocked">{$LL.ui.modal.badges.fields.unlockStatus.values['1']()}</option>
          <option value="locked">{$LL.ui.modal.badges.fields.unlockStatus.values['0']()}</option>
        </select>
      </div>
      <div class="uiControl">
        <label for="badgeSortOrder" class="unselectable">{@html $LL.ui.modal.badges.fields.sortOrder.label()}</label>
        <select id="badgeSortOrder" bind:value={sortOrder} onchange={updateFiltered}>
          <option value="badgeId">{$LL.ui.modal.badges.fields.sortOrder.values.default()}</option>
          <option value="bp">BP</option>
          <option value="percent">Percent</option>
        </select>
      </div>
      <div class="uiControl badgeSearchRow">
        <label for="badgeSearch" class="unselectable">{@html $LL.ui.modal.badges.fields.search.label()}</label>
        <div class="badgeSearchControl">
          <input
            id="badgeSearch"
            class:activeSearch={!!normalizedSearchTerm.value}
            type="text"
            autocomplete="off"
            placeholder={searchMode === 'location'
              ? 'Map / coordinates'
              : searchMode === 'artist'
                ? 'Artist'
                : 'Badge ID / tag'}
            bind:value={searchTerm}
            onfocus={onSearchFocus}
            onblur={onSearchBlur}
            oninput={() => {
              showSearchOptions = !!searchTerm.trim();
              updateFiltered();
            }}
          />
          {#if searchTerm.trim()}
            <button type="button" class="badgeSearchClear" aria-label="Clear search" onclick={clearSearch}>✖</button>
          {/if}
          {#if showSearchOptions && searchTerm.trim()}
            <div class="badgeSearchDropdown">
              {#each ['name', 'location', 'artist'] as mode}
                <button
                  type="button"
                  class="badgeSearchOption"
                  class:active={searchMode === mode}
                  onmousedown={(event) => event.preventDefault()}
                  onclick={() => applySearchMode(mode as 'name' | 'location' | 'artist')}
                >
                  <span class="badgeSearchOptionLabel"
                    ><em>{getSearchModeLabel(mode as 'name' | 'location' | 'artist')}:</em> {searchPreview}</span
                  >
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div id="badgeGameTabs" class="modalTabsContainer">
    <button type="button" class="modalTab" class:active={selectedGame === 'all'} onclick={() => selectGame('all')}>
      <span class="modalTabLabel unselectable">All</span>
    </button>
    {#each games as game}
      <button type="button" class="modalTab" class:active={selectedGame === game} onclick={() => selectGame(game)}>
        <span class="modalTabLabel unselectable">{game}</span>
      </button>
    {/each}
  </div>

  <div id="badgeCategoryTabs" class="subTabs">
    <button type="button" class="subTab" class:active={selectedGroup === 'all'} onclick={() => selectGroup('all')}>
      <small class="badgeCategoryTabLabel subTabLabel infoLabel unselectable">All</small>
      <div class="subTabBg"></div>
    </button>
    {#each currentGroups as group (group)}
      <button type="button" class="subTab" class:active={selectedGroup === group} onclick={() => selectGroup(group)}>
        <small class="badgeCategoryTabLabel subTabLabel infoLabel unselectable">{group}</small>
        <div class="subTabBg"></div>
      </button>
    {/each}
  </div>

  <div class="modalContent itemContainer itemRowContainer">
    {#if loading}
      <p>Loading badges...</p>
    {:else if error}
      <p>Error: {error}</p>
    {:else if !filteredBadges.length}
      <p>No badges found.</p>
    {:else}
      <div class="badgeScrollArea" bind:this={scrollContainer} onscroll={onScroll}>
        <div style="position: relative; width: 100%; height: {totalHeight}px;">
          <div
            class="badgeVirtualGrid"
            role="list"
            style="position: absolute; top: {topOffset}px; left: 0; right: 0; display: grid; grid-template-columns: repeat({columnCount}, minmax(110px, 1fr)); gap: 10px;"
          >
            {#each visibleBadges as badge (badge.badgeId)}
              <BadgeItem
                {badge}
                lockedIcon={true}
                scaled={true}
                selected={$selectedBadge === badge.badgeId}
                onclick={() => badge.unlocked && setBadge(badge)}
              />
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
</Modal>

<style>
  .modalContent.itemContainer.itemRowContainer {
    flex: 1 1 auto;
    min-height: 0;
    height: auto;
    padding: 0;
    overflow: hidden;
  }

  #badgeControls {
    display: grid;
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    justify-content: center;
    align-items: end;
    column-gap: 28px;
    row-gap: 10px;
    max-width: 860px;
    margin: 0 auto;
  }

  #badgeControls > .uiControl {
    min-width: 0;
  }

  #badgeControls .badgeSearchRow {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  #badgeControls .badgeSearchRow > label {
    margin: 0;
    white-space: nowrap;
  }

  .badgeSearchControl {
    position: relative;
    width: min(540px, calc(100vw - 280px));
    min-width: 0;
    max-width: 100%;
  }

  @media (max-width: 900px) {
    #badgeControls {
      grid-template-columns: minmax(0, 1fr);
      row-gap: 8px;
    }

    #badgeControls .badgeSearchRow {
      justify-content: flex-start;
      gap: 8px;
    }

    .badgeSearchControl {
      width: 100%;
    }
  }

  .badgeSearchControl input {
    width: 100%;
    padding-right: 34px;
    box-sizing: border-box;
  }

  .badgeSearchControl input.activeSearch {
    outline: 1px solid rgba(255, 255, 255, 0.8);
    outline-offset: 1px;
  }

  .badgeSearchClear {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    font-size: 12px;
    line-height: 1;
    opacity: 0.8;
  }

  .badgeSearchClear:hover {
    opacity: 1;
  }

  .badgeSearchDropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 3;
    min-width: 320px;
    max-width: 100%;
    overflow: hidden;
    background: rgb(var(--modal-base-bg-color));
    border: 8px solid transparent;
    border-image: var(--modal-border-image-url) 8 repeat;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.22);
  }

  .badgeSearchOption {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    background: transparent;
    text-align: left;
  }

  .badgeSearchOption:first-child {
    border-top: 0;
  }

  .badgeSearchOption.active,
  .badgeSearchOption:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .badgeSearchOptionLabel {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #badgeGameTabs {
    margin-top: 8px;
  }

  #badgeCategoryTabs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    row-gap: 4px;
    margin: 4px 0 8px;
  }

  #badgeCategoryTabs .subTab {
    position: relative;
    padding: 2px 2px 0 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    appearance: none;
  }

  #badgeCategoryTabs .subTabLabel {
    position: relative;
    z-index: 1;
    display: block;
    padding: 0 8px;
  }

  #badgeCategoryTabs .subTabBg {
    position: absolute;
    inset: 0;
    top: auto;
    border-radius: 4px 4px 0 0;
    opacity: 0;
    z-index: 0;
  }

  #badgeCategoryTabs .subTab:hover .subTabBg {
    opacity: 0.1;
  }

  #badgeCategoryTabs .subTab.active .subTabBg {
    opacity: 0.25;
  }

  .badgeScrollArea {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 10px;
    box-sizing: border-box;
  }

  .badgeVirtualGrid {
    display: grid;
    grid-auto-rows: minmax(130px, auto);
    justify-items: center;
    align-items: start;
    gap: 10px;
  }

  /* Keep lock glyph visible above dimmed badge art in modal virtual grid. */
  .badgeVirtualGrid :global(.badgeItem.locked > .badgeContainer > .lockedIcon) {
    mix-blend-mode: normal;
  }

  .badgeVirtualGrid :global(.badgeItem.locked > .badgeContainer > .lockedIcon > svg) {
    opacity: 1 !important;
  }
</style>
