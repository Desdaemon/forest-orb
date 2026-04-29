<script>
	import { onMount } from 'svelte';
	import ScheduleItem from './ScheduleItem.svelte';
	import { apiFetch } from '../init.js'; // Assuming path is correct

	/** @type {{ isOpen: boolean, player: any, gameId: string, joinedPartyId: string | null, joinedPartyCache: any, localizedMessages: any, config: any, systemName: string, YEAR: number }} */
	let { 
		isOpen = $bindable(), 
		player = $bindable(),
		gameId,
		joinedPartyId,
		joinedPartyCache,
		localizedMessages,
		config,
		systemName,
		YEAR
	} = $props();

	let schedules = $state([]);
	let isLoading = $state(false);
	let showEmpty = $state(true);

	// For the edit modal
	let showEditModal = $state(false);
	let editingScheduleId = $state(null);
	let editFormData = $state({});

	async function fetchSchedules() {
		isLoading = true;
		try {
			const response = await apiFetch('schedule?command=list');
			if (!response.ok) throw new Error(response.statusText);
			const data = await response.json();
			schedules = (data || []).sort((a, z) => +z.official - +a.official || a.datetime.localeCompare(z.datetime));
		} catch (err) {
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		if (isOpen) {
			fetchSchedules();
		}
	});

	function handleClose() {
		isOpen = false;
	}

	function openEditModal(schedule) {
		editingScheduleId = schedule.id;
		editFormData = { ...schedule };
		showEditModal = true;
	}

	async function handleCancelSchedule(schedule) {
		if (confirm(localizedMessages.schedules.confirmCancel)) {
			const response = await apiFetch(`schedule?command=cancel&scheduleId=${schedule.id}`);
			if (response.ok) {
				await fetchSchedules();
			} else {
				console.error(response.statusText);
			}
		}
	}
</script>

{#if isOpen}
	<div id="schedulesModal" class="modal">
		<a href="javascript:void(0);" class="modalClose" onclick={handleClose}>✖</a>
		<div class="modalHeader">
			<h1 class="modalTitle" data-i18n="[html]modal.schedule.title">Events</h1>
		</div>
		<div class="modalContent">
			<div style="width:100%">
				<div class="messageContainer themeText scheduleGroupHeader" data-i18n="[html]modal.schedule.official">
					Official Events
				</div>
				<div class="scheduleContainer">
					{#each schedules.filter(s => s.official) as schedule}
						<ScheduleItem 
							{schedule} 
							isMod={player && player.rank > 0} 
							{gameId} 
							joinedPartyId={joinedPartyId}
							{localizedMessages}
							{config}
							{systemName}
							{player}
							onEdit={() => openEditModal(schedule)}
							onCancel={() => handleCancelSchedule(schedule)}
						/>
					{/each}
				</div>
			</div>

			<div style="width:100%">
				<div class="messageContainer themeText scheduleGroupHeader" data-i18n="[html]modal.schedule.ongoing">
					Ongoing Events
				</div>
				<div class="scheduleContainer">
					{#each schedules.filter(s => !s.official && (!s.partyId || s.partyId === joinedPartyId)) as schedule}
						<ScheduleItem 
							{schedule} 
							isMod={player && player.rank > 0} 
							{gameId} 
							joinedPartyId={joinedPartyId}
							{localizedMessages}
							{config}
							{systemName}
							{player}
							onEdit={() => openEditModal(schedule)}
							onCancel={() => handleCancelSchedule(schedule)}
						/>
					{/each}
				</div>
			</div>

			<div style="width:100%">
				<div class="messageContainer themeText scheduleGroupHeader" data-i18n="[html]modal.schedule.party">
					Party Events
				</div>
				<div class="scheduleContainer">
					{#each schedules.filter(s => s.partyId && s.partyId === joinedPartyId) as schedule}
						<ScheduleItem 
							{schedule} 
							isMod={player && player.rank > 0} 
							{gameId} 
							joinedPartyId={joinedPartyId}
							{localizedMessages}
							{config}
							{systemName}
							{player}
							onEdit={() => openEditModal(schedule)}
							onCancel={() => handleCancelSchedule(schedule)}
						/>
					{/each}
				</div>
			</div>

			<div style="width:100%">
				<div class="messageContainer themeText scheduleGroupHeader" data-i18n="[html]modal.schedule.future">
					Future Events
				</div>
				<div class="scheduleContainer">
					{#each schedules.filter(s => !s.official && (!s.partyId || s.partyId !== joinedPartyId)) as schedule}
						<ScheduleItem 
							{schedule} 
							isMod={player && player.rank > 0} 
							{gameId} 
							joinedPartyId={joinedPartyId}
							{localizedMessages}
							{config}
							{systemName}
							{player}
							onEdit={() => openEditModal(schedule)}
							onCancel={() => handleCancelSchedule(schedule)}
						/>
					{/each}
				</div>
			</div>

			{#if schedules.length === 0}
				<div id="emptySchedules" class="hidden" data-i18n="[html]modal.schedule.noResults">
					No events have been scheduled.
				</div>
			{/if}
		</div>
		<div class="modalFooter">
			{#if player?.account}
				<button
					id="createSchedule"
					type="button"
					class="unselectable"
					onclick={() => openEditModal({})}
					data-i18n="[html]modal.schedule.doSchedule"
				>
					Schedule an Event
				</button>
			{/if}
		</div>
	</div>
{/if}
