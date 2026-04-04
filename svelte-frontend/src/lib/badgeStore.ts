import { writable } from 'svelte/store';
import type { Badge } from './components/BadgeItem.svelte';

export const selectedBadge = writable<string | Badge>('null');

export const badgeStore = {
  subscribe: selectedBadge.subscribe,
  set: (badgeId: string) => selectedBadge.set(badgeId),
  reset: () => selectedBadge.set('null'),
};
