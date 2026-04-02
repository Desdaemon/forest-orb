import { writable } from 'svelte/store';

export const selectedBadge = writable<string | null>(null);

export const badgeStore = {
	subscribe: selectedBadge.subscribe,
	set: (badgeId: string) => selectedBadge.set(badgeId),
	reset: () => selectedBadge.set(null),
};
