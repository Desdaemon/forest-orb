<script>
	import { openBadgesModalFromAccount } from '$lib/badges.svelte';
</script>

<div id="accountSettingsModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.accountSettings.title">Account Settings</h1>
	</div>
	<div class="modalContent itemContainer">
		<ul class="formControls">
			<li class="formControlRow buttonRow">
				<button
					id="changePasswordButton"
					class="unselectable"
					type="button"
					data-i18n="[html]modal.accountSettings.fields.changePassword"
				>
					Change Password
				</button>
			</li>
			<li class="formControlRow">
				<label
					for="accountBadgeButton"
					class="unselectable"
					data-i18n="[html]modal.accountSettings.fields.badge"
				>
					Badge
				</label>
				<div>
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div
						id="accountBadgeButton"
						class="badgeItem item unselectable"
						onclick={openBadgesModalFromAccount}
					></div>
				</div>
			</li>
			<li id="saveSyncSlotIdRow" class="formControlRow buttonRow">
				<button
					id="clearSaveSyncButton"
					class="unselectable"
					type="button"
					data-i18n="[html]modal.accountSettings.fields.clearSaveSync"
				>
					Clear Save Sync Data
				</button>
			</li>
		</ul>
	</div>
</div>
