<script>
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import ChatboxContainer from '$lib/components/ChatboxContainer.svelte';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import GameChatContainer from '$lib/components/GameChatContainer.svelte';
	import GameLogo from '$lib/components/GameLogo.svelte';
	import SessionCommands from '$lib/components/SessionCommands.svelte';
	import { gameId, hasTouchscreen } from '$lib';
	import { openBadgesModal } from '$lib/badges.svelte';
	import { globalConfig } from '$lib/config.svelte';
	import { openEventsModal } from '$lib/events';
	import { isFullscreenSupported, toggleFullscreen } from '$lib/gamecanvas';
	import { initApp } from '$lib/init';
	import { locationsState, openLocationsModal } from '$lib/locations.svelte';
	import { openSchedulesModal } from '$lib/schedules';
	import {
		get2kkiVersion,
		init2kkiConfig,
		initPlay,
		initUiTheme,
		onContentScroll,
		onDocumentClick,
		onDocumentKeyup,
		onDocumentMouseMove,
		onFullscreenChange,
		onModalContainerClick,
		onToggleChat,
		onToggleExplorer,
		onToggleHideLocation,
		onToggleMute,
		onTogglePrivateMode,
		onWindowResize,
		openModal,
		openSettingsModal,
		openUiThemesModal,
		showFirstVisitModals,
		updateFullscreenPolling
	} from '$lib/play.svelte';

	// Everything below used to run as import-time side effects in the modules above.
	$effect(() => {
		init2kkiConfig();
		initUiTheme();
		initApp();
		initPlay();
		// TODO: the account, save sync, save data, screenshot and ranking controls are still
		// waiting on their modules to be ported.
		// Start polling if we're already fullscreen with the settings modal open
		updateFullscreenPolling();
		showFirstVisitModals();
	});

	const gameName = 'Yume 2kki';
	const gameIdsWithDisclaimer = [
		'flow',
		'someday',
		'deepdreams',
		'prayers',
		'amillusion',
		'unevendream',
		'braingirl',
		'muma',
		'genie',
		'mikan',
		'ultraviolet',
		'sheawaits',
		'oversomnia',
		'tsushin',
		'nostalgic',
		'oneshot',
		'if',
		'unaccomplished',
		'fog',
		'cold',
		'loveyou'
	];
	const enableBadgeTools = false;
</script>

<svelte:window onresize={onWindowResize} />
<svelte:document
	onkeyup={onDocumentKeyup}
	onclick={onDocumentClick}
	onmousemove={onDocumentMouseMove}
	onfullscreenchange={onFullscreenChange}
/>

