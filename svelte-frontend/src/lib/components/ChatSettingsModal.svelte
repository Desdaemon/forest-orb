<script>
	import { globalConfig, updateConfig } from '$lib/config.svelte';
	import {
		onChangeGlobalChatHistoryLimit,
		onChangeMapChatHistoryLimit,
		onChangePartyChatHistoryLimit,
		onToggleGameChatGlobal,
		onToggleGameChatParty
	} from '$lib/play.svelte';

	/** Flips a `globalConfig` flag and persists it. */
	function toggle(key) {
		globalConfig[key] = !globalConfig[key];
		updateConfig(globalConfig, true);
	}
</script>

<div id="chatSettingsModal" class="modal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.chatSettings.title">Chat Settings</h1>
	</div>
	<div class="modalContent">
		<ul class="formControls">
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.chatSettings.fields.toggleGameChat.label">
					In-Game Chat Overlay
				</label>
				<div>
					<button
						id="gameChatButton"
						class={['checkboxButton', 'unselectable', { toggled: globalConfig.gameChat }]}
						onclick={() => toggle('gameChat')}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class={['formControlRow indent gameChatRow', { hidden: !globalConfig.gameChat }]}>
				<label class="unselectable" data-i18n="[html]modal.chatSettings.fields.toggleGameChat.global">
					Global Chat Overlay
				</label>
				<div>
					<button
						id="gameChatGlobalButton"
						class={['checkboxButton', 'unselectable', { toggled: globalConfig.gameChatGlobal }]}
						onclick={() => {
							globalConfig.gameChatGlobal = !globalConfig.gameChatGlobal;
							onToggleGameChatGlobal();
						}}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class={['formControlRow indent gameChatRow', { hidden: !globalConfig.gameChat }]}>
				<label class="unselectable" data-i18n="[html]modal.chatSettings.fields.toggleGameChat.party">
					Party Chat Overlay
				</label>
				<div>
					<button
						id="gameChatPartyButton"
						class={['checkboxButton', 'unselectable', { toggled: globalConfig.gameChatParty }]}
						onclick={() => {
							globalConfig.gameChatParty = !globalConfig.gameChatParty;
							onToggleGameChatParty();
						}}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow desktopOnly">
				<label class="unselectable" data-i18n="[html]modal.chatSettings.fields.toggleTabToChat">
					Press Tab to Chat
				</label>
				<div>
					<button
						id="tabToChatButton"
						class={['checkboxButton inverseToggle unselectable', { toggled: !globalConfig.tabToChat }]}
						onclick={() => toggle('tabToChat')}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.chatSettings.fields.togglePlayMentionSound">
					Play Mention Sound
				</label>
				<div>
					<button
						id="playMentionSoundButton"
						class={[
							'checkboxButton inverseToggle unselectable',
							{ toggled: !globalConfig.playMentionSound }
						]}
						onclick={() => toggle('playMentionSound')}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable" data-i18n="[html]modal.chatSettings.fields.blurScreenshotEmbeds">
					Blur All Screenshots
				</label>
				<div>
					<button
						id="blurScreenshotEmbedsButton"
						class={['checkboxButton', 'unselectable', { toggled: globalConfig.blurScreenshotEmbeds }]}
						onclick={() => toggle('blurScreenshotEmbeds')}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label
					for="mapChatHistoryLimit"
					class="unselectable"
					data-i18n="[html]modal.chatSettings.fields.mapChatHistoryLimit.label"
				>
					Map Chat History Limit
				</label>
				<div>
					<select id="mapChatHistoryLimit" onchange={onChangeMapChatHistoryLimit}>
						<option value="25" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.25">
							25
						</option>
						<option value="50" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.50">
							50
						</option>
						<option
							value="100"
							data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.100"
							selected
						>
							100
						</option>
						<option value="250" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.250">
							250
						</option>
						<option value="500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.500">
							500
						</option>
						<option value="1000" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.1000">
							1000
						</option>
						<option value="2500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.2500">
							2500
						</option>
						<option value="0" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.0">
							Unlimited
						</option>
					</select>
				</div>
			</li>
			<li class="formControlRow">
				<label
					for="globalChatHistoryLimit"
					class="unselectable"
					data-i18n="[html]modal.chatSettings.fields.globalChatHistoryLimit.label"
				>
					Global Chat History Limit
				</label>
				<div>
					<select id="globalChatHistoryLimit" onchange={onChangeGlobalChatHistoryLimit}>
						<option value="25" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.25">
							25
						</option>
						<option value="50" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.50">
							50
						</option>
						<option
							value="100"
							data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.100"
							selected
						>
							100
						</option>
						<option value="250" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.250">
							250
						</option>
						<option value="500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.500">
							500
						</option>
						<option value="1000" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.1000">
							1000
						</option>
						<option value="2500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.2500">
							2500
						</option>
						<option value="0" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.0">
							Unlimited
						</option>
					</select>
				</div>
			</li>
			<li class="formControlRow">
				<label
					for="partyChatHistoryLimit"
					class="unselectable"
					data-i18n="[html]modal.chatSettings.fields.partyChatHistoryLimit.label"
				>
					Map Chat History Limit
				</label>
				<div>
					<select id="partyChatHistoryLimit" onchange={onChangePartyChatHistoryLimit}>
						<option value="25" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.25">
							25
						</option>
						<option value="50" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.50">
							50
						</option>
						<option value="100" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.100">
							100
						</option>
						<option
							value="250"
							data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.250"
							selected
						>
							250
						</option>
						<option value="500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.500">
							500
						</option>
						<option value="1000" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.1000">
							1000
						</option>
						<option value="2500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.2500">
							2500
						</option>
						<option value="0" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.0">
							Unlimited
						</option>
					</select>
				</div>
			</li>
		</ul>
	</div>
</div>
