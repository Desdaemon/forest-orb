<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
  import PendingLoader from '$lib/components/PendingLoader.svelte';
  import { getGameInitState } from '$lib/init';
  import { locationResolver } from '$lib/locationResolver';
  import { getInfo } from '$lib/api';
  import { addLoader, loaderActive, removeLoader } from '$lib/stores/pendingLoader';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  type RankingSubCategory = {
    subCategoryId: string;
    pageCount: number;
  };

  type RankingCategory = {
    categoryId: string;
    queryCategoryId: string;
    subCategories: RankingSubCategory[];
  };

  type RankingRow = {
    position: number;
    name: string;
    systemName?: string | null;
    rank?: number;
    badge?: string | null;
    medals?: number[] | null;
    valueInt?: number;
    valueFloat?: number;
  };

  // const rankingsUrl = 'https://connect.ynoproject.net/rankings';
  const rankingsUrl = '/connect/rankings';
  const medalTypes = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const;

  let loading = $state(true);
  let loadingRows = $state(false);
  let error = $state<string | null>(null);

  let categories = $state<RankingCategory[]>([]);
  let rankings = $state<RankingRow[]>([]);

  let selectedCategoryId = $state('');
  let selectedSubCategoryId = $state('');
  let page = $state(1);
  let pageCount = $state(1);
  let currentPlayerName = $state('');
  let subCategoryLabels = $state<Record<string, string>>({});
  const rankingsModalLoading = loaderActive('rankingsModal');

  const { gameId } = getGameInitState();

  const selectedCategory = $derived.by(
    () => categories.find((category) => category.categoryId === selectedCategoryId) || null
  );

  const selectedSubCategory = $derived.by(() => {
    if (!selectedCategory) return null;
    return (
      selectedCategory.subCategories.find((subCategory) => subCategory.subCategoryId === selectedSubCategoryId) || null
    );
  });

  const valueHeader = $derived.by(() => {
    const category = selectedCategoryId;
    if (!category) return '';
    const valueLabel = ($LL.messages.rankings.categories as Record<string, any>)[category]?.valueLabel;
    return typeof valueLabel === 'function' ? valueLabel() : '';
  });

  function getCategoryLabel(categoryId: string) {
    const label = ($LL.messages.rankings.categories as Record<string, any>)[categoryId]?.label;
    if (typeof label === 'function') return label();
    return categoryId;
  }

  function getSubCategoryLabel(categoryId: string, subCategoryId: string) {
    const key = `${categoryId}:${subCategoryId}`;
    if (subCategoryLabels[key]) return subCategoryLabels[key];

    const subCategory = ($LL.messages.rankings.subCategories as Record<string, any>)[subCategoryId];
    if (typeof subCategory === 'function') return subCategory();

    if (Number.isFinite(Number(subCategoryId)) && categoryId !== 'timeTrial') {
      return $LL.messages.events.period({ ORDINAL: subCategoryId });
    }

    return subCategoryId;
  }

  function getValueTemplate(categoryId: string) {
    const value = ($LL.messages.rankings.categories as Record<string, any>)[categoryId]?.value;
    if (typeof value === 'function') return value();
    return '{NUMBER}';
  }

  function formatRankingValue(ranking: RankingRow, categoryId: string) {
    const template = getValueTemplate(categoryId);

    if (template.includes('{NUMBER}')) {
      return template.replace('{NUMBER}', String(ranking.valueInt ?? 0));
    }

    if (template.includes('{PERCENT}')) {
      const percent = Math.round((ranking.valueFloat ?? 0) * 10000) / 100;
      return template.replace('{PERCENT}', String(percent));
    }

    if (template.includes('{MINUTES}') || template.includes('{SECONDS}')) {
      const total = ranking.valueInt ?? 0;
      const minutes = Math.floor(total / 60);
      const seconds = total - minutes * 60;
      return template
        .replace('{MINUTES}', String(minutes).padStart(2, '0'))
        .replace('{SECONDS}', String(seconds).padStart(2, '0'));
    }

    return String(ranking.valueInt ?? 0);
  }

  function getMedalIcons(medals: number[] | null | undefined) {
    if (!Array.isArray(medals)) return [];

    const icons: string[] = [];
    for (let typeIndex = medalTypes.length - 1; typeIndex >= 0; typeIndex--) {
      const count = Number(medals[typeIndex] ?? 0);
      for (let i = 0; i < count; i++) {
        icons.unshift(`/images/medal_${medalTypes[typeIndex].toLowerCase()}.png`);
        if (icons.length >= 5) return icons;
      }
    }

    return icons;
  }

  function getPageWindow(currentPage: number, maxPage: number) {
    const start = Math.max(currentPage - 2, 1);
    const end = Math.min(start + 4, maxPage);
    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }

  async function rankingsApiFetch(path: string) {
    const response = await fetch(`${rankingsUrl}/${path}`, { credentials: 'include' });
    if (!response.ok) throw new Error(response.statusText);
    return response;
  }

  async function withRankingsLoader<T>(task: () => Promise<T>) {
    addLoader('rankingsModal');
    try {
      return await task();
    } finally {
      removeLoader('rankingsModal');
    }
  }

  async function resolveTimeTrialLabels(nextCategories: RankingCategory[]) {
    const nextLabels: Record<string, string> = {};

    for (const category of nextCategories) {
      if (category.categoryId !== 'timeTrial') continue;
      for (const subCategory of category.subCategories) {
        const rawId = subCategory.subCategoryId;
        if (!Number.isFinite(Number(rawId))) continue;

        try {
          const name = await locationResolver.resolveCurrentLocationName({
            gameId,
            mapId: String(rawId).padStart(4, '0'),
            prevMapId: '0000',
            x: 0,
            y: 0
          });
          if (name) {
            nextLabels[`${category.categoryId}:${subCategory.subCategoryId}`] = name;
          }
        } catch {
          // Best-effort labels; fallbacks are handled by getSubCategoryLabel.
        }
      }
    }

    subCategoryLabels = nextLabels;
  }

  function parseCategories(rawCategories: any[]): RankingCategory[] {
    const parsed: RankingCategory[] = [];

    for (const category of rawCategories) {
      const rawCategoryId = String(category?.categoryId ?? '');
      const subCategoriesRaw = Array.isArray(category?.subCategories) ? category.subCategories : [];
      if (!rawCategoryId || !subCategoriesRaw.length) continue;

      let categoryId = rawCategoryId;
      if (rawCategoryId.endsWith(`_${gameId}`)) {
        categoryId = rawCategoryId.slice(0, (gameId.length + 1) * -1);
      }

      const categoryLabel = ($LL.messages.rankings.categories as Record<string, any>)[categoryId]?.label;
      if (typeof categoryLabel !== 'function') continue;

      parsed.push({
        categoryId,
        queryCategoryId: rawCategoryId,
        subCategories: subCategoriesRaw.map((subCategory: any) => ({
          subCategoryId: String(subCategory?.subCategoryId ?? ''),
          pageCount: Math.max(1, Number(subCategory?.pageCount ?? 1))
        }))
      });
    }

    return parsed;
  }

  async function fetchAndPopulateRankingCategories() {
    loading = true;
    error = null;

    try {
      await withRankingsLoader(async () => {
        const response = await rankingsApiFetch(`categories?game=${gameId}`);
        const rawCategories = (await response.json()) as any[];
        const nextCategories = parseCategories(rawCategories);
        categories = nextCategories;

        if (!nextCategories.length) {
          selectedCategoryId = '';
          selectedSubCategoryId = '';
          rankings = [];
          return;
        }

        if (!nextCategories.find((category) => category.categoryId === selectedCategoryId)) {
          selectedCategoryId = nextCategories[0].categoryId;
        }

        const selected =
          nextCategories.find((category) => category.categoryId === selectedCategoryId) ?? nextCategories[0];
        if (!selected.subCategories.find((subCategory) => subCategory.subCategoryId === selectedSubCategoryId)) {
          selectedSubCategoryId = selected.subCategories[0]?.subCategoryId ?? '';
        }

        await resolveTimeTrialLabels(nextCategories);
        await fetchAndLoadRankings(selectedCategoryId, selectedSubCategoryId);
      });
    } catch (err) {
      console.error(err);
      error = 'Failed to load rankings categories';
    } finally {
      loading = false;
    }
  }

  async function fetchAndLoadRankings(categoryId: string, subCategoryId: string) {
    if (!categoryId || !subCategoryId) return;

    loadingRows = true;
    error = null;

    try {
      await withRankingsLoader(async () => {
        const selected = categories.find((category) => category.categoryId === categoryId);
        if (!selected) return;

        const pageResponse = await rankingsApiFetch(
          `page?category=${encodeURIComponent(selected.queryCategoryId)}&subCategory=${encodeURIComponent(subCategoryId)}`
        );
        const preferredPage = Math.max(1, Number.parseInt(await pageResponse.text(), 10) || 1);
        await fetchAndLoadRankingsPage(categoryId, subCategoryId, preferredPage);
      });
    } catch (err) {
      console.error(err);
      error = 'Failed to load rankings';
    } finally {
      loadingRows = false;
    }
  }

  async function fetchAndLoadRankingsPage(categoryId: string, subCategoryId: string, nextPage: number) {
    loadingRows = true;
    error = null;

    try {
      await withRankingsLoader(async () => {
        const selected = categories.find((category) => category.categoryId === categoryId);
        if (!selected) return;

        const response = await rankingsApiFetch(
          `list?game=${encodeURIComponent(gameId)}&category=${encodeURIComponent(selected.queryCategoryId)}&subCategory=${encodeURIComponent(subCategoryId)}&page=${nextPage}`
        );
        const nextRankings = (await response.json()) as RankingRow[];
        rankings = Array.isArray(nextRankings) ? nextRankings : [];

        selectedCategoryId = categoryId;
        selectedSubCategoryId = subCategoryId;
        page = Math.max(1, nextPage);

        const pageLimit = selected.subCategories.find(
          (subCategory) => subCategory.subCategoryId === subCategoryId
        )?.pageCount;
        pageCount = Math.max(1, Number(pageLimit ?? 1));
      });
    } catch (err) {
      console.error(err);
      error = 'Failed to load rankings list';
    } finally {
      loadingRows = false;
    }
  }

  async function handleSelectCategory(categoryId: string) {
    if (categoryId === selectedCategoryId) return;

    const category = categories.find((entry) => entry.categoryId === categoryId);
    const defaultSubCategoryId = category?.subCategories[0]?.subCategoryId ?? '';
    if (!defaultSubCategoryId) return;

    await fetchAndLoadRankings(categoryId, defaultSubCategoryId);
  }

  async function handleSelectSubCategory(subCategoryId: string) {
    if (!selectedCategoryId || subCategoryId === selectedSubCategoryId) return;
    await fetchAndLoadRankings(selectedCategoryId, subCategoryId);
  }

  onMount(async () => {
    try {
      const info = await getInfo();
      currentPlayerName = info?.name || '';
    } catch {
      currentPlayerName = '';
    }

    await fetchAndPopulateRankingCategories();
  });