<svelte:head>
	<title>{gameName} Online - YNOproject</title>
	<meta charset="utf-8" />
	<meta name="description" content="Play multiplayer {gameName} for free! Ad-free and no registration required." />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	{#if gameId == '2kki'}
		<meta name="2kkiVersion" content="" />
		<!-- eg. 0.117g Patch 4 -->
	{/if}
	<link rel="manifest" href="/manifest.json" />
	<link rel="stylesheet" href="play.css" />
	<link rel="stylesheet" href="gamecanvas.css" />
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/animations/scale.css" />
	<!--<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>-->
</svelte:head>

<div id="background"></div>
<div id="backgroundOverlay"></div>
<div id="content" onscroll={onContentScroll}>
	<div id="top"></div>
	<div id="header">
		<div id="headerLogoContainer">
			<button
				id="nexusButton"
				class="iconButton fillIcon unselectable"
				data-i18n="[title]tooltips.nexus"
				dir="ltr"
				onclick={() => (window.location.href = '../')}
			>
				<svg height="48" viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg">
					<path
						d="m0 0h6v10h16v-10h6v16h-11v12.5h-6v-12.5h-11v-15.5m34-0.5h22v6h-16v22.5h-6v-28.5m22 6h6v22.5h-6v-22.5"
					></path>
				</svg>
				<svg height="48" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
					<path d="m0 0h28v28h-28v-28m10 13h-2v2h2v-2m-4 9h16v-16h-16v16m0.5-15.5h15v15h-15v-15"></path>
					<path
						d="m0 0h28v28h-10l-6 7v-21l9-9h-15v17h3v6h-9v-28m22 5h-0.5v17h0.5v-17m-6 15h-1.5v0.5h-0.5v1.5h2v-2"
					></path>
				</svg>
				<svg height="48" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
					<path d="m0 0h28v28h-28v-28m10 13h-2v2h2v-2m-4 9h16v-16h-16v16m0.5-15.5h15v15h-15v-15"></path>
					<path
						d="m0 0h28v28h-10l-6 7v-21l9-9h-15v17h3v6h-9v-28m22 5h-0.5v17h0.5v-17m-6 15h-1.5v0.5h-0.5v1.5h2v-2"
					></path>
				</svg>
			</button>
			<GameLogo />
		</div>
		<div id="headerIconContainer" class="itemContainer smallItemContainer">
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div id="badgeButton" class="badgeItem item accountRequired unselectable" onclick={openBadgesModal}></div>
			<button
				id="locationsButton"
				class={['iconButton', 'fillIcon', 'unselectable', { hidden: !locationsState.available }]}
				data-i18n="[title]tooltips.locations"
				onclick={openLocationsModal}
			>
				<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
					<path
						d="m0 14zv-2.5l3.75-4 3 2 5.25-5 6 4.5v5zm0-9.5a1.0313 1.0313 90 0 0 4 0 1.0313 1.0313 90 0 0-4 0z"
					/>
				</svg>
			</button>
			<button
				id="communityScreenshotsButton"
				class="iconButton fillIcon unselectable"
				data-i18n="[title]tooltips.communityScreenshots"
			>
				<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
					<path
						d="m0.75 5.5h14.5v9.25h-1.25v-8h-13.25zm14.5 9.25v1.25h-14.5v-9.25h1.25v8zm-12.5-0.75v-1.25l2.25-2.5 1.75 1.25 3-3 3.5 2.5v3zm0-5.5a0.5 0.5 90 0 0 2.5 0 0.5 0.5 90 0 0-2.5 0zm0-4.25h13.75v9.75h-1v-8.75h-12.75v-1m2-1.25h13v9h-1v-8h-12v-1"
					/>
				</svg>
			</button>
			<button
				id="rankingsButton"
				class={['iconButton', 'fillIcon', 'unselectable', { hidden: globalConfig.hideRankings }]}
				data-i18n="[title]tooltips.rankings"
			>
				<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
					<path d="m0 18v-11h5.75v11m0.5 0v-16h5.5v16m0.5-6h5.75v6h-5.75v-6" />
				</svg>
			</button>
			<button
				id="schedulesButton"
				class={['iconButton', 'fillIcon', 'unselectable', { hidden: globalConfig.hideSchedules }]}
				data-i18n="[title]tooltips.schedules"
				onclick={() => openSchedulesModal()}
			>
				<svg
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink"
					xml:space="preserve"
					width="32"
					height="32"
					viewBox="0 0 18 18"
				>
					<path
						d="M18 3V18H0V3H3V4.5a.5.5 90 003 0V3H7.5V4.5a.5.5 90 003 0V3H12V4.5a.5.5 90 003 0V3ZM3.5 4.5a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 4.5a.5.5 90 002 0V1A.5.5 90 008 1Zm4.5 0a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 7H1.5v4H8Zm2 0v4h6.5V7ZM1.5 16.5H8v-4H1.5Zm8.5-4v4h6.5v-4Z"
					/>
				</svg>
			</button>
			<button id="loginButton" type="button" class="unselectable" data-i18n="[html]account.login">Login</button>
			<button id="logoutButton" type="button" class="unselectable" data-i18n="[html]account.logout">
				Logout
			</button>
		</div>
	</div>
	<div id="layout">
		<div id="mainContainer" class="container">
			<div id="gameContainer">
				<div id="controls">
					<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
						<defs id="svgDefs"></defs>
					</svg>
					<div id="leftControls">
						<button
							id="privateModeButton"
							class="iconButton toggleButton altToggleButton transparentToggleButton unselectable"
							data-i18n="[title]tooltips.togglePrivateMode"
							onclick={onTogglePrivateMode}
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="m5 0a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0-5m4 13c0-5-1-7-4-7-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 3.625 1 3.875 4.125q2.375 0 4-0.875"
								/>
								<path d="m9 4a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7s4 2 4 7q-4 2-8 0" />
							</svg>
						</button>
						<button id="saveButton" class="iconButton unselectable" data-i18n="[title]tooltips.save">
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="m0 1.5q0-1.5 1.5-1.5h11.25l2.25 2.25v12.75q0 1.5-1.5 1.5h-12q-1.5 0-1.5-1.5v-13.5m4.5-1.5v3.75q0 0.75 0.75 0.75h4.5q0.75 0 0.75-0.75v-3.75m-1.75 1v2.5h0.75v-2.5h-0.75m-5.75 15.5v-6.75q0-0.75 0.75-0.75h7.5q0.75 0 0.75 0.75v6.75m-7.5-6h6m-6 2.25h6m-6 2.25h6"
								/>
							</svg>
						</button>
						<button
							id="uiThemeButton"
							class="iconButton unselectable"
							data-i18n="[title]tooltips.uiTheme"
							onclick={openUiThemesModal}
						>
							<svg
								viewBox="0 0 21 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="m4.5 3c4.5-4.5 13.5-3 13.5-0.375m-4.125 6.375c-1.875 0-3.375 1.5-1.875 1.875m3 2.625c3 1.5-4.5 6-10.5 4.5-7.5-3-4.5-12 0-15m9-0.75a1.5 1.5 90 0 0 0 3.75 1.5 1.5 90 0 0 0-3.75m-6 0.75a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m-3.75 4.5a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m1.5 5.25a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m6-0.75a1.5 1.5 90 0 0-0.75 4.5q2.25 0 3-1.875m7.5-14.625q-6 4.5-7.5 10.5l1.5 0.75q4.5-3.75 6-11.25m-7.5 10.5c-3 0-1.5 3-3 4.5 6 0 4.5-3 4.5-3.75m-3.75 2.25c0.75 1.5 1.5 0 1.5 1.275"
								/>
							</svg>
						</button>
						<button
							id="chatButton"
							class="iconButton toggleButton offToggleButton unselectable"
							data-i18n="[title]tooltips.toggleChat"
							onclick={onToggleChat}
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="m3 18l6-4.5h6q3 0 3-3v-7.5q0-3-3-3h-12q-3 0-3 3v7.5q0 3 3 3h1.5l-1.5 4.5m11.25-12.75a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3"
								/>
								<path d="m-2 16l22-14" />
							</svg>
						</button>
						<button
							id="explorerButton"
							style="display: none"
							class="2kkiOnly iconButton toggleButton onToggleButton accountRequired unselectable"
							data-i18n="[title]tooltips.toggleExplorer"
							onclick={onToggleExplorer}
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="m6.75 6.75h4.5v4.5h-4.5v-4.5m2.25 0v-3.75h-1.5v-3h3v3h-1.5m2.25 6h3.75v-1.5h3v3h-3v-1.5m-6 2.25v3.75h1.5v3h-3v-3h1.5m-2.25-6h-3.75v-1.5h-3v3h3v-1.5"
								/>
								<path d="m-2 16l22-14" />
							</svg>
						</button>
						<button
							id="screenshotButton"
							class="iconButton unselectable"
							data-i18n="[title]tooltips.screenshot"
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="m3 8q0-1 1-1h1.5c1 0 1-2 2-2h3c1 0 1 2 2 2h1.5q1 0 1 1v4q0 1-1 1h-10q-1 0-1-1zm6-0.5a2 2 90 0 0 0 4 2 2 90 0 0 0 -4m-9-2.5v-2q0-1 1-1h2m12 0h2q1 0 1 1v2m0 8v2q0 1-1 1h-2m-12 0h-2q-1 0-1-1v-2"
								></path>
							</svg>
						</button>
						<button
							id="myScreenshotsButton"
							class="iconButton accountRequired unselectable"
							data-i18n="[title]tooltips.myScreenshots"
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="m0 2h18v13h-18zv13-11.5 11.5zm2.5 10.5v-1.5l2.75-3 2.25 1.5 3.75-3.75 4.25 3.25v3.5zm0-6.75a0.75 0.75 90 0 0 3 0 0.75 0.75 90 0 0-3 0z"
								></path>
							</svg>
						</button>
						<button
							id="settingsButton"
							class="iconButton unselectable"
							data-i18n="[title]tooltips.settings"
							onclick={openSettingsModal}
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="m9 5.5a1 1 90 0 0 0 7 1 1 90 0 0 0 -7m-7 5.5l-2-0.25v-3.5l2-0.25 0.75-1.5-1.25-1.75 2.25-2.25 1.75 1.25 1.5-0.75 0.25-2h3.5l0.25 2 1.5 0.75 1.75-1.25 2.25 2.25-1.25 1.75 0.75 1.5 2 0.25v3.5l-2 0.25-0.75 1.5 1.25 1.75-2.25 2.25-1.75-1.25-1.5 0.75-0.25 2h-3.5l-0.25-2-1.5-0.75-1.75 1.25-2.25-2.25 1.25-1.75-0.75-1.5"
								/>
							</svg>
						</button>
						<button
							id="muteButton"
							class="iconButton toggleButton offToggleButton unselectable"
							data-i18n="[title]tooltips.toggleMute"
							onclick={onToggleMute}
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path d="m0 7h3l4-4v12l-4-4h-3v-4m10 0q1 2 0 4m3-5.5q2 3.5 0 7m3-9.5q4 6 0 12" />
								<path d="m-2 16l22-14" />
							</svg>
						</button>
						<button
							id="hideLocationButton"
							class="iconButton toggleButton offToggleButton unselectable"
							data-i18n="[title]tooltips.toggleHideLocation"
							onclick={onToggleHideLocation}
						>
							<svg
								viewBox="0 0 18 18"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="m3 5q1-5 6-5t6 5-6 11q-7-6-6-11m6-2a1 1 0 0 0 0 5 1 1 0 0 0 0 -5m-2 11c-1 0-3 1-3 2s2 2 5 2 5-1 5-2-2-2-3-2"
								/>
								<path d="m-2 16l22-14" />
							</svg>
						</button>
					</div>
					<div id="rightControls">
						<div id="badgeHintControls"></div>
						<div id="mapControls"></div>
						<!-- Yume 2kki Explorer doesn't support mobile -->
						{#if !hasTouchscreen}
							<div id="explorerControls" class="2kkiOnly"></div>
						{/if}
						<div id="eventControls" class="accountRequired" style="display: none">
							<button
								id="eventsButton"
								class="iconButton unselectable"
								data-i18n="[title]tooltips.events"
								onclick={openEventsModal}
							>
								<svg
									viewBox="0 0 18 18"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
								>
									<path
										d="m0 9l6.5-1.5-1.5-2.5 2.5 1.5 1.5-6.5 1.5 6.5 2.5-1.5-1.5 2.5 6.5 1.5-6.5 1.5 1.5 2.5-2.5-1.5-1.5 6.5-1.5-6.5-2.5 1.5 1.5-2.5-6.5-1.5m7.75-6q-4.75 0-4.75 4.75m7.25-4.75q4.75 0 4.75 4.75m-7.25 7.25q-4.75 0-4.75-4.75m7.2656 4.75q4.7344 0 4.7344-4.75m-6-2.75a1 1 90 0 0 0 3 1 1 90 0 0 0 -3"
									/>
								</svg>
							</button>
						</div>

						<!-- Fullscreen-only controls -->
						<button
							id="fsBadgesButton"
							class="iconButton fillIcon unselectable fsOnlyControl accountRequired"
							data-i18n="[title]tooltips.badges"
							onclick={openBadgesModal}
						>
							<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
								<path
									d="m9 0 2 2.5 3.5-1v3.5l3.5 1-1.5 3 1.5 3-3.5 1v3.5l-3.5-1-2 2.5-2-2.5-3.5 1v-3.5l-3.5-1 1.5-3-1.5-3 3.5-1v-3.5l3.5 1 2-2.5m0-3v7"
								/>
							</svg>
						</button>
						<button
							id="fsLocationsButton"
							class="iconButton fillIcon unselectable fsOnlyControl"
							data-i18n="[title]tooltips.locations"
							onclick={openLocationsModal}
						>
							<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
								<path
									d="m0 14zv-2.5l3.75-4 3 2 5.25-5 6 4.5v5zm0-9.5a1.0313 1.0313 90 0 0 4 0 1.0313 1.0313 90 0 0-4 0z"
								/>
							</svg>
						</button>
						<button
							id="fsCommunityScreenshotsButton"
							class="iconButton fillIcon unselectable fsOnlyControl"
							data-i18n="[title]tooltips.communityScreenshots"
						>
							<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
								<path
									d="m0.75 5.5h14.5v9.25h-1.25v-8h-13.25zm14.5 9.25v1.25h-14.5v-9.25h1.25v8zm-12.5-0.75v-1.25l2.25-2.5 1.75 1.25 3-3 3.5 2.5v3zm0-5.5a0.5 0.5 90 0 0 2.5 0 0.5 0.5 90 0 0-2.5 0zm0-4.25h13.75v9.75h-1v-8.75h-12.75v-1m2-1.25h13v9h-1v-8h-12v-1"
								/>
							</svg>
						</button>
						<button
							id="fsRankingsButton"
							class={[
								'iconButton fillIcon unselectable fsOnlyControl',
								{ hidden: globalConfig.hideRankings }
							]}
							data-i18n="[title]tooltips.rankings"
						>
							<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
								<path d="m0 18v-11h5.75v11m0.5 0v-16h5.5v16m0.5-6h5.75v6h-5.75v-6" />
							</svg>
						</button>
						<button
							id="fsSchedulesButton"
							class={[
								'iconButton fillIcon unselectable fsOnlyControl',
								{ hidden: globalConfig.hideSchedules }
							]}
							data-i18n="[title]tooltips.schedules"
							onclick={() => openSchedulesModal()}
						>
							<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
								<path
									d="M18 3V18H0V3H3V4.5a.5.5 90 003 0V3H7.5V4.5a.5.5 90 003 0V3H12V4.5a.5.5 90 003 0V3ZM3.5 4.5a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 4.5a.5.5 90 002 0V1A.5.5 90 008 1Zm4.5 0a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 7H1.5v4H8Zm2 0v4h6.5V7ZM1.5 16.5H8v-4H1.5Zm8.5-4v4h6.5v-4Z"
								/>
							</svg>
						</button>

						<button
							id="controls-fullscreen"
							class={['iconButton', 'unselectable', { hidden: !isFullscreenSupported() }]}
							onclick={toggleFullscreen}
						>
							<svg
								viewBox="0 0 15 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
							>
								<path
									d="M13.5 13.5H10m3.5 0V10m0 3.5l-4-4m.5-8h3.5m0 0V5m0-3.5l-4 4M5 1.5H1.5m0 0V5m0-3.5l4 4m-4 4.5v3.5m0 0H5m-3.5 0l4-4"
								></path>
							</svg>
						</button>
					</div>
				</div>

				<GameCanvas />

				<GameChatContainer />

				<div id="locationDisplayContainer" class="unselectable">
					<div id="locationDisplayLabelContainer">
						<label id="locationDisplayLabel"></label>
					</div>
					<div id="locationDisplayLabelContainerOverlay"></div>
					<label id="locationDisplayLabelOverlay"></label>
				</div>

				<div id="dpad" class={['unselectable', { hidden: !globalConfig.mobileControls }]}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" class="baseColorFill">
						<path
							id="dpad-up"
							data-key="ArrowUp"
							data-key-code="38"
							d="M48,5.8C48,2.5,45.4,0,42,0H29.9C26.6,0,24,2.4,24,5.8V24h24V5.8z"
						/>
						<path
							id="dpad-right"
							data-key="ArrowRight"
							data-key-code="39"
							d="M66.2,24H48v24h18.2c3.3,0,5.8-2.7,5.8-6V29.9C72,26.5,69.5,24,66.2,24z"
						/>
						<path
							id="dpad-down"
							data-key="ArrowDown"
							data-key-code="40"
							d="M24,66.3c0,3.3,2.6,5.7,5.9,5.7H42c3.3,0,6-2.4,6-5.7V48H24V66.3z"
						/>
						<path
							id="dpad-left"
							data-key="ArrowLeft"
							data-key-code="37"
							d="M5.7,24C2.4,24,0,26.5,0,29.9V42c0,3.3,2.3,6,5.7,6H24V24H5.7z"
						/>
						<rect id="dpad-center" x="24" y="24" width="24" height="24" />
					</svg>
				</div>

				<div id="apad" class={['unselectable', { hidden: !globalConfig.mobileControls }]}>
					<div
						id="apad-escape"
						class="baseColorBg apadCircBtn apadBtn"
						data-key="Escape"
						data-key-code="27"
					></div>
					<div
						id="apad-enter"
						class="baseColorBg apadCircBtn apadBtn"
						data-key="Enter"
						data-key-code="13"
					></div>
					<div
						id="apad-shift"
						class="baseColorBg apadRectBtn apadBtn"
						data-key="ShiftLeft"
						data-key-code="16"
					></div>
					{#if gameId == 'yume' || gameId == 'unconscious' || gameId == 'prayers' || gameId == 'someday' || gameId == 'unevendream' || gameId == 'braingirl' || gameId == 'tsushin' || gameId == 'oneshot' || gameId == 'unaccomplished' || gameId == 'fog' || gameId == 'cold' || gameId == 'loveyou'}
						<div id="apad-numbers" class="apadBtnContainer">
							{#if gameId == 'tsushin'}
								<div
									id="apad-0"
									class="baseColorBg apadSqBtn apadBtn"
									data-key="Digit0"
									data-key-code="48"
								></div>
							{/if}
							<div
								id="apad-1"
								class="baseColorBg apadSqBtn apadBtn"
								data-key="Digit1"
								data-key-code="49"
							></div>
							{#if gameId == 'unevendream' || gameId == 'braingirl'}
								<div
									id="apad-2"
									class="baseColorBg apadSqBtn apadBtn"
									data-key="Digit2"
									data-key-code="50"
								></div>
							{/if}
							{#if gameId == 'yume' || gameId == 'unevendream' || gameId == 'someday' || gameId == 'tsushin'}
								<div
									id="apad-3"
									class="baseColorBg apadSqBtn apadBtn"
									data-key="Digit3"
									data-key-code="51"
								></div>
							{/if}
							{#if gameId == 'unevendream'}
								<div
									id="apad-4"
									class="baseColorBg apadSqBtn apadBtn"
									data-key="Digit4"
									data-key-code="52"
								></div>
							{/if}
							{#if gameId == 'yume' || gameId == 'unaccomplished'}
								<div
									id="apad-5"
									class="baseColorBg apadSqBtn apadBtn"
									data-key="Digit5"
									data-key-code="53"
								></div>
							{/if}
							<div
								id="apad-9"
								class="baseColorBg apadSqBtn apadBtn"
								data-key="Digit9"
								data-key-code="57"
							></div>
						</div>
					{/if}
				</div>

				<div id="joystick" class="unselectable hidden">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 72 72"
						class="baseColorFill hidden"
						data-style="joystick"
					>
						<defs>
							<mask id="joystickInset">
								<rect width="100%" height="100%" fill="white"></rect>
								<circle id="insetCircle" cx="25" cy="25" r="20" fill="black"></circle>
							</mask>
						</defs>
						<circle id="joystickCircle" cx="25" cy="25" r="25" mask="url(#joystickInset)"></circle>
					</svg>
					<svg
						width="13.229166mm"
						height="13.229167mm"
						viewBox="0 0 13.229166 13.229167"
						version="1.1"
						data-style="dpad"
						class="baseColorFill hidden"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g id="dpadCircle" transform="translate(-11.225154,-3.5548219)">
							<path
								d="m 17.839738,3.5548218 a 6.6145835,6.6145835 0 0 0 -6.614583,6.6145832 6.6145835,6.6145835 0 0 0 6.614583,6.614583 6.6145835,6.6145835 0 0 0 6.614583,-6.614583 6.6145835,6.6145835 0 0 0 -6.614583,-6.6145832 z M 16.436723,4.644161 h 2.806547 c 0.242771,0 0.438216,0.1954449 0.438216,0.4382161 v 3.24528 h 3.24528 c 0.242771,0 0.438216,0.1954449 0.438216,0.4382161 v 2.8070638 c 0,0.242772 -0.195445,0.438216 -0.438216,0.438216 h -3.24528 v 3.244763 c 0,0.242772 -0.195445,0.438216 -0.438216,0.438216 h -2.806547 c -0.242772,0 -0.438216,-0.195444 -0.438216,-0.438216 v -3.244763 h -3.24528 c -0.242772,0 -0.438216,-0.195444 -0.438216,-0.438216 V 8.7658732 c 0,-0.2427712 0.195444,-0.4382161 0.438216,-0.4382161 h 3.24528 v -3.24528 c 0,-0.2427712 0.195444,-0.4382161 0.438216,-0.4382161 z"
								class="joystickBase"
							/>
							<path
								d="M 15.998507,12.011153 V 8.3276571 h -3.24528 c -0.242772,0 -0.438216,0.1954449 -0.438216,0.4382161 v 2.8070638 c 0,0.242772 0.195444,0.438216 0.438216,0.438216 z"
								id="joystickLeft"
								class="joystickDpad"
							/>
							<path
								d="m 19.681486,12.011153 h -3.682979 v 3.244763 c 0,0.242772 0.195444,0.438216 0.438216,0.438216 h 2.806547 c 0.242771,0 0.438216,-0.195444 0.438216,-0.438216 z"
								id="joystickDown"
								class="joystickDpad"
							/>
							<path d="m 19.681486,8.3276571 h -3.682979 v 3.6834959 h 3.682979 z" class="joystickDpad" />
							<path
								d="m 19.681486,8.3276571 v 3.6834959 h 3.24528 c 0.242771,0 0.438216,-0.195444 0.438216,-0.438216 V 8.7658732 c 0,-0.2427712 -0.195445,-0.4382161 -0.438216,-0.4382161 z"
								id="joystickRight"
								class="joystickDpad"
							/>
							<path
								d="m 16.436723,4.644161 c -0.242772,0 -0.438216,0.1954449 -0.438216,0.4382161 v 3.24528 h 3.682979 v -3.24528 c 0,-0.2427712 -0.195445,-0.4382161 -0.438216,-0.4382161 z"
								id="joystickUp"
								class="joystickDpad"
							/>
						</g>
					</svg>
				</div>
			</div>
		</div>
		<ChatboxContainer />
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div id="modalContainer" class="modalContainer hidden" onclick={onModalContainerClick}>
			<div class="modalOverlay"></div>
		</div>
		<div id="modalFadeOutContainer" class="modalContainer"></div>
		<div id="confirmModalContainer" class="confirmModalContainer modalContainer hidden">
			<div id="confirmModal" class="confirmModal modal hidden">
				<a href="javascript:void(0);" class="modalClose">✖</a>
				<div class="modalContent">
					<div>
						<label class="confirmMessage infoLabel"></label>
					</div>
				</div>
				<div class="modalFooter">
					<button class="confirmOkButton unselectable" type="button" data-i18n="[html]modal.confirm.ok">
						Ok
					</button>
					<button
						class="confirmCancelButton unselectable"
						type="button"
						data-i18n="[html]modal.confirm.cancel"
					>
						Cancel
					</button>
				</div>
			</div>
			<div class="modalOverlay"></div>
		</div>
		<ToastContainer />
		<SessionCommands />
	</div>
	<div id="layoutEnd"></div>
	<div>
		<div id="gameEndDate" class="notice" style="display: none;"></div>
		{#if gameId == '2kki'}
			<br />
			<div class="notice version">
				Yume 2kki Version <span id="2kkiVersion">{get2kkiVersion()}</span>
			</div>
			<br />
			<div class="notice" data-i18n="[html]2kki.hostedWithPermission">
				Hosted with permission from the Yume 2kki developers
			</div>
		{/if}
		{#if gameIdsWithDisclaimer.includes(gameId)}
			<br />
			<div class="notice" data-i18n="[html]disclaimer.hostedWithPermission">
				Hosted with permission from the developer(s)
			</div>
		{/if}
		{#if gameId == 'yume'}
			<br />
			<div class="notice" data-i18n="[html]disclaimer.pendingApproval">
				Pending approval from developer/publisher
			</div>
		{/if}
		<br />
		<div class="notice">
			<a href="javascript:void(0);" onclick={() => openModal('rulesModal')} data-i18n="[html]reviewRules">
				Review Rules
			</a>
			&bull;
			<a href="javascript:void(0);" onclick={() => openModal('warningsModal')} data-i18n="[html]reviewWarnings">
				Review Warnings
			</a>
		</div>
	</div>
	<div id="footerIconContainer">
		<a href="https://ynoproject.net/discord" target="_blank" class="icon fillIcon" title="Discord">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
				<path
					d="M19.229,6.012c-0.903-0.73-2.015-1.246-2.872-1.572c-0.307-0.117-0.653-0.076-0.923,0.111C15.162,4.737,15,5.045,15,5.374	C15,5.72,14.72,6,14.374,6c-1.573,0-3.176,0-4.749,0C9.28,6,9,5.72,9,5.375c0-0.329-0.162-0.638-0.433-0.824	C8.296,4.364,7.95,4.323,7.643,4.441c-0.86,0.329-1.978,0.85-2.894,1.59C3.831,6.882,2,11.861,2,16.165	c0,0.076,0.019,0.15,0.057,0.216c1.265,2.233,4.714,2.817,5.499,2.842c0.005,0.001,0.009,0.001,0.014,0.001	c0.139,0,0.286-0.056,0.351-0.18l0.783-1.485c-0.646-0.164-1.313-0.359-2.04-0.617c-0.521-0.185-0.792-0.757-0.607-1.277	s0.759-0.791,1.277-0.607c3.527,1.254,5.624,1.253,9.345-0.005c0.523-0.175,1.091,0.104,1.268,0.627s-0.104,1.091-0.627,1.268	c-0.728,0.246-1.392,0.434-2.035,0.594l0.793,1.503c0.065,0.124,0.213,0.18,0.351,0.18c0.005,0,0.009,0,0.014-0.001	c0.786-0.025,4.235-0.61,5.499-2.843C21.981,16.315,22,16.241,22,16.164C22,11.861,20.169,6.882,19.229,6.012z M9.04,13.988	c-0.829,0-1.5-0.893-1.5-1.996c0-1.102,0.671-1.996,1.5-1.996c0.832-0.11,1.482,0.893,1.5,1.996	C10.54,13.095,9.869,13.988,9.04,13.988z M14.996,14.012c-0.829,0-1.5-0.895-1.5-2s0.671-2,1.5-2s1.5,0.895,1.5,2	S15.825,14.012,14.996,14.012z"
				/>
			</svg>
		</a>
		<a href="https://tumblr.com/ynoproject" target="_blank" class="icon fillIcon" title="Tumblr">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180" width="32" height="32">
				<path
					d="M63.6,159.3c-24,0-41.8-12.3-41.8-41.8V70.3H0V44.7C24,38.5,34,17.9,35.1,0H60v40.6h29v29.7H60v41.1  c0,12.3,6.2,16.6,16.1,16.6h14.1v31.3H63.6z"
				/>
			</svg>
		</a>
		<a href="https://twitter.com/ynoproject" target="_blank" class="icon fillIcon" title="Twitter">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 209" width="32" height="32">
				<path
					d="M256,25.4500259 C246.580841,29.6272672 236.458451,32.4504868 225.834156,33.7202333 C236.678503,27.2198053 245.00583,16.9269929 248.927437,4.66307685 C238.779765,10.6812633 227.539325,15.0523376 215.57599,17.408298 C205.994835,7.2006971 192.34506,0.822 177.239197,0.822 C148.232605,0.822 124.716076,24.3375931 124.716076,53.3423116 C124.716076,57.4586875 125.181462,61.4673784 126.076652,65.3112644 C82.4258385,63.1210453 43.7257252,42.211429 17.821398,10.4359288 C13.3005011,18.1929938 10.710443,27.2151234 10.710443,36.8402889 C10.710443,55.061526 19.9835254,71.1374907 34.0762135,80.5557137 C25.4660961,80.2832239 17.3681846,77.9207088 10.2862577,73.9869292 C10.2825122,74.2060448 10.2825122,74.4260967 10.2825122,74.647085 C10.2825122,100.094453 28.3867003,121.322443 52.413563,126.14673 C48.0059695,127.347184 43.3661509,127.988612 38.5755734,127.988612 C35.1914554,127.988612 31.9009766,127.659938 28.694773,127.046602 C35.3777973,147.913145 54.7742053,163.097665 77.7569918,163.52185 C59.7820257,177.607983 37.1354036,186.004604 12.5289147,186.004604 C8.28987161,186.004604 4.10888474,185.75646 0,185.271409 C23.2431033,200.173139 50.8507261,208.867532 80.5109185,208.867532 C177.116529,208.867532 229.943977,128.836982 229.943977,59.4326002 C229.943977,57.1552968 229.893412,54.8901664 229.792282,52.6381454 C240.053257,45.2331635 248.958338,35.9825545 256,25.4500259"
					fill="#55acee"
				/>
			</svg>
		</a>
		<a href="https://github.com/ynoproject" target="_blank" class="icon fillIcon" title="GitHub">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
				<path
					d="M10.9,2.1c-4.6,0.5-8.3,4.2-8.8,8.7c-0.5,4.7,2.2,8.9,6.3,10.5C8.7,21.4,9,21.2,9,20.8v-1.6c0,0-0.4,0.1-0.9,0.1 c-1.4,0-2-1.2-2.1-1.9c-0.1-0.4-0.3-0.7-0.6-1C5.1,16.3,5,16.3,5,16.2C5,16,5.3,16,5.4,16c0.6,0,1.1,0.7,1.3,1c0.5,0.8,1.1,1,1.4,1 c0.4,0,0.7-0.1,0.9-0.2c0.1-0.7,0.4-1.4,1-1.8c-2.3-0.5-4-1.8-4-4c0-1.1,0.5-2.2,1.2-3C7.1,8.8,7,8.3,7,7.6c0-0.4,0-0.9,0.2-1.3 C7.2,6.1,7.4,6,7.5,6c0,0,0.1,0,0.1,0C8.1,6.1,9.1,6.4,10,7.3C10.6,7.1,11.3,7,12,7s1.4,0.1,2,0.3c0.9-0.9,2-1.2,2.5-1.3 c0,0,0.1,0,0.1,0c0.2,0,0.3,0.1,0.4,0.3C17,6.7,17,7.2,17,7.6c0,0.8-0.1,1.2-0.2,1.4c0.7,0.8,1.2,1.8,1.2,3c0,2.2-1.7,3.5-4,4 c0.6,0.5,1,1.4,1,2.3v2.6c0,0.3,0.3,0.6,0.7,0.5c3.7-1.5,6.3-5.1,6.3-9.3C22,6.1,16.9,1.4,10.9,2.1z"
				/>
			</svg>
		</a>
	</div>
	<div id="backgroundTransition"></div>
	<div id="bottom"></div>
	<div id="loadingOverlay" class="hidden">
		{#if gameId == '2kki'}
			<div class="versionDisplay unselectable hidden transparent"></div>
		{/if}
	</div>
</div>
