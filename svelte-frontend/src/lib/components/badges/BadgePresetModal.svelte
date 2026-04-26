<script>
	import { initBadgePresetModal, loadBadgePreset, saveBadgePreset } from '$lib/badges.svelte';
</script>

<div id="badgePresetModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.badgePreset.title">Manage Badge Presets</h1>
		<div class="formControls" style="width:100%">
			<div class="formControlRow">
				<label for="badgePresetSelection" data-i18n="[html]modal.badgePreset.selectPreset">Select Preset</label>
				<select id="badgePresetSelection" onchange={initBadgePresetModal}>
					<option value="0" data-i18n="[html]modal.badgePreset.presetName" i18n-options={{ index: 1 }}>
						Preset 1
					</option>
					<option value="1" data-i18n="[html]modal.badgePreset.presetName" i18n-options={{ index: 2 }}>
						Preset 2
					</option>
					<option value="2" data-i18n="[html]modal.badgePreset.presetName" i18n-options={{ index: 3 }}>
						Preset 3
					</option>
				</select>
			</div>
		</div>
	</div>
	<div class="modalContent"></div>
	<div class="modalFooter">
		<button
			id="badgePresetSave"
			class="unselectable"
			type="button"
			data-i18n="[html]modal.common.save"
			onclick={saveBadgePreset}
		>
			Save
		</button>
		<button
			id="badgePresetLoad"
			class="unselectable"
			type="button"
			data-i18n="[html]modal.common.apply"
			onclick={loadBadgePreset}
		>
			Apply
		</button>
	</div>
</div>
