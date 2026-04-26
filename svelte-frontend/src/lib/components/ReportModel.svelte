<script>
	import { reportForm, submitReport } from '$lib/report.svelte';
</script>

<div id="reportModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.report.title">Report</h1>
	</div>
	<div class="modalContent">
		<ul class="formControls" style="width:100%">
			<form id="reportForm" action="javascript:void(0);" onsubmit={submitReport}>
				<li class="formControlRow">
					<label for="reason" class="unselectable" data-i18n="[html]modal.report.fields.reason.title">
						Reason
					</label>
					<div>
						<select id="reportReasonSelect" name="reason" bind:value={reportForm.reason}>
							<option value=":1" data-i18n="[html]modal.report.fields.reason.1">
								Slurs, harmful or inappropriate language
							</option>
							<option value=":2" data-i18n="[html]modal.report.fields.reason.2">
								Harassment, bullying, stalking
							</option>
							<option value=":3" data-i18n="[html]modal.report.fields.reason.3">
								Inappropriate names
							</option>
							<option value=":4" data-i18n="[html]modal.report.fields.reason.4">Ban evasion</option>
							<option value=":5" data-i18n="[html]modal.report.fields.reason.5">
								Cheating, abusing exploits
							</option>
							<option value=":6" data-i18n="[html]modal.report.fields.reason.6">Underage player</option>
							<option value=":7" data-i18n="[html]modal.report.fields.reason.7">Spam</option>
							<option value="" data-i18n="[html]modal.report.fields.reason.other">Other (specify)</option>
						</select>
					</div>
				</li>
				<li id="reportCustomReason" class={['formControlRow', 'fullWidth', { hidden: !!reportForm.reason }]}>
					<div class="textareaContainer">
						<input
							type="text"
							name="customReason"
							class="autoExpand"
							maxlength="50"
							required={!reportForm.reason}
							bind:value={reportForm.customReason}
							placeholder="Custom reason (max 50 characters)"
							data-i18n="[placeholder]modal.report.fields.reason.placeholder"
						/>
					</div>
				</li>
				<li class="formControlRow buttonRow fullWidth">
					<button type="submit" data-i18n="[html]modal.report.submit">Submit</button>
				</li>
			</form>
		</ul>
	</div>
</div>
