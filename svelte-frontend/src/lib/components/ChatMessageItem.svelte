<script lang="ts">
  import type { ChatPlayerProfile } from '$lib/stores/chatPlayer';

  export type ChatMessageType = 'system' | 'map' | 'global' | 'party';

  export type ChatMessageViewModel = {
    localId: number;
    msgId: string;
    senderUuid: string;
    senderName: string;
    senderSystemName: string;
    contents: string;
    type: ChatMessageType;
    timestamp: number;
    mapId: string;
    prevMapId: string;
    prevLocationsStr: string;
    locationName: string;
    locationUrl: string;
    x: number;
    y: number;
    senderAccount?: boolean;
    senderBadge?: string | null;
  };

  const {
    message,
    player,
    showTimestamp = true
  }: {
    message: ChatMessageViewModel;
    player?: ChatPlayerProfile;
    showTimestamp?: boolean;
  } = $props();

  const isSystem = $derived(message.type === 'system');
  const isMap = $derived(message.type === 'map');
  const isGlobal = $derived(message.type === 'global');
  const isParty = $derived(message.type === 'party');
  const hasText = $derived(Boolean(message.contents?.trim()));
  const hasLocation = $derived((message.mapId || '0000') !== '0000' && (isGlobal || isParty));
  const resolvedSenderLabel = $derived(player?.name || message.senderName || message.senderUuid || 'YNO');
  const badgeId = $derived.by(() => {
    const value = player?.badge ?? message.senderBadge;
    if (value === undefined || value === null || value === '' || value === 'null') return '';
    return String(value);
  });
  const badgeStyle = $derived(badgeId ? `background-image: url('images/badge/${badgeId}.png');` : '');
  const isAccount = $derived((player?.account ?? message.senderAccount) === true);
  const startMarker = $derived(isAccount ? '[' : '<');
  const endMarker = $derived(isAccount ? ']' : '>');

  const timestampLabel = $derived.by(() => {
    if (!message.timestamp) return '';
    const date = new Date(message.timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const containerClass = $derived.by(() => {
    if (isGlobal) return 'messageContainer global';
    if (isParty) return 'messageContainer party';
    if (isMap) return 'messageContainer map';
    return 'messageContainer';
  });

  const locationText = $derived.by(() => {
    if (!hasLocation) return '';
    const resolved = (message.locationName || '').trim();
    if (resolved) return resolved;

    const base = message.mapId || '0000';
    const hasCoords = Number.isFinite(message.x) && Number.isFinite(message.y) && message.x >= 0 && message.y >= 0;

    if (hasCoords) {
      return `Map ${base} (${message.x}, ${message.y})`;
    }
    return `Map ${base}`;
  });

  const locationLink = $derived.by(() => {
    const value = (message.locationUrl || '').trim();
    return value || null;
  });

  const normalizedSystemName = $derived.by(() => {
    const raw = player?.systemName || message.senderSystemName;
    if (!raw) return '';
    return raw.replace(/'|\s$/g, '');
  });

  const senderThemeClass = $derived.by(() => {
    if (!normalizedSystemName) return '';
    return `theme_${normalizedSystemName.replace(/[ ()]/g, '_')}`;
  });

  const senderClass = $derived.by(() => {
    // const accountClass = isAccount ? ' account' : '';
    // const themeClass = senderThemeClass ? ` ${senderThemeClass}` : '';
    // return `messageSender${accountClass}${themeClass}`;
    return ['messageSender', senderThemeClass, { account: isAccount }];
  });

  const nameTextClass = $derived.by(() => (senderThemeClass ? `nameText ${senderThemeClass}` : 'nameText'));
  const nameMarkerClass = $derived.by(() =>
    senderThemeClass ? `nameMarker punct ${senderThemeClass}` : 'nameMarker punct'
  );
</script>

<div
  class={containerClass}
  data-msg-id={message.msgId}
  data-sender-uuid={message.senderUuid}
  data-map-id={message.mapId}
  data-prev-map-id={message.prevMapId}
  data-prev-locations-str={message.prevLocationsStr}
  data-x={message.x}
  data-y={message.y}
  data-system-name={normalizedSystemName || player?.systemName || message.senderSystemName}
  data-badge={player?.badge ?? message.senderBadge}
  data-rank={player?.rank}
  data-account={isAccount}
>
  {#if !isSystem}
    <div class="messageHeader">
      {#if isGlobal || isParty}
        {#if hasLocation}
          <bdi class="playerLocation" role="presentation"
            >{#if locationLink}<a href={locationLink} target="_blank" rel="noopener noreferrer">{locationText}</a
              >{:else}{locationText}{/if}</bdi
          >
        {:else}
          <span></span>
        {/if}
      {:else}
        <span></span>
      {/if}
      {#if showTimestamp}
        <bdi class="messageTimestamp infoLabel">{timestampLabel}</bdi>
      {/if}
    </div>
  {/if}

  <div class="message">
    {#if !isSystem}
      <div class={senderClass}>
        {#if isGlobal}
          <span class="chatTypeIcon">[G]</span>
        {:else if isParty}
          <span class="chatTypeIcon">[P]</span>
        {/if}
        <span class={nameMarkerClass}>{startMarker}</span><bdi class={nameTextClass}>{resolvedSenderLabel}</bdi
        >{#if badgeId}<span class="badge nameBadge" style={badgeStyle} aria-hidden="true"></span>{/if}<span
          class={nameMarkerClass}>{endMarker}</span
        >
      </div>
      <span> </span>
    {/if}

    <div class="messageContentsWrapper" dir="auto">
      <span class="messageContents" class:notext={!hasText}>{message.contents}</span>
    </div>
  </div>
</div>
