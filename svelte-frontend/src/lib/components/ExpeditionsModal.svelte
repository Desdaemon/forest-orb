<script>
	/** @type {'locations' | 'vms'} */
	let activeTab = $state('locations');
</script>

<div id="eventsModal" class="modal accountRequired hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.events.title">Expeditions</h1>
	</div>
	<div class="modalContent">
		<div id="expRankInfoContainer" class="modalInfoContainer">
			<label id="totalExp">0 ExP</label>
			<div id="expRankContainer">
				<label id="expRank">Rank: Novice</label>
				<img id="expRankBadge" class="badge" style="display: none" />
			</div>
		</div>
		<div id="rankExpContainer">
			<label id="rankExpLabel" class="progressBarHeading" data-i18n="[html]modal.events.rankExp">Next Rank</label>
			<div id="rankExpBarContainer" class="progressBarContainer">
				<label id="rankExpBarLabel" class="progressBarLabel altText unselectable"></label>
				<div id="rankExpBar" class="progressBar"></div>
			</div>
		</div>
		<div id="eventPeriodInfoContainer">
			<h3 id="eventPeriod">Season 1</h3>
			<label id="eventPeriodEndDateLabel">Ends</label>
		</div>
		<label id="weekExpLabel" class="progressBarHeading" data-i18n="[html]modal.events.weekExp">ExP This Week</label>
		<div id="weekExpBarContainer" class="progressBarContainer">
			<label id="weekExpBarLabel" class="progressBarLabel altText unselectable"></label>
			<div id="weekExpBar" class="progressBar"></div>
		</div>
		<div id="eventTabs" class="subTabs">
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				id="eventTabLocations"
				class={['eventTab', 'subTab', { active: activeTab === 'locations' }]}
				data-tab-list="locations"
				onclick={() => (activeTab = 'locations')}
			>
				<small class="subTabLabel infoLabel unselectable" data-i18n="[html]modal.events.tabs.locations">
					Locations
				</small>
				<div class="subTabBg"></div>
			</div>
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				id="eventTabVms"
				class={['eventTab', 'subTab', { active: activeTab === 'vms' }]}
				data-tab-list="vms"
				onclick={() => (activeTab = 'vms')}
			>
				<small class="subTabLabel infoLabel unselectable" data-i18n="[html]modal.events.tabs.vms">
					Vending Machine
				</small>
				<div class="subTabBg"></div>
			</div>
		</div>
		<div
			id="eventLocationsList"
			class={['eventList', 'scrollableContainer', { hidden: activeTab !== 'locations' }]}
		></div>
		<div id="eventVmsList" class={['eventList', 'scrollableContainer', { hidden: activeTab !== 'vms' }]}></div>
	</div>
</div>
