<script>
	import {
		badgeSortOrderNames,
		badgeUi,
		clearBadgeSearch,
		hideBadgeDropdown,
		onActivateSearchMode,
		onChangeBadgeSortOrder,
		onFocusBadgeSearch,
		onInputBadgeSearch,
		onKeydownBadgeSearch,
		openBadgeGalleryModal,
		updateBadgeVisibility
	} from '$lib/badges.svelte';
	import { openModal } from '$lib/play.svelte';
</script>

<div id="badgesModal" class="modal fullscreenModal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.badges.title">Badge</h1>
		<div id="badgeControls" class="uiControls wrap">
			<div class="uiControl">
				<label
					for="badgeUnlockStatus"
					class="unselectable"
					data-i18n="[html]modal.badges.fields.unlockStatus.label"
				>
					Unlock Status:&nbsp;
				</label>
				<select id="badgeUnlockStatus" onchange={updateBadgeVisibility}>
					<option value="" data-i18n="[html]modal.badges.fields.unlockStatus.values.all">All</option>
					<option value="0" data-i18n="[html]modal.badges.fields.unlockStatus.values.0">Locked</option>
					<option value="1" data-i18n="[html]modal.badges.fields.unlockStatus.values.1">Unlocked</option>
					<option value="recentUnlock" data-i18n="[html]modal.badges.fields.unlockStatus.values.recentUnlock">
						Recently Unlocked
					</option>
				</select>
			</div>
			<div class="uiControl">
				<label for="badgeSortOrder" class="unselectable" data-i18n="[html]modal.badges.fields.sortOrder.label">
					Sort Order:&nbsp;
				</label>
				<!-- The labels of the per-type options are localized in `updateBadgesAndPopulateModal()`. -->
				<select id="badgeSortOrder" onchange={onChangeBadgeSortOrder}>
					<option value="" data-i18n="[html]modal.badges.fields.sortOrder.values.default">Default</option>
					{#each badgeSortOrderNames as sortOrder (sortOrder)}
						<option value={sortOrder}></option>
						<option value="{sortOrder}_desc"></option>
					{/each}
				</select>
			</div>
			<div class="uiControl">
				<label for="badgeSearch" class="unselectable" data-i18n="[html]modal.badges.fields.search.label">
					Search:&nbsp;
				</label>
				<div style="display: inline-block">
					<svg
						data-kind="name"
						class={['icon', 'searchIcon', { hidden: badgeUi.searchMode !== 'name' }]}
						height="24px"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M14.2639 15.9376L12.5958 14.2835C11.7909 13.4852 11.3884 13.0861 10.9266 12.9402C10.5204 12.8119 10.0838 12.8166 9.68048 12.9537C9.22188 13.1096 8.82814 13.5173 8.04068 14.3327L4.04409 18.2802M14.2639 15.9376L14.6053 15.5991C15.4112 14.7999 15.8141 14.4003 16.2765 14.2544C16.6831 14.1262 17.12 14.1312 17.5236 14.2688C17.9824 14.4252 18.3761 14.834 19.1634 15.6515L20 16.4936M14.2639 15.9376L18.275 19.9566M18.275 19.9566C17.9176 20.0001 17.4543 20.0001 16.8 20.0001H7.2C6.07989 20.0001 5.51984 20.0001 5.09202 19.7821C4.71569 19.5904 4.40973 19.2844 4.21799 18.9081C4.12796 18.7314 4.07512 18.5322 4.04409 18.2802M18.275 19.9566C18.5293 19.9257 18.7301 19.8728 18.908 19.7821C19.2843 19.5904 19.5903 19.2844 19.782 18.9081C20 18.4803 20 17.9202 20 16.8001V16.4936M12.5 4L7.2 4.00011C6.07989 4.00011 5.51984 4.00011 5.09202 4.21809C4.71569 4.40984 4.40973 4.7158 4.21799 5.09213C4 5.51995 4 6.08 4 7.20011V16.8001C4 17.4576 4 17.9222 4.04409 18.2802M20 11.5V16.4936M14 10.0002L16.0249 9.59516C16.2015 9.55984 16.2898 9.54219 16.3721 9.5099C16.4452 9.48124 16.5146 9.44407 16.579 9.39917C16.6515 9.34859 16.7152 9.28492 16.8425 9.1576L21 5.00015C21.5522 4.44787 21.5522 3.55244 21 3.00015C20.4477 2.44787 19.5522 2.44787 19 3.00015L14.8425 7.1576C14.7152 7.28492 14.6515 7.34859 14.6009 7.42112C14.556 7.4855 14.5189 7.55494 14.4902 7.62801C14.4579 7.71033 14.4403 7.79862 14.4049 7.97518L14 10.0002Z"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<svg
						data-kind="location"
						class={['icon', 'searchIcon', { hidden: badgeUi.searchMode !== 'location' }]}
						viewBox="-2 -2 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						height="18"
					>
						<path
							d="m3 5q1-5 6-5t6 5-6 11q-7-6-6-11m6-2a1 1 0 0 0 0 5 1 1 0 0 0 0 -5m-2 11c-1 0-3 1-3 2s2 2 5 2 5-1 5-2-2-2-3-2"
						/>
					</svg>
					<svg
						data-kind="artist"
						class={['icon', 'searchIcon', { hidden: badgeUi.searchMode !== 'artist' }]}
						viewBox="0 0 10 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						height="12"
					>
						<path d="m10 4a1 1 90 000 5 1 1 90 000-5M5 17c0-5 1-7 5-7s5 2 5 7q-5 2-10 0" />
					</svg>
					<input
						id="badgeSearch"
						type="text"
						autocomplete="off"
						class={{ active: !!badgeUi.searchMode }}
						oninput={onInputBadgeSearch}
						onkeydown={onKeydownBadgeSearch}
						onfocus={onFocusBadgeSearch}
						onblur={hideBadgeDropdown}
					/>
					<div class={['dropdown', { hidden: !badgeUi.dropdownOpen }]} id="badgeDropdown">
						<div
							class="dropdownItem"
							role="button"
							tabindex="0"
							onclick={onActivateSearchMode('name')}
							onkeydown={onActivateSearchMode('name')}
							onblur={hideBadgeDropdown}
						>
							<i data-i18n="[html]modal.badges.fields.search.name">Name:</i>
							<span id="searchName"></span>
						</div>
						<div
							class="dropdownItem"
							role="button"
							tabindex="0"
							onclick={onActivateSearchMode('location')}
							onkeydown={onActivateSearchMode('location')}
							onblur={hideBadgeDropdown}
						>
							<i data-i18n="[html]modal.badges.fields.search.location">Location:</i>
							<span id="searchLocation"></span>
						</div>
						<div
							class="dropdownItem"
							role="button"
							tabindex="0"
							onclick={onActivateSearchMode('artist')}
							onkeydown={onActivateSearchMode('artist')}
							onblur={hideBadgeDropdown}
						>
							<i data-i18n="[html]modal.badges.fields.search.artist">Artist:</i>
							<span id="searchArtist"></span>
						</div>
					</div>
				</div>
				<a
					id="badgeSearchClearLink"
					href="javascript:void(0);"
					class={['unselectable', { hidden: !badgeUi.searchMode }]}
					onclick={clearBadgeSearch}
				>
					✖
				</a>
			</div>
		</div>
	</div>
	<div id="badgeGameTabs" class="modalTabsContainer"></div>
	<div id="badgeCategoryTabs" class="subTabs"></div>
	<div class="modalContent itemContainer"></div>
	<div class="modalFooter">
		<button
			id="badgeGalleryButton"
			class={['unselectable', { hidden: badgeUi.modifyingSlot }]}
			type="button"
			data-i18n="[html]modal.badges.manageBadgeGallery"
			onclick={openBadgeGalleryModal}
		>
			Manage Badge Gallery
		</button>
		{#if enableBadgeTools}
			<button type="button" onclick={() => openModal('badgeToolsModal')}>Badge Tools</button>
		{/if}
	</div>
</div>
