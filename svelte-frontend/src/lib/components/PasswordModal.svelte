<div id="passwordModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.password.title">Change Password</h1>
	</div>
	<div class="modalContent">
		<form id="changePasswordForm" class="fullWidth">
			<ul class="formControls">
				<li class="formControlRow">
					<label for="oldPassword" class="unselectable" data-i18n="[html]modal.password.fields.oldPassword">
						Old Password
					</label>
					<input id="oldPassword" name="password" type="password" autocomplete="off" />
				</li>
				<li class="formControlRow">
					<label for="newPassword" class="unselectable" data-i18n="[html]modal.password.fields.newPassword">
						New Password
					</label>
					<input id="newPassword" name="newPassword" type="password" autocomplete="off" />
				</li>
				<li class="formControlRow">
					<label
						for="confirmPassword"
						class="unselectable"
						data-i18n="[html]modal.password.fields.newConfirmPassword"
					>
						Confirm New Password
					</label>
					<input id="newConfirmPassword" type="password" autocomplete="off" />
				</li>
				<li id="passwordErrorRow" class="formControlRow hidden">
					<label id="passwordError"></label>
				</li>
			</ul>
			<button type="submit" data-i18n="[html]modal.password.submit">Submit</button>
		</form>
	</div>
</div>
