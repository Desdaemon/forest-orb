<script>
	// Registers every session websocket command handler exactly once, on mount.
	// These used to run as import-time side effects in the modules below.
	import { register2kkiSessionHandlers } from '$lib/2kki';
	import { registerChatSessionHandlers } from '$lib/chat.svelte';
	import { registerEventSessionHandlers } from '$lib/events';
	import { registerFriendsSessionHandlers } from '$lib/friends';
	import { registerLocationsSessionHandlers } from '$lib/locations.svelte';
	import { registerPlayerListSessionHandlers } from '$lib/playerlist.svelte';
	import { registerPlaySessionHandlers } from '$lib/play.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		registerPlaySessionHandlers();
		registerPlayerListSessionHandlers();
		registerChatSessionHandlers();
		registerLocationsSessionHandlers();
		register2kkiSessionHandlers();
		registerFriendsSessionHandlers();
		registerEventSessionHandlers();
	});
</script>
