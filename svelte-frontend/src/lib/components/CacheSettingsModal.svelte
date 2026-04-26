<div id="cacheSettingsModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.cacheSettings.title">Cache Settings</h1>
	</div>
	<div class="modalContent">
		<ul class="formControls" style="overflow: visible">
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.cacheSettings.fields.locationCache">
					Location Cache
				</label>
				<div>
					<button
						type="button"
						id="clearLocationCacheButton"
						class="unselectable"
						data-i18n="[html]modal.cacheSettings.clear"
						onclick={() => clearCache(CACHE_TYPE.location, this)}
					>
						Clear
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.cacheSettings.fields.mapCache">Map Cache</label>
				<div>
					<button
						type="button"
						id="clearMapCacheButton"
						class="unselectable"
						data-i18n="[html]modal.cacheSettings.clear"
						onclick={() => clearCache(CACHE_TYPE.map, this)}
					>
						Clear
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.cacheSettings.fields.locationColorCache">
					Location Color Cache
				</label>
				<div>
					<button
						type="button"
						id="clearLocationColorCacheButton"
						class="unselectable"
						data-i18n="[html]modal.cacheSettings.clear"
						onclick={() => clearCache(CACHE_TYPE.locationColor, this)}
					>
						Clear
					</button>
				</div>
			</li>
		</ul>
	</div>
</div>
