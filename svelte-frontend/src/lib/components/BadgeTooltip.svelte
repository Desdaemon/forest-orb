<script lang="ts">
  import { locationResolverStore } from '$lib/locationResolver';
  import LL, { locale } from '../../i18n/i18n-svelte';
  import { loadLocalizedBadges, type LocalizedBadge } from '$lib/badgeLocalization';
  import type { Badge } from './BadgeItem.svelte';
  import { isBrowser } from '$lib/init';

  const LOCKED_TEXT = '???';
  const LOCATION_LABEL = 'Location:';
  const NO_BADGE_TEXT = 'No Badge';

  type ConditionSegment = { text: string; achieved: boolean };

  let { badge }: { badge: Badge } = $props();

  const badgeId = $derived(badge.badgeId || 'null');
  const canRevealBadgeInfo = $derived((badge.unlocked || !badge.secret) && badgeId !== 'null');

  const mapIdString = $derived.by(() => {
    if (badge.mapId === undefined || badge.mapId === null || badge.mapId === '') return null;
    return String(badge.mapId).trim().padStart(4, '0');
  });

  async function loadLocalizedBadge(badge: Badge) {
    if (badge.badgeId === 'null' || !badge.game) return null;
    const game = badge.game;
    const localizedByGame = await loadLocalizedBadges($locale);
    return localizedByGame[game]?.[badgeId] || null;
  }

  let localizedBadge: LocalizedBadge | null = $state(null);
  $effect(() => {
    if (!isBrowser) return;
    loadLocalizedBadge(badge).then((result) => {
      localizedBadge = result;
    });
  });

  let badgeLocation: { name: string | null; url: string | null } = $state({ name: null, url: null });
  $effect(() => {
    if (!isBrowser) return;
    if (!mapIdString || !badge.game || badgeId === 'null') {
      badgeLocation = { name: null, url: null };
      return;
    }
    locationResolverStore
      .resolveCurrentLocationInfo({
        gameId: badge.game,
        lang: $locale,
        mapId: mapIdString,
        x: badge.mapX,
        y: badge.mapY
      })
      .then((info) => {
        badgeLocation = { name: info.name.trim(), url: info.url };
      });
  });

  function formatBadgeTitle(title: string, bp?: number): string {
    return typeof bp === 'number' ? `${title} - ${bp} BP` : title;
  }

  function formatTime(minutes: number, seconds: number): string {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  const titleText = $derived.by(() => {
    if (badgeId === 'null') return NO_BADGE_TEXT;
    if (!canRevealBadgeInfo) return LOCKED_TEXT;
    return localizedBadge?.name || badgeId;
  });

  const titleWithBp = $derived(formatBadgeTitle(titleText, badge.bp));

  const percentText = $derived.by(() => {
    if (typeof badge.percent !== 'number') return null;
    const roundingRatio = badge.percent < 1 ? 100 : 10;
    const roundedPercent = Math.floor(badge.percent * roundingRatio) / roundingRatio;
    return $LL.messages.badges.percentUnlocked({ PERCENT: String(roundedPercent) });
  });

  const goalProgressText = $derived.by(() => {
    if (badge.secret || badge.secretCondition) return null;
    if (!badge.goalsTotal || badge.goalsTotal <= 1) return null;
    return $LL.messages.badges.goalProgress({ CURRENT: String(badge.goals ?? 0), TOTAL: String(badge.goalsTotal) });
  });

  const conditionSegments = $derived.by((): ConditionSegment[] | null => {
    if (!localizedBadge?.condition) return null;
    if (!canRevealBadgeInfo && badge.secretCondition) return null;

    let condition = localizedBadge.condition;
    if (typeof badge.seconds === 'number') {
      const minutes = Math.floor(badge.seconds / 60);
      const seconds = badge.seconds - minutes * 60;
      condition = condition.replace('{TIME}', formatTime(minutes, seconds));
    }

    const achievedNeedles: string[] = [];
    if (localizedBadge.checkbox && badge.tags?.length) {
      for (const subcondition in localizedBadge.checkbox) {
        const needle = localizedBadge.checkbox[subcondition];
        const achieved = subcondition.includes('|')
          ? !!subcondition.split('|').find((tag) => badge.tags!.includes(tag))
          : badge.tags.includes(subcondition);
        if (achieved) achievedNeedles.push(needle);
      }
    }

    if (!achievedNeedles.length) return [{ text: condition, achieved: false }];

    let segments: ConditionSegment[] = [{ text: condition, achieved: false }];
    for (const needle of achievedNeedles) {
      const next: ConditionSegment[] = [];
      for (const seg of segments) {
        if (seg.achieved) {
          next.push(seg);
          continue;
        }
        const parts = seg.text.split(needle);
        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) next.push({ text: parts[i], achieved: false });
          if (i < parts.length - 1) next.push({ text: needle, achieved: true });
        }
      }
      segments = next;
    }
    return segments;
  });
</script>

<div>
  <h3 class="tooltipTitle" class:altText={badge.hidden}>{titleWithBp}</h3>

  {#if canRevealBadgeInfo && localizedBadge?.description}
    <div class="tooltipContent">{localizedBadge.description}</div>
  {/if}

  <div class="tooltipSpacer"></div>
  {#if mapIdString && mapIdString !== '0000'}
    <span class="tooltipLocation">
      <span class="tooltipLabel">{LOCATION_LABEL}</span>
      {#if badgeLocation?.url}
        <a href={badgeLocation.url} target="_blank" rel="noopener noreferrer">{badgeLocation.name}</a>
      {:else}
        <span>{badgeLocation?.name || `MAP${mapIdString}`}</span>
      {/if}
    </span>
  {/if}

  {#if conditionSegments}
    <div class="tooltipContent">
      {#each conditionSegments as seg}{#if seg.achieved}<tag>{seg.text}</tag>{:else}{seg.text}{/if}{/each}
    </div>
  {:else if !canRevealBadgeInfo && badge.secretCondition}
    <h3 class="tooltipTitle">{LOCKED_TEXT}</h3>
  {/if}

  <div class="tooltipFooter">
    {#if goalProgressText}
      {goalProgressText}<br />
    {/if}
    {#if percentText}
      {percentText}
    {/if}
    {#if canRevealBadgeInfo && badge.art}
      <small class="tooltipCornerText">{$LL.messages.badges.artCredit({ ARTIST: badge.art })}</small>
    {/if}
  </div>
</div>
