<div id="saveModal" class="modal wideModal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle">
			<span data-i18n="[html]modal.save.title">Manage Save Data</span>
			<a href="javascript:void(0);" class="helpLink iconLink" data-i18n="[title]modal.save.info">
				<div class="helpIcon icon fillIcon invertFillIcon altIcon">
					<svg viewBox="0 0 18 18">
						<path
							d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
						/>
					</svg>
				</div>
			</a>
		</h1>
	</div>
	<div class="modalContent">
		<div id="saveSlotList" class="scrollableContainer"></div>
	</div>
	<div class="modalFooter">
		<button id="saveModalManageOtherButton" type="button" data-i18n="[html]modal.save.manageOther">
			Manage Different Game&hellip;
		</button>
		<select id="saveDataGame" class="gameSelect hidden"></select>
		<button
			id="saveModalReloadButton"
			class="unselectable hidden"
			type="button"
			data-i18n="[html]modal.save.reload"
		>
			Save Changes and Reload
		</button>
	</div>
</div>
