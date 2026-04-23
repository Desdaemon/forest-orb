<script>
	// @ts-check
	import {
		cycleGameChatMode,
		gameChatModeIndex,
		trySendMapMessage,
		trySendGlobalMessage,
		trySendPartyMessage
	} from '$lib/chat.svelte';
	import { playerName } from '$lib/play.svelte';
	let focused = $state(false);

	function focusGameChatInput() {
		focused = true;
		document.execCommand('selectAll', false, undefined);
		document.getSelection().collapseToEnd();
	}

	function blurGameChatInput() {
		focused = false;
	}

	function keydownChatInput(e) {
		if (e.key === 'Tab') {
			e.preventDefault();
			cycleGameChatMode();
		} else if (e.key === 'Enter') {
			const chatMessageContent = e.target.innerText.trim();
			if (!chatMessageContent) {
				document.getElementById('canvas').focus();
				return;
			}
			e.preventDefault();
			if (!playerName) return;
			switch (gameChatModeIndex()) {
				case 0:
					if (!trySendMapMessage(chatMessageContent)) return;
					break;
				case 1:
					if (!trySendGlobalMessage(chatMessageContent)) return;
					break;
				case 2:
					if (!trySendPartyMessage(chatMessageContent)) return;
					break;
			}
			e.target.innerHTML = '';
		} else if (e.key === 'Escape') {
			document.getElementById('canvas').focus();
			return;
		}
	}
</script>

<div id="gameChatContainer" class={['hidden', { focused }]}>
	<div id="gameChatInputContainer" class="gameChatMessageContainer">
		<div class="gameChatMessage message">
			<div class="messageContents">
				>&nbsp;<span id="gameChatModeIcon"></span>
				<div class="globalCooldownIcon icon hidden">
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
				<span
					id="gameChatInput"
					contenteditable="true"
					onfocus={focusGameChatInput}
					onblur={blurGameChatInput}
					onkeydown={keydownChatInput}
				></span>
			</div>
		</div>
	</div>
</div>

<style>
	#gameChatContainer {
		position: absolute;
		font-family: 'JF-Dot-Shinonome12';
		font-size: 16px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		overflow: hidden;
		pointer-events: none;
		transform-origin: top left;
		transform: scale(var(--canvas-scale));
	}

	#gameChatContainer:not(.focused) > #gameChatInputContainer {
		display: none;
	}

	#gameChatContainer.focused > .gameChatMessageContainer {
		opacity: 1 !important;
	}
</style>
