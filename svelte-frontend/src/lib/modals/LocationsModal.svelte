<script lang="ts">
  import { LL } from '$lib';
  import { apiFetch } from '$lib/api';
  import Modal from '$lib/components/Modal.svelte';
  import VirtualList from 'svelte-tiny-virtual-list';
  import { onMount } from 'svelte';

  type LocationsVisitedFilter = '' | 'visited' | 'unvisited';
  type LocationsSortOrder = 'newest' | 'oldest' | 'shallowest' | 'deepest' | 'alpha' | 'players';

  type LocationEntry = {
    id: number | string;
    title?: string;
    titleJP?: string;
    primaryAuthor?: string;
    locationImage?: string;
    versionAdded?: string;
    versionsUpdated?: string[];
    depth?: number;
    minDepth?: number;
    secret?: boolean;
    playerCount?: number;
    visited?: boolean;
  };

  let loading = $state(false);
  let loadError = $state('');
  let locations = $state<LocationEntry[]>([]);

  let visitedFilter = $state<LocationsVisitedFilter>('');
  let sortOrder = $state<LocationsSortOrder>('newest');
  let searchText = $state('');
  let searchByName = $state(true);
  let searchByAuthor = $state(false);

  const visitedLocationIds = $derived.by(() => {
    if (typeof window === 'undefined') return new Set<string>();
    const globalValue = (window as any).visitedLocationIds;
    if (!Array.isArray(globalValue)) return new Set<string>();
    return new Set(globalValue.map((value) => String(value)));
  });

  function compareVersionNames(v1: string, v2: string) {
    const v1Parts = v1.split('.');
    const v2Parts = v2.split('.');
    const maxLen = Math.max(v1Parts.length, v2Parts.length);
    for (let i = 0; i < maxLen; i += 1) {
      const a = Number.parseInt(v1Parts[i] ?? '0', 10);
      const b = Number.parseInt(v2Parts[i] ?? '0', 10);
      if (a < b) return -1;
      if (a > b) return 1;
    }
    return 0;
  }

  function getVersionOrderMap(items: LocationEntry[]): Map<string, number> {
    const versions = Array.from(
      new Set(items.map((item) => item.versionAdded).filter((value): value is string => !!value))
    ).sort((a, b) => compareVersionNames(b, a));
    return new Map(versions.map((version, idx) => [version, idx]));
  }

  function isVisited(location: LocationEntry): boolean {
    return !!location.visited || visitedLocationIds.has(String(location.id));
  }

  function getThumbnailUrl(location: LocationEntry): string {
    const imagePath = location.locationImage;
    if (!imagePath) return '/images/unknown_location.png';
    if (!isVisited(location)) return '/images/unknown_location.png';

    const fileName = imagePath.slice(imagePath.lastIndexOf('/') + 1);
    return `${imagePath.replace('images/', 'images/thumb/')}/240px-${fileName}`;
  }

  function getDisplayName(location: LocationEntry): string {
    return location.title || location.titleJP || String(location.id);
  }

  function getLastUpdatedVersion(location: LocationEntry): string | null {
    const last = location.versionsUpdated?.at(-1);
    if (!last) return null;
    const dashIndex = last.indexOf('-');
    return dashIndex > -1 ? last.slice(0, dashIndex) : last;
  }

  const filteredLocations = $derived.by(() => {
    const search = searchText.trim().toLowerCase();
    const versionOrderMap = getVersionOrderMap(locations);

    const result = locations
      .filter((location) => !!location.locationImage)
      .filter((location) => !location.secret || isVisited(location))
      .filter((location) => {
        if (!visitedFilter) return true;
        const visited = isVisited(location);
        return visitedFilter === 'visited' ? visited : !visited;
      })
      .filter((location) => {
        if (!search) return true;
        const name = getDisplayName(location).toLowerCase();
        const author = (location.primaryAuthor || '').toLowerCase();
        const nameMatch = searchByName && name.includes(search);
        const authorMatch = searchByAuthor && author.includes(search);
        return nameMatch || authorMatch;
      });

    result.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return (
            (versionOrderMap.get(a.versionAdded || '') ?? Number.MAX_SAFE_INTEGER) -
            (versionOrderMap.get(b.versionAdded || '') ?? Number.MAX_SAFE_INTEGER)
          );
        case 'newest':
          return (
            (versionOrderMap.get(b.versionAdded || '') ?? Number.MAX_SAFE_INTEGER) -
            (versionOrderMap.get(a.versionAdded || '') ?? Number.MAX_SAFE_INTEGER)
          );
        case 'shallowest': {
          const depthA = a.depth ?? Number.MAX_SAFE_INTEGER;
          const depthB = b.depth ?? Number.MAX_SAFE_INTEGER;
          if (depthA !== depthB) return depthA - depthB;
          return (a.minDepth ?? Number.MAX_SAFE_INTEGER) - (b.minDepth ?? Number.MAX_SAFE_INTEGER);
        }
        case 'deepest': {
          const depthA = a.depth ?? Number.MIN_SAFE_INTEGER;
          const depthB = b.depth ?? Number.MIN_SAFE_INTEGER;
          if (depthA !== depthB) return depthB - depthA;
          return (b.minDepth ?? Number.MIN_SAFE_INTEGER) - (a.minDepth ?? Number.MIN_SAFE_INTEGER);
        }
        case 'alpha':
          return getDisplayName(a).localeCompare(getDisplayName(b));
        case 'players':
          return (b.playerCount ?? 0) - (a.playerCount ?? 0);
      }
    });

    return result;
  });

  $inspect(filteredLocations.length);

  onMount(async () => {
    loading = true;
    loadError = '';
    try {
      const data = await apiFetch<LocationEntry[]>('gamelocations');
      locations = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to load locations:', error);
      loadError = 'Failed to load locations.';
    } finally {
      loading = false;
    }
  });
