<script lang="ts">
  import { onMount } from 'svelte';
  import { locale } from '../../i18n/i18n-svelte';
  import { activateTheme, allGameUiThemes } from '$lib/stores/uiTheme';
  import { getInitPayload, inferGameId } from '$lib/init';

  export interface Schedule {
    id: string;
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
    schedule: Schedule;
    playerData?: any;
    joinedPartyId?: number | null;
    onEdit?: (schedule: Schedule) => void;
    onCancel?: (schedule: Schedule) => void;
    onFollow?: (schedule: Schedule) => Promise<number | null | void>;
  }

  const { schedule, playerData, onEdit, onCancel, onFollow }: Props = $props();

  const platformAuthorities = Object.freeze({
    discord: 'discord.com',
    youtube: 'youtube.com',
    twitch: 'twitch.tv',
    niconico: 'nicovideo.jp',
    openrec: 'openrec.tv',
    bilibili: 'bilibili.com'
  });

  type Platform = keyof typeof platformAuthorities;

  const currentGameId = inferGameId(getInitPayload());

  let descriptionExpanded = $state(false);
  let playerLiked = $derived(schedule.playerLiked);
  let followerCount = $derived(schedule.followerCount || 0);

  const resolvedTheme = $derived.by(() => {
    const themesByGame = allGameUiThemes as unknown as Record<string, readonly string[]>;
    const themes = themesByGame[schedule.game] ?? [];
    const preferred = (schedule.systemName || '').trim();
    if (preferred && themes.includes(preferred)) return preferred;
    return themes[0] ?? '';
  });

  const themeClass = $derived.by(() => {
    if (!resolvedTheme) return '';
    const normalized = resolvedTheme.replace(/[ ()]/g, '_');
    const prefix = schedule.game !== currentGameId ? `${schedule.game}___` : '';
    return `theme_${prefix}${normalized}`;
  });

  const listEntryClass = $derived.by(() => `listEntry schedule${themeClass ? ` ${themeClass}` : ''}`);

  const parsedDatetime = $derived.by(() => {
    const dt = new Date(schedule.datetime);
    return Number.isNaN(dt.getTime()) ? null : dt;
  });

  const datetimeLabel = $derived.by(() => {
    if (!parsedDatetime) return schedule.datetime;
    const lang = $locale || 'en';
    const localeArg: string | string[] = lang === 'en' ? [] : lang;
    return parsedDatetime.toLocaleString(localeArg, { dateStyle: 'short', timeStyle: 'short' });
  });

  const weekdayLabel = $derived.by(() => {
    if (!parsedDatetime) return '';
    const lang = $locale || 'en';
    const localeArg: string | string[] = lang === 'en' ? [] : lang;
    return parsedDatetime.toLocaleString(localeArg, { weekday: 'long' });
  });

  const recurringTitle = $derived.by(() => {
    if (!schedule.recurring) return '';
    if (schedule.interval === 1) return `Every ${schedule.intervalType.slice(0, -1)}`;
    if (schedule.intervalType === 'days' && schedule.interval % 7 === 0) {
      const weeks = schedule.interval / 7;
      if (weeks === 1) return `Weekly (${weekdayLabel})`;
      return `Every ${weeks} weeks`;
    }
    return `Every ${schedule.interval} ${schedule.intervalType}`;
  });

  const links = $derived.by(() => {
    const out: { platform: Platform; label: string; href: string }[] = [];
    for (const platform of Object.keys(platformAuthorities) as Platform[]) {
      const raw = (schedule[platform] as string | undefined) ?? '';
      if (!raw) continue;
      const sanitized = sanitizeLink(platform, raw);
      if (!sanitized) continue;
      out.push({ platform, label: platformLabel(platform), href: sanitized });
    }
    return out;
  });

  const descriptionHtml = $derived.by(() => renderDescriptionHtml(schedule.description || '', schedule.game));

  onMount(async () => {
    if (resolvedTheme) {
      try {
        await activateTheme(resolvedTheme, schedule.game, currentGameId);
      } catch (err) {
        console.warn('Failed to activate schedule theme', resolvedTheme, schedule.game, err);
      }
    }
  });

  function platformLabel(platform: Platform): string {
    switch (platform) {
      case 'discord':
        return 'Discord';
      case 'youtube':
        return 'YouTube';
      case 'twitch':
        return 'Twitch';
      case 'niconico':
        return 'Niconico';
      case 'openrec':
        return 'OPENREC';
      case 'bilibili':
        return 'bilibili';
      default:
        return platform;
    }
  }

  function sanitizeLink(platform: Platform, link: string): string | null {
    try {
      const authority = platformAuthorities[platform];
      const parsed = new URL(link, `https://${authority}`);
      const hostname = parsed.hostname.replace(/^www\./, '');
      if (hostname !== authority) return null;
      parsed.hostname = authority;
      parsed.protocol = 'https:';
      return parsed.href;
    } catch {
      return null;
    }
  }

  function decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  function escapeHtml(text: string): string {
    const elm = document.createElement('div');
    elm.innerText = text;
    return elm.innerHTML;
  }

  function renderDescriptionHtml(raw: string, game: string): string {
    const decoded = decodeHtmlEntities(raw);
    const wikiAnchors: string[] = [];

    const withWikiPlaceholders = decoded.replace(/\{\{l:(.+?)\}\}/g, (_, descriptor) => {
      const [hrefRaw, altRaw] = String(descriptor).split(',', 2);
      const href = (hrefRaw || '').trim();
      const alt = (altRaw || href).trim();
      const anchor = `<a target="_blank" rel="noopener noreferrer" href="https://yume.wiki/${escapeHtml(game)}/${escapeHtml(href)}">${escapeHtml(alt)}</a>`;
      const token = `__WIKI_LINK_${wikiAnchors.length}__`;
      wikiAnchors.push(anchor);
      return token;
    });

    let html = escapeHtml(withWikiPlaceholders);

    html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a target="_blank" rel="noopener noreferrer" href="$1">$1</a>');
    html = html.replace(/\n{2,}/g, '<br><br>');
    html = html.replace(/\w{2,}\n/g, '$&<br>').replace(/\n/g, ' ');

    wikiAnchors.forEach((anchor, idx) => {
      html = html.replaceAll(`__WIKI_LINK_${idx}__`, anchor);
    });

    return html;
  }

  function canEdit() {
    const isMod = playerData && playerData.rank > 0;
    return isMod || (playerData?.uuid && playerData.uuid === schedule.ownerUuid);
  }

  function canCancel() {
    const isMod = playerData && playerData.rank > 0;
    return isMod || (playerData?.uuid && playerData.uuid === schedule.ownerUuid);
  }

  function toggleDescription() {
    descriptionExpanded = !descriptionExpanded;
  }

  async function handleFollow() {
    if (!onFollow) return;
    try {
      const nextCount = await onFollow(schedule);
      if (typeof nextCount === 'number' && Number.isFinite(nextCount)) {
        followerCount = nextCount;
      } else {
        followerCount = Math.max(0, followerCount + (playerLiked ? 1 : -1));
      }
    } catch (err) {
      console.error('Failed to follow/unfollow schedule:', err);
    }
  }

  function handleEdit() {
    onEdit?.(schedule);
  }

  function handleCancel() {
    onCancel?.(schedule);
  }
