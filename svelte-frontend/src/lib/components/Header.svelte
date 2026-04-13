<script lang="ts">
  import { modal, type ModalId } from '$lib/stores/modal';
  import { selectedBadge } from '$lib/stores/badge';
  import BadgeItem from './BadgeItem.svelte';
  import { tooltipLabel } from './Tooltip.svelte';
  import { LL } from '$lib';
  import { globalConfig } from '$lib/stores/config';
  import { auth } from '$lib/stores/authStore';

  function handleSchedulesClick() {
    modal.open('schedulesModal');
  }

  function handleLocationsClick() {
    modal.open('locationsModal');
  }

  function handleCommunityScreenshotsClick() {
    modal.open('communityScreenshotsModal');
  }

  function handleRankingsClick() {
    modal.open('rankingsModal');
  }

  function handleBadgeClick() {
    modal.open('badgesModal');
  }

  // Handle login button click (replicates original implementation)
  function handleLoginClick() {
    auth.handleLoginClick();
  }

  // Handle logout button click
  function handleLogoutClick() {
    auth.handleLogoutClick();
  }
</script>

<div id="header" role="presentation">
  <div id="headerLogoContainer" role="presentation">
    <button
      id="nexusButton"
      class="iconButton fillIcon unselectable"
      {...tooltipLabel($LL.ui.tooltips.nexus())}
      dir="ltr"
    >
      <svg height="48" viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <path
          d="m0 0h6v10h16v-10h6v16h-11v12.5h-6v-12.5h-11v-15.5m34-0.5h22v6h-16v22.5h-6v-28.5m22 6h6v22.5h-6v-22.5"
        />
      </svg>
      <svg height="48" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <path d="m0 0h28v28h-28v-28m10 13h-2v2h2v-2m-4 9h16v-16h-16v16m0.5-15.5h15v15h-15v-15" />
        <path d="m0 0h28v28h-10l-6 7v-21l9-9h-15v17h3v6h-9v-28m22 5h-0.5v17h0.5v-17m-6 15h-1.5v0.5h-0.5v1.5h2v-2" />
      </svg>
      <svg height="48" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <path d="m0 0h28v28h-28v-28m10 13h-2v2h2v-2m-4 9h16v-16h-16v16m0.5-15.5h15v15h-15v-15" />
        <path d="m0 0h28v28h-10l-6 7v-21l9-9h-15v17h3v6h-9v-28m22 5h-0.5v17h0.5v-17m-6 15h-1.5v0.5h-0.5v1.5h2v-2" />
      </svg>
    </button>
    <div id="gameLogoContainer" role="presentation">
      <div id="gameLogo" class="transparent" role="presentation">
        <div id="gameLogoOverlay" role="presentation"></div>
      </div>
    </div>
  </div>
  <div id="headerIconContainer" class="itemContainer smallItemContainer" role="presentation">
    <BadgeItem badge={$selectedBadge} onclick={handleBadgeClick} emptyIcon />
    <button
      id="locationsButton"
      class="iconButton fillIcon unselectable"
      {...tooltipLabel($LL.ui.tooltips.locations())}
      onclick={handleLocationsClick}
    >
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32" role="presentation">
        <path d="m0 14zv-2.5l3.75-4 3 2 5.25-5 6 4.5v5zm0-9.5a1.0313 1.0313 90 0 0 4 0 1.0313 1.0313 90 0 0-4 0z" />
      </svg>
    </button>
    <button
      id="communityScreenshotsButton"
      class="iconButton fillIcon unselectable"
      {...tooltipLabel($LL.ui.tooltips.communityScreenshots())}
      onclick={handleCommunityScreenshotsClick}
    >
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32" role="presentation">
        <path
          d="m0.75 5.5h14.5v9.25h-1.25v-8h-13.25zm14.5 9.25v1.25h-14.5v-9.25h1.25v8zm-12.5-0.75v-1.25l2.25-2.5 1.75 1.25 3-3 3.5 2.5v3zm0-5.5a0.5 0.5 90 0 0 2.5 0 0.5 0.5 90 0 0-2.5 0zm0-4.25h13.75v9.75h-1v-8.75h-12.75v-1m2-1.25h13v9h-1v-8h-12v-1"
        />
      </svg>
    </button>
    {#if !$globalConfig.hideRankings}
      <button
        id="rankingsButton"
        class="iconButton fillIcon unselectable"
        {...tooltipLabel($LL.ui.tooltips.rankings())}
        onclick={handleRankingsClick}
      >
        <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32" role="presentation">
          <path d="m0 18v-11h5.75v11m0.5 0v-16h5.5v16m0.5-6h5.75v6h-5.75v-6" />
        </svg>
      </button>
    {/if}
    {#if !$globalConfig.hideSchedules}
      <button
        id="schedulesButton"
        class="iconButton fillIcon unselectable"
        {...tooltipLabel($LL.ui.tooltips.schedules())}
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
          role="presentation"
        >
          <path
            d="M18 3V18H0V3H3V4.5a.5.5 90 003 0V3H7.5V4.5a.5.5 90 003 0V3H12V4.5a.5.5 90 003 0V3ZM3.5 4.5a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 4.5a.5.5 90 002 0V1A.5.5 90 008 1Zm4.5 0a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 7H1.5v4H8Zm2 0v4h6.5V7ZM1.5 16.5H8v-4H1.5Zm8.5-4v4h6.5v-4Z"
          />
        </svg>
      </button>
    {/if}
    <button id="loginButton" type="button" class="unselectable" onclick={handleLoginClick}>
      {$LL.ui.account.login()}
    </button>
    <button id="logoutButton" type="button" class="unselectable" onclick={handleLogoutClick}>
      {$LL.ui.account.logout()}
    </button>
  </div>
</div>
