<script lang="ts">
  import { LL } from '$lib';
  import { onMount, onDestroy } from 'svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { activeSession } from '$lib/chatSession';
  import { getGameInitState } from '$lib/init';
  import { activateTheme, allGameUiThemes } from '$lib/stores/uiTheme';
  import { userConfig, globalConfig, setUserSetting } from '$lib/stores/config';
  import { get } from 'svelte/store';

  // Star SVG paths
  const STAR_PATH = 'm9 0.5 2 6.5h7l-5.5 4 2 6.5-5.5-4-5.5 4 2-6.5-5.5-4h7z';
  const STAR_HALF_PATH = 'm9 0.5v13l-5.5 4 2-6.5-5.5-4h7z';

  const eventExpRanks = [
    { exp: 40, badge: null },
    { exp: 100, badge: 'mono' },
    { exp: 250, badge: 'bronze' },
    { exp: 500, badge: 'silver' },
    { exp: 1000, badge: 'gold' },
    { exp: 2000, badge: 'platinum' },
    { exp: 0, badge: 'diamond' }
  ] as const;

  type ExpRankIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

  type EventLocation = {
    locationId: number;
    title: string;
    game?: string;
    type: number;
    depth: number;
    minDepth?: number;
    endDate: Date;
    exp: number;
    complete: boolean;
  };

  type EventVm = {
    id: number;
    game?: string;
    endDate: Date;
    exp: number;
    complete: boolean;
  };

  type EventPeriod = {
    periodOrdinal: number;
    endDate: Date;
  };

  type PlayerExp = {
    totalExp: number;
    weekExp: number;
  };

  const { gameId } = getGameInitState();

  let activeTab = $state<'locations' | 'vms'>('locations');
  let period = $state<EventPeriod | null>(null);
  let locationEvents = $state<EventLocation[]>([]);
  let vmEvents = $state<EventVm[]>([]);
  let playerExp = $state<PlayerExp | null>(null);

  const groupedLocationEvents = $derived.by(() => {
    const groups = new Map<number, EventLocation[]>();
    for (const event of locationEvents) {
      const list = groups.get(event.type);
      if (list) {
        list.push(event);
      } else {
        groups.set(event.type, [event]);
      }
    }
    return Array.from(groups.entries()).map(([type, events]) => ({ type, events }));
  });

  // Derived rank info
  const rankInfo = $derived.by(() => {
    if (!playerExp) return { rankIndex: 0 as ExpRankIndex, rankExp: 0, prevRankExp: 0 };
    let rankIndex = -1;
    let rankExp = 0;
    let prevRankExp = 0;
    for (let i = 0; i < eventExpRanks.length; i++) {
      const er = eventExpRanks[i];
      rankExp = Math.max(er.exp - prevRankExp, 0);
      if (playerExp.totalExp < er.exp) {
        rankIndex = i;
        break;
      }
      prevRankExp = er.exp;
    }
    if (rankIndex === -1) rankIndex = eventExpRanks.length - 1;
    return { rankIndex: rankIndex as ExpRankIndex, rankExp, prevRankExp };
  });

  const currentRankBadge = $derived(eventExpRanks[rankInfo.rankIndex].badge);
  const rankBarWidth = $derived(
    playerExp && rankInfo.rankExp > 0
      ? Math.min(((playerExp.totalExp - rankInfo.prevRankExp) / rankInfo.rankExp) * 100, 100)
      : 0
  );
  const weekBarWidth = $derived(playerExp ? Math.min((playerExp.weekExp / 50) * 100, 100) : 0);

  function formatDate(date: Date): string {
    const lang = get(globalConfig).lang ?? 'en';
    return date.toLocaleString(lang === 'en' ? [] : lang, { dateStyle: 'short', timeStyle: 'short' });
  }

  function getEndDateLabel(endDate: Date): string {
    return $LL.messages.events.availableUntilDate({ DATE: formatDate(endDate) }).replace(/\n/g, '<br>');
  }

  // Track location handling
  let trackedLocationId = $derived($userConfig.trackedLocationId);

  function toggleTrack(event: EventLocation) {
    const toggled = trackedLocationId !== event.locationId;
    const newId = toggled ? event.locationId : null;
    setUserSetting('trackedLocationId', newId as any);
    if (toggled) {
      $activeSession?.sendCommand('nl', [String(event.locationId)]);
    }
  }

  // Depth stars renderer (returns array of star data for template)
  function getDepthStars(depth: number, isMin = false): Array<{ fill: 'full' | 'half' | 'empty' }> {
    const stars: Array<{ fill: 'full' | 'half' | 'empty' }> = [];
    for (let d = 0; d < 10; d += 2) {
      if (!isMin && d >= depth) break;
      if (d + 1 < depth) {
        stars.push({ fill: 'full' });
      } else if (d < depth) {
        stars.push({ fill: 'half' });
      } else {
        stars.push({ fill: 'empty' });
      }
    }
    // For outline always 5 stars
    return stars;
  }

  function getOutlineStars(): Array<{ fill: 'empty' }> {
    return Array.from({ length: 5 }, () => ({ fill: 'empty' as const }));
  }

  const activatedThemeKeys = new Set<string>();

  function getDefaultThemeForGame(eventGameId?: string): string {
    if (!eventGameId) return '';
    const themesByGame = allGameUiThemes as unknown as Record<string, readonly string[]>;
    const themes = themesByGame[eventGameId] ?? [];
    return themes[0] ?? '';
  }

  function getEventThemeClass(eventGameId?: string): string {
    if (!eventGameId) return '';
    const theme = getDefaultThemeForGame(eventGameId);
    if (!theme) return '';
    const normalized = theme.replace(/[ ()]/g, '_');
    const prefix = eventGameId !== gameId ? `${eventGameId}___` : '';
    return `theme_${prefix}${normalized}`;
  }

  function ensureEventThemeActivated(eventGameId?: string): void {
    if (!eventGameId || eventGameId === gameId) return;
    const theme = getDefaultThemeForGame(eventGameId);
    if (!theme) return;
    const key = `${eventGameId}/${gameId}/${theme}`;
    if (activatedThemeKeys.has(key)) return;
    activatedThemeKeys.add(key);
    void activateTheme(theme, eventGameId, gameId).catch((err) => {
      console.warn('ExpeditionsModal: failed to activate event theme', theme, eventGameId, err);
      activatedThemeKeys.delete(key);
    });
  }

  $effect(() => {
    for (const event of locationEvents) {
      ensureEventThemeActivated(event.game ?? gameId);
    }
    for (const vm of vmEvents) {
      ensureEventThemeActivated(vm.game ?? gameId);
    }
  });

  // Session command setup
  let unsubSession: (() => void) | null = null;

  function setupSessionHandlers(session: typeof $activeSession) {
    if (!session) return;
    session.onCommand('ep', (args) => {
      const data = JSON.parse(args[0]);
      if (!data || data.periodOrdinal < 0) return;
      period = { periodOrdinal: data.periodOrdinal, endDate: new Date(data.endDate) };
      // Now fetch events
      session.sendCommand('e');
    });
    session.onCommand('e', (args) => {
      const data = JSON.parse(args[0]);
      console.log({ data });
      if (!data) return;
      if (data.locations) {
        locationEvents = data.locations.map((l: any) => ({
          ...l,
          endDate: new Date(l.endDate)
        }));
      }
      if (data.vms) {
        vmEvents = data.vms.map((v: any) => ({
          ...v,
          endDate: new Date(v.endDate)
        }));
      }
    });
    session.onCommand('eexp', (args) => {
      playerExp = JSON.parse(args[0]);
    });
    session.onCommand('eec', () => {
      session.sendCommand('e');
      session.sendCommand('eexp');
    });
    // Request initial data
    session.sendCommand('ep');
    session.sendCommand('eexp');
  }

  onMount(() => {
    unsubSession = activeSession.subscribe((session) => {
      if (session) setupSessionHandlers(session);
    });
  });

  onDestroy(() => {
    unsubSession?.();
  });
