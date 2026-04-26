<script>
	import { gameId } from '$lib';
	import { trySetChatName } from '$lib/chat.svelte'

	function chatNameCheck(ev) {
		ev.preventDefault();
	  trySetChatName(ev.target.nameInput.value);
	}

	let nameInput;

	/**
	 * @param {HTMLInputElement} inputElement
	 * @param {number} length
	 */
	function constrainByteLength(length) {
		const buf = new Uint8Array(length);
		const enc = new TextEncoder();
		const listener = (event) => {
			const target = event?.target;
			if (!target) return;
			// modifying input contents during composition would interrupt it
			// and prevent the user from finishing
			if (event.isComposing) return;

			const sel = target.selectionStart;
			const v = target.value;

			// length is implicitly constrained by encodeInto
			// encode the substring after the caret first so it doesn't get
			// overwritten if the caret is in the middle of the string
			const e2 = enc.encodeInto(v.substring(sel), buf);
			// then do the one before the caret
			const e1 = enc.encodeInto(v.substring(0, sel), buf.subarray(e2.written));
			target.value = v.substring(0, e1.read) + v.substring(sel, sel + e2.read);
			target.selectionEnd = e1.read;
		};

		// some browsers send an input event with isComposing: false after composition
		// finishes but it's not guaranteed to always fire (and doesn't on e.g. chromium)
		// so we have to listen for compositionend as well
		// inputElement.addEventListener('input', listener);
		// inputElement.addEventListener('compositionend', listener);
		return { oninput: listener, oncompositionend: listener };
	}
</script>

