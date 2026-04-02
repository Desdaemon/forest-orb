<script lang="ts">
    import { onMount } from "svelte";
    import { modal } from "$lib/modalStore";
    import { selectedBadge } from "$lib/badgeStore";
    import { apiFetch } from "$lib/api";
    import ModalClose from "../ModalClose.svelte";

    type Badge = {
        badgeId: string;
        game: string;
        group?: string;
        bp?: number;
        percent?: number;
        unlocked?: boolean;
        secret?: boolean;
        hidden?: boolean;
    };

    let badges = $state<Badge[]>([]);
    let filteredBadges = $state<Badge[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let sortOrder = $state<"badgeId" | "bp" | "percent">("badgeId");
    let unlockFilter = $state<"all" | "unlocked" | "locked">("all");
    let searchTerm = $state("");
    let selectedGame = $state("all");
    let selectedGroup = $state("all");
    let games = $state<string[]>([]);
    let groupsByGame = $state<Record<string, string[]>>({});

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

    const unsubscribe = selectedBadge.subscribe((value) => {
        // just to keep reactivity in header. no need to store locally here.
    });

    onMount(async () => {
        let resizeObserver: ResizeObserver | null = null;

        try {
            loading = true;
            // If /badge.json exists in static, use it.
            const response = await fetch("/badge.json");
            if (!response.ok) throw new Error("badge meta not available");
            const data = (await response.json()) as Badge[];
            badges = data.filter((b) => !b.hidden);
            games = Array.from(
                new Set(badges.map((b) => b.game).filter(Boolean)),
            ).sort();
            const groupMap: Record<string, Set<string>> = {};
            for (const badge of badges) {
                const game = badge.game || "unknown";
                const group = badge.group || "ungrouped";
                groupMap[game] ??= new Set();
                if (group && group !== "null") groupMap[game].add(group);
            }
            groupsByGame = Object.fromEntries(
                Object.entries(groupMap).map(([game, set]) => [
                    game,
                    Array.from(set).sort(),
                ]),
            );
            updateFiltered();

            if (scrollContainer) {
                setContainerSize();
                resizeObserver = new ResizeObserver(setContainerSize);
                resizeObserver.observe(scrollContainer);
            }
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to load badges";
        } finally {
            loading = false;
        }

        return () => {
            resizeObserver?.disconnect();
        };
    });

    const currentGroups = $derived(
        selectedGame === "all"
            ? Array.from(new Set(Object.values(groupsByGame).flat())).sort()
            : (groupsByGame[selectedGame] ?? []),
    );

    function selectGame(game: string) {
        selectedGame = game;
        selectedGroup = "all";
        updateFiltered();
    }

    function selectGroup(group: string) {
        selectedGroup = group;
        updateFiltered();
    }

    function updateVirtualScroll() {
        const width = scrollContainer?.clientWidth || containerWidth || 800;
        columnCount = Math.max(1, Math.floor((width + 10) / 120));
        visibleRows = Math.max(1, Math.ceil(containerHeight / ITEM_HEIGHT));
        totalRows = Math.max(0, Math.ceil(filteredBadges.length / columnCount));
        totalHeight = totalRows * ITEM_HEIGHT;

        virtualStart = Math.max(
            0,
            Math.floor(scrollTop / ITEM_HEIGHT) -
                OVERSCAN_ROWS -
                EXTRA_OVERSCAN_ROW,
        );
        virtualEnd = Math.min(
            totalRows,
            virtualStart + visibleRows + OVERSCAN_ROWS * 2 + EXTRA_OVERSCAN_ROW,
        );

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
        if (sortOrder === "bp") return b.bp ?? 0;
        if (sortOrder === "percent") return b.percent ?? 0;
        return b.badgeId.toLowerCase();
    }

    function updateFiltered() {
        let list = [...badges];
        if (selectedGame !== "all")
            list = list.filter((b) => b.game === selectedGame);
        if (unlockFilter === "unlocked") list = list.filter((b) => b.unlocked);
        if (unlockFilter === "locked") list = list.filter((b) => !b.unlocked);
        if (selectedGroup !== "all")
            list = list.filter(
                (b) => (b.group ?? "ungrouped") === selectedGroup,
            );
        if (searchTerm.trim()) {
            const by = searchTerm.toLowerCase();
            list = list.filter(
                (b) =>
                    (b.badgeId ?? "").toLowerCase().includes(by) ||
                    (b.group ?? "").toLowerCase().includes(by) ||
                    (b.game ?? "").toLowerCase().includes(by),
            );
        }

        filteredBadges = list;
        updateVirtualScroll();

        list.sort((a, b) => {
            if (sortOrder === "badgeId")
                return (a.badgeId ?? "").localeCompare(b.badgeId ?? "");
            const aVal = getSortText(a) as number;
            const bVal = getSortText(b) as number;
            return bVal - aVal;
        });
        filteredBadges = list;
    }

    async function setBadge(badgeId: string) {
        try {
            await apiFetch(
                "/badge?command=set&id=" + encodeURIComponent(badgeId),
                { method: "POST" },
            );
            selectedBadge.set(badgeId);
            modal.close();
        } catch (err) {
            console.error("set badge failed", err);
            error = "Could not set badge";
        }
    }

    function getBadgeImage(badge: Badge) {
        if (badge.badgeId === "null") return "";
        return `images/badge/${badge.badgeId}.png`;
    }
</script>

<div
    class="modal fullscreenModal"
    role="dialog"
    aria-modal="true"
    aria-label="Badges"
>
    <ModalClose />
    <div class="modalHeader">
        <h1 class="modalTitle">Badge Gallery</h1>
        <div id="badgeControls" class="uiControls wrap">
            <div class="uiControl">
                <label for="badgeUnlockStatus" class="unselectable"
                    >Unlock Status:&nbsp;</label
                >
                <select
                    id="badgeUnlockStatus"
                    bind:value={unlockFilter}
                    onchange={updateFiltered}
                >
                    <option value="all">All</option>
                    <option value="unlocked">Unlocked</option>
                    <option value="locked">Locked</option>
                </select>
            </div>
            <div class="uiControl">
                <label for="badgeSortOrder" class="unselectable"
                    >Sort Order:&nbsp;</label
                >
                <select
                    id="badgeSortOrder"
                    bind:value={sortOrder}
                    onchange={updateFiltered}
                >
                    <option value="badgeId">Default</option>
                    <option value="bp">BP</option>
                    <option value="percent">Percent</option>
                </select>
            </div>
            <div class="uiControl">
                <label for="badgeSearch" class="unselectable"
                    >Search:&nbsp;</label
                >
                <input
                    id="badgeSearch"
                    type="text"
                    autocomplete="off"
                    placeholder="Name / group / game"
                    bind:value={searchTerm}
                    oninput={updateFiltered}
                />
            </div>
        </div>
    </div>

    <div id="badgeGameTabs" class="modalTabsContainer">
        <button
            type="button"
            class="modalTab"
            class:active={selectedGame === "all"}
            onclick={() => selectGame("all")}
        >
            <span class="modalTabLabel unselectable">All</span>
        </button>
        {#each games as game}
            <button
                type="button"
                class="modalTab"
                class:active={selectedGame === game}
                onclick={() => selectGame(game)}
            >
                <span class="modalTabLabel unselectable">{game}</span>
            </button>
        {/each}
    </div>

    <div id="badgeCategoryTabs" class="subTabs">
        <button
            class="subTab"
            class:active={selectedGroup === "all"}
            onclick={() => selectGroup("all")}
        >
            <small
                class="badgeCategoryTabLabel subTabLabel infoLabel unselectable"
                >All</small
            >
            <div class="subTabBg"></div>
        </button>
        {#each currentGroups as group (group)}
            <button
                class="subTab"
                class:active={selectedGroup === group}
                onclick={() => selectGroup(group)}
            >
                <small
                    class="badgeCategoryTabLabel subTabLabel infoLabel unselectable"
                    >{group}</small
                >
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
            <div
                class="badgeScrollArea"
                bind:this={scrollContainer}
                onscroll={onScroll}
            >
                <div
                    style="position: relative; width: 100%; height: {totalHeight}px;"
                >
                    <div
                        class="badgeVirtualGrid"
                        style="position: absolute; top: {topOffset}px; left: 0; right: 0; display: grid; grid-template-columns: repeat({columnCount}, minmax(110px, 1fr)); gap: 10px;"
                    >
                        {#each visibleBadges as badge (badge.badgeId)}
                            <button
                                type="button"
                                class="item badgeItem"
                                class:locked={!badge.unlocked}
                                class:selected={$selectedBadge ===
                                    badge.badgeId}
                                tabindex="0"
                                onclick={() =>
                                    badge.unlocked && setBadge(badge.badgeId)}
                                aria-label={badge.badgeId}
                            >
                                <div
                                    class="badgeContainer"
                                    class:special={badge.hidden}
                                >
                                    {#if badge.badgeId !== "null"}
                                        <img
                                            class="badgeImg"
                                            src={getBadgeImage(badge)}
                                            alt={badge.badgeId}
                                            width="74"
                                            height="74"
                                        />
                                    {:else}
                                        <div class="badgePlaceholder">None</div>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .modalContent.itemContainer.itemRowContainer {
        height: calc(100% - 120px);
        padding: 0;
        overflow: hidden;
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
    .modalContent.itemContainer.itemRowContainer .item {
        min-width: 110px;
        max-width: 120px;
        width: auto;
        margin: 6px;
        box-sizing: border-box;
    }
    .badgeItem {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
    }
    .badgeItem.locked {
        opacity: 0.45;
        cursor: not-allowed;
    }
    .badgeItem.selected .badgeContainer {
        border-color: white;
    }
    .badgeContainer {
        width: 98px;
        height: 98px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgb(var(--modal-base-bg-color));
        border: 2px solid transparent;
        border-radius: 4px;
        padding: 2px;
        box-sizing: border-box;
    }
    .badgeContainer.special {
        background-image: var(--modal-alt-gradient-b);
    }
    .badge {
        width: 74px;
        height: 74px;
        background-size: cover;
        background-position: center;
        margin-bottom: 4px;
    }
    .badgeImg {
        width: 74px;
        height: 74px;
        object-fit: contain;
        display: block;
    }
    .badgePlaceholder {
        width: 74px;
        height: 74px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.65);
        background: rgba(255, 255, 255, 0.06);
    }
    .badgeItem span,
    .badgeItem div:last-child {
        font-size: 11px;
        line-height: 1.1;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
