<div id="loginModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.login.title">Login</h1>
	</div>
	<div class="modalContent">
		<form id="loginForm">
			<ul class="formControls">
				<li class="formControlRow">
					<label for="loginUsername" class="unselectable" data-i18n="[html]modal.login.fields.username">
						Username
					</label>
					<input id="loginUsername" name="user" type="text" autocomplete="off" maxlength="12" />
				</li>
				<li class="formControlRow">
					<label for="loginPassword" class="unselectable" data-i18n="[html]modal.login.fields.password">
						Password
					</label>
					<input id="loginPassword" name="password" type="password" autocomplete="off" />
				</li>
				<li id="loginErrorRow" class="formControlRow hidden">
					<label id="loginError"></label>
				</li>
			</ul>
			<div class="cf-turnstile" data-sitekey="0x4AAAAAAB2ijZ45647GuniE"></div>
			<button type="submit" data-i18n="[html]modal.login.submit">Submit</button>
		</form>
	</div>
	<div class="modalFooter">
		<span class="infoLabel" data-i18n="[html]modal.login.registerPrompt">Don't have an account?&nbsp;</span>
		<a id="loginRegisterLink" href="javascript:void(0);" data-i18n="[html]modal.login.register">Register</a>
	</div>
</div>
