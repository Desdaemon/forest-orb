<script>
	import { gameId } from '$lib';
</script>

{#if gameId == '2kki'}
	<div id="explorerUndiscoveredLocationsModal" class="modal hidden">
		<a href="javascript:void(0);" class="modalClose">✖</a>
		<div class="modalHeader">
			<h1 class="modalTitle" data-i18n="[html]modal.explorerUndiscoveredLocations.title">
				Undiscovered Locations
			</h1>
		</div>
		<div class="modalContent">
			<ul id="explorerUndiscoveredLocations"></ul>
			<span
				id="explorerUndiscoveredLocationsEmptyLabel"
				class="infoLabel hidden"
				data-i18n="[html]modal.explorerUndiscoveredLocations.complete"
			>
				You've discovered every available location! Congrats!!
			</span>
		</div>
	</div>
{/if}
