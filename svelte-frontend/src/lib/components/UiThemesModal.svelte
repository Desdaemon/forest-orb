<script>
	import { gameId } from '$lib';
	import { onChangeFontStyle, onClickUiThemeList } from '$lib/play.svelte';
</script>

<div id="uiThemesModal" class="modal fullscreenModal hidden">
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.uiTheme.title">UI Theme</h1>
	</div>
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<!-- The themes are populated at runtime, so their clicks are delegated from here. -->
	<div class="modalContent itemContainer" onclick={onClickUiThemeList}></div>
	<div class="modalFooter">
		<div class="uiControl">
			<label for="fontStyle" class="unselectable" data-i18n="[html]fontStyle.label">Font Style:</label>
			<select id="fontStyle" class="fontStyle" onchange={onChangeFontStyle}>
				<option value="0" data-i18n="[html]fontStyle.values.style1">Style 1</option>
				<option value="1" data-i18n="[html]fontStyle.values.style2">Style 2</option>
				{#if gameId !== 'muma' && gameId !== 'genie'}
					{#if gameId !== 'someday'}
						<option value="2" data-i18n="[html]fontStyle.values.style3">Style 3</option>
					{/if}
					{#if gameId !== 'deepdreams'}
						<option value="3" data-i18n="[html]fontStyle.values.style4">Style 4</option>
					{/if}
					{#if gameId == 'yume' || gameId == '2kki' || gameId == 'unconscious' || gameId == 'flow' || gameId == 'mikan'}
						<option value="4" data-i18n="[html]fontStyle.values.style5">Style 5</option>
						{#if gameId != 'mikan'}
							<option value="5" data-i18n="[html]fontStyle.values.style6">Style 6</option>
							<option value="6" data-i18n="[html]fontStyle.values.style7">Style 7</option>
						{/if}
					{/if}
				{/if}
			</select>
		</div>
	</div>
</div>
