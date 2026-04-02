<script lang="ts">
	const { onToggleChat = () => {} } = $props<{ onToggleChat?: () => void }>();
</script>

<div id="controls">
	<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
		<defs id="svgDefs"></defs>
	</svg>
	<div id="leftControls">
		<button id="privateModeButton" class="iconButton toggleButton altToggleButton transparentToggleButton unselectable" data-i18n="[title]tooltips.togglePrivateMode" aria-label="Toggle private mode">
			<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m5 0a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0-5m4 13c0-5-1-7-4-7-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 3.625 1 3.875 4.125q2.375 0 4-0.875" /><path d="m9 4a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7s4 2 4 7q-4 2-8 0" /></svg>
		</button>
		<button id="saveButton" class="iconButton unselectable" data-i18n="[title]tooltips.save" aria-label="Save game">
			<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m0 1.5q0-1.5 1.5-1.5h11.25l2.25 2.25v12.75q0 1.5-1.5 1.5h-12q-1.5 0-1.5-1.5v-13.5m4.5-1.5v3.75q0 0.75 0.75 0.75h4.5q0.75 0 0.75-0.75v-3.75m-1.75 1v2.5h0.75v-2.5h-0.75m-5.75 15.5v-6.75q0-0.75 0.75-0.75h7.5q0.75 0 0.75 0.75v6.75m-7.5-6h6m-6 2.25h6m-6 2.25h6" /></svg>
		</button>
		<button id="uiThemeButton" class="iconButton unselectable" data-i18n="[title]tooltips.uiTheme" aria-label="Cycle UI theme" onclick={onToggleChat}>
			<svg viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m4.5 3c4.5-4.5 13.5-3 13.5-0.375m-4.125 6.375c-1.875 0-3.375 1.5-1.875 1.875m3 2.625c3 1.5-4.5 6-10.5 4.5-7.5-3-4.5-12 0-15m9-0.75a1.5 1.5 90 0 0 0 3.75 1.5 1.5 90 0 0 0-3.75m-6 0.75a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m-3.75 4.5a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m1.5 5.25a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m6-0.75a1.5 1.5 90 0 0-0.75 4.5q2.25 0 3-1.875m7.5-14.625q-6 4.5-7.5 10.5l1.5 0.75q4.5-3.75 6-11.25m-7.5 10.5c-3 0-1.5 3-3 4.5 6 0 4.5-3 4.5-3.75m-3.75 2.25c0.75 1.5 1.5 0 1.5 1.275" /></svg>
		</button>
		<button id="chatButton" class="iconButton toggleButton offToggleButton unselectable" data-i18n="[title]tooltips.toggleChat" aria-label="Toggle chat" onclick={onToggleChat}>
			<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m3 18l6-4.5h6q3 0 3-3v-7.5q0-3-3-3h-12q-3 0-3 3v7.5q0 3 3 3h1.5l-1.5 4.5m11.25-12.75a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3"/><path d="m-2 16l22-14" /></svg>
		</button>
		<!-- More buttons can be added here, same as legacy markup -->
	</div>
	<div id="rightControls">
		<div id="badgeHintControls"></div>
		<div id="mapControls"></div>
		<div id="explorerControls"></div>
		<div id="eventControls" class="accountRequired" style="display: none"></div>
		<button id="controls-fullscreen" class="iconButton unselectable" aria-label="Toggle Fullscreen">
			<svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M13.5 13.5H10m3.5 0V10m0 3.5l-4-4m.5-8h3.5m0 0V5m0-3.5l-4 4M5 1.5H1.5m0 0V5m0-3.5l4 4m-4 4.5v3.5m0 0H5m-3.5 0l4-4"></path></svg>
		</button>
	</div>
</div>
