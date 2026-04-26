<script>
	import { onChangeLocationsSortOrder, onChangeLocationsVisited } from '$lib/locations.svelte';
</script>

<div id="locationsModal" class="modal fullscreenModal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.locations.title">Locations</h1>
		<div id="locationsControls" class="uiControls wrap">
			<div class="uiControl">
				<span></span>
				<select id="locationsVisited" onchange={onChangeLocationsVisited}>
					<option value="" data-i18n="[html]modal.locations.fields.visited.values.all">All</option>
					<option value="visited" data-i18n="[html]modal.locations.fields.visited.values.visited">
						Visited
					</option>
					<option value="unvisted" data-i18n="[html]modal.locations.fields.visited.values.unvisited">
						Unvisited
					</option>
				</select>
			</div>
			<div class="uiControl">
				<span></span>
				<select id="locationsSortOrder" onchange={onChangeLocationsSortOrder}>
					<option value="newest" data-i18n="[html]modal.locations.fields.sortOrder.values.newest">
						Newest
					</option>
					<option value="oldest" data-i18n="[html]modal.locations.fields.sortOrder.values.oldest">
						Oldest
					</option>
					<option value="shallowest" data-i18n="[html]modal.locations.fields.sortOrder.values.shallowest">
						Shallowest
					</option>
					<option value="deepest" data-i18n="[html]modal.locations.fields.sortOrder.values.deepest">
						Deepest
					</option>
					<option value="alpha" data-i18n="[html]modal.locations.fields.sortOrder.values.alpha">
						Alphabetical
					</option>
					<option value="players" data-i18n="[html]modal.locations.fields.sortOrder.values.players">
						Player Count
					</option>
				</select>
			</div>
		</div>
		<div class="infiniteScrollRefreshIndicator transparent unselectable">
			<label class="infoLabel" data-i18n="[html]modal.locations.scrollToRefresh">Scroll to Top to Refresh</label>
		</div>
	</div>
	<div class="modalContent infiniteScrollContainer itemContainer"></div>
</div>