</script>

<Modal aria-label="Expeditions">
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.events.title()}</h1>
  </div>
  <div class="modalContent">
    {#if playerExp}
      <!-- Rank info -->
      <div id="expRankInfoContainer" class="modalInfoContainer">
        <span id="totalExp">{$LL.messages.events.exp({ POINTS: playerExp.totalExp })}</span>
        <div id="expRankContainer">
          <span id="expRank"
            >{$LL.messages.events.expRank({
              RANK: ($LL.messages.events.expRanks as any)[String(rankInfo.rankIndex)]()
            })}</span
          >
          {#if currentRankBadge}
            <img id="expRankBadge" class="badge" src="/images/badge/{currentRankBadge}.png" alt="" />
          {/if}
        </div>
      </div>

      <!-- Rank exp bar -->
      <div id="rankExpContainer">
        <span class="progressBarHeading">{$LL.ui.modal.events.rankExp()}</span>
        <div id="rankExpBarContainer" class="progressBarContainer">
          <span id="rankExpBarLabel" class="label progressBarLabel altText unselectable"></span>
          <div id="rankExpBar" class="progressBar" style="width: {rankBarWidth}%"></div>
        </div>
      </div>
    {/if}

    {#if period}
      <!-- Period info -->
      <div id="eventPeriodInfoContainer">
        <h3 id="eventPeriod">{$LL.messages.events.period({ ORDINAL: period.periodOrdinal })}</h3>
        <span id="eventPeriodEndDateLabel">{$LL.messages.events.periodEnds({ DATE: formatDate(period.endDate) })}</span>
      </div>
    {/if}

    {#if playerExp}
      <!-- Week exp bar -->
      <span class="progressBarHeading">{$LL.ui.modal.events.weekExp()}</span>
      <div id="weekExpBarContainer" class="progressBarContainer">
        <span id="weekExpBarLabel" class="label progressBarLabel altText unselectable"></span>
        <div id="weekExpBar" class="progressBar" style="width: {weekBarWidth}%"></div>
      </div>
    {/if}

    <!-- Tabs -->
    <div id="eventTabs" class="subTabs">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        id="eventTabLocations"
        class="eventTab subTab"
        class:active={activeTab === 'locations'}
        onclick={() => (activeTab = 'locations')}
      >
        <small class="subTabLabel infoLabel unselectable">{$LL.ui.modal.events.tabs.locations()}</small>
        <div class="subTabBg"></div>
      </div>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        id="eventTabVms"
        class="eventTab subTab"
        class:active={activeTab === 'vms'}
        onclick={() => (activeTab = 'vms')}
      >
        <small class="subTabLabel infoLabel unselectable">{$LL.ui.modal.events.tabs.vms()}</small>
        <div class="subTabBg"></div>
      </div>
    </div>

    <!-- Locations list -->
    <div id="eventLocationsList" class="eventList scrollableContainer" class:hidden={activeTab !== 'locations'}>
      {#each groupedLocationEvents as group (group.type)}
        {@const typeLabel = ($LL.messages.events.types as any)[String(group.type)]}
        <h3>{typeof typeLabel === 'function' ? typeLabel() : String(group.type)}</h3>
        {#each group.events as event (event.locationId)}
          {@const eventGameId = event.game ?? gameId}
          {@const eventThemeClass = getEventThemeClass(eventGameId)}
          <div
            class={['eventLocationListEntry eventListEntry listEntry', eventThemeClass]}
            class:complete={event.complete}
          >
            <div class="detailsContainer">
              {#if eventGameId !== gameId}
                <a class="gameLink" href="../{eventGameId}" target="_blank">
                  {$LL.messages.games[eventGameId as AllGames]()}
                </a>
              {/if}
              <div class="locationName">{event.title}</div>
              <!-- Depth outline stars -->
              <div class="depthContainer depthOutlineContainer">
                {#each getOutlineStars() as _}
                  <div class="starIcon icon">
                    <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                      <path d={STAR_PATH} />
                    </svg>
                  </div>
                {/each}
              </div>
              <!-- Depth fill stars -->
              <div class="depthContainer depthFillContainer" class:maxDepthFillContainer={!!event.minDepth}>
                {#each getDepthStars(event.depth) as star}
                  <div class="starIcon icon fillIcon">
                    <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                      {#if star.fill === 'full'}
                        <path d={STAR_PATH} />
                      {:else if star.fill === 'half'}
                        <path d={STAR_HALF_PATH} />
                      {/if}
                    </svg>
                  </div>
                {/each}
              </div>
              {#if event.minDepth}
                <!-- Min depth fill stars -->
                <div class="depthContainer depthFillContainer minDepthFillContainer">
                  {#each getDepthStars(event.minDepth, true) as star}
                    <div class="starIcon icon fillIcon">
                      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                        {#if star.fill === 'full'}
                          <path d={STAR_PATH} />
                        {:else if star.fill === 'half'}
                          <path d={STAR_HALF_PATH} />
                        {/if}
                      </svg>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            {#if gameId === eventGameId && eventGameId === '2kki' && !event.complete}
              <div class="eventLocationTrackContainer">
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button
                  class="eventLocationTrackButton icon iconButton fillIcon fadeToggleButton altToggleButton"
                  class:toggled={trackedLocationId === event.locationId}
                  onclick={() => toggleTrack(event)}
                  title={$LL.messages.events.toggleTracked()}
                >
                  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
                    <path
                      d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18m0 2a1 1 0 0 1 0 14 1 1 0 0 1 0-14m4 11-2-6-6-2 2 6 6 2m-4-5a1 1 0 0 1 0 2 1 1 0 0 1 0-2"
                    />
                  </svg>
                </button>
              </div>
            {/if}

            <div class="eventLocationEndDateContainer eventEndDateContainer">
              <div>
                <span class="nowrap">{@html getEndDateLabel(event.endDate)}</span>
              </div>
            </div>

            <span class="eventLocationPoints eventPoints infoLabel">
              {$LL.messages.events.exp({ POINTS: event.exp ?? 0 })}
            </span>

            <div class="checkbox" class:toggled={event.complete}><span></span></div>
          </div>
        {/each}
      {/each}
    </div>

    <!-- VMs list -->
    <div id="eventVmsList" class="eventList scrollableContainer" class:hidden={activeTab !== 'vms'}>
      {#each vmEvents as vm (vm.id)}
        {@const vmGameId = vm.game ?? gameId}
        {@const vmThemeClass = getEventThemeClass(vmGameId)}
        <div
          class={vmThemeClass
            ? `eventVmListEntry eventListEntry listEntry ${vmThemeClass}`
            : 'eventVmListEntry eventListEntry listEntry'}
          class:complete={vm.complete}
        >
          <div class="vmContainer">
            <img class="vmImage" src="/connect/{vmGameId}/api/vm?id={vm.id}" alt="" />
          </div>

          <div class="eventLocationEndDateContainer eventEndDateContainer">
            <div>
              <span class="nowrap">{@html getEndDateLabel(vm.endDate)}</span>
            </div>
          </div>

          <span class="eventLocationPoints eventPoints infoLabel">
            {$LL.messages.events.exp({ POINTS: vm.exp ?? 0 })}
          </span>

          <div class="checkbox" class:toggled={vm.complete}><span></span></div>
        </div>
      {/each}
    </div>
  </div>
</Modal>