</script>

<div class={listEntryClass}>
  <div class="listEntryMain">
    <strong class="nameMarker eventName" data-role="name">
      {schedule.name}
      <svg width="16" height="16" class="icon fillIcon" class:hidden={!schedule.partyId}>
        <path
          d="m9 4a1 1 90 0 0 0 5 1 1 90 0 0 -5m-4 13c0-5 1-7 4-7s4 2 4 7q-4 2-8 0m0-17a1 1 90 0 0 0 5 1 1 90 0 0 -5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0 -5m4 13c0-5-1-7-4-7-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 3.625 1 3.875 4.125q2.375 0 4-0.875"
        ></path>
      </svg>
    </strong>

    <div class="themeText scheduleHeader">
      {#if canEdit()}
        <button
          class="icon iconButton fillIcon unselectable toggleButton offToggleButton"
          style="padding-inline-end: 12px;"
          onclick={handleEdit}
          aria-label="Edit schedule"
          title="Edit schedule"
        >
          <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="m12.25 3h-8.25q-2 0-2 2v10q0 2 2 2h10q2 0 2-2v-7.75l-2 2.25v3.5c0 2 0 2-2 2h-6c-2 0-2 0-2-2v-6c0-2 0-2 2-2h4.5l1.75-2m3.75-2l-7 8-1 3 3-1 7-8q0-2-2-2m-0.875 1l2 2-0.8125 0.9375-2-2m-5.3125 6.0625l2 2m-2.75 0.25l0.5 0.5"
              stroke="#000000"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path d="m-2 16l22-14"></path>
          </svg>
        </button>
      {/if}

      {#if canCancel()}
        <button
          class="deleteIcon icon iconButton"
          style="padding-inline-end: 12px"
          onclick={handleCancel}
          aria-label="Cancel schedule"
          title="Cancel schedule"
        >
          <svg viewBox="0 0 18 18" width="24" height="24"
            ><path
              d="m3.5 2h11q2 0 2 3h-15q0-3 2-3m4-2h2q2 0 2 2h-5q0-2 2-2m-5.5 5 1 13h10l1-13m-8.5 11-0.5-9m3 9v-9m2.5 9 0.5-9"
            ></path></svg
          >
        </button>
      {/if}

      <div class="likeContainer" style="display: flex; align-items: center;">
        <button
          class="likeIcon icon iconButton toggleButton altToggleButton"
          class:fillIcon={playerLiked}
          onclick={handleFollow}
          aria-label={playerLiked ? 'Unfollow schedule' : 'Follow schedule'}
          title={playerLiked ? 'Unfollow schedule' : 'Follow schedule'}
        >
          <svg viewBox="0 0 18 18" width="24" height="24">
            <path
              d="m16.65 2c-1.875-2.025-4.875-1.95-6.825 0.075l-0.825 0.975-0.825-0.975c-1.95-2.025-4.95-2.1-6.75-0.075h-0.075c-1.8 1.95-1.8 5.25 0.15 7.275l4.05 4.425 3.45 3.675 3.3-3.6 4.2-4.5c1.95-2.025 1.95-5.325 0.15-7.275z"
            ></path>
          </svg>
        </button>
        <span class="infoLabel likeCount unselectable" style="margin-inline-start: 8px; font-size: 1.2em;"
          >{followerCount}</span
        >
      </div>
    </div>
  </div>

  <div
    class="scheduleDescription"
    class:expanded={descriptionExpanded}
    onclick={toggleDescription}
    onkeydown={(e) => e.key === 'Enter' && toggleDescription()}
    role="button"
    tabindex="0"
  >
    <span class="themeText" data-role="description">
      {@html descriptionHtml}
    </span>
  </div>

  <div style="padding-bottom: 4px; font-size: 0.9em;" data-role="links">
    {#if links.length}
      {#each links as link, idx}
        <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>{idx < links.length - 1
          ? ' | '
          : ''}
      {/each}
    {/if}
  </div>

  <div style="justify-content: space-between; width: 100%; font-size: 0.9em;" class="listEntryMain themeText">
    <div data-role="organizer" style="display:inline-flex; white-space:nowrap">Organized by {schedule.ownerName}</div>
    <div data-role="datetime" class="scheduleDatetime">
      {datetimeLabel}
      {#if schedule.recurring}
        <span class="icon" title={recurringTitle}>↻</span>
      {/if}
    </div>
  </div>
</div>
