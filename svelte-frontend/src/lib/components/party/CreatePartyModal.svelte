<script>
	import { openPartyThemeModal, partyForm, submitCreatePartyForm } from '$lib/parties.svelte';
	import { autoExpandTextarea } from '$lib/play.svelte';
</script>

<div id="createPartyModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle">
			<span class="createTitle" data-i18n="[html]modal.createParty.title.create">Create Party</span>
			<span class="updateTitle" data-i18n="[html]modal.createParty.title.update">Update Party</span>
		</h1>
	</div>
	<div class="modalContent">
		<form id="createPartyForm" class="fullWidth" onsubmit={submitCreatePartyForm}>
			<ul class="formControls">
				<li class="formControlRow">
					<label for="partyName" class="unselectable" data-i18n="[html]modal.createParty.fields.partyName">
						Party Name
					</label>
					<input id="partyName" name="name" type="text" autocomplete="off" bind:value={partyForm.name} />
				</li>
				<li class="formControlRow">
					<div class="textareaContainer">
						<label
							for="partyDescription"
							class="unselectable"
							data-i18n="[html]modal.createParty.fields.description"
						>
							Description
						</label>
						<textarea
							id="partyDescription"
							name="description"
							class="autoExpand"
							bind:value={partyForm.description}
							{@attach autoExpandTextarea}
						></textarea>
					</div>
				</li>
				<li class="formControlRow">
					<label class="unselectable" data-i18n="[html]modal.createParty.fields.public">Public</label>
					<div>
						<button
							id="publicPartyButton"
							class={[
								'checkboxButton',
								'inverseToggle',
								'unselectable',
								{
									toggled: partyForm.private
								}
							]}
							type="button"
							onclick={() => (partyForm.private = !partyForm.private)}
						>
							<span></span>
						</button>
						<input type="checkbox" name="public" style="display: none" checked={!partyForm.private} />
					</div>
				</li>
				<li class={['formControlRow', { hidden: !partyForm.private }]}>
					<div>
						<a
							id="showHidePartyPasswordLink"
							href="javascript:void(0);"
							class={['showHidePasswordLink', { showPassword: partyForm.showPassword }]}
							onclick={() => (partyForm.showPassword = !partyForm.showPassword)}
						>
							<span data-i18n="[html]modal.createParty.showPassword">Show Password</span>
							<span data-i18n="[html]modal.createParty.hidePassword">Hide Password</span>
						</a>
						<div>
							<label
								for="partyPassword"
								class="unselectable"
								data-i18n="[html]modal.createParty.fields.password"
							>
								Password
							</label>
							<input
								id="partyPassword"
								name="pass"
								type={partyForm.showPassword ? 'text' : 'password'}
								autocomplete="off"
								value={partyForm.password}
								oninput={(ev) => (partyForm.password = ev.currentTarget.value)}
							/>
						</div>
					</div>
				</li>
				<li class="formControlRow">
					<label for="partyThemeButton" class="unselectable" data-i18n="[html]modal.createParty.fields.theme">
						Theme
					</label>
					<div>
						<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
						<div
							id="partyThemeButton"
							class="uiThemeItem item unselectable"
							onclick={openPartyThemeModal}
						></div>
						<input id="partyTheme" type="hidden" name="theme" />
					</div>
				</li>
			</ul>
			<button type="submit" data-i18n="[html]modal.createParty.submit">Submit</button>
		</form>
	</div>
</div>