</script>

<Modal aria-label="Rankings">
  <PendingLoader visible={$rankingsModalLoading} text="Loading rankings..." />
  <div class="modalHeader">
    <h1 class="modalTitle" data-i18n="[html]modal.rankings.title">{$LL.ui.modal.rankings.title()}</h1>
  </div>
  <div class="modalContent">
    {#if loading}
      <div class="messageContainer themeText">Loading rankings...</div>
    {:else if error}
      <div class="messageContainer themeText">{error}</div>
    {:else if !categories.length}
      <div class="messageContainer themeText">No rankings categories available.</div>
    {:else}
      <div id="rankingCategoryTabs" class="modalTabsContainer">
        {#each categories as category (category.categoryId)}
          <button
            type="button"
            class="rankingCategoryTab modalTab"
            class:active={selectedCategoryId === category.categoryId}
            onclick={() => handleSelectCategory(category.categoryId)}
          >
            <span class="rankingCategoryTabLabel modalTabLabel unselectable"
              >{getCategoryLabel(category.categoryId)}</span
            >
          </button>
        {/each}
      </div>

      <div id="rankingSubCategoryTabs" class="subTabs">
        {#if selectedCategory}
          {#each selectedCategory.subCategories as subCategory (subCategory.subCategoryId)}
            <button
              type="button"
              class="subTab"
              class:active={selectedSubCategoryId === subCategory.subCategoryId}
              onclick={() => handleSelectSubCategory(subCategory.subCategoryId)}
            >
              <small class="rankingSubCategoryTabLabel subTabLabel infoLabel unselectable">
                {getSubCategoryLabel(selectedCategory.categoryId, subCategory.subCategoryId)}
              </small>
              <div class="subTabBg"></div>
            </button>
          {/each}
        {/if}
      </div>

      <table id="rankingsTable">
        <thead>
          <tr>
            <th>#</th>
            <th data-i18n="[html]modal.rankings.player">{$LL.ui.modal.rankings.player()}</th>
            <th id="rankingValueHeader">{valueHeader}</th>
          </tr>
        </thead>
        <tbody id="rankings">
          {#if loadingRows && !rankings.length}
            <tr>
              <td colspan="3" class="themeText">Loading rankings...</td>
            </tr>
          {:else if !rankings.length}
            <tr>
              <td colspan="3" class="themeText">No rankings found.</td>
            </tr>
          {:else}
            {#each rankings as ranking (`${selectedCategoryId}:${selectedSubCategoryId}:${ranking.position}:${ranking.name}`)}
              {@const medalIcons = getMedalIcons(ranking.medals)}
              <tr class:highlight={!!currentPlayerName && ranking.name === currentPlayerName}>
                <td><span class="infoLabel">{ranking.position}</span></td>
                <td>
                  <div class="nameTextContainer">
                    <span class="nameMarker">[</span>
                    <span class="nameText">{ranking.name}</span>
                    <span class="nameMarker">]</span>
                  </div>
                  {#if ranking.badge && ranking.badge !== 'null'}
                    <div
                      class="badge nameBadge"
                      style="background-image: url('/images/badge/{ranking.badge}.png')"
                    ></div>
                  {/if}
                  {#if medalIcons.length}
                    <div class="medalsContainer" style="min-width: {Math.max(medalIcons.length << 3, 16)}px">
                      {#each medalIcons as medalUrl}
                        <img class="medal" src={medalUrl} alt="" loading="lazy" />
                      {/each}
                    </div>
                  {/if}
                </td>
                <td><span class="infoLabel">{formatRankingValue(ranking, selectedCategoryId)}</span></td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>

      <div id="rankingsPagination">
        {#if page > 1}
          <a
            class="rankingPageLink rankingPageSkipLink"
            href="/"
            onclick={(event) => {
              event.preventDefault();
              fetchAndLoadRankingsPage(selectedCategoryId, selectedSubCategoryId, 1);
            }}>◀◀</a
          >
          <a
            class="rankingPageLink"
            href="/"
            onclick={(event) => {
              event.preventDefault();
              fetchAndLoadRankingsPage(selectedCategoryId, selectedSubCategoryId, page - 1);
            }}>◀</a
          >
        {/if}

        {#each getPageWindow(page, pageCount) as pageNumber (pageNumber)}
          {#if pageNumber === page}
            <span class="rankingPageLink">{pageNumber}</span>
          {:else}
            <a
              class="rankingPageLink"
              href="/"
              onclick={(event) => {
                event.preventDefault();
                fetchAndLoadRankingsPage(selectedCategoryId, selectedSubCategoryId, pageNumber);
              }}>{pageNumber}</a
            >
          {/if}
        {/each}

        {#if page < pageCount}
          <a
            class="rankingPageLink"
            href="/"
            onclick={(event) => {
              event.preventDefault();
              fetchAndLoadRankingsPage(selectedCategoryId, selectedSubCategoryId, page + 1);
            }}>▶</a
          >
          <a
            class="rankingPageLink rankingPageSkipLink"
            href="/"
            onclick={(event) => {
              event.preventDefault();
              fetchAndLoadRankingsPage(selectedCategoryId, selectedSubCategoryId, pageCount);
            }}>▶▶</a
          >
        {/if}
      </div>
    {/if}
  </div>
</Modal>
