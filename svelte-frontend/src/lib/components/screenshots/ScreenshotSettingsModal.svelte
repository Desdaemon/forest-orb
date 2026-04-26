<div id="screenshotSettingsModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.screenshotSettings.title">Screenshot Settings</h1>
	</div>
	<div class="modalContent">
		<ul class="formControls">
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.screenshotSettings.fields.autoDownloadScreenshots">
					Automatically Download Screenshots
				</label>
				<div>
					<button id="autoDownloadScreenshotsButton" class="checkboxButton unselectable">
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label
					for="screenshotResolution"
					class="unselectable"
					data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.label"
				>
					Screenshot Download Resolution
				</label>
				<div>
					<select id="screenshotResolution">
						<option
							value="1"
							data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.values.1"
							selected
						>
							1x - 320x240
						</option>
						<option
							value="2"
							data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.values.2"
						>
							2x - 640x480
						</option>
						<option
							value="3"
							data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.values.3"
						>
							3x - 960x720
						</option>
						<option
							value="4"
							data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.values.4"
						>
							4x - 1280x960
						</option>
					</select>
				</div>
			</li>
		</ul>
	</div>
</div>
