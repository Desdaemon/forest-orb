<script>
	import { gameId } from '$lib';
	import { config, globalConfig, updateConfig } from '$lib/config.svelte';
	import { simulateKeyboardInput } from '$lib/gamecanvas';
	import {
		checkLang,
		checkNametagMode,
		checkSaveReminder,
		checkWikiLinkMode,
		closeModal,
		onChangeMusicVolume,
		onChangeSoundVolume,
		onInputMobileControl,
		onInputMusicVolume,
		onInputSoundVolume,
		onToggleBadgeHints,
		onToggleEnableExplorer,
		onToggleHideUnnamedPlayers,
		onToggleImmersionMode,
		onToggleMobileControls,
		onTogglePlayBadgeHintSound,
		onTogglePlayerSounds,
		onToggleQuestionablePreloads,
		onToggleRankings,
		onToggleSchedules,
		onToggleSingleplayerMode,
		onToggleUnicodeFont,
		openBlocklistModal,
		openCacheSettingsModal,
		openModal
	} from '$lib/play.svelte';

	/** Flips a config flag and persists it. */
	function toggle(configObj, key, global = false) {
		configObj[key] = !configObj[key];
		updateConfig(configObj, global);
	}
</script>

<div id="settingsModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.settings.title">Settings</h1>
	</div>
	<div class="modalContent">
		<ul class="formControls">
			<li class="formControlRow">
				<label for="lang" class="unselectable" data-i18n="[html]modal.settings.fields.lang">Language</label>
				<div>
					<label id="translationInstruction" class="nofilter hidden">
						<a id="translationLink" target="_blank" data-i18n="[html]instruction.translation">
							Translation Work Needed
						</a>
					</label>
					<div>
						<select id="lang" size="4" onchange={checkLang}>
							<option value="en">English</option>
							<option value="ja">日本語</option>
							<option value="zh">中文</option>
							<option value="ko">한국어</option>
							<option value="es">Español</option>
							<option value="eo">Esperanto</option>
							<option value="pt">Português</option>
							<option value="fr">Français</option>
							<option value="de">Deutsch</option>
							<option value="it">Italiano</option>
							<option value="pl">Polski</option>
							<option value="ro">Română</option>
							<option value="tr">Türkçe</option>
							<option value="ru">Русский</option>
							<option value="vi">Tiếng Việt</option>
							<option value="ar">العربية</option>
							<option value="id">Bahasa Indonesia</option>
							<option value="uk">Українська</option>
						</select>
					</div>
					<label id="noGameLocInstruction" class="hidden" data-i18n="[html]instruction.noGameLoc">
						* Game Localization Unsupported
					</label>
				</div>
			</li>
			<li class="formControlRow">
				<label for="nametagMode" class="unselectable" data-i18n="[html]modal.settings.fields.nametagMode.label">
					Nametags
				</label>
				<div>
					<select id="nametagMode" size="4" onchange={checkNametagMode}>
						<option value="0" data-i18n="[html]modal.settings.fields.nametagMode.values.none">None</option>
						<option value="1" data-i18n="[html]modal.settings.fields.nametagMode.values.classic" selected>
							Classic
						</option>
						<option value="2" data-i18n="[html]modal.settings.fields.nametagMode.values.compact">
							Compact
						</option>
						<option value="3" data-i18n="[html]modal.settings.fields.nametagMode.values.slim">Slim</option>
					</select>
				</div>
			</li>
			<li class="formControlRow">
				<label
					for="wikiLinkMode"
					class="unselectable"
					data-i18n="[html]modal.settings.fields.wikiLinkMode.label"
				>
					Wiki Link Popup
				</label>
				<div>
					<select id="wikiLinkMode" size="3" onchange={checkWikiLinkMode}>
						<option value="2" data-i18n="modal.settings.fields.wikiLinkMode.values.always">Always</option>
						<option value="1" data-i18n="modal.settings.fields.wikiLinkMode.values.fullscreen" selected>
							Fullscreen Only
						</option>
						<option value="0" data-i18n="modal.settings.fields.wikiLinkMode.values.never">Never</option>
					</select>
				</div>
			</li>
			<li class="formControlRow">
				<label
					for="saveReminder"
					class="unselectable"
					data-i18n="[html]modal.settings.fields.saveReminder.label"
				>
					Save Notification Interval
				</label>
				<div>
					<select id="saveReminder" size="4" onchange={checkSaveReminder}>
						<option
							value="10"
							data-i18n="modal.settings.fields.saveReminder.interval.minutes"
							i18n-options={{ interval: 10 }}
						>
							10 minutes
						</option>
						<option
							value="15"
							data-i18n="modal.settings.fields.saveReminder.interval.minutes"
							i18n-options={{ interval: 15 }}
						>
							15 minutes
						</option>
						<option
							value="20"
							data-i18n="modal.settings.fields.saveReminder.interval.minutes"
							i18n-options={{ interval: 20 }}
						>
							20 minutes
						</option>
						<option
							value="30"
							data-i18n="modal.settings.fields.saveReminder.interval.minutes"
							i18n-options={{ interval: 30 }}
						>
							30 minutes
						</option>
						<option
							value="45"
							data-i18n="modal.settings.fields.saveReminder.interval.minutes"
							i18n-options={{ interval: 45 }}
						>
							45 minutes
						</option>
						<option
							value="60"
							data-i18n="modal.settings.fields.saveReminder.interval.minutes"
							i18n-options={{ interval: 60 }}
						>
							60 minutes
						</option>
						<option
							value="90"
							data-i18n="modal.settings.fields.saveReminder.interval.minutes"
							i18n-options={{ interval: 90 }}
						>
							90 minutes
						</option>
						<option
							value="120"
							data-i18n="modal.settings.fields.saveReminder.interval.minutes"
							i18n-options={{ interval: 120 }}
						>
							120 minutes
						</option>
						<option value="0" data-i18n="modal.settings.fields.saveReminder.interval.never">Never</option>
					</select>
				</div>
			</li>
			<li class="formControlRow">
				<label for="soundVolume" class="unselectable" data-i18n="[html]modal.settings.fields.soundVolume">
					Sound Volume
				</label>
				<div>
					<input
						id="soundVolume"
						oninput={onInputSoundVolume}
						onchange={onChangeSoundVolume}
						type="range"
						min="0"
						max="100"
						value="100"
						step="5"
						class="slider"
					/>
				</div>
			</li>
			<li class="formControlRow">
				<label for="musicVolume" class="unselectable" data-i18n="[html]modal.settings.fields.musicVolume">
					Music Volume
				</label>
				<div>
					<input
						id="musicVolume"
						oninput={onInputMusicVolume}
						onchange={onChangeMusicVolume}
						type="range"
						min="0"
						max="100"
						value="100"
						step="5"
						class="slider"
					/>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.settings.fields.togglePlayerSounds">
					Player Sounds
				</label>
				<div>
					<button
						id="playerSoundsButton"
						class={['checkboxButton inverseToggle unselectable', { toggled: config.disablePlayerSounds }]}
						onclick={onTogglePlayerSounds}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable">
					<span data-i18n="[html]modal.settings.fields.toggleEnableBadgeHints.label">Badge Hints</span>
					<a
						href="javascript:void(0);"
						class="helpLink iconLink"
						data-i18n="[title]modal.settings.fields.toggleEnableBadgeHints.helpText"
					>
						<div class="helpIcon icon fillIcon invertFillIcon altIcon">
							<svg viewBox="0 0 18 18">
								<path
									d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
								/>
							</svg>
						</div>
					</a>
				</label>
				<div>
					<button
						id="badgeHintsButton"
						class={['checkboxButton inverseToggle unselectable', { toggled: !globalConfig.badgeHints }]}
						onclick={onToggleBadgeHints}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class={['formControlRow indent badgeHintRow', { hidden: !globalConfig.badgeHints }]}>
				<label class="unselectable" data-i18n="[html]modal.settings.fields.togglePlayBadgeHintSound">
					Play Badge Hint Sound
				</label>
				<div>
					<button
						id="playBadgeHintSoundButton"
						class={[
							'checkboxButton inverseToggle unselectable',
							{ toggled: !globalConfig.playBadgeHintSound }
						]}
						onclick={onTogglePlayBadgeHintSound}
					>
						<span></span>
					</button>
				</div>
			</li>
			{#if gameId == '2kki'}
				<li class="formControlRow">
					<label class="unselectable">
						<span data-i18n="[html]modal.settings.fields.toggleEnableExplorer.label">Navigator</span>
						<a
							href="javascript:void(0);"
							class="helpLink iconLink"
							data-i18n="[title]modal.settings.fields.toggleEnableExplorer.helpText"
						>
							<div class="helpIcon icon fillIcon invertFillIcon altIcon">
								<svg viewBox="0 0 18 18">
									<path
										d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
									/>
								</svg>
							</div>
						</a>
					</label>
					<div>
						<button
							id="enableExplorerButton"
							class={['checkboxButton', 'unselectable', { toggled: config.enableExplorer }]}
							onclick={onToggleEnableExplorer}
						>
							<span></span>
						</button>
					</div>
				</li>
			{/if}
			<li class="formControlRow">
				<label class="unselectable">
					<span data-i18n="[html]modal.settings.fields.toggleImmersionMode.label">Immersion Mode</span>
					<a
						href="javascript:void(0);"
						class="helpLink iconLink"
						data-i18n="[title]modal.settings.fields.toggleImmersionMode.helpText"
					>
						<div class="helpIcon icon fillIcon invertFillIcon altIcon">
							<svg viewBox="0 0 18 18">
								<path
									d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
								/>
							</svg>
						</div>
					</a>
				</label>
				<div>
					<button
						id="immersionModeButton"
						class={['checkboxButton', 'unselectable', { toggled: config.immersionMode }]}
						onclick={onToggleImmersionMode}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable">
					<span data-i18n="[html]modal.settings.fields.toggleSingleplayerMode.label">Singleplayer Mode</span>
					<a
						href="javascript:void(0);"
						class="helpLink iconLink"
						data-i18n="[title]modal.settings.fields.toggleSingleplayerMode.helpText"
					>
						<div class="helpIcon icon fillIcon invertFillIcon altIcon">
							<svg viewBox="0 0 18 18">
								<path
									d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
								/>
							</svg>
						</div>
					</a>
				</label>
				<div>
					<button
						id="singleplayerModeButton"
						class={['checkboxButton', 'unselectable', { toggled: config.singleplayerMode }]}
						onclick={onToggleSingleplayerMode}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow mobileOnly">
				<label class="unselectable" data-i18n="[html]modal.settings.fields.toggleMobileControls">
					Show Mobile Controls
				</label>
				<div>
					<button
						id="mobileControlsButton"
						class={['checkboxButton inverseToggle unselectable', { toggled: !globalConfig.mobileControls }]}
						onclick={onToggleMobileControls}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow mobileOnly">
				<label class="unselectable">
					<span data-i18n="[html]modal.settings.fields.mobileControlsType.label">Mobile Controls Type</span>
					<a
						href="javascript:void(0);"
						class="helpLink iconLink"
						data-i18n="[title]tooltips.mobileControlsType"
					>
						<div class="helpIcon icon fillIcon invertFillIcon altIcon">
							<svg viewBox="0 0 18 18">
								<path
									d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
								/>
							</svg>
						</div>
					</a>
				</label>
				<div>
					<select id="mobileControl" size="3" oninput={onInputMobileControl}>
						<option
							value="default"
							selected
							data-i18n="[html]modal.settings.fields.mobileControlsType.default"
						>
							D-Pad
						</option>
						<option value="joystick" data-i18n="[html]modal.settings.fields.mobileControlsType.joystick">
							Floating Joystick
						</option>
						<option value="dpad" data-i18n="[html]modal.settings.fields.mobileControlsType.dpad">
							Floating D-Pad
						</option>
					</select>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.settings.fields.toggleLocationDisplay">
					Location Display
				</label>
				<div>
					<button
						id="locationDisplayButton"
						class={['checkboxButton', 'unselectable', { toggled: globalConfig.locationDisplay }]}
						onclick={() => toggle(globalConfig, 'locationDisplay', true)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.settings.fields.toggleRankings">Rankings</label>
				<div>
					<button
						id="toggleRankingsButton"
						class={['checkboxButton inverseToggle unselectable', { toggled: globalConfig.hideRankings }]}
						onclick={onToggleRankings}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.settings.fields.toggleSchedules">Events</label>
				<div>
					<button
						id="toggleSchedulesButton"
						class={['checkboxButton inverseToggle unselectable', { toggled: globalConfig.hideSchedules }]}
						onclick={onToggleSchedules}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable">
					<span data-i18n="[html]modal.settings.fields.togglePreloads.label">Preloads</span>
					<a
						href="javascript:void(0);"
						class="helpLink iconLink"
						data-i18n="[title]modal.settings.fields.togglePreloads.helpText"
					>
						<div class="helpIcon icon fillIcon invertFillIcon altIcon">
							<svg viewBox="0 0 18 18">
								<path
									d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
								/>
							</svg>
						</div>
					</a>
				</label>
				<div>
					<button
						id="togglePreloadsButton"
						class={['checkboxButton', 'unselectable', { toggled: globalConfig.preloads }]}
						onclick={() => toggle(globalConfig, 'preloads', true)}
					>
						<span></span>
					</button>
				</div>
			</li>
			{#if gameId == '2kki'}
				<li class={['formControlRow indent preloadRow', { hidden: !globalConfig.preloads }]}>
					<label class="unselectable">
						<span data-i18n="[html]modal.settings.fields.toggleQuestionablePreloads">
							Preload PC Wallpapers
						</span>
					</label>
					<div>
						<button
							id="toggleQuestionablePreloadsButton"
							class={['checkboxButton', 'unselectable', { toggled: globalConfig.questionablePreloads }]}
							onclick={onToggleQuestionablePreloads}
						>
							<span></span>
						</button>
					</div>
				</li>
			{/if}
			<li class="formControlRow">
				<label class="unselectable">
					<span data-i18n="[html]modal.settings.fields.unicodeFont">Alternate Font</span>
				</label>
				<div>
					<button
						id="toggleUnicodeFont"
						class={['checkboxButton', 'unselectable', { toggled: globalConfig.unicodeFont }]}
						onclick={() => {
							globalConfig.unicodeFont = !globalConfig.unicodeFont;
							onToggleUnicodeFont();
						}}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.settings.fields.toggleHideUnnamedPlayers">
					Hide Unnamed Players
				</label>
				<div>
					<button
						id="hideUnnamedPlayersButton"
						class={['checkboxButton', 'unselectable', { toggled: config.hideUnnamedPlayers }]}
						onclick={() => {
							config.hideUnnamedPlayers = !config.hideUnnamedPlayers;
							onToggleHideUnnamedPlayers();
						}}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow buttonRow">
				<button
					id="blocklistButton"
					onclick={openBlocklistModal}
					class="unselectable"
					type="button"
					data-i18n="[html]modal.settings.blocklist"
				>
					Blocklist
				</button>
				<button
					id="chatSettingsButton"
					class="unselectable"
					type="button"
					data-i18n="[html]modal.settings.chatSettings"
					onclick={() => openModal('chatSettingsModal', null, 'settingsModal')}
				>
					Chat
				</button>
				<button
					id="screenshotSettingsButton"
					class="unselectable"
					type="button"
					data-i18n="[html]modal.settings.screenshotSettings"
					onclick={() => openModal('screenshotSettingsModal', null, 'settingsModal')}
				>
					Screenshots
				</button>
				<button
					id="notificationSettingsButton"
					class="unselectable"
					type="button"
					data-i18n="[html]modal.settings.notificationSettings"
					onclick={() => openModal('notificationSettingsModal', null, 'settingsModal')}
				>
					Notifications
				</button>
				<button
					id="cacheSettingsButton"
					class="unselectable"
					type="button"
					data-i18n="[html]modal.settings.cacheSettings"
					onclick={() => openCacheSettingsModal('settingsModal')}
				>
					Cache
				</button>
				<button
					id="accountSettingsButton"
					class="unselectable accountRequired"
					type="button"
					data-i18n="[html]modal.settings.accountSettings"
				>
					Account
				</button>
				<button
					class="unselectable"
					type="button"
					data-i18n="[html]modal.settings.engineSettings"
					onclick={() => (closeModal(), simulateKeyboardInput('F1', 112))}
				>
					Engine (F1)
				</button>
			</li>
		</ul>
	</div>
</div>
