<div id="myScreenshotsModal" class="modal fullscreenModal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.myScreenshots.title">My Screenshots</h1>
		<h3 id="myScreenshotsLimitLabel"></h3>
		<div id="screenshotSlotProgressContainer" class="screenshotSlotProgressContainer progressContainer">
			<label
				id="screenshotSlotProgressLabel"
				class="progressBarHeading"
				data-i18n="[html]modal.myScreenshots.screenshotSlotProgress"
			>
				Next Slot Upgrade (BP)
			</label>
			<div id="screenshotSlotProgressBarContainer" class="progressBarContainer">
				<label id="screenshotSlotProgressBarLabel" class="progressBarLabel altText unselectable"></label>
				<div id="screenshotSlotProgressBar" class="progressBar"></div>
			</div>
		</div>
		<span id="myScreenshotsEmptyLabel" class="infoLabel hidden" data-i18n="[html]modal.myScreenshots.empty">
			You haven't saved any screenshots yet.
		</span>
	</div>
	<div class="modalContent itemContainer"></div>
</div>
