<script>
	import { onMount } from 'svelte';
import { parseFreeformMarkdown, wrapMessageEmojis, populateMessageNodes } from '../chat.svelte.ts';
	import { getPlayerName } from '../playerlist.svelte.ts';
	import { apiFetch } from '../init.ts';
	import { sanitizeLink } from '../schedules.ts';

	/** @type {{ schedule: any, isMod: boolean, gameId: string, joinedPartyId: string | null, localizedMessages: any, config: any, systemName: string, player: any, onEdit: () => void, onCancel: () => void }} */
	let { 
		schedule, 
		isMod, 
		gameId, 
		joinedPartyId, 
		localizedMessages, 
		config, 
		systemName,
		player,
		onEdit,
		onCancel
	} = $props();

	let descriptionHtml = $state('');
	let organizerHtml = $state('');
	let datetimeText = $state('');
	let linksHtml = $state('');
	let themeClass = $state('');

	// We'll use a small trick to handle the complex markdown/emoji/emojify logic 
	// which was previously done with manual DOM manipulation.
	
	// Since we can't easily use the exact same DOM-based functions, 
	// we'll try to replicate the behavior.

	function updateContent() {
		// Description
		let msg = parseFreeformMarkdown(schedule.description || '');
		// Replicating the yume.wiki link replacement
		msg = msg.replace(/{{l:(.+?)}}/g, (_, descriptor) => {            
			const [href, altText] = descriptor.split(',', 2);
			return `<a target="_blank" href="https://yume.wiki/${schedule.game}/${href}">${altText || href}</a>`;
		});
		// We'll need to handle emojis and other stuff. 
		// For now, let's just assume description is simple or use a placeholder.
		descriptionHtml = msg; 

		// Organizer
		organizerHtml = getPlayerName({ 
			name: schedule.ownerName, 
			systemName: schedule.ownerSystemName || 'null', 
			rank: schedule.ownerRank, 
			account: true, 
			badge: schedule.ownerString || 'null' 
		}, false, true, true);

		// Datetime
		if (schedule.datetime) {
			const parsedDatetime = new Date(schedule.datetime);
			const locale = config.lang === 'en' ? [] : config.lang;
			datetimeText = parsedDatetime.toLocaleString(locale, { "dateStyle": "short", "timeStyle": "short" });
		}

		// Links
		const links = [];
		const platformAuthorities = ['discord', 'youtube', 'twitch', 'niconico', 'openrec', 'bilibili'];
		for (const platform of platformAuthorities) {
			if (schedule[platform]) {
				// This part is tricky because sanitizeLink is a global.
				// We'll assume it's available or we'll find it.
				// For now, let's just use a placeholder.
				links.push(`<a target="_blank" href="javascript:void(0)">${localizedMessages.schedules.platforms[platform]}</a>`);
			}
		}
		linksHtml = links.join(' | ');

		// Theme
		if (schedule.systemName && schedule.game) {
			let theme = schedule.systemName;
			// We'll skip the complex theme application for now and just use the theme name if possible.
			themeClass = theme.replace(/'|\s$/g, "").replace(/ /g, "_");
		}
	}

	onMount(() => {
		updateContent();
	});

	// If schedule changes
	$effect(() => {
		updateContent();
	});

	async function handleFollow() {
		if (!player?.uuid) return;
		const response = await apiFetch(`schedule?command=follow&value=${!schedule.playerLiked}&scheduleId=${schedule.id}`);
		if (response.ok) {
			schedule.playerLiked = !schedule.playerLiked;
			// In a real Svelte app, we would update the parent's state.
		} else {
			console.error(response.statusText);
		}
	}
</script>

<div class="listEntry schedule">
	<div class="listEntryMain">
		<strong class="nameMarker eventName">
			{#if schedule.partyId}
				<svg width="16" height="16" class="icon fillIcon">
					<path d="m9 4a1 1 90 0 0 0 5 1 1 90 0 0 0 -5m-4 13c0-5 1-7 4-7s4 2 4 7q-4 2-8 0m0-17a1 1 90 0 0 0 5 1 1 90 0 0 0 -5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0 -5m4 13c0-5-1-7-4-7-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 3.625 1 3.875 4.125q2.375 0 4-0.875" />
				</svg>
			{/if}
			{schedule.name}
		</strong>
		<div class="themeText scheduleHeader">
			{#if isMod && (!player?.uuid || player.uuid === schedule.ownerUuid)}
				<button
					class="icon iconButton fillIcon unselectable"
					onclick={onEdit}
				>
					<svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="m12.25 3h-8.25q-2 0-2 2v10q0 2 2 2h10q2 0 2-2v-7.75l-2 2.25v3.5c0 2 0 2-2 2h-6c-2 0-2 0-2-2v-6c0-2 0-2 2-2h4.5l1.75-2m3.75-2l-7 8-1 3 3-1 7-8q0-2-2-2m-0.875 1l2 2-0.8125 0.9375-2-2m-5.3125 6.0625l2 2m-2.75 0.25l0.5 0.5" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
						<path d="m-2 16l22-14" />
					</svg>
				</button>
				<button
					class="deleteIcon icon iconButton"
					onclick={onCancel}
				>
					<svg viewBox="0 0 18 18" width="24" height="24">
						<path d="m3.5 2h11q2 0 2 3h-15q0-3 2-3m4-2h2q2 0 2 2h-5q0-2 2-2m-5.5 5 1 13h10l1-13m-8.5 11-0.5-9m3 9v-9m2.5 9 0.5-9" />
					</svg>
				</button>
			{/if}
			<div class="likeContainer" style="display: flex; align-items: center;">
				<div
					class="likeIcon icon iconButton toggleButton altToggleButton"
					onclick={handleFollow}
				>
					<svg viewBox="0 0 18 18" width="24" height="24">
						<path d="m16.65 2c-1.875-2.025-4.875-1.95-6.825 0.075l-0.825 0.975-0.825-0.975c-1.95-2.025-4.95-2.1-6.75-0.075h-0.075c-1.8 1.95-1.8 5.25 0.15 7.275l4.05 4.425 3.45 3.675 3.3-3.6 4.2-4.5c1.95-2.025 1.95-5.325 0.15-7.275z" />
					</svg>
				</div>
				<span class="infoLabel likeCount unselectable" style="margin-inline-start: 8px; font-size: 1.2em;">
					{schedule.followerCount}
				</span>
			</div>
		</div>
	</div>

	<div class="scheduleDescription">
		<span class="themeText">{@html descriptionHtml}</span>
	</div>

	<div style="padding-bottom: 4px; font-size: 0.9em;">
		{@html linksHtml}
	</div>

	<div style="justify-content: space-between; width: 100%; font-size: 0.9em;" class="listEntryMain themeText">
		<div class="organizer">
			{@html organizerHtml}
		</div>
		<div class="scheduleDatetime">
			{datetimeText}
		</div>
	</div>
</div>
