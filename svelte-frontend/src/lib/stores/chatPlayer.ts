import { writable } from 'svelte/store';

export type ChatPlayerProfile = {
  uuid: string;
  id: number;
  name: string;
  systemName: string;
  rank: number;
  account: boolean;
  badge: string | null;
  medals: unknown;
  [extra: string]: unknown;
};

type ChatPlayerState = Record<string, ChatPlayerProfile>;

const chatPlayers = writable<ChatPlayerState>({});

export const chatPlayerStore = {
  subscribe: chatPlayers.subscribe,
  reset: () => chatPlayers.set({}),
  upsert: (profile: { uuid: string } & Partial<ChatPlayerProfile>) => {
    chatPlayers.update((state) => {
      const existing = state[profile.uuid];
      return {
        ...state,
        [profile.uuid]: {
          ...existing,
          ...profile
        }
      };
    });
  },
  upsertMany: (profiles: ChatPlayerProfile[]) => {
    if (!profiles.length) return;

    chatPlayers.update((state) => {
      const next = { ...state };
      for (const profile of profiles) {
        const existing = next[profile.uuid];
        next[profile.uuid] = {
          ...existing,
          ...profile
        };
      }
      return next;
    });
  },
  removeByUuid: (uuid: string) => {
    chatPlayers.update((state) => {
      if (!state[uuid]) return state;
      const next = { ...state };
      delete next[uuid];
      return next;
    });
  }
};
