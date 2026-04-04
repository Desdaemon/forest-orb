<script lang="ts">
  import type { ModalId } from '$lib/modalStore';
  import { selectedBadge } from '$lib/badgeStore';
  import BadgeItem from './BadgeItem.svelte';

  const {
    onToggleChat = () => {},
    onOpenModal = () => {}
  }: {
    onToggleChat?: () => void;
    onOpenModal?: (modalId: ModalId) => void;
  } = $props();

  function handleThemeClick() {
    onOpenModal('uiThemesModal');
  }

  function handleChatClick() {
    onToggleChat();
  }

  function handleSchedulesClick() {
    onOpenModal('schedulesModal');
  }

  function handleLocationsClick() {
    onOpenModal('locationsModal');
  }

  function handleCommunityScreenshotsClick() {
    onOpenModal('communityScreenshotsModal');
  }

  function handleRankingsClick() {
    onOpenModal('rankingsModal');
  }

  function handleBadgeClick() {
    onOpenModal('badgesModal');
  }
</script>

<div id="header">
  <div id="headerLogoContainer">
    <button
      id="nexusButton"
      class="iconButton fillIcon unselectable"
      data-i18n="[title]tooltips.nexus"
      aria-label="[title]tooltips.nexus"
      dir="ltr"
    >
      <svg height="48" viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg">
        <path
          d="m0 0h6v10h16v-10h6v16h-11v12.5h-6v-12.5h-11v-15.5m34-0.5h22v6h-16v22.5h-6v-28.5m22 6h6v22.5h-6v-22.5"
        />
      </svg>
      <svg height="48" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <path d="m0 0h28v28h-28v-28m10 13h-2v2h2v-2m-4 9h16v-16h-16v16m0.5-15.5h15v15h-15v-15" />
        <path d="m0 0h28v28h-10l-6 7v-21l9-9h-15v17h3v6h-9v-28m22 5h-0.5v17h0.5v-17m-6 15h-1.5v0.5h-0.5v1.5h2v-2" />
      </svg>
      <svg height="48" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <path d="m0 0h28v28h-28v-28m10 13h-2v2h2v-2m-4 9h16v-16h-16v16m0.5-15.5h15v15h-15v-15" />
        <path d="m0 0h28v28h-10l-6 7v-21l9-9h-15v17h3v6h-9v-28m22 5h-0.5v17h0.5v-17m-6 15h-1.5v0.5h-0.5v1.5h2v-2" />
      </svg>
    </button>
    <div id="gameLogoContainer">
      <div id="gameLogo" class="transparent">
        <div id="gameLogoOverlay"></div>
      </div>
    </div>
  </div>
  <div id="headerIconContainer" class="itemContainer smallItemContainer">
    <BadgeItem badge={$selectedBadge} onclick={handleBadgeClick} emptyIcon />
    <button
      id="locationsButton"
      class="iconButton fillIcon unselectable hidden"
      data-i18n="[title]tooltips.locations"
      aria-label="[title]tooltips.locations"
      onclick={handleLocationsClick}
    >
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32"
        ><path
          d="m0 14zv-2.5l3.75-4 3 2 5.25-5 6 4.5v5zm0-9.5a1.0313 1.0313 90 0 0 4 0 1.0313 1.0313 90 0 0-4 0z"
        /></svg
      >
    </button>
    <button
      id="communityScreenshotsButton"
      class="iconButton fillIcon unselectable"
      data-i18n="[title]tooltips.communityScreenshots"
      aria-label="[title]tooltips.communityScreenshots"
      onclick={handleCommunityScreenshotsClick}
    >
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32"
        ><path
          d="m0.75 5.5h14.5v9.25h-1.25v-8h-13.25zm14.5 9.25v1.25h-14.5v-9.25h1.25v8zm-12.5-0.75v-1.25l2.25-2.5 1.75 1.25 3-3 3.5 2.5v3zm0-5.5a0.5 0.5 90 0 0 2.5 0 0.5 0.5 90 0 0-2.5 0zm0-4.25h13.75v9.75h-1v-8.75h-12.75v-1m2-1.25h13v9h-1v-8h-12v-1"
        /></svg
      >
    </button>
    <button
      id="rankingsButton"
      class="iconButton fillIcon unselectable"
      data-i18n="[title]tooltips.rankings"
      aria-label="[title]tooltips.rankings"
      onclick={handleRankingsClick}
    >
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32"
        ><path d="m0 18v-11h5.75v11m0.5 0v-16h5.5v16m0.5-6h5.75v6h-5.75v-6" /></svg
      >
    </button>
    <button
      id="schedulesButton"
      class="iconButton fillIcon unselectable"
      data-i18n="[title]tooltips.schedules"
      aria-label="[title]tooltips.schedules"
      onclick={handleSchedulesClick}
    >
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xml:space="preserve"
        width="32"
        height="32"
        viewBox="0 0 18 18"
        ><path
          d="M18 3V18H0V3H3V4.5a.5.5 90 003 0V3H7.5V4.5a.5.5 90 003 0V3H12V4.5a.5.5 90 003 0V3ZM3.5 4.5a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 4.5a.5.5 90 002 0V1A.5.5 90 008 1Zm4.5 0a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 7H1.5v4H8Zm2 0v4h6.5V7ZM1.5 16.5H8v-4H1.5Zm8.5-4v4h6.5v-4Z"
        /></svg
      >
    </button>
    <button
      id="uiThemeButton"
      class="iconButton unselectable"
      data-i18n="[title]tooltips.uiTheme"
      aria-label="[title]tooltips.uiTheme"
      onclick={handleThemeClick}
    >
      <svg viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
        ><path
          d="m4.5 3c4.5-4.5 13.5-3 13.5-0.375m-4.125 6.375c-1.875 0-3.375 1.5-1.875 1.875m3 2.625c3 1.5-4.5 6-10.5 4.5-7.5-3-4.5-12 0-15m9-0.75a1.5 1.5 90 0 0 0 3.75 1.5 1.5 90 0 0 0-3.75m-6 0.75a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m-3.75 4.5a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m1.5 5.25a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m6-0.75a1.5 1.5 90 0 0-0.75 4.5q2.25 0 3-1.875m7.5-14.625q-6 4.5-7.5 10.5l1.5 0.75q4.5-3.75 6-11.25m-7.5 10.5c-3 0-1.5 3-3 4.5 6 0 4.5-3 4.5-3.75m-3.75 2.25c0.75 1.5 1.5 0 1.5 1.275"
        /></svg
      >
    </button>
    <button
      id="chatButton"
      class="iconButton toggleButton offToggleButton unselectable"
      data-i18n="[title]tooltips.toggleChat"
      aria-label="[title]tooltips.toggleChat"
      onclick={handleChatClick}
    >
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
        ><path
          d="m3 18l6-4.5h6q3 0 3-3v-7.5q0-3-3-3h-12q-3 0-3 3v7.5q0 3 3 3h1.5l-1.5 4.5m11.25-12.75a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3"
        /><path d="m-2 16l22-14" /></svg
      >
    </button>
  </div>
</div>
