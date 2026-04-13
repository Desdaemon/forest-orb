import { getGameInitState } from './init';
import type { ChatPlayerProfile } from './stores/chatPlayer';
import { easyrpgPlayer } from './play';
import { writable } from 'svelte/store';

type SessionCommandHandler = (args: string[]) => void;

export type SessionClient = {
  connect: () => void;
  disconnect: () => void;
  subscribe: (run: (value: SessionState) => void) => () => void;
  sendCommand: (command: string, params?: string[]) => void;
  onCommand: (command: string, handler: SessionCommandHandler | undefined) => void;
};

export const activeSession = writable<SessionClient | null>(null);

export const ConnectionStatus = Object.freeze({
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  PRIVATE: 3,
  SINGLEPLAYER: 4
});
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

type SessionMessagePayload = {
  senderUuid?: string;
  senderName?: string;
  senderSystemName?: string;
  contents?: string;
  type: 'map' | 'global' | 'party';
  timestamp?: number;
  msgId?: string;
  mapId?: string;
  prevMapId?: string;
  prevLocationsStr?: string;
  x?: number;
  y?: number;
  senderAccount?: boolean;
  senderBadge?: string | null;
};

type ChatSessionClientOptions = {
  shouldConnect: () => boolean;
  onReconnectAttemptChange: (attempt: number) => void;
  onOpen: () => void;
  onAppendMessage: (message: SessionMessagePayload) => void;
  getPlayer: (uuid?: string) => ChatPlayerProfile | undefined;
  onPlayerProfile: (profile: ChatPlayerProfile) => void;
  onPlayerMessagesUpdate: (uuid: string, profile: ChatPlayerProfile) => void;
  onActivatePlayerTheme: (systemName?: string) => void;
};

const wsDelim = '\uffff';

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

function getSessionWsUrl() {
  const state = getGameInitState();
  const wsBase = state.serverUrl.replace(/^http/, 'ws');
  return `${wsBase}/session`;
}

type SessionState = {
  connState: ConnectionStatus;
  playerCount: number;
};

