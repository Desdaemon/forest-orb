<script module lang="ts">
  type ChatMessageTimestampInput = number | string | undefined;

  function getMessageMinuteKey(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getHours()}:${date.getMinutes()}`;
  }

  function normalizeTimestamp(timestamp?: ChatMessageTimestampInput): number {
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp === 'string' && timestamp) {
      const parsed = Date.parse(timestamp);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return Date.now();
  }

  function parseAccountFlag(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === '1' || normalized === 'true') return true;
      if (normalized === '0' || normalized === 'false' || normalized === '') return false;
    }
    return fallback;
  }
</script>

<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { createChatSessionClient } from '$lib/chatSession';
  import { onMount, tick } from 'svelte';
  import { getGameInitState } from '$lib/init';
  import { locationResolver } from '$lib/locationResolver';
  import { chatPlayerStore, type ChatPlayerProfile } from '$lib/stores/chatPlayer';
  import { activateTheme } from '$lib/stores/uiTheme';
  import ChatMessageItem from './ChatMessageItem.svelte';
  import VirtualList, { type VirtualListController } from './VirtualList.svelte';
  import BadgeItem from './BadgeItem.svelte';

  const { gameId: currentGameId } = getGameInitState();

  const { show = false }: { show?: boolean } = $props();

  type ChatTab = 'chat' | 'players' | 'parties';

  type ChatMessage = {
    localId: number;
    msgId: string;
    senderUuid: string;
    senderName: string;
    senderSystemName: string;
    contents: string;
    type: 'system' | 'map' | 'global' | 'party';
    timestamp: number;
    mapId: string;
    prevMapId: string;
    prevLocationsStr: string;
    locationName: string;
    locationUrl: string;
    x: number;
    y: number;
    senderAccount: boolean;
    senderBadge: string | null;
  };

  type ChatMessageInput = {
    msgId?: string;
    senderUuid?: string;
    senderName?: string;
    senderSystemName?: string;
    contents?: string;
    type: ChatMessage['type'];
    timestamp?: number | string;
    mapId?: string;
    prevMapId?: string;
    prevLocationsStr?: string;
    x?: number;
    y?: number;
    senderAccount?: boolean;
    senderBadge?: string | null;
  };

  type AppendMessageOptions = {
    scrollToBottom?: 'if-at-bottom' | 'always' | 'never';
    trackAsNew?: boolean;
  };

  type ChatHistoryMessage = {
    msgId?: string;
    uuid?: string;
    contents?: string;
    party?: boolean;
    timestamp?: number;
    mapId?: string;
    prevMapId?: string;
    prevLocations?: string;
    prevLocationsStr?: string;
    x?: number;
    y?: number;
  };

  type ChatHistoryPlayer = {
    uuid: string;
    id?: number;
    name?: string;
    systemName?: string;
    rank?: number;
    account?: boolean;
    badge?: string | null;
    medals?: unknown;
  };

  let reconnectAttempt = $state(0);
  let playerCount = $state<number>(0);
  let connStatus = $state<'Disconnected' | 'Connected' | 'Error'>('Disconnected');
  let activeTab = $state<ChatTab>('chat');
  let chatScope = $state<'all' | 'map' | 'global'>('all');
  let hideLocations = $state(false);
  let hideTimestamps = $state(false);
  let mentionsOnly = $state(false);
  let draftMessage = $state('');
  let messages = $state<ChatMessage[]>([]);
  let parties = $state<string[]>([]);

  let historyRetryTimer: number | null = null;
  let hasLoadedInitialHistory = false;
  let isLoadingInitialHistory = false;
  let isMounted = false;
  let pendingScrollToBottom = $state(false);
  let isChatAtBottom = $state(true);
  let unseenNewMessageCount = $state(0);
  let seenMessageIds = new Set<string>();
  let messagesListRef: VirtualListController | undefined = $state();
  let nextLocalMessageId = 1;
  const sessionClient = createChatSessionClient({
    shouldConnect: () => isMounted && show,
    onStatusChange: (status) => {
      connStatus = status;
    },
    onReconnectAttemptChange: (attempt) => {
      reconnectAttempt = attempt;
    },
    onOpen: () => {
      void loadInitialChatHistory();
    },
    onPlayerCount: (count) => {
      playerCount = count;
    },
    onAppendMessage: (message) => {
      appendMessage(message);
    },
    getPlayer,
    onPlayerProfile: (profile) => {
      chatPlayerStore.upsert(profile);
      playerProfiles[profile.uuid] = profile;
    },
    onPlayerMessagesUpdate: (uuid, profile) => {
      messages = messages.map((message) => {
        if (message.senderUuid !== uuid) return message;
        return {
          ...message,
          senderName: profile.name || message.senderName,
          senderSystemName: profile.systemName || message.senderSystemName,
          senderAccount: profile.account,
          senderBadge: profile.badge
        };
      });
    },
    onActivatePlayerTheme: activatePlayerTheme
  });

  let playerProfiles = $chatPlayerStore;
  const players = $derived.by(() =>
    Object.values($chatPlayerStore).sort((a, b) => (a.name || a.uuid).localeCompare(b.name || b.uuid))
  );
  const filteredMessages = $derived.by(() => {
    if (chatScope === 'map') {
      return messages.filter((message) => message.type === 'map');
    }
    if (chatScope === 'global') {
      return messages.filter((message) => message.type === 'global' || message.type === 'party');
    }
    return messages;
  });
  const messageListClass = $derived.by(() => {
    const classes = ['chatboxTabContent', 'scrollableContainer'];
    if (hideLocations) classes.push('hideLocations');
    if (hideTimestamps) classes.push('hideTimestamps');
    if (mentionsOnly) classes.push('mentionsOnly');
    return classes.join(' ');
  });

  onMount(() => {
    isMounted = true;

    void locationResolver.init({
      gameId: getGameInitState().gameId,
      lang: document.documentElement.lang || 'en'
    });

    return () => {
      isMounted = false;
      sessionClient.disconnect();
    };
  });

  function shouldShowTimestamp(message: ChatMessage, previousMessage?: ChatMessage) {
    if (!message.timestamp) return false;
    if (!previousMessage) return true;
    return getMessageMinuteKey(message.timestamp) !== getMessageMinuteKey(previousMessage.timestamp);
  }

  function isChatScrolledToBottom() {
    const atBottom = messagesListRef?.isScrolledToBottom(16) ?? true;
    isChatAtBottom = atBottom;
    return atBottom;
  }

  function queueScrollToBottom() {
    pendingScrollToBottom = true;
  }

  function onMessagesScrollStateChange(isAtBottom: boolean) {
    isChatAtBottom = isAtBottom;
    if (isAtBottom) {
      unseenNewMessageCount = 0;
    }
  }

  function onClickNewMessages() {
    if (messagesListRef) {
      messagesListRef.scrollToBottom();
      isChatAtBottom = true;
      pendingScrollToBottom = false;
    } else {
      queueScrollToBottom();
    }
    unseenNewMessageCount = 0;
  }

  function clearVisibleMessages() {
    if (chatScope === 'map') {
      messages = messages.filter((message) => message.type !== 'map');
    } else if (chatScope === 'global') {
      messages = messages.filter((message) => message.type !== 'global' && message.type !== 'party');
    } else {
      messages = [];
      parties = [];
    }

    seenMessageIds = new Set(messages.map((message) => message.msgId).filter(Boolean));
    unseenNewMessageCount = 0;
  }

  function onChatScopeTabKeydown(event: KeyboardEvent, scope: 'all' | 'map' | 'global') {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    chatScope = scope;
  }

  function onMainTabKeydown(event: KeyboardEvent, tab: ChatTab) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setTab(tab);
  }

  function getPlayerDisplayName(player: ChatPlayerProfile): string {
    return player.name || player.uuid || 'Unknown';
  }

  function getPlayerBadgeImageUrl(badge: string): string {
    return `images/badge/${badge}.png`;
  }

  function getPlayerSpriteUrl(player: ChatPlayerProfile): string {
    const spriteUrl =
      (player.spriteUrl as string | undefined) ||
      (player.spriteImg as string | undefined) ||
      (player.sprite as string | undefined);
    return typeof spriteUrl === 'string' ? spriteUrl : '';
  }

  function getPlayerThemeClass(player: ChatPlayerProfile): string {
    const raw = (player.systemName || '').trim();
    if (!raw) return '';
    const normalized = raw.replace(/'|\s$/g, '');
    if (!normalized) return '';
    return `theme_${normalized.replace(/[ ()]/g, '_')}`;
  }

  function appendMessage(input: ChatMessageInput, options: AppendMessageOptions = {}) {
    const shouldTrackAsNew = options.trackAsNew ?? true;
    const shouldScrollToBottom =
      options.scrollToBottom === 'always' || (options.scrollToBottom !== 'never' && isChatScrolledToBottom());

    const senderUuid = input.senderUuid || '';
    const player = senderUuid ? getPlayer(senderUuid) : undefined;

    const message: ChatMessage = {
      localId: nextLocalMessageId++,
      msgId: input.msgId || '',
      senderUuid,
      senderName: senderUuid ? input.senderName || player?.name || senderUuid : input.senderName || 'System',
      senderSystemName: input.senderSystemName || player?.systemName || '',
      contents: input.contents || '',
      type: input.type,
      timestamp: normalizeTimestamp(input.timestamp),
      mapId: input.mapId || '',
      prevMapId: input.prevMapId || '',
      prevLocationsStr: input.prevLocationsStr || '',
      locationName: '',
      locationUrl: '',
      x: Number.isNaN(input.x) ? -1 : (input.x ?? -1),
      y: Number.isNaN(input.y) ? -1 : (input.y ?? -1),
      senderAccount: input.senderAccount ?? player?.account ?? false,
      senderBadge: input.senderBadge ?? player?.badge ?? null
    };

    if (message.msgId) {
      if (seenMessageIds.has(message.msgId)) return;
      seenMessageIds.add(message.msgId);
    }

    if (message.senderUuid && !playerProfiles[message.senderUuid]) {
      chatPlayerStore.upsert({
        uuid: message.senderUuid,
        id: -1,
        name: message.senderName || message.senderUuid,
        systemName: message.senderSystemName || ''
      });
    }

    if (message.type === 'party' && !parties.includes('Party')) {
      parties = [...parties, 'Party'];
    }

    messages = [...messages, message].slice(-200);

    void hydrateLocationName(message);

    if (shouldScrollToBottom) {
      queueScrollToBottom();
    } else if (shouldTrackAsNew && activeTab === 'chat') {
      unseenNewMessageCount += 1;
    }
  }

  async function hydrateLocationName(message: ChatMessage) {
    if (!(message.type === 'global' || message.type === 'party')) return;

    const mapId = message.mapId || '0000';
    if (mapId === '0000') return;

    const prevMapId = message.prevMapId || '0000';
    const lang = document.documentElement.lang || 'en';

    const locationInfo = await locationResolver.resolveCurrentLocationInfo({
      gameId: getGameInitState().gameId,
      lang,
      mapId,
      prevMapId,
      prevLocationsStr: message.prevLocationsStr,
      x: message.x,
      y: message.y
    });

    if (!locationInfo.name) return;

    messages = messages.map((entry) =>
      entry.localId === message.localId
        ? {
            ...entry,
            locationName: locationInfo.name,
            locationUrl: locationInfo.url || ''
          }
        : entry
    );
  }

  function setTab(tab: ChatTab) {
    activeTab = tab;
  }

  function activatePlayerTheme(systemName?: string) {
    if (!systemName) return;
    const normalized = systemName.replace(/'|\s$/g, '');
    if (!normalized) return;
    try {
      activateTheme(normalized, getGameInitState().gameId, currentGameId);
    } catch (err) {
      // Theme initialization should never block chat history/messages.
      console.warn('Failed to activate player theme:', normalized, err);
    }
  }

  function clearPendingTimers() {
    if (historyRetryTimer !== null) {
      clearTimeout(historyRetryTimer);
      historyRetryTimer = null;
    }
  }

  function disconnectSession() {
    clearPendingTimers();
    sessionClient.disconnect();
  }

  async function loadInitialChatHistory(force = false) {
    if (isLoadingInitialHistory) return;
    if (hasLoadedInitialHistory && !force) return;

    if (historyRetryTimer !== null) {
      clearTimeout(historyRetryTimer);
      historyRetryTimer = null;
    }

    isLoadingInitialHistory = true;

    try {
      const history = await apiFetch<{
        players?: ChatHistoryPlayer[];
        messages?: ChatHistoryMessage[];
      }>('/chathistory?globalMsgLimit=50&partyMsgLimit=50', { method: 'GET' });

      const historyPlayers: Record<string, ChatPlayerProfile> = {};
      if (Array.isArray(history.players)) {
        const fullPlayers: ChatPlayerProfile[] = history.players.map((player) => ({
          uuid: player.uuid,
          id: player.id ?? -1,
          name: player.name ?? player.uuid,
          systemName: player.systemName ?? '',
          rank: player.rank ?? 0,
          account: parseAccountFlag(player.account, false),
          badge:
            player.badge === undefined || player.badge === null || player.badge === 'null'
              ? null
              : String(player.badge),
          medals: player.medals ?? null
        }));

        for (const player of fullPlayers) {
          historyPlayers[player.uuid] = player;
          activatePlayerTheme(player.systemName);
        }
        chatPlayerStore.upsertMany(fullPlayers);
      }

      if (Array.isArray(history.messages)) {
        for (const message of history.messages) {
          const senderUuid = message.uuid || '';
          const sender = historyPlayers[senderUuid] || getPlayer(senderUuid);
          appendMessage(
            {
              msgId: message.msgId,
              senderUuid,
              senderName: sender?.name || senderUuid,
              senderSystemName: sender?.systemName || '',
              contents: message.contents || '',
              type: message.party ? 'party' : 'global',
              timestamp: message.timestamp,
              mapId: message.mapId,
              prevMapId: message.prevMapId,
              prevLocationsStr: message.prevLocationsStr || message.prevLocations || '',
              x: message.x,
              y: message.y,
              senderAccount: sender?.account,
              senderBadge: sender?.badge ?? null
            },
            { scrollToBottom: 'never', trackAsNew: false }
          );
        }
      }

      queueScrollToBottom();

      hasLoadedInitialHistory = true;
    } catch (err) {
      hasLoadedInitialHistory = false;
      console.error('Failed to load initial chat history:', err);
      if (isMounted && show) {
        historyRetryTimer = window.setTimeout(() => {
          void loadInitialChatHistory();
        }, 3000);
      }
    } finally {
      isLoadingInitialHistory = false;
    }
  }

  function getPlayer(uuid?: string): ChatPlayerProfile | undefined {
    if (!uuid) return undefined;
    return playerProfiles[uuid];
  }

  function onSubmitMessage(event: SubmitEvent) {
    event.preventDefault();
    const contents = draftMessage.trim();
    if (!contents) return;

    appendMessage({
      senderUuid: 'you',
      senderName: 'You',
      contents,
      type: 'global',
      timestamp: Date.now()
    });

    draftMessage = '';
  }

  $effect(() => {
    if (!show) {
      disconnectSession();
      connStatus = 'Disconnected';
      return;
    }

    void loadInitialChatHistory();
    sessionClient.connect();
  });

  $effect(() => {
    if (!pendingScrollToBottom || !show || activeTab !== 'chat') return;

    void tick().then(() => {
      if (!pendingScrollToBottom || !show || activeTab !== 'chat') return;
      messagesListRef?.scrollToBottom();
      isChatAtBottom = true;
      unseenNewMessageCount = 0;
      pendingScrollToBottom = false;
    });
  });
</script>

{#if show}
  <div id="chatboxContainer" class="container" role="presentation">
    <div id="chatbox" class="allChat">
      <div id="chatboxInfo">
        <div id="onlineInfo" class="info">
          <span id="connStatus" class="infoContainer unselectable"
            ><span id="connStatusIcon" class="punct">●</span><span id="connStatusText" class="infoText"
              >{connStatus}{#if playerCount !== null}
                ({playerCount}){/if}</span
            ></span
          >
        </div>
        <div id="location" class="info hidden">
          <span id="locationLabel" class="infoLabel nowrap" data-i18n="[html]chatbox.location">Location:&nbsp;</span
          ><span id="locationText" class="infoText nofilter"></span>
        </div>
      </div>
      <div id="chatboxContent" role="presentation">
        <div id="chatboxTabs" role="tablist" aria-label="Chat tabs">
          <div
            id="chatboxTabChat"
            class="chatboxTab"
            class:active={activeTab === 'chat'}
            role="tab"
            tabindex="0"
            aria-selected={activeTab === 'chat'}
            data-tab-section="chat"
            onclick={() => setTab('chat')}
            onkeydown={(event) => onMainTabKeydown(event, 'chat')}
          >
            <span class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.chat">Chat</span>
          </div>
          <div
            id="chatboxTabPlayers"
            class="chatboxTab"
            class:active={activeTab === 'players'}
            role="tab"
            tabindex="0"
            aria-selected={activeTab === 'players'}
            data-tab-section="players"
            onclick={() => setTab('players')}
            onkeydown={(event) => onMainTabKeydown(event, 'players')}
          >
            <span class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.players">Players</span>
          </div>
          <div
            id="chatboxTabParties"
            class="chatboxTab"
            class:active={activeTab === 'parties'}
            role="tab"
            tabindex="0"
            aria-selected={activeTab === 'parties'}
            data-tab-section="parties"
            onclick={() => setTab('parties')}
            onkeydown={(event) => onMainTabKeydown(event, 'parties')}
          >
            <span class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.parties">Parties</span>
          </div>
        </div>
        <div id="chat" class="chatboxTabSection" class:hidden={activeTab !== 'chat'}>
          <div id="chatHeader" class="tabHeader">
            <div id="chatTabs" class="subTabs" role="tablist" aria-label="Chat filters">
              <div
                id="chatTabAll"
                class="chatTab subTab"
                class:active={chatScope === 'all'}
                role="tab"
                tabindex="0"
                aria-selected={chatScope === 'all'}
                onclick={() => (chatScope = 'all')}
                onkeydown={(event) => onChatScopeTabKeydown(event, 'all')}
              >
                <small class="chatTabLabel subTabLabel infoLabel unselectable">All</small>
                <div class="subTabBg"></div>
              </div>
              <div
                id="chatTabMap"
                class="chatTab subTab"
                class:active={chatScope === 'map'}
                role="tab"
                tabindex="0"
                aria-selected={chatScope === 'map'}
                onclick={() => (chatScope = 'map')}
                onkeydown={(event) => onChatScopeTabKeydown(event, 'map')}
              >
                <small class="chatTabLabel subTabLabel infoLabel unselectable">Map</small>
                <div class="subTabBg"></div>
              </div>
              <div
                id="chatTabGlobal"
                class="chatTab subTab"
                class:active={chatScope === 'global'}
                role="tab"
                tabindex="0"
                aria-selected={chatScope === 'global'}
                onclick={() => (chatScope = 'global')}
                onkeydown={(event) => onChatScopeTabKeydown(event, 'global')}
              >
                <small class="chatTabLabel subTabLabel infoLabel unselectable">Global</small>
                <div class="subTabBg"></div>
              </div>
            </div>
            <div id="chatButtons" class="tabButtons">
              <button
                id="globalMessageLocationsButton"
                class="iconButton toggleButton offToggleButton unselectable"
                class:toggled={hideLocations}
                aria-label="Toggle locations"
                onclick={() => (hideLocations = !hideLocations)}
              >
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                  <path
                    d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18v18q-10-9 0-18 10 9 0 18m-7.5-4q7.5-3 15 0m-15-10q7.5 2 15 0m-16.5 5h18"
                  /><path d="m-2 16l22-14" />
                </svg>
              </button>
              <button
                id="messageTimestampsButton"
                class="iconButton toggleButton offToggleButton unselectable"
                class:toggled={hideTimestamps}
                aria-label="Toggle timestamps"
                onclick={() => (hideTimestamps = !hideTimestamps)}
              >
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                  <path d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18m0 3v6l4 4" /><path d="m-2 16l22-14" />
                </svg>
              </button>
              <button
                id="mentionFilterButton"
                class="iconButton toggleButton offToggleButton unselectable"
                class:toggled={mentionsOnly}
                aria-label="Show mentions only"
                onclick={() => (mentionsOnly = !mentionsOnly)}
              >
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                  <path
                    d="M13.5 9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0Zc0 1.657 1.007 3 2.25 3S18 10.657 18 9a9 9 0 10-2.636 6.364M13.5 9V5.25"
                  />
                  <path
                    d="M13.5 9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0Zc0 1.657 1.007 3 2.25 3S18 10.657 18 9a9 9 0 10-2.636 6.364M13.5 9V5.25"
                  />
                </svg>
              </button>
              <button
                id="clearChatButton"
                class="iconButton unselectable"
                aria-label="Clear chat"
                onclick={clearVisibleMessages}
              >
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                  <path
                    d="m3 18l6-4.5h6q3 0 3-3v-7.5q0-3-3-3h-12q-3 0-3 3v7.5q0 3 3 3h1.5l-1.5 4.5m9.5-14.75l-7 7m0-7l7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
          <VirtualList
            bind:this={messagesListRef}
            onScrollStateChange={onMessagesScrollStateChange}
            id="messages"
            class={messageListClass}
            items={filteredMessages}
            estimatedItemHeight={72}
            overscan={8}
            visible={activeTab === 'chat'}
          >
            {#snippet empty()}
              <div class="messageContainer">
                <div class="message"><span class="messageContents">No messages yet.</span></div>
              </div>
            {/snippet}
            {#snippet row(message, index)}
              <ChatMessageItem
                message={message as ChatMessage}
                player={getPlayer((message as ChatMessage).senderUuid)}
                showTimestamp={shouldShowTimestamp(
                  message as ChatMessage,
                  index > 0 ? filteredMessages[index - 1] : undefined
                )}
              />
            {/snippet}
          </VirtualList>
          {#if unseenNewMessageCount > 0 && !isChatAtBottom}
            <button class="newMessagesButton" type="button" onclick={onClickNewMessages}>
              <span class="arrow" aria-hidden="true">↓</span>
              New messages
            </button>
          {/if}
        </div>
        <div id="players" class="chatboxTabSection" class:hidden={activeTab !== 'players'}>
          <VirtualList
            id="playerList"
            class="playerList chatboxTabContent scrollableContainer"
            items={players}
            estimatedItemHeight={42}
            overscan={10}
            visible={activeTab === 'players'}
          >
            {#snippet empty()}
              <div class="messageContainer"><div class="message">No players loaded.</div></div>
            {/snippet}
            {#snippet row(player)}
              {@const profile = player as ChatPlayerProfile}
              {@const spriteUrl = getPlayerSpriteUrl(profile)}
              {@const playerThemeClass = getPlayerThemeClass(profile)}
              <div
                class={playerThemeClass ? `playerListEntry listEntry ${playerThemeClass}` : 'playerListEntry listEntry'}
                data-uuid={profile.uuid}
                data-name={profile.name || ''}
                data-system-name={profile.systemName || ''}
              >
                <div class="listEntryMain">
                  {#if spriteUrl}
                    <img class="playerListEntrySprite listEntrySprite" src={spriteUrl} alt="" loading="lazy" />
                  {:else}
                    <div class="playerListEntrySprite listEntrySprite" aria-hidden="true"></div>
                  {/if}
                  <div class="nameTextContainer">
                    {#if !profile.account}
                      <span class="nameMarker">&lt;</span>
                    {/if}
                    <span class={playerThemeClass ? `nameText ${playerThemeClass}` : 'nameText'}
                      >{getPlayerDisplayName(profile)}</span
                    >
                    {#if !profile.account}
                      <span class="nameMarker">&gt;</span>
                    {/if}
                  </div>
                </div>
                <div
                  class={playerThemeClass
                    ? `playerListEntryBadge badge ${playerThemeClass}`
                    : 'playerListEntryBadge badge'}
                  class:hidden={!profile.badge}
                  style={profile.badge ? `background-image: url('${getPlayerBadgeImageUrl(profile.badge)}')` : ''}
                ></div>
              </div>
            {/snippet}
          </VirtualList>
        </div>
        <div id="parties" class="chatboxTabSection" class:hidden={activeTab !== 'parties'}>
          <VirtualList
            id="partyList"
            class="partyList chatboxTabContent scrollableContainer"
            items={parties}
            estimatedItemHeight={30}
            overscan={8}
            visible={activeTab === 'parties'}
          >
            {#snippet empty()}
              <div class="messageContainer"><div class="message">No parties detected.</div></div>
            {/snippet}
            {#snippet row(party)}
              <div class="messageContainer">
                <div class="message">{party as string}</div>
              </div>
            {/snippet}
          </VirtualList>
        </div>
      </div>
      <div id="chatInputContainer">
        <form action="javascript:void(0)" onsubmit={onSubmitMessage}>
          <input
            id="chatInput"
            type="text"
            autocomplete="off"
            maxlength="150"
            placeholder="Type a message..."
            bind:value={draftMessage}
          />
        </form>
      </div>
      <div id="enterNameContainer"></div>
    </div>
  </div>
{/if}

<style>
  #chat {
    position: relative;
  }

  #chat .newMessagesButton {
    position: absolute;
    inset-inline-start: 50%;
    transform: translateX(-50%);
    bottom: 8px;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    z-index: 2;
  }

  #chat .newMessagesButton .arrow {
    font-size: 0.95em;
    line-height: 1;
  }
</style>
