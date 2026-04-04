<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  export const OverlayType = {
    GRADIENT: 1,
    MULTIPLY: 2,
    MASK: 4,
    DUAL: 8,
    LOCATION: 16
  } as const;

  export type Badge = {
    badgeId: string;
    game?: string;
    group?: string;
    mapId?: number | string;
    mapX?: number;
    mapY?: number;
    tags?: string[];
    newUnlock?: boolean;
    overlayType?: number;
    unlocked?: boolean;
    hidden?: boolean;
    secret?: boolean;
    secretCondition?: boolean;
    originalOrder?: number;
    bp?: number;
    percent?: number;
    goalsTotal?: number;
    goals?: number;
    seconds?: number;
    art?: string;
    animated?: boolean;
  };

  const SVG_PATHS = {
    locked:
      'm13 7c0-4 0-6-4-6s-4 2-4 6h2c0-4 0-4 2-4s2 0 2 4h2q2 0 2 2v6q0 2-2 2h-8q-2 0-2-2v-6q0-2 2-2h6m-2 3a1 1 90 0 0 2 1 1 90 0 0 -2m-0.5 1.875l-0.5 1.875q0 0.125 0.125 0.125h1.75q0.125 0 0.125-0.125l-0.5-1.875q-0.5 0.25-1 0',
    ban: 'm9 0a9 9 90 1 0 9 9 9 9 90 0 0 -9 -9zm0 2.1a6.9 6.9 90 0 1 4.1 1.3l-9.7 9.7a6.9 6.9 90 0 1 5.6 -11zm0 13.8a6.9 6.9 90 0 1 -4.1 -1.3l9.6-9.6a6.9 6.9 90 0 1 -5.5 10.9z'
  } as const;

  let {
    badge: badgeProp,
    emptyIcon = false,
    lockedIcon = false,
    scaled = false,
    selected = false,
    ...props
  }: {
    /** Either a badge ID or a full badge */
    badge?: string | Badge;
    emptyIcon?: boolean;
    lockedIcon?: boolean;
    scaled?: boolean;
    selected?: boolean;
  } & HTMLAttributes<HTMLDivElement> = $props();

  const badge = $derived(
    typeof badgeProp === 'string' ? ({ badgeId: badgeProp } as Badge) : (badgeProp ?? { badgeId: 'null' })
  );
  const badgeId = $derived(badge.badgeId || 'null');
  const showBadgeEl = $derived((badge.unlocked || !badge.secret) && badgeId !== 'null');
  const shouldLockItem = $derived((badgeId !== 'null' && !badge.unlocked) || (!showBadgeEl && badgeId !== 'null'));

  function getBadgeUrl(b: Badge, staticOnly: boolean): string {
    return b.badgeId ? `images/badge/${b.badgeId}${!staticOnly && b.animated ? '.gif' : '.png'}` : '';
  }

  const badgeUrl = $derived(showBadgeEl ? getBadgeUrl(badge, !badge.unlocked) : '');
  const overlayType = $derived(badge.overlayType ?? 0);
  const hasOverlay = $derived(!!overlayType);
  const hasDual = $derived(!!(overlayType & OverlayType.DUAL));
  const hasMask = $derived(!!(overlayType & OverlayType.MASK));
  const hasMultiply = $derived(!!(overlayType & OverlayType.MULTIPLY));

  const badgeMaskValue = $derived(
    hasMask ? `url('${badgeUrl.replace('.', hasDual ? '_mask_fg.' : '_mask.')}')` : `url('${badgeUrl}')`
  );
  const badgeMask2Value = $derived(hasMask ? `url('${badgeUrl.replace('.', '_mask_bg.')}')` : `url('${badgeUrl}')`);
</script>

<div
  {...props}
  class={[
    'badgeItem item unselectable',
    {
      locked: shouldLockItem,
      disabled: shouldLockItem
    },
    props.class
  ]}
>
  <div class="badgeContainer" class:special={badge.hidden && badge.unlocked} class:selected>
    {#if showBadgeEl}
      <div
        class="badge"
        class:scaledBadge={scaled}
        class:overlayBadge={hasOverlay}
        style="background-image: url('{badgeUrl}');"
      >
        {#if hasOverlay}
          <div
            class="badgeOverlay"
            class:badgeOverlayMultiply={hasMultiply}
            class:badgeOverlayBase={hasDual}
            style="-webkit-mask-image: ${badgeMaskValue}; mask-image: ${badgeMaskValue};"
          ></div>
          {#if hasDual}
            <div
              class="badgeOverlay badgeOverlay2 badgeOverlayAlt"
              class:badgeOverlayMultiply={hasMultiply}
              style="-webkit-mask-image: ${badgeMask2Value}; mask-image: ${badgeMask2Value};"
            ></div>
          {/if}
        {/if}
      </div>
      {#if !badge.unlocked && lockedIcon}
        <div class="lockedIcon icon fillIcon" aria-hidden="true">
          <svg viewBox="0 0 18 18"><path d={SVG_PATHS.locked}></path></svg>
        </div>
      {/if}
    {:else if badgeId !== 'null'}
      {#if lockedIcon}
        <div class="lockedIcon icon fillIcon" aria-hidden="true">
          <svg viewBox="0 0 18 18"><path d={SVG_PATHS.locked}></path></svg>
        </div>
      {/if}
      <div></div>
    {:else if emptyIcon}
      <div class="banIcon icon fillIcon" aria-hidden="true">
        <svg viewBox="0 0 18 18"><path d={SVG_PATHS.ban}></path></svg>
      </div>
    {:else}
      <div></div>
    {/if}
  </div>
</div>
