<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
  import { modal } from '$lib/stores/modal';
  import { apiFetch } from '$lib/api';

  export interface Schedule {
    id?: string;
    name: string;
    description: string;
    ownerUuid: string;
    partyId: number | null;
    game: string;
    recurring: boolean;
    official: boolean;
    interval: number;
    intervalType: 'days' | 'months' | 'years';
    datetime: string;
    systemName: string;
    followerCount: number;
    playerLiked: boolean;

    ownerName: string;
    ownerRank: number;
    ownerString: string;
    ownerSystemName: string;

    discord?: string;
    youtube?: string;
    twitch?: string;
    niconico?: string;
    openrec?: string;
    bilibili?: string;
  }

  interface Props {
    schedule?: Partial<Schedule>;
    playerData?: any;
    joinedPartyId?: number | null;
    joinedPartyCache?: any;
    gameId?: string;
  }

  const { schedule = {}, playerData, joinedPartyId, joinedPartyCache, gameId = '2kki' }: Props = $props();

  const isMod = $derived(playerData && playerData.rank > 0);
  const isOwner = $derived(schedule.ownerUuid && schedule.ownerUuid === playerData?.uuid);
  const canEdit = $derived(isMod || (isOwner && schedule.game === gameId));

  let editingScheduleId = $derived<string | undefined>(schedule.id);
  let name = $derived(schedule.name || '');
  let description = $derived(schedule.description || '');
  let datetime = $derived(schedule.datetime || '');
  let recurring = $derived(schedule.recurring || false);
  let interval = $derived(schedule.interval || 1);
  let intervalType = $derived<'days' | 'months' | 'years'>(schedule.intervalType || 'days');
  let restrictParty = $derived(schedule.partyId === joinedPartyId);
  let official = $derived(schedule.official || false);
  let resetOrganizer = $state(false);
  let theme = $derived(schedule.systemName || '');

  const platformAuthorities = Object.freeze({
    discord: 'discord.com',
    youtube: 'youtube.com',
    twitch: 'twitch.tv',
    niconico: 'nicovideo.jp',
    openrec: 'openrec.tv',
    bilibili: 'bilibili.com'
  });

  type Platform = keyof typeof platformAuthorities;

  let discord = $derived(schedule.discord || '');
  let youtube = $derived(schedule.youtube || '');
  let twitch = $derived(schedule.twitch || '');
  let niconico = $derived(schedule.niconico || '');
  let openrec = $derived(schedule.openrec || '');
  let bilibili = $derived(schedule.bilibili || '');

  const YEAR = 366 * 24 * 60 * 60 * 1000;

  function sanitizeLink(platform: Platform, link: string): string | null {
    try {
      let parsed = new URL(link, 'https://' + platformAuthorities[platform]);
      let parsedHostname = parsed.hostname.replace('www.', '');
      if (parsedHostname !== platformAuthorities[platform]) return null;

      parsed.hostname = platformAuthorities[platform];
      parsed.protocol = 'https:';
      return parsed.href;
    } catch (err) {
      console.warn(link, 'is not a valid link');
      return null;
    }
  }

  function formatDatetimeForInput(isoString: string): string {
    try {
      let parsed = new Date(isoString);
      parsed = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60 * 1000);
      return parsed.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  }

  function handleRecurringToggle() {
    recurring = !recurring;
  }

  function handlePartyRestrictionToggle() {
    restrictParty = !restrictParty;
  }

  function handleOfficialToggle() {
    official = !official;
  }

  function handleResetOrganizerToggle() {
    resetOrganizer = !resetOrganizer;
  }

  function openThemeModal() {
    modal.open(
      'uiThemesModal',
      {
        gameId,
        initialTheme: theme,
        onThemeSelected: (selectedTheme: string) => {
          theme = selectedTheme;
        }
      },
    );
  }

  function handlePlatformChange(platform: Platform, value: string): string | null {
    const sanitized = sanitizeLink(platform, value);
    if (sanitized !== null) {
      switch (platform) {
        case 'discord':
          discord = sanitized;
          break;
        case 'youtube':
          youtube = sanitized;
          break;
        case 'twitch':
          twitch = sanitized;
          break;
        case 'niconico':
          niconico = sanitized;
          break;
        case 'openrec':
          openrec = sanitized;
          break;
        case 'bilibili':
          bilibili = sanitized;
          break;
      }
      return null;
    }
    return $LL.messages.schedules.invalidPlatformLink();
  }

  async function handleSubmit() {
    if (!playerData?.account) return;

    const scheduleData: Record<string, any> = {
      name,
      description,
      datetime: new Date(datetime).toISOString(),
      recurring,
      systemName: theme,
      game: gameId,
      ownerUuid: playerData.uuid,
      discord,
      youtube,
      twitch,
      niconico,
      openrec,
      bilibili
    };

    if (editingScheduleId) {
      scheduleData.id = editingScheduleId;
      if (isMod && !resetOrganizer) {
        scheduleData.ownerUuid = '';
      }
    }

    if (joinedPartyCache?.ownerUuid && joinedPartyCache.ownerUuid === playerData?.uuid) {
      if (restrictParty) {
        scheduleData.partyId = joinedPartyId;
        scheduleData.systemName = joinedPartyCache.systemName;
      } else {
        delete scheduleData.partyId;
      }
    }

    if (recurring) {
      scheduleData.interval = interval;
      scheduleData.intervalType = intervalType;
    }

    if (isMod) {
      scheduleData.official = official;
    }

    try {
      const params = new URLSearchParams(scheduleData as any).toString();
      await apiFetch(`schedule?command=update&${params}`);
      modal.close();
      window.dispatchEvent(new CustomEvent('schedules-reloaded'));
    } catch (err) {
      console.error('Failed to save schedule:', err);
    }
  }

  async function handleCancel() {
    if (!editingScheduleId) {
      modal.close();
      return;
    }

    modal.confirm(
      $LL.messages.schedules.confirmCancel(),
      async () => {
        try {
          await apiFetch(`schedule?command=cancel&scheduleId=${editingScheduleId}`);
          modal.close();
          window.dispatchEvent(new CustomEvent('schedules-reloaded'));
        } catch (err) {
          console.error('Failed to cancel schedule:', err);
        }
      },
      modal.close
    );
  }

  // Set datetime input min/max
  $effect(() => {
    const datetimeInput = document.querySelector('input[name="datetime"]') as HTMLInputElement;
    if (datetimeInput) {
      const min = new Date();
      min.setHours(0, 0, 0, 0);
      const max = new Date(min.getTime() + YEAR);
      datetimeInput.setAttribute('min', min.toISOString().slice(0, 16));
      datetimeInput.setAttribute('max', max.toISOString().slice(0, 16));
    }
  });

  // Initialize datetime input value
  $effect(() => {
    const datetimeInput = document.querySelector('input[name="datetime"]') as HTMLInputElement;
    if (datetimeInput && schedule.datetime) {
      datetimeInput.value = formatDatetimeForInput(schedule.datetime);
    }
  });
