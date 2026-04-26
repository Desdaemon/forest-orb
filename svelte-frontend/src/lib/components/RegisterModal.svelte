<div id="registerModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.register.title">Register</h1>
	</div>
	<div class="modalContent">
		<form id="registerForm">
			<ul class="formControls">
				<li class="formControlRow">
					<label for="registerUsername" class="unselectable" data-i18n="[html]modal.register.fields.username">
						Username
					</label>
					<input id="registerUsername" name="user" type="text" autocomplete="off" maxlength="12" />
				</li>
				<li class="formControlRow">
					<label for="registerPassword" class="unselectable" data-i18n="[html]modal.register.fields.password">
						Password
					</label>
					<input id="registerPassword" name="password" type="password" autocomplete="off" maxlength="72" />
				</li>
				<li class="formControlRow">
					<label
						for="registerConfirmPassword"
						class="unselectable"
						data-i18n="[html]modal.register.fields.confirmPassword"
					>
						Confirm Password
					</label>
					<input id="registerConfirmPassword" type="password" autocomplete="off" maxlength="72" />
				</li>
				<li id="registerErrorRow" class="formControlRow hidden">
					<label id="registerError"></label>
				</li>
			</ul>
			<div class="cf-turnstile" data-sitekey="0x4AAAAAAB2ijZ45647GuniE"></div>
			<button type="submit" data-i18n="[html]modal.register.submit">Submit</button>
		</form>
	</div>
	<div class="modalFooter">
		<span class="infoLabel" data-i18n="[html]modal.register.loginPrompt">Already have an account?&nbsp;</span>
		<a href="javascript:void(0);" onclick={() => openModal('loginModal')} data-i18n="[html]modal.register.login">
			Login
		</a>
	</div>
</div>