<div id="chatboxContainer" class="container" style="display: table-cell">
	<div id="chatbox" class="allChat">
		<div id="chatboxInfo">
			<div id="onlineInfo" class="info hidden">
				<span id="connStatus" class="infoContainer unselectable"
					><span id="connStatusIcon" class="punct">●</span>
					<label id="connStatusText" class="infoText">Disconnected</label>
					<a
						id="reconnectButton"
						href="javascript:void(0);"
						class="reconnectLink iconLink unselectable"
						data-i18n="[title]chatbox.reconnect"
					>
						<div class="reconnectIcon icon fillIcon altIcon">
							<svg viewBox="0 0 18 18">
								<path
									d="m0 7q1.5-7 9-7 3 0 5.5 2.5l2-2.5 1.5 8h-8l2-2.5q-5-3.5-8 1.5h-4m18 4q-1.5 7-9 7-3 0-5.5-2.5l-2 2.5-1.5-8h8l-2 2.5q5 3.5 8-1.5h4"
								></path>
							</svg>
						</div>
					</a></span
				><span id="playerCountLabel" class="playerCountLabel infoLabel unselectable"></span><span
					id="mapPlayerCountLabel"
					class="playerCountLabel infoLabel unselectable hidden"
				></span><span
					id="immersionModeLabel"
					class="infoLabel unselectable"
					data-i18n="[html]chatbox.immersionMode">Immersion Mode</span
				>
			</div>
			<div id="location" class="info hidden">
				<span id="locationLabel" class="infoLabel nowrap" data-i18n="[html]chatbox.location"
					>Location:&nbsp;</span
				><span id="locationText" class="infoText nofilter"></span>
			</div>
			<div id="nextLocationContainer" class="info hidden">
				<button
					id="toggleNextLocationButton"
					class="icon fillIcon iconButton"
					data-i18n="[title]tooltips.chat.toggleNextLocation"
				>
					<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
						><path
							d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18m0 2a1 1 0 0 1 0 14 1 1 0 0 1 0-14m4 11-2-6-6-2 2 6 6 2m-4-5a1 1 0 0 1 0 2 1 1 0 0 1 0-2"
						></path></svg
					>
				</button>
				<div id="nextLocation" class="info">
					<span
						id="nextLocationLabel"
						class="infoLabel nowrap"
						data-i18n="[html]chatbox.nextLocation">Next Loc:&nbsp;</span
					><span id="nextLocationText" class="infoText nofilter"></span>
				</div>
			</div>
		</div>
		<div id="chatboxContent">
			<div id="chatboxTabs">
				<div id="chatboxTabChat" class="chatboxTab active" data-tab-section="chat">
					<label class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.chat">Chat</label
					>
					<div id="unreadMessageCountContainer" class="notificationCountContainer hidden">
						<div class="notificationCount">
							<label class="notificationCountLabel">0</label>
						</div>
					</div>
				</div>
				<div id="chatboxTabPlayers" class="chatboxTab" data-tab-section="players">
					<label class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.players"
						>Players</label
					>
					<div id="incomingFriendRequestCountContainer" class="notificationCountContainer hidden">
						<div class="notificationCount">
							<label class="notificationCountLabel">0</label>
						</div>
					</div>
				</div>
				<div id="chatboxTabParties" class="chatboxTab" data-tab-section="parties">
					<label class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.parties"
						>Parties</label
					>
				</div>
			</div>
			<div id="chat" class="chatboxTabSection">
				<div id="chatHeader" class="tabHeader">
					<div id="chatTabs" class="subTabs">
						<div id="chatTabAll" class="chatTab subTab active">
							<small
								class="chatTabLabel subTabLabel infoLabel unselectable"
								data-i18n="[html]chatbox.chat.tab.all">All</small
							>
							<div class="subTabBg"></div>
						</div>
						<div id="chatTabMap" class="chatTab subTab">
							<small
								class="chatTabLabel subTabLabel infoLabel unselectable"
								data-i18n="[html]chatbox.chat.tab.map">Map</small
							>
							<div class="subTabBg"></div>
						</div>
						<div id="chatTabGlobal" class="chatTab subTab">
							<small
								class="chatTabLabel subTabLabel infoLabel unselectable"
								data-i18n="[html]chatbox.chat.tab.global">Global</small
							>
							<div class="subTabBg"></div>
						</div>
						<div id="chatTabParty" class="chatTab partySubTab subTab">
							<small
								class="chatTabLabel subTabLabel infoLabel unselectable"
								data-i18n="[html]chatbox.chat.tab.party">Party</small
							>
							<div class="subTabBg"></div>
						</div>
					</div>
					<div id="chatButtons" class="tabButtons">
						<button
							id="globalMessageLocationsButton"
							class="iconButton toggleButton offToggleButton unselectable"
							data-i18n="[title]tooltips.chat.toggleGlobalMessageLocations"
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
							>
								<path
									d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18v18q-10-9 0-18 10 9 0 18m-7.5-4q7.5-3 15 0m-15-10q7.5 2 15 0m-16.5 5h18"
								/><path d="m-2 16l22-14" />
							</svg>
						</button>
						<button
							id="messageTimestampsButton"
							class="iconButton toggleButton offToggleButton unselectable"
							data-i18n="[title]tooltips.chat.toggleMessageTimestamps"
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
							>
								<path d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18m0 3v6l4 4" /><path d="m-2 16l22-14" />
							</svg>
						</button>
						<button
							id="mentionFilterButton"
							class="iconButton toggleButton offToggleButton unselectable"
							data-i18n="[title]tooltips.chat.filterMentions"
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
							>
								<path
									d="M13.5 9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0Zc0 1.657 1.007 3 2.25 3S18 10.657 18 9a9 9 0 10-2.636 6.364M13.5 9V5.25"
								/><path
									d="M13.5 9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0Zc0 1.657 1.007 3 2.25 3S18 10.657 18 9a9 9 0 10-2.636 6.364M13.5 9V5.25"
								/>
							</svg>
						</button>
						<button
							id="clearChatButton"
							class="iconButton unselectable"
							data-i18n="[title]tooltips.chat.clearChat"
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
							>
								<path
									d="m3 18l6-4.5h6q3 0 3-3v-7.5q0-3-3-3h-12q-3 0-3 3v7.5q0 3 3 3h1.5l-1.5 4.5m9.5-14.75l-7 7m0-7l7 7"
								/>
							</svg>
						</button>
					</div>
				</div>
				<div id="messages" class="chatboxTabContent scrollableContainer"></div>
			</div>
			<div id="players" class="chatboxTabSection hidden">
				<div id="playersHeader" class="tabHeader">
					<div id="playersTabs" class="subTabs">
						<div id="playersTabMap" class="playersTab subTab active">
							<small
								class="playersTabLabel subTabLabel infoLabel unselectable"
								data-i18n="[html]chatbox.players.tab.map">Map</small
							>
							<div class="subTabBg"></div>
						</div>
						<div id="playersTabFriends" class="playersTab friendsSubTab subTab">
							<small
								class="playersTabLabel subTabLabel infoLabel unselectable"
								data-i18n="[html]chatbox.players.tab.friends">Friends</small
							>
							<div class="subTabBg"></div>
						</div>
						<div id="playersTabParty" class="playersTab partySubTab subTab">
							<small
								class="playersTabLabel subTabLabel infoLabel unselectable"
								data-i18n="[html]chatbox.players.tab.party">Party</small
							>
							<div class="subTabBg"></div>
						</div>
					</div>
					<div id="playersButtons" class="tabButtons"></div>
				</div>
				<div id="playerList" class="playerList chatboxTabContent scrollableContainer"></div>
				<div id="friendsPlayerList" class="playerList chatboxTabContent scrollableContainer"></div>
				<div id="partyPlayerList" class="playerList chatboxTabContent scrollableContainer"></div>
			</div>
			<div id="parties" class="chatboxTabSection hidden">
				<div id="partiesHeader" class="tabHeader">
					<div id="partiesTabs" class="subTabs"></div>
					<div id="partiesButtons" class="tabButtons">
						<button
							id="createPartyButton"
							class="iconButton unselectable"
							data-i18n="[title]tooltips.parties.createParty"
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
							>
								<path
									d="m9 4a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7 1.625 0 2.5313 0.6875 2.75 1.125v0.625h-3v3.5h3v2.25q-3.2344 1.2344-6.75-0.5m0-17a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0-5m4 11.75c-0.125-3.625-1-5.75-4-5.75-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 2.5 0.875 2.625 1v-2h3.5v3h1.75m-2 6.25v-3h3v-3h-3v-3h-3v3h-3v3h3v3h3"
								/>
							</svg>
						</button>
						<button
							id="disbandPartyButton"
							class="iconButton unselectable"
							data-i18n="[title]tooltips.parties.disbandParty"
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
							>
								<path
									d="m9 4c0.4375 0 1.375 0.1875 1.9062 0.875l-1.9062 1.875-1.9063-1.875c0.6563-0.75 1.4688-0.875 1.9063-0.875m-4 11.25l4-4 3.9375 3.9375s0.0625 0.25 0.0625 1.8125q-4 2-8 0-0.0625-1.5 0-1.75m0-15.25m1.6562 4.4063c2.2813-2.4688-0.4687-5.2813-2.7812-4.1563q-0.5 0.3125-0.7813 0.625l3.5625 3.5313m-5.6562 8.5937c0.5 0.25 0.9375 0.4375 1.25 0.5l4.5-4.5-2.875-2.875c-3.1875 0.5-2.875 6.125-2.875 6.875m10.344-8.5937c-2.2813-2.4688 0.4687-5.2813 2.7812-4.1563q0.5 0.3125 0.7813 0.625l-3.5625 3.5313m5.6562 8.5937c-0.5 0.25-0.9375 0.4375-1.25 0.5l-4.5-4.5 2.875-2.875c3.1875 0.5 2.875 6.125 2.875 6.875m-14-12l6 6 7-7 2 2-7 7 7 7-2 2-7-7-7 7-2-2 7-7-6-6 2-2"
								/>
							</svg>
						</button>
					</div>
				</div>
				<div id="partyList" class="partyList chatboxTabContent scrollableContainer"></div>
			</div>
		</div>
		<div id="chatInputContainer" style="display: none" {...constrainByteLength(150)}>
			<form action="javascript:chatInputActionFired()">
				<input
					id="chatInput"
					data-ynomoji="true"
					type="text"
					autocomplete="off"
					maxlength="150"
					disabled="true"
				/>
				<div id="globalChatInputOverlay"></div>
				<div id="chatBorder"></div>
			</form>
			<div class="globalCooldownIcon icon">
				<svg
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
				>
					<circle class="bgCircle" cx="9" cy="9" r="9" />
					<circle class="timerCircle" cx="9" cy="9" r="9" />
				</svg>
			</div>
			<button
				id="globalMessageButton"
				class="iconButton fadeToggle unselectable"
				data-i18n="[title]tooltips.toggleGlobalMessage"
			>
				<svg
					viewBox="0 0 18 18"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
				>
					<path
						d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18v18q-10-9 0-18 10 9 0 18m-7.5-4q7.5-3 15 0m-15-10q7.5 2 15 0m-16.5 5h18"
					/>
					<path d="m-2 16l22-14" />
				</svg>
			</button>
		</div>
		<div id="ynomojiContainer" class="scrollableContainer hidden"></div>
		<div id="enterNameContainer">
			<span id="enterNameInstruction">
				<span data-i18n="[html]chatbox.chat.nickname.header"
					>You must set a nickname before you can chat.</span
				>
				<br />
				<small>
					<span data-i18n="[html]chatbox.chat.nickname.rule.maxLength">* Maximum 12 characters</span
					>
					<br />
					<span data-i18n="[html]chatbox.chat.nickname.rule.alphanumeric"
						>* Alphanumeric characters only</span
					>
				</small>
			</span>
			<form id="enterNameForm" onsubmit={chatNameCheck}>
				<input id="nameInput" type="text" autocomplete="off" maxlength="10" />
			</form>
		</div>
	</div>
	{#if gameId == '2kki'}
		<div id="explorerContainer" style="display: none" class="accountRequired" data-game-ids>
			<iframe id="explorerFrame" class="unselectable"></iframe>
			<a
				id="explorerUndiscoveredLocationsLink"
				href="javascript:void(0);"
				class="iconLink hidden"
				data-i18n="[title]tooltips.explorerUndiscoveredLocations"
			>
				<div class="helpIcon icon fillIcon invertFillIcon altIcon">
					<svg viewBox="0 0 18 18">
						<path
							d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
						/>
					</svg>
				</div>
			</a>
		</div>
	{/if}
</div>