</script>

<Modal id="editEventModal" aria-label={$LL.ui.modal.scheduleEdit.title()}>
  <form id="scheduleForm" onsubmit={handleSubmit}>
    <ul class="formControls" style="width:100%">
      <li class="formControlRow fullWidth">
        <div class="textareaContainer">
          <label for="name" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.name">Event Name</label>
          <input type="text" id="name" name="name" class="autoExpand" maxlength="255" required bind:value={name} />
        </div>
      </li>
      <li class="formControlRow fullWidth">
        <div class="textareaContainer">
          <label for="description" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.description"
            >Description</label
          >
          <textarea
            id="editScheduleDescription"
            name="description"
            class="autoExpand"
            maxlength="1000"
            data-i18n="[placeholder]placeholders.scheduleDescription"
            bind:value={description}
          ></textarea>
        </div>
      </li>
      <li class="formControlRow">
        <label for="datetime" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.datetime"
          >Event Date and Time</label
        >
        <div>
          <input name="datetime" type="datetime-local" id="datetime" required bind:value={datetime} />
        </div>
      </li>
      <li class="formControlRow">
        <label for="eventRecurring" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.recurring"
          >Recurring Event</label
        >
        <div>
          <button
            id="eventRecurring"
            class="checkboxButton unselectable"
            type="button"
            class:toggled={recurring}
            onclick={handleRecurringToggle}
          >
            <span></span>
          </button>
        </div>
      </li>
      <li id="eventInterval" class="formControlRow indent" class:hidden={!recurring}>
        <label for="interval" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.interval.title"
          >Interval</label
        >
        <div>
          <input
            name="interval"
            type="number"
            min="1"
            value={interval}
            onchange={(e) => (interval = Number((e.target as HTMLInputElement).value))}
          />
          <select name="intervalType" bind:value={intervalType}>
            <option value="days" data-i18n="[html]modal.scheduleEdit.fields.interval.days">days</option>
            <option value="months" data-i18n="[html]modal.scheduleEdit.fields.interval.months">months</option>
            <option value="years" data-i18n="[html]modal.scheduleEdit.fields.interval.years">years</option>
          </select>
        </div>
      </li>
      <li
        id="restrictPartyRow"
        class="formControlRow"
        class:hidden={!joinedPartyCache || joinedPartyCache.ownerUuid !== playerData?.uuid}
      >
        <label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.restrictParty">Limit to Party</label>
        <div>
          <button
            id="restrictParty"
            class="checkboxButton unselectable"
            type="button"
            class:toggled={restrictParty}
            onclick={handlePartyRestrictionToggle}
          >
            <span></span>
          </button>
        </div>
      </li>
      <li id="eventOfficialRow" class="formControlRow hidden" class:hidden={!isMod}>
        <label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.official">Official Event</label>
        <div>
          <button
            id="eventOfficial"
            class="checkboxButton unselectable"
            type="button"
            class:toggled={official}
            onclick={handleOfficialToggle}
          >
            <span></span>
          </button>
        </div>
      </li>
      <li id="resetOrganizerRow" class="formControlRow hidden" class:hidden={!isMod || !editingScheduleId}>
        <label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.resetOrganizer">Reset Organizer</label>
        <div>
          <button
            id="resetOrganizer"
            class="checkboxButton unselectable"
            type="button"
            class:toggled={resetOrganizer}
            onclick={handleResetOrganizerToggle}
          >
            <span></span>
          </button>
        </div>
      </li>
      <li class="formControlRow">
        <label for="scheduleThemeButton" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.theme"
          >Theme</label
        >
        <div>
          <div id="scheduleThemeButton" class="uiThemeItem item unselectable" onclick={openThemeModal}></div>
          <input id="scheduleTheme" type="hidden" name="theme" bind:value={theme} />
        </div>
      </li>
      <li class="formControlRow">
        <label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.title">External Links</label>
      </li>
      <li class="formControlRow indent">
        <label for="discord" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.discord"
          >Discord</label
        >
        <div>
          <input
            name="discord"
            type="text"
            data-platform
            bind:value={discord}
            onchange={(e) => {
              const error = handlePlatformChange('discord', e.currentTarget.value);
              e.currentTarget.setCustomValidity(error || '');
            }}
          />
        </div>
      </li>
      <li class="formControlRow indent">
        <label for="youtube" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.youtube"
          >YouTube</label
        >
        <div>
          <input
            name="youtube"
            type="text"
            data-platform
            bind:value={youtube}
            onchange={(e) => {
              const error = handlePlatformChange('youtube', e.currentTarget.value);
              e.currentTarget.setCustomValidity(error || '');
            }}
          />
        </div>
      </li>
      <li class="formControlRow indent">
        <label for="twitch" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.twitch"
          >Twitch</label
        >
        <div>
          <input
            name="twitch"
            type="text"
            data-platform
            bind:value={twitch}
            onchange={(e) => {
              const error = handlePlatformChange('twitch', e.currentTarget.value);
              e.currentTarget.setCustomValidity(error || '');
            }}
          />
        </div>
      </li>
      <li class="formControlRow indent">
        <label for="niconico" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.niconico"
          >Nicovideo</label
        >
        <div>
          <input
            name="niconico"
            type="text"
            data-platform
            bind:value={niconico}
            onchange={(e) => {
              const error = handlePlatformChange('niconico', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).setCustomValidity(error || '');
            }}
          />
        </div>
      </li>
      <li class="formControlRow indent">
        <label for="openrec" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.openrec"
          >Openrec</label
        >
        <div>
          <input
            name="openrec"
            type="text"
            data-platform
            bind:value={openrec}
            onchange={(e) => {
              const error = handlePlatformChange('openrec', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).setCustomValidity(error || '');
            }}
          />
        </div>
      </li>
      <li class="formControlRow indent">
        <label for="bilibili" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.bilibili"
          >Bilibili</label
        >
        <div>
          <input
            name="bilibili"
            type="text"
            data-platform
            bind:value={bilibili}
            onchange={(e) => {
              const error = handlePlatformChange('bilibili', (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).setCustomValidity(error || '');
            }}
          />
        </div>
      </li>
      <li class="formControlRow buttonRow fullWidth">
        <button type="submit" data-i18n="[html]modal.scheduleEdit.save">Save</button>
        <button type="button" id="cancelSchedule" data-i18n="[html]modal.scheduleEdit.cancel" onclick={handleCancel}>
          Cancel Event
        </button>
      </li>
    </ul>
  </form>
</Modal>
