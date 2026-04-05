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
      activateTheme(normalized, getGameInitState().gameId);
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
  <div id="chatboxContainer" class="container">
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
      <div id="chatboxContent">
        <div id="chatboxTabs">
          <button
            id="chatboxTabChat"
            class="chatboxTab"
            class:active={activeTab === 'chat'}
            data-tab-section="chat"
            onclick={() => setTab('chat')}
            type="button"
          >
            <span class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.chat">Chat</span>
          </button>
          <button
            id="chatboxTabPlayers"
            class="chatboxTab"
            class:active={activeTab === 'players'}
            data-tab-section="players"
            onclick={() => setTab('players')}
            type="button"
          >
            <span class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.players">Players</span>
          </button>
          <button
            id="chatboxTabParties"
            class="chatboxTab"
            class:active={activeTab === 'parties'}
            data-tab-section="parties"
            onclick={() => setTab('parties')}
            type="button"
          >
            <span class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.parties">Parties</span>
          </button>
        </div>
        <div id="chat" class="chatboxTabSection" class:hidden={activeTab !== 'chat'}>
          <div id="chatControlsBar" class="chatControlsBar">
            <div class="chatScopeTabs" role="tablist" aria-label="Chat filters">
              <button
                type="button"
                class="chatScopeButton"
                class:active={chatScope === 'all'}
                onclick={() => (chatScope = 'all')}
              >
                All
              </button>
              <button
                type="button"
                class="chatScopeButton"
                class:active={chatScope === 'map'}
                onclick={() => (chatScope = 'map')}
              >
                Map
              </button>
              <button
                type="button"
                class="chatScopeButton"
                class:active={chatScope === 'global'}
                onclick={() => (chatScope = 'global')}
              >
                Global
              </button>
            </div>
            <div class="chatControlToggles">
              <button
                type="button"
                class="chatControlIcon"
                class:active={!hideLocations}
                aria-label="Toggle locations"
                onclick={() => (hideLocations = !hideLocations)}
              >
                ◎
              </button>
              <button
                type="button"
                class="chatControlIcon"
                class:active={!hideTimestamps}
                aria-label="Toggle timestamps"
                onclick={() => (hideTimestamps = !hideTimestamps)}
              >
                ◷
              </button>
              <button
                type="button"
                class="chatControlIcon"
                class:active={mentionsOnly}
                aria-label="Show mentions only"
                onclick={() => (mentionsOnly = !mentionsOnly)}
              >
                @
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
              <div class="messageContainer">
                <div class="message">
                  <bdi>{(player as ChatPlayerProfile).name || (player as ChatPlayerProfile).uuid}</bdi>
                  <small class="infoLabel">{(player as ChatPlayerProfile).uuid}</small>
                  {#if (player as ChatPlayerProfile).systemName}
                    <small class="infoLabel">theme: {(player as ChatPlayerProfile).systemName}</small>
                  {/if}
                  {#if (player as ChatPlayerProfile).badge}
                    <small class="infoLabel">badge: {(player as ChatPlayerProfile).badge}</small>
                  {/if}
                  {#if (player as ChatPlayerProfile).rank}
                    <small class="infoLabel">rank: {(player as ChatPlayerProfile).rank}</small>
                  {/if}
                </div>
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

  #chat .chatControlsBar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: -30px 6px 6px;
    padding: 2px 8px;
    border: 2px solid rgba(251, 156, 52, 0.95);
    border-radius: 12px;
    background-color: rgba(var(--shadow-color), 0.75);
    box-shadow: 0 0 0 1px rgba(67, 31, 6, 0.85), 0 0 8px rgba(251, 156, 52, 0.35);
    z-index: 3;
  }

  #chat .chatScopeTabs,
  #chat .chatControlToggles {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  #chat .chatScopeButton,
  #chat .chatControlIcon {
    min-height: 22px;
    padding: 0 8px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: rgb(var(--base-color));
    font-weight: 600;
    line-height: 1;
  }

  #chat .chatControlIcon {
    min-width: 24px;
    padding: 0 6px;
    font-size: 15px;
  }

  #chat .chatScopeButton.active,
  #chat .chatControlIcon.active {
    background: rgba(var(--base-bg-color), 0.85);
    box-shadow: inset 0 0 0 1px rgba(var(--base-color), 0.4);
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

  :global(body.highContrast) #chat .chatControlsBar {
    border-color: rgba(var(--base-color), 0.55);
    background-color: rgba(var(--base-bg-color), 0.78);
    box-shadow: inset 0 0 0 1px rgba(var(--base-color), 0.22);
  }

  :global(body.highContrast) #chat .chatScopeButton.active,
  :global(body.highContrast) #chat .chatControlIcon.active {
    background: rgba(var(--base-bg-color), 0.92);
    box-shadow: inset 0 0 0 1px rgba(var(--base-color), 0.3);
  }
</style>