</script>

<Modal id="locationsModal" aria-label="Locations" fullscreen>
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.locations.title()}</h1>
    <div id="locationsControls" class="uiControls wrap">
      <div class="uiControl">
        <span data-i18n="[html]modal.locations.fields.visited.label">Visited:</span>
        <select id="locationsVisited" bind:value={visitedFilter}>
          <option value="">{$LL.ui.modal.locations.fields.visited.values.all()}</option>
          <option value="visited">{$LL.ui.modal.locations.fields.visited.values.visited()}</option>
          <option value="unvisited">{$LL.ui.modal.locations.fields.visited.values.unvisited()}</option>
        </select>
      </div>
      <div class="uiControl">
        <span data-i18n="[html]modal.locations.fields.sortOrder.label">Sort by:</span>
        <select id="locationsSortOrder" bind:value={sortOrder}>
          <option value="newest">{$LL.ui.modal.locations.fields.sortOrder.values.newest()}</option>
          <option value="oldest">{$LL.ui.modal.locations.fields.sortOrder.values.oldest()}</option>
          <option value="shallowest">{$LL.ui.modal.locations.fields.sortOrder.values.shallowest()}</option>
          <option value="deepest">{$LL.ui.modal.locations.fields.sortOrder.values.deepest()}</option>
          <option value="alpha">{$LL.ui.modal.locations.fields.sortOrder.values.alpha()}</option>
          <option value="players">{$LL.ui.modal.locations.fields.sortOrder.values.players()}</option>
        </select>
      </div>
      <div class="uiControl locationsSearchControl">
        <span data-i18n="[html]modal.locations.fields.search.label">Search:</span>
        <input id="locationsFilterInput" type="text" bind:value={searchText} autocomplete="off" />
        <label for="locationsNameInput" class="locationsSearchToggle">
          <input id="locationsNameInput" type="checkbox" bind:checked={searchByName} />
          <span data-i18n="[html]modal.locations.fields.search.name">Location</span>
        </label>
        <label for="locationsAuthorInput" class="locationsSearchToggle">
          <input id="locationsAuthorInput" type="checkbox" bind:checked={searchByAuthor} />
          <span data-i18n="[html]modal.locations.fields.search.author">Author</span>
        </label>
      </div>
    </div>
  </div>
  <div class="modalContent itemContainer itemRowContainer">
    {#if loading}
      <div class="messageContainer themeText">Loading locations...</div>
    {:else if loadError}
      <div class="messageContainer themeText">{loadError}</div>
    {:else if !filteredLocations.length}
      <div class="messageContainer themeText">No locations found.</div>
    {:else}
      <VirtualList
        itemCount={filteredLocations.length}
        itemSize={300}
        height={200}
      >
        <div slot="item" let:index>
          {#key index}
            <div
              class="locationItem imageItem item"
              data-location-id={filteredLocations[index].id}
              class:spoiler={!isVisited(filteredLocations[index])}
              aria-label={getDisplayName(filteredLocations[index])}
            >
              <div class="locationThumbnailContainer imageThumbnailContainer">
                <img
                  class="locationThumbnail imageThumbnail unselectable"
                  src={getThumbnailUrl(filteredLocations[index])}
                  alt={getDisplayName(filteredLocations[index])}
                />
              </div>
              <div class="locationControls imageControls" data-location-id={filteredLocations[index].id}>
                <div class="depthCountContainer imageCountContainer">
                  <span class="imageCount unselectable">{filteredLocations[index].depth ?? '-'}</span>
                </div>
                <div class="playerCountContainer imageCountContainer">
                  <span class="playerCount imageCount unselectable">{filteredLocations[index].playerCount ?? 0}</span>
                </div>
              </div>
              <div class="locationName imageItemLocation infoText">{getDisplayName(filteredLocations[index])}</div>
              {#if filteredLocations[index].primaryAuthor}
                <div class="locationAuthor infoText" data-i18n="[html]locations.author">
                  Author: <span class="unselectable">{filteredLocations[index].primaryAuthor}</span>
                </div>
              {/if}
              {#if filteredLocations[index].versionAdded}
                <div class="locationVersionAdded infoText" data-i18n="[html]locations.versionAdded">
                  Added: <span class="unselectable">{filteredLocations[index].versionAdded}</span>
                </div>
              {/if}
              {#if getLastUpdatedVersion(filteredLocations[index])}
                <div class="locationVersionUpdated infoText" data-i18n="[html]locations.versionUpdated">
                  Updated: <span class="unselectable">{getLastUpdatedVersion(filteredLocations[index])}</span>
                </div>
              {/if}
            </div>
          {/key}
        </div>
      </VirtualList>
    {/if}
  </div>
</Modal>

<style>
  #locationsControls {
    margin-top: 8px;
  }

  .locationsSearchControl {
    align-items: center;
    display: flex;
    gap: 8px;
    min-width: 300px;
  }

  #locationsFilterInput {
    max-width: 180px;
  }

  .locationsSearchToggle {
    align-items: center;
    display: inline-flex;
    gap: 4px;
    margin: 0;
  }

  .modalContent.itemContainer {
    overflow: hidden;
  }

  :global(.locationScrollArea) {
    height: 100%;
    overflow-y: auto;
  }

  :global(.locationScrollArea > div) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    padding: 12px;
  }

  .locationItem {
    break-inside: avoid;
  }

  .locationItem > .infoText {
    line-height: 1.3;
  }
</style>
