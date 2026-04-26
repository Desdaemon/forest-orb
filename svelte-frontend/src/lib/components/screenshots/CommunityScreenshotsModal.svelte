<div id="communityScreenshotsModal" class="modal fullscreenModal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.communityScreenshots.title">Community Screenshots</h1>
		<div id="communityScreenshotsControls" class="uiControls wrap">
			<div class="uiControl">
				<label
					for="communityScreenshotsGame"
					class="unselectable"
					data-i18n="[html]modal.communityScreenshots.fields.game.label"
				>
					Game:&nbsp;
				</label>
				<select id="communityScreenshotsGame" class="gameSelect">
					<option value="" data-i18n="[html]modal.communityScreenshots.fields.game.values.all">All</option>
				</select>
			</div>
			<div class="uiControl">
				<span></span>
				<select id="communityScreenshotsSortOrder">
					<option value="recent" data-i18n="[html]modal.communityScreenshots.fields.sortOrder.values.recent">
						Newest
					</option>
					<option value="likes" data-i18n="[html]modal.communityScreenshots.fields.sortOrder.values.likes">
						Most Liked
					</option>
				</select>
			</div>
			<div class="uiControl">
				<span></span>
				<select id="communityScreenshotsInterval">
					<option value="day" data-i18n="[html]modal.communityScreenshots.fields.interval.values.day">
						Today
					</option>
					<option value="week" data-i18n="[html]modal.communityScreenshots.fields.interval.values.week">
						This Week
					</option>
					<option value="month" data-i18n="[html]modal.communityScreenshots.fields.interval.values.month">
						This Month
					</option>
					<option value="year" data-i18n="[html]modal.communityScreenshots.fields.interval.values.year">
						This Year
					</option>
					<option value="" data-i18n="[html]modal.communityScreenshots.fields.interval.values.all">
						All Time
					</option>
				</select>
			</div>
		</div>
		<div class="infiniteScrollRefreshIndicator transparent unselectable">
			<label class="infoLabel" data-i18n="[html]modal.communityScreenshots.scrollToRefresh">
				Scroll to Top to Refresh
			</label>
		</div>
	</div>
	<div class="modalContent infiniteScrollContainer itemContainer"></div>
</div>
