<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
  import VirtualList from '$lib/components/VirtualList.svelte';
  import ScheduleItem, { type Schedule } from '$lib/components/ScheduleItem.svelte';
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api';
  import { modal } from '$lib/stores/modal';

  type ScheduleSection = 'official' | 'ongoing' | 'party' | 'future';

  type ScheduleRow =
    | {
        kind: 'header';
        id: string;
        section: ScheduleSection;
        label: string;
      }
    | {
        kind: 'item';
        id: string;
        section: ScheduleSection;
        schedule: Schedule;
      };

  const ONGOING_SCHEDULES_THRESHOLD = 15 * 60 * 1000;
  // const YEAR = 366 * 24 * 60 * 60 * 1000;

  let schedules = $state<Schedule[]>([]);
  let loading = $state(false);
  // FIXME: Wire this to the migrated session/player source once available.
  let playerData = $state<any>(null);
  // let gameId = $state('');
  // FIXME: Wire this to the migrated party/session source once available.
  let joinedPartyId = $state<number | null>(null);
  // let joinedPartyCache = $state<any>(null);
  // gameId = init.gameId || '2kki';

  onMount(async () => {
    await loadSchedules();
  });

  async function loadSchedules() {
    loading = true;
    try {
      const data = await apiFetch<Schedule[]>('schedule?command=list');
      schedules = data || [];
      schedules.sort((a, z) => +z.official - +a.official || a.datetime.localeCompare(z.datetime));
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      loading = false;
    }
  }

  async function handleFollowSchedule(schedule: Schedule) {
    try {
      const newLikedState = !schedule.playerLiked;
      const data = await apiFetch<string>(`schedule?command=follow&value=${newLikedState}&scheduleId=${schedule.id}`);
      schedule.playerLiked = newLikedState;
      schedule.followerCount = Number.parseInt(data, 10);
      return Number.isFinite(schedule.followerCount) ? schedule.followerCount : null;
    } catch (err) {
      console.error('Failed to follow/unfollow schedule:', err);
      return null;
    }
  }

  function handleCreateSchedule() {
    modal.open('editEventModal', {
      schedule: {},
      playerData,
      joinedPartyId,
      joinedPartyCache: null,
      gameId: '2kki'
    });
  }

  function handleEditSchedule(schedule: Schedule) {
    modal.open('editEventModal', {
      schedule,
      playerData,
      joinedPartyId,
      joinedPartyCache: null,
      gameId: '2kki'
    });
  }

  function categorizeSchedules(scheds: Schedule[]) {
    const ongoing: Schedule[] = [];
    const party: Schedule[] = [];
    const official: Schedule[] = [];
    const future: Schedule[] = [];

    for (const schedule of scheds) {
      if (!schedule.partyId || schedule.partyId === joinedPartyId) {
        try {
          const parsedDatetime = new Date(schedule.datetime);
          if (+parsedDatetime - +new Date() <= ONGOING_SCHEDULES_THRESHOLD) {
            ongoing.push(schedule);
            continue;
          }
        } catch {}

        if (schedule.partyId && schedule.partyId === joinedPartyId) {
          party.push(schedule);
        } else if (schedule.official) {
          official.push(schedule);
        } else {
          future.push(schedule);
        }
      }
    }

    return { ongoing, party, official, future };
  }

  const categorized = $derived(categorizeSchedules(schedules));

  const scheduleRows = $derived.by<ScheduleRow[]>(() => {
    const rows: ScheduleRow[] = [];

    const sections: Array<{ key: ScheduleSection; label: string; items: Schedule[] }> = [
      { key: 'official', label: $LL.ui.modal.schedule.official(), items: categorized.official },
      { key: 'ongoing', label: $LL.ui.modal.schedule.ongoing(), items: categorized.ongoing },
      { key: 'party', label: $LL.ui.modal.schedule.party(), items: categorized.party },
      { key: 'future', label: $LL.ui.modal.schedule.future(), items: categorized.future }
    ];

    for (const section of sections) {
      if (!section.items.length) continue;
      rows.push({
        kind: 'header',
        id: `header-${section.key}`,
        section: section.key,
        label: section.label
      });

      for (const schedule of section.items) {
        rows.push({
          kind: 'item',
          id: `${section.key}-${schedule.id}`,
          section: section.key,
          schedule
        });
      }
    }

    return rows;
  });
</script>

<Modal aria-label="Schedules">
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.schedule.title()}</h1>
  </div>
  <div class="modalContent">
    {#if loading}
      <div class="messageContainer themeText">Loading schedules...</div>
    {:else}
      <VirtualList
        id="schedulesList"
        class="scrollableContainer schedulesList"
        items={scheduleRows}
        estimatedItemHeight={208}
        overscan={3}
      >
        {#snippet empty()}
          <div id="emptySchedules">{$LL.ui.modal.schedule.noResults()}</div>
        {/snippet}

        {#snippet row(row)}
          {#if row.kind === 'header'}
            <div class="scheduleVirtualRow scheduleVirtualHeaderRow" style="width:100%">
              <div class="messageContainer themeText scheduleGroupHeader">
                {row.label}
              </div>
            </div>
          {:else}
            <div class="scheduleVirtualRow scheduleVirtualItemRow scheduleContainer" style="width:100%">
              <ScheduleItem
                schedule={row.schedule}
                {playerData}
                {joinedPartyId}
                onFollow={handleFollowSchedule}
                onEdit={handleEditSchedule}
              />
            </div>
          {/if}
        {/snippet}
      </VirtualList>
    {/if}
  </div>
  <div class="modalFooter">
    <button
      type="button"
      class="unselectable"
      onclick={handleCreateSchedule}
      data-i18n="[html]modal.schedule.doSchedule"
    >
      Schedule an Event
    </button>
  </div>
</Modal>

<style>
  :global(.schedulesList) {
    width: 100%;
    max-height: min(70vh, 52rem);
  }

  :global(.scheduleVirtualRow) {
    display: flow-root;
    width: 100%;
    box-sizing: border-box;
  }

  :global(.scheduleVirtualHeaderRow) {
    padding-top: 8px;
    padding-bottom: 4px;
  }
</style>