export function createChatSessionClient(options: ChatSessionClientOptions) {
  let reconnectAttempt = 0;
  let reconnectTimer: number | null = null;
  let sessionWs: WebSocket | null = null;
  let sessionCommandHandlers: Record<string, SessionCommandHandler | undefined> = {};
  let sessionCommandCallbackQueue: Record<string, Array<(args: string[]) => void>> = {};
  const state = writable<SessionState>({
    connState: ConnectionStatus.DISCONNECTED,
    playerCount: 0
  });

  function setConnState(connState: ConnectionStatus) {
    state.update((old) => ({ ...old, connState }));
  }

  function clearReconnectTimer() {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function addSessionCommandHandler(command: string, handler?: SessionCommandHandler) {
    sessionCommandHandlers[command] = handler;
    sessionCommandCallbackQueue[command] = [];
  }

  function initSessionCommandHandlers() {
    sessionCommandHandlers = {};
    sessionCommandCallbackQueue = {};

    addSessionCommandHandler('p', (args) => {
      const [uuid, name, systemName, rankStr, accountStr, badgeArg, ...medalArgs] = args;
      if (!uuid) return;

      const existing = options.getPlayer(uuid);
      const rankValue = Number.parseInt(rankStr || '', 10);
      const medals = medalArgs
        .slice(0, 5)
        .map((value) => Number.parseInt(value || '', 10))
        .filter((value) => !Number.isNaN(value));

      const nextProfile: ChatPlayerProfile = {
        uuid,
        id: existing?.id ?? -1,
        name: name || existing?.name || uuid,
        systemName: systemName || existing?.systemName || '',
        rank: Number.isNaN(rankValue) ? (existing?.rank ?? 0) : rankValue,
        account: parseAccountFlag(accountStr, existing?.account ?? false),
        badge:
          badgeArg === undefined || badgeArg === ''
            ? (existing?.badge ?? null)
            : badgeArg === 'null'
              ? null
              : String(badgeArg),
        medals: medals.length === 5 ? medals : (existing?.medals ?? null)
      };

      options.onPlayerProfile(nextProfile);
      options.onActivatePlayerTheme(nextProfile.systemName);
      options.onPlayerMessagesUpdate(uuid, nextProfile);
    });

    addSessionCommandHandler('say', (args) => {
      const [uuid, contents] = args;
      options.onAppendMessage({
        senderUuid: uuid,
        contents: contents || '',
        type: 'map',
        timestamp: Date.now()
      });
    });

    addSessionCommandHandler('gsay', (args) => {
      const senderUuid = args[0] || '';
      const sender = options.getPlayer(senderUuid);

      const hasNumericCoords =
        args.length >= 6 &&
        !Number.isNaN(Number.parseInt(args[4] || '', 10)) &&
        !Number.isNaN(Number.parseInt(args[5] || '', 10));

      const hasLegacyHeader = args.length >= 7 && hasNumericCoords;

      const mapId = hasLegacyHeader ? args[1] || '' : '';
      const prevMapId = hasLegacyHeader ? args[2] || '' : '';
      const prevLocationsStr = hasLegacyHeader ? args[3] || '' : '';
      const x = hasLegacyHeader ? Number.parseInt(args[4] || '', 10) : -1;
      const y = hasLegacyHeader ? Number.parseInt(args[5] || '', 10) : -1;
      const msgId = hasLegacyHeader && args.length >= 8 ? args[args.length - 1] || '' : '';
      const contents = hasLegacyHeader
        ? args.slice(6, msgId ? -1 : undefined).join(' ')
        : args.length >= 2
          ? args.slice(1).join(' ')
          : '';

      options.onAppendMessage({
        senderUuid,
        senderName: sender?.name || senderUuid,
        senderSystemName: sender?.systemName || '',
        senderAccount: sender?.account,
        senderBadge: sender?.badge ?? null,
        contents,
        msgId,
        type: 'global',
        timestamp: Date.now(),
        mapId,
        prevMapId,
        prevLocationsStr,
        x,
        y
      });
    });

    addSessionCommandHandler('psay', (args) => {
      options.onAppendMessage({
        senderUuid: args[0],
        contents: args[1] || '',
        msgId: args[2],
        type: 'party',
        timestamp: Date.now()
      });
    });

    addSessionCommandHandler('pc', (args) => {
      const nextCount = Number.parseInt(args[0] || '', 10);
      if (!Number.isNaN(nextCount)) {
        state.update((old) => ({ ...old, playerCount: nextCount }));
      }
    });

    addSessionCommandHandler('lcol');
    addSessionCommandHandler('ttr');
  }

  function onSessionMessage(data: string) {
    const args = data.split(wsDelim);
    const command = args[0];
    const params = args.slice(1);

    if (!(command in sessionCommandHandlers)) return;

    const handler = sessionCommandHandlers[command];
    if (handler) {
      handler(params);
    }

    const callbacks = sessionCommandCallbackQueue[command] || [];
    while (callbacks.length) {
      const callback = callbacks.shift();
      if (callback) callback(params);
    }
  }

  function scheduleReconnect() {
    if (!options.shouldConnect()) return;
    clearReconnectTimer();
    reconnectAttempt += 1;
    options.onReconnectAttemptChange(reconnectAttempt);
    const delay = Math.min(5000 * reconnectAttempt, 30000);
    reconnectTimer = window.setTimeout(() => {
      connect();
    }, delay);
  }

  function disconnect() {
    clearReconnectTimer();
    if (!sessionWs) return;
    sessionWs.onopen = null;
    sessionWs.onmessage = null;
    sessionWs.onerror = null;
    sessionWs.onclose = null;
    sessionWs.close();
    sessionWs = null;
  }

  function connect() {
    if (!options.shouldConnect()) return;
    disconnect();

    setConnState(ConnectionStatus.DISCONNECTED);
    try {
      sessionWs = new WebSocket(getSessionWsUrl());
    } catch (err) {
      setConnState(ConnectionStatus.DISCONNECTED);
      console.error('Failed to create session websocket:', err);
      scheduleReconnect();
      return;
    }

    sessionWs.onopen = () => {
      reconnectAttempt = 0;
      options.onReconnectAttemptChange(reconnectAttempt);
      setConnState(ConnectionStatus.CONNECTED);
      initSessionCommandHandlers();
      easyrpgPlayer.sessionReady();
      options.onOpen();
    };

    sessionWs.onmessage = (event) => {
      if (typeof event.data === 'string') {
        onSessionMessage(event.data);
      }
    };

    sessionWs.onerror = () => {
      setConnState(ConnectionStatus.DISCONNECTED);
    };

    sessionWs.onclose = (event) => {
      sessionWs = null;
      if (event.code === 1028) {
        setConnState(ConnectionStatus.DISCONNECTED);
        return;
      }
      if (!options.shouldConnect()) {
        setConnState(ConnectionStatus.DISCONNECTED);
        return;
      }
      scheduleReconnect();
    };
  }

  function sendCommand(command: string, params: string[] = []) {
    if (!sessionWs || sessionWs.readyState !== WebSocket.OPEN) return;
    sessionWs.send([command, ...params].join(wsDelim));
  }

  return {
    connect,
    disconnect,
    subscribe: state.subscribe,
    sendCommand,
    onCommand: addSessionCommandHandler
  };
}
