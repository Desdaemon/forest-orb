<script>
	import {
		badgeSlotColNumbers,
		badgeSlotRowNumbers,
		badgeUi,
		didDragBadgeSlot,
		didDropOnBadgeSlot,
		highlightRemoveBadgeSlot,
		mightDropOnBadgeSlot,
		onClickBadgeSlot,
		openBadgePresetModal,
		setUpTwoFingerPan,
		toggleRemoveBadges
	} from '$lib/badges.svelte';

	/** @type {HTMLElement} */
	let modalContent;

	// Two-finger panning of the badge gallery, previously wired up at import time in badges.ts.
	$effect(() => {
		setUpTwoFingerPan(modalContent);
	});
</script>

<div id="badgeGalleryModal" class="modal semiWideModal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.badgeGallery.title">Manage Badge Gallery</h1>
		<div id="badgeGalleryInfoContainer" class="modalInfoContainer">
			<label id="badgeGalleryTotalBc">0 Badges</label>
			<label id="badgeGalleryTotalBp">0 BP</label>
		</div>
		<div id="badgeGalleryRowProgressContainer" class="badgeGalleryProgressContainer progressContainer">
			<label
				id="badgeGalleryRowProgressLabel"
				class="progressBarHeading"
				data-i18n="[html]modal.badgeGallery.badgeGalleryRowProgress"
			>
				Next Row Upgrade (BP)
			</label>
			<div id="badgeGalleryRowProgressBarContainer" class="progressBarContainer">
				<label id="badgeGalleryRowProgressBarLabel" class="progressBarLabel altText unselectable"></label>
				<div id="badgeGalleryRowProgressBar" class="progressBar"></div>
			</div>
		</div>
		<div id="badgeGalleryColProgressContainer" class="badgeGalleryProgressContainer progressContainer">
			<label
				id="badgeGalleryColProgressLabel"
				class="progressBarHeading"
				data-i18n="[html]modal.badgeGallery.badgeGalleryColProgress"
			>
				Next Column Upgrade (Badges)
			</label>
			<div id="badgeGalleryColProgressBarContainer" class="progressBarContainer">
				<label id="badgeGalleryColProgressBarLabel" class="progressBarLabel altText unselectable"></label>
				<div id="badgeGalleryColProgressBar" class="progressBar"></div>
			</div>
		</div>
	</div>
	<!-- The slot grid is fixed in size; `initBadgeGalleryModal()` fills in and hides slots. -->
	<div
		class={[
			'modalContent',
			'itemContainer',
			'itemRowContainer',
			'smallItemContainer',
			{ removing: badgeUi.removing }
		]}
		dir="ltr"
		bind:this={modalContent}
	>
		{#each badgeSlotRowNumbers as row (row)}
			<div class="itemRow">
				{#each badgeSlotColNumbers as col (col)}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div
						class="badgeSlotButton badgeItem item unselectable"
						data-row={row}
						data-col={col}
						draggable="true"
						onclick={onClickBadgeSlot}
						ondragstart={didDragBadgeSlot}
						ondragend={didDragBadgeSlot}
						ondragover={mightDropOnBadgeSlot}
						ondragleave={mightDropOnBadgeSlot}
						ondrop={didDropOnBadgeSlot}
						onmouseenter={highlightRemoveBadgeSlot}
						onmousemove={highlightRemoveBadgeSlot}
						onmouseleave={highlightRemoveBadgeSlot}
					></div>
				{/each}
			</div>
		{/each}
	</div>
	<div class="modalFooter">
		<button
			id="removeBadgesButton"
			class="unselectable"
			type="button"
			data-i18n="[html]modal.badgeGallery.removeMode.activate"
			onclick={toggleRemoveBadges}
		>
			Remove Badges
		</button>
		<button
			id="badgePresetButton"
			class="unselectable"
			type="button"
			data-i18n="[html]modal.badgeGallery.manageBadgePreset"
			onclick={openBadgePresetModal}
		>
			Manage Presets
		</button>
	</div>
</div>
