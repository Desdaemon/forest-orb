<script>
	import { joinPartyForm, submitJoinPrivatePartyForm } from '$lib/parties.svelte';
</script>

<div id="joinPrivatePartyModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.joinPrivateParty.title">Join Private Party</h1>
	</div>
	<div class="modalContent">
		<form id="joinPrivatePartyForm" onsubmit={submitJoinPrivatePartyForm}>
			<ul class="formControls">
				<li class="formControlRow">
					<div>
						<a
							id="showHidePrivatePartyPasswordLink"
							href="javascript:void(0);"
							class={['showHidePasswordLink', { showPassword: joinPartyForm.showPassword }]}
							onclick={() => (joinPartyForm.showPassword = !joinPartyForm.showPassword)}
						>
							<span data-i18n="[html]modal.joinPrivateParty.showPassword">Show Password</span>
							<span data-i18n="[html]modal.joinPrivateParty.hidePassword">Hide Password</span>
						</a>
						<div>
							<label
								for="partyPassword"
								class="unselectable"
								data-i18n="[html]modal.joinPrivateParty.fields.password"
							>
								Password
							</label>
							<input
								id="privatePartyPassword"
								name="pass"
								type={joinPartyForm.showPassword ? 'text' : 'password'}
								autocomplete="off"
								value={joinPartyForm.password}
								oninput={(ev) => (joinPartyForm.password = ev.currentTarget.value)}
							/>
						</div>
					</div>
				</li>
				<li id="joinPrivatePartyFailed" class={['formControlRow', { hidden: !joinPartyForm.failed }]}>
					<label data-i18n="[html]modal.joinPrivateParty.incorrectPassword">
						Incorrect Password: Please try again.
					</label>
				</li>
			</ul>
			<button type="submit" data-i18n="[html]modal.joinPrivateParty.submit">Submit</button>
		</form>
	</div>
</div>
