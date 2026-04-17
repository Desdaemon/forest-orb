<script lang="ts">
  import { onMount } from 'svelte';
  import { modal, type ModalId } from '$lib/stores/modal';
  import { tooltipLabel } from './Tooltip.svelte';
  import { LL } from '$lib';
  import { disableChat, hideLocation, mute, privateMode } from '$lib/config';

  const { onToggleChat = () => {} } = $props<{
    onToggleChat?: () => void;
  }>();

  function handleThemeClick() {
    modal.open('uiThemesModal');
  }

  function handleSettingsClick() {
    modal.open('settingsModal');
  }

  function handleEventsClick() {
    // onOpenModal('eventsModal');
    modal.open('testStage1');
  }

  function handleSaveClick() {
    modal.open('saveDataModal');
  }

  function handleScreenshotClick() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    requestAnimationFrame(() => {
      const screenshotCanvas = document.createElement('canvas');
      screenshotCanvas.width = 320;
      screenshotCanvas.height = 240;
      screenshotCanvas.getContext('2d')?.drawImage(canvas, 0, 0, 320, 240);
      const url = screenshotCanvas.toDataURL();
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
    });
  }

  type FullscreenLayout = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };

  type FullscreenDocument = Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void> | void;
  };

  let fullscreenSupported = $state(true);

  function handleFullscreenClick() {
    if (typeof document === 'undefined') return;

    const layout = document.getElementById('layout') as FullscreenLayout | null;
    if (!layout) return;

    const fullscreenDocument = document as FullscreenDocument;
    if (layout.requestFullscreen) {
      if (!document.fullscreenElement) {
        void layout.requestFullscreen();
      } else {
        void document.exitFullscreen?.();
      }
      return;
    }

    if (layout.webkitRequestFullscreen) {
      if (!fullscreenDocument.webkitFullscreenElement) {
        void layout.webkitRequestFullscreen();
      } else {
        void fullscreenDocument.webkitExitFullscreen?.();
      }
    }
  }

  onMount(() => {
    const layout = document.getElementById('layout') as FullscreenLayout | null;
    fullscreenSupported = Boolean(layout && (layout.requestFullscreen || layout.webkitRequestFullscreen));
  });
</script>

