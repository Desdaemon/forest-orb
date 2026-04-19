// See https://svelte.dev/docs/kit/types#app.d.ts

import type { GameId } from "$lib/allGameUiThemes";

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}

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

    export interface EditEventModalData {
      schedule: Partial<App.Schedule>;
      playerData?: unknown;
      joinedPartyId?: number | null;
      joinedPartyCache?: unknown;
      gameId?: GameId;
    }

    export type UiThemeModalData = {
      gameId?: GameId;
      pickerMode?: boolean;
      pickerTheme?: string;
    }
  }

  async function createEasyRpgPlayer(init: Record<string, unknown>): Promise<unknown>;
}

export {};
