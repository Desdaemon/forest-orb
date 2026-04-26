<script>
	import {
		cancelSchedule,
		editSchedule,
		onChangePlatformLink,
		onClickScheduleTheme,
		onToggleEventRecurring,
		onToggleScheduleButton
	} from '$lib/schedules';
	import { autoExpandTextarea, hideYnomojiContainer, onfocusYnomoji, oninputYnomoji } from '$lib/play.svelte';
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="scheduleEditModal" class="modal hidden" onmouseleave={hideYnomojiContainer}>
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.scheduleEdit.title">Edit Event</h1>
	</div>
	<div class="modalContent">
		<ul class="formControls" style="width:100%">
			<form id="scheduleForm" action="javascript:void(0)" onsubmit={editSchedule}>
				<li class="formControlRow fullWidth">
					<div class="textareaContainer">
						<label for="name" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.name">
							Event Name
						</label>
						<input type="text" name="name" class="autoExpand" maxlength="255" required />
					</div>
				</li>
				<li class="formControlRow fullWidth">
					<div class="textareaContainer">
						<label
							for="description"
							class="unselectable"
							data-i18n="[html]modal.scheduleEdit.fields.description"
						>
							Description
						</label>
						<textarea
							id="editScheduleDescription"
							oninput={oninputYnomoji}
							onfocus={onfocusYnomoji}
							data-ynomoji="expandDown"
							name="description"
							type="text"
							class="autoExpand"
							maxlength="1000"
							data-i18n="[placeholder]placeholders.scheduleDescription"
							placeholder="Markdown syntax is accepted, use l:World,optional link name to insert a link to yume.wiki"
							{@attach autoExpandTextarea}
						></textarea>
					</div>
				</li>
				<li class="formControlRow">
					<label for="eventStart" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.datetime">
						Event Date and Time
					</label>
					<div>
						<input type="datetime-local" name="eventStart" required />
					</div>
				</li>
				<li class="formControlRow">
					<label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.recurring">
						Recurring Event
					</label>
					<div>
						<button
							id="eventRecurring"
							class="checkboxButton unselectable"
							type="button"
							onclick={onToggleEventRecurring}
						>
							<span></span>
						</button>
					</div>
				</li>
				<li id="eventInterval" class="formControlRow indent">
					<label
						for="interval"
						class="unselectable"
						data-i18n="[html]modal.scheduleEdit.fields.interval.title"
					>
						Interval
					</label>
					<div>
						<input name="interval" type="number" min="1" value="1" />
						<select name="intervalType">
							<option value="days" data-i18n="[html]modal.scheduleEdit.fields.interval.days">days</option>
							<option value="months" data-i18n="[html]modal.scheduleEdit.fields.interval.months">
								months
							</option>
							<option value="years" data-i18n="[html]modal.scheduleEdit.fields.interval.years">
								years
							</option>
						</select>
					</div>
				</li>
				<li id="restrictPartyRow" class="formControlRow">
					<label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.restrictParty">
						Limit to Party
					</label>
					<div>
						<button
							id="restrictParty"
							class="checkboxButton unselectable"
							type="button"
							onclick={onToggleScheduleButton}
						>
							<span></span>
						</button>
					</div>
				</li>
				<li id="eventOfficialRow" class="formControlRow hidden">
					<label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.official">
						Official Event
					</label>
					<div>
						<button
							id="eventOfficial"
							class="checkboxButton unselectable"
							type="button"
							onclick={onToggleScheduleButton}
						>
							<span></span>
						</button>
					</div>
				</li>
				<li id="resetOrganizerRow" class="formControlRow hidden">
					<label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.resetOrganizer">
						Reset Organizer
					</label>
					<div>
						<button
							id="resetOrganizer"
							class="checkboxButton unselectable"
							type="button"
							onclick={onToggleScheduleButton}
						>
							<span></span>
						</button>
					</div>
				</li>
				<li class="formControlRow">
					<label
						for="scheduleThemeButton"
						class="unselectable"
						data-i18n="[html]modal.scheduleEdit.fields.theme"
					>
						Theme
					</label>
					<div>
						<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
						<div
							id="scheduleThemeButton"
							class="uiThemeItem item unselectable"
							onclick={onClickScheduleTheme}
						></div>
						<input id="scheduleTheme" type="hidden" name="theme" />
					</div>
				</li>
				<li class="formControlRow">
					<label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.title">
						External Links
					</label>
				</li>
				<li class="formControlRow indent">
					<label
						for="discord"
						class="unselectable"
						data-i18n="[html]modal.scheduleEdit.fields.platforms.discord"
					>
						Discord
					</label>
					<div>
						<input name="discord" type="text" data-platform onchange={onChangePlatformLink} />
					</div>
				</li>
				<li class="formControlRow indent">
					<label
						for="youtube"
						class="unselectable"
						data-i18n="[html]modal.scheduleEdit.fields.platforms.youtube"
					>
						YouTube
					</label>
					<div>
						<input name="youtube" type="text" data-platform onchange={onChangePlatformLink} />
					</div>
				</li>
				<li class="formControlRow indent">
					<label
						for="twitch"
						class="unselectable"
						data-i18n="[html]modal.scheduleEdit.fields.platforms.twitch"
					>
						Twitch
					</label>
					<div>
						<input name="twitch" type="text" data-platform onchange={onChangePlatformLink} />
					</div>
				</li>
				<li class="formControlRow indent">
					<label
						for="niconico"
						class="unselectable"
						data-i18n="[html]modal.scheduleEdit.fields.platforms.niconico"
					>
						Nicovideo
					</label>
					<div>
						<input name="niconico" type="text" data-platform onchange={onChangePlatformLink} />
					</div>
				</li>
				<li class="formControlRow indent">
					<label
						for="openrec"
						class="unselectable"
						data-i18n="[html]modal.scheduleEdit.fields.platforms.openrec"
					>
						Openrec
					</label>
					<div>
						<input name="openrec" type="text" data-platform onchange={onChangePlatformLink} />
					</div>
				</li>
				<li class="formControlRow indent">
					<label
						for="bilibili"
						class="unselectable"
						data-i18n="[html]modal.scheduleEdit.fields.platforms.bilibili"
					>
						Bilibili
					</label>
					<div>
						<input name="bilibili" type="text" data-platform onchange={onChangePlatformLink} />
					</div>
				</li>
				<li class="formControlRow buttonRow fullWidth">
					<button type="submit" data-i18n="[html]modal.scheduleEdit.save">Save</button>
					<button
						type="button"
						id="cancelSchedule"
						onclick={cancelSchedule}
						data-i18n="[html]modal.scheduleEdit.cancel"
					>
						Cancel Event
					</button>
				</li>
			</form>
		</ul>
	</div>
</div>