<div id="controls" role="toolbar">
  <div id="leftControls" role="presentation">
    <button
      id="privateModeButton"
      class={[
        'iconButton toggleButton altToggleButton transparentToggleButton unselectable',
        { toggled: $privateMode }
      ]}
      onclick={privateMode.toggle}
      {...tooltipLabel($LL.ui.tooltips.togglePrivateMode())}
    >
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="m5 0a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0-5m4 13c0-5-1-7-4-7-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 3.625 1 3.875 4.125q2.375 0 4-0.875"
        />
        <path d="m9 4a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7s4 2 4 7q-4 2-8 0" /></svg
      >
    </button>
    <button
      id="saveButton"
      class="iconButton unselectable"
      {...tooltipLabel($LL.ui.tooltips.save())}
      onclick={handleSaveClick}
    >
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="m0 1.5q0-1.5 1.5-1.5h11.25l2.25 2.25v12.75q0 1.5-1.5 1.5h-12q-1.5 0-1.5-1.5v-13.5m4.5-1.5v3.75q0 0.75 0.75 0.75h4.5q0.75 0 0.75-0.75v-3.75m-1.75 1v2.5h0.75v-2.5h-0.75m-5.75 15.5v-6.75q0-0.75 0.75-0.75h7.5q0.75 0 0.75 0.75v6.75m-7.5-6h6m-6 2.25h6m-6 2.25h6"
        />
      </svg>
    </button>
    <button
      id="uiThemeButton"
      class="iconButton unselectable"
      {...tooltipLabel($LL.ui.tooltips.uiTheme())}
      onclick={handleThemeClick}
    >
      <svg viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="m4.5 3c4.5-4.5 13.5-3 13.5-0.375m-4.125 6.375c-1.875 0-3.375 1.5-1.875 1.875m3 2.625c3 1.5-4.5 6-10.5 4.5-7.5-3-4.5-12 0-15m9-0.75a1.5 1.5 90 0 0 0 3.75 1.5 1.5 90 0 0 0-3.75m-6 0.75a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m-3.75 4.5a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m1.5 5.25a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m6-0.75a1.5 1.5 90 0 0-0.75 4.5q2.25 0 3-1.875m7.5-14.625q-6 4.5-7.5 10.5l1.5 0.75q4.5-3.75 6-11.25m-7.5 10.5c-3 0-1.5 3-3 4.5 6 0 4.5-3 4.5-3.75m-3.75 2.25c0.75 1.5 1.5 0 1.5 1.275"
        />
      </svg>
    </button>
    <button
      id="chatButton"
      class="iconButton toggleButton offToggleButton unselectable"
      class:toggled={$disableChat}
      {...tooltipLabel($LL.ui.tooltips.toggleChat())}
      onclick={() => {
        disableChat.toggle();
        onToggleChat?.();
      }}
    >
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="m3 18l6-4.5h6q3 0 3-3v-7.5q0-3-3-3h-12q-3 0-3 3v7.5q0 3 3 3h1.5l-1.5 4.5m11.25-12.75a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3"
        />
        <path d="m-2 16l22-14" />
      </svg>
    </button>
    <button
      id="screenshotButton"
      class="iconButton unselectable"
      {...tooltipLabel($LL.ui.tooltips.screenshot())}
      onclick={handleScreenshotClick}
    >
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="m3 8q0-1 1-1h1.5c1 0 1-2 2-2h3c1 0 1 2 2 2h1.5q1 0 1 1v4q0 1-1 1h-10q-1 0-1-1zm6-0.5a2 2 90 0 0 0 4 2 2 90 0 0 0 -4m-9-2.5v-2q0-1 1-1h2m12 0h2q1 0 1 1v2m0 8v2q0 1-1 1h-2m-12 0h-2q-1 0-1-1v-2"
        ></path>
      </svg>
    </button>
    <button
      id="myScreenshotsButton"
      class="iconButton accountRequired unselectable"
      {...tooltipLabel($LL.ui.tooltips.myScreenshots())}
      onclick={() => console.warn('My Screenshots modal is not ported yet.')}
    >
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="m0 2h18v13h-18zv13-11.5 11.5zm2.5 10.5v-1.5l2.75-3 2.25 1.5 3.75-3.75 4.25 3.25v3.5zm0-6.75a0.75 0.75 90 0 0 3 0 0.75 0.75 90 0 0-3 0z"
        />
      </svg>
    </button>
    <button
      id="settingsButton"
      class="iconButton unselectable"
      {...tooltipLabel($LL.ui.tooltips.settings())}
      onclick={handleSettingsClick}
    >
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="m9 5.5a1 1 90 0 0 0 7 1 1 90 0 0 0 -7m-7 5.5l-2-0.25v-3.5l2-0.25 0.75-1.5-1.25-1.75 2.25-2.25 1.75 1.25 1.5-0.75 0.25-2h3.5l0.25 2 1.5 0.75 1.75-1.25 2.25 2.25-1.25 1.75 0.75 1.5 2 0.25v3.5l-2 0.25-0.75 1.5 1.25 1.75-2.25 2.25-1.75-1.25-1.5 0.75-0.25 2h-3.5l-0.25-2-1.5-0.75-1.75 1.25-2.25-2.25 1.25-1.75-0.75-1.5"
        />
      </svg>
    </button>
    <button
      id="muteButton"
      class="iconButton toggleButton offToggleButton unselectable"
      class:toggled={$mute}
      onclick={mute.toggle}
      {...tooltipLabel($LL.ui.tooltips.toggleMute())}
    >
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="m0 7h3l4-4v12l-4-4h-3v-4m10 0q1 2 0 4m3-5.5q2 3.5 0 7m3-9.5q4 6 0 12" />
        <path d="m-2 16l22-14" />
      </svg>
    </button>
    <button
      id="hideLocationButton"
      class="iconButton toggleButton offToggleButton unselectable"
      class:toggled={$hideLocation}
      onclick={hideLocation.toggle}
      {...tooltipLabel($LL.ui.tooltips.toggleHideLocation())}
    >
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="m3 5q1-5 6-5t6 5-6 11q-7-6-6-11m6-2a1 1 0 0 0 0 5 1 1 0 0 0 0 -5m-2 11c-1 0-3 1-3 2s2 2 5 2 5-1 5-2-2-2-3-2"
        />
        <path d="m-2 16l22-14" />
      </svg>
    </button>
  </div>
  <div id="rightControls" role="presentation">
    <div id="badgeHintControls"></div>
    <div id="mapControls"></div>
    <div id="explorerControls"></div>
    <div id="eventControls" class="" onclick={handleEventsClick}>
      <button id="eventsButton" class="iconButton unselectable" data-i18n="[title]tooltips.events">
        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
          ><path
            d="m0 9l6.5-1.5-1.5-2.5 2.5 1.5 1.5-6.5 1.5 6.5 2.5-1.5-1.5 2.5 6.5 1.5-6.5 1.5 1.5 2.5-2.5-1.5-1.5 6.5-1.5-6.5-2.5 1.5 1.5-2.5-6.5-1.5m7.75-6q-4.75 0-4.75 4.75m7.25-4.75q4.75 0 4.75 4.75m-7.25 7.25q-4.75 0-4.75-4.75m7.2656 4.75q4.7344 0 4.7344-4.75m-6-2.75a1 1 90 0 0 0 3 1 1 90 0 0 0 -3"
          /></svg
        >
      </button>
    </div>

    <!-- Fullscreen-only controls -->
    <button
      id="fsBadgesButton"
      class="iconButton fillIcon unselectable fsOnlyControl accountRequired"
      data-i18n="[title]tooltips.badges"
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
    >
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="m0 14zv-2.5l3.75-4 3 2 5.25-5 6 4.5v5zm0-9.5a1.0313 1.0313 90 0 0 4 0 1.0313 1.0313 90 0 0-4 0z" />
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
      class="iconButton fillIcon unselectable fsOnlyControl"
      data-i18n="[title]tooltips.rankings"
    >
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="m0 18v-11h5.75v11m0.5 0v-16h5.5v16m0.5-6h5.75v6h-5.75v-6" />
      </svg>
    </button>
    <button
      id="fsSchedulesButton"
      class="iconButton fillIcon unselectable fsOnlyControl"
      data-i18n="[title]tooltips.schedules"
    >
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="M18 3V18H0V3H3V4.5a.5.5 90 003 0V3H7.5V4.5a.5.5 90 003 0V3H12V4.5a.5.5 90 003 0V3ZM3.5 4.5a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 4.5a.5.5 90 002 0V1A.5.5 90 008 1Zm4.5 0a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 7H1.5v4H8Zm2 0v4h6.5V7ZM1.5 16.5H8v-4H1.5Zm8.5-4v4h6.5v-4Z"
        />
      </svg>
    </button>
    <div id="eventControls" class="accountRequired" style="display: none">
      <button
        id="eventsButton"
        class="iconButton unselectable"
        onclick={handleEventsClick}
        {...tooltipLabel($LL.ui.tooltips.events())}
      >
        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
          <path
            d="m0 9l6.5-1.5-1.5-2.5 2.5 1.5 1.5-6.5 1.5 6.5 2.5-1.5-1.5 2.5 6.5 1.5-6.5 1.5 1.5 2.5-2.5-1.5-1.5 6.5-1.5-6.5-2.5 1.5 1.5-2.5-6.5-1.5m7.75-6q-4.75 0-4.75 4.75m7.25-4.75q4.75 0 4.75 4.75m-7.25 7.25q-4.75 0-4.75-4.75m7.2656 4.75q4.7344 0 4.7344-4.75m-6-2.75a1 1 90 0 0 3 1 1 90 0 0 -3"
          />
        </svg>
      </button>
    </div>
    <button
      id="controls-fullscreen"
      class="iconButton unselectable"
      class:hidden={!fullscreenSupported}
      aria-label="Toggle Fullscreen"
      onclick={handleFullscreenClick}
    >
      <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
          d="M13.5 13.5H10m3.5 0V10m0 3.5l-4-4m.5-8h3.5m0 0V5m0-3.5l-4 4M5 1.5H1.5m0 0V5m0-3.5l4 4m-4 4.5v3.5m0 0H5m-3.5 0l4-4"
        />
      </svg>
    </button>
  </div>
</div>
