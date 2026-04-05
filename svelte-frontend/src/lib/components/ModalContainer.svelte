<script lang="ts">
  import { LL } from '$lib';
  import { modal, type ModalId } from '$lib/stores/modal';
  import { onDestroy } from 'svelte';

  const MODAL_ANIM_MS = 200;

  let activeModal = $state<ModalId | null>(null);
  let modalData = $state<Record<string, any>>({});
  let open = $state(false);
  let mounted = $state(false);
  let closing = $state(false);
  let closeTimeout: ReturnType<typeof setTimeout> | null = null;

  const unsubscribe = modal.subscribe((state) => {
    if (state.open) {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }

      activeModal = state.activeModal;
      modalData = state.modalData || {};
      open = true;
      mounted = true;
      closing = false;
      return;
    }

    open = false;
    if (!mounted)
      return;

    closing = true;
    closeTimeout = setTimeout(() => {
      mounted = false;
      closing = false;
      activeModal = null;
      modalData = {};
      closeTimeout = null;
    }, MODAL_ANIM_MS);
  });

  onDestroy(() => {
    if (closeTimeout)
      clearTimeout(closeTimeout);
    unsubscribe();
  });

  function closeModalHandler() {
    modal.close();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModalHandler();
    }
  }

</script>

{#if mounted}
<div class="modalContainer" class:closing={closing}>
  <div
    class="modalOverlay"
    class:closing={closing}
    role="button"
    tabindex="0"
    onclick={handleOverlayClick}
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') closeModalHandler();
    }}
  ></div>

  <div class="modalStack" class:closing={closing}>
    {#if activeModal === 'schedulesModal'}
      {@const { default: SchedulesModal } = await import('$lib/modals/SchedulesModal.svelte')}
      <SchedulesModal />
    {/if}
    {#if activeModal === 'locationsModal'}
      {@const { default: LocationsModal } = await import('$lib/modals/LocationsModal.svelte')}
      <LocationsModal />
    {/if}
    {#if activeModal === 'communityScreenshotsModal'}
      {@const { default: CommunityScreenshotsModal } = await import('$lib/modals/CommunityScreenshotsModal.svelte')}
      <CommunityScreenshotsModal />
    {/if}
    {#if activeModal === 'rankingsModal'}
      {@const { default: RankingsModal } = await import('$lib/modals/RankingsModal.svelte')}
      <RankingsModal />
    {/if}
    {#if activeModal === 'badgesModal'}
      {@const { default: BadgesModal } = await import('$lib/modals/BadgesModal.svelte')}
      <BadgesModal />
    {/if}
    {#if activeModal === 'uiThemesModal'}
      {@const { default: UiThemesModal } = await import('$lib/modals/UiThemesModal.svelte')}
      <UiThemesModal />
    {/if}
    {#if activeModal === 'settingsModal'}
      {@const { default: SettingsModal } = await import('$lib/modals/SettingsModal.svelte')}
      <SettingsModal />
    {/if}

    <!-- Recreated modals from index.php -->
    <div id="loginModal" class="modal" class:hidden={activeModal !== 'loginModal'}>
      <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
      <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.login.title()}</h1></div>
      <div class="modalContent">
        <form
          id="loginForm"
          onsubmit={(e) => {
            e.preventDefault();
            console.log('login submit');
          }}
        >
          <ul class="formControls">
            <li class="formControlRow">
              <label for="loginUsername">{$LL.ui.modal.login.fields.username()}</label>
              <input id="loginUsername" name="user" type="text" autocomplete="off" maxlength="12" />
            </li>
            <li class="formControlRow">
              <label for="loginPassword">{$LL.ui.modal.login.fields.password()}</label>
              <input id="loginPassword" name="password" type="password" autocomplete="off" />
            </li>
          </ul>
          <button type="submit">{$LL.ui.modal.login.submit()}</button>
        </form>
      </div>
      <div class="modalFooter">
        <span class="infoLabel">{@html $LL.ui.modal.login.registerPrompt()}</span>
        <button type="button" class="modalLink" onclick={() => modal.open('registerModal', {}, 'loginModal')}
          >{$LL.ui.modal.login.register()}</button
        >
      </div>
    </div>

    <div id="registerModal" class="modal" class:hidden={activeModal !== 'registerModal'}>
      <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
      <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.register.title()}</h1></div>
      <div class="modalContent">
        <form
          id="registerForm"
          onsubmit={(e) => {
            e.preventDefault();
            console.log('register submit');
          }}
        >
          <ul class="formControls">
            <li class="formControlRow">
              <label for="registerUsername">{$LL.ui.modal.register.fields.username()}</label>
              <input id="registerUsername" name="user" type="text" autocomplete="off" maxlength="12" />
            </li>
            <li class="formControlRow">
              <label for="registerPassword">{$LL.ui.modal.register.fields.password()}</label>
              <input id="registerPassword" name="password" type="password" autocomplete="off" maxlength="72" />
            </li>
            <li class="formControlRow">
              <label for="registerConfirmPassword">{$LL.ui.modal.register.fields.confirmPassword()}</label>
              <input id="registerConfirmPassword" type="password" autocomplete="off" maxlength="72" />
            </li>
          </ul>
          <button type="submit">{$LL.ui.modal.register.submit()}</button>
        </form>
      </div>
      <div class="modalFooter">
        <span class="infoLabel">{@html $LL.ui.modal.register.loginPrompt()}</span>
        <button type="button" class="modalLink" onclick={() => modal.open('loginModal', {}, 'registerModal')}
          >{$LL.ui.modal.register.login()}</button
        >
      </div>
    </div>

    <div id="blocklistModal" class="modal" class:hidden={activeModal !== 'blocklistModal'}>
      <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
      <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.blocklist.title()}</h1></div>
      <div class="modalContent">
        <span id="blocklistModalEmptyLabel" class="infoLabel">{$LL.ui.modal.blocklist.empty()}</span>
        <div id="blocklistModalPlayerListContainer" class="scrollableContainer">
          <div id="blocklistModalPlayerList" class="playerList"></div>
        </div>
      </div>
    </div>

    <!-- Placeholders / copy of other modal structure -->
    <div id="chatSettingsModal" class="modal" class:hidden={activeModal !== 'chatSettingsModal'}>
      <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
      <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.chatSettings.title()}</h1></div>
      <div class="modalContent">
        <p>Chat settings form goes here.</p>
      </div>
    </div>

    <div id="screenshotSettingsModal" class="modal" class:hidden={activeModal !== 'screenshotSettingsModal'}>
      <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
      <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.screenshotSettings.title()}</h1></div>
      <div class="modalContent">
        <p>Screenshot settings form goes here.</p>
      </div>
    </div>

    <div id="notificationSettingsModal" class="modal" class:hidden={activeModal !== 'notificationSettingsModal'}>
      <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
      <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.notificationSettings.title()}</h1></div>
      <div class="modalContent">
        <p>Notification settings form goes here.</p>
      </div>
    </div>

    <div id="cacheSettingsModal" class="modal" class:hidden={activeModal !== 'cacheSettingsModal'}>
      <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
      <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.cacheSettings.title()}</h1></div>
      <div class="modalContent">
        <p>Cache controls go here.</p>
      </div>
    </div>

    <div id="accountSettingsModal" class="modal" class:hidden={activeModal !== 'accountSettingsModal'}>
      <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
      <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.accountSettings.title()}</h1></div>
      <div class="modalContent">
        <p>Account settings form goes here.</p>
      </div>
    </div>

    <div id="confirmModal" class="modal" class:hidden={activeModal !== 'confirmModal'}>
      <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
      <div class="modalHeader"><h1 class="modalTitle">Confirm</h1></div>
      <div class="modalContent">
        <p>{modalData.message || 'Are you sure?'}</p>
      </div>
      <div class="modalFooter">
        <button
          type="button"
          onclick={() => {
            modalData.onOk?.();
            closeModalHandler();
          }}
        >
          {$LL.ui.modal.confirm.ok()}
        </button>
        <button
          type="button"
          onclick={() => {
            modalData.onCancel?.();
            closeModalHandler();
          }}
        >
          {$LL.ui.modal.confirm.cancel()}
        </button>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  @keyframes modalZoomIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes modalZoomOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  @keyframes overlayFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes overlayFadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .modalContainer {
    position: fixed;
    inset: 0;
    z-index: 10000;
  }

  .modalContainer.closing {
    pointer-events: none;
  }

  .modalStack {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 19;
    animation: modalZoomIn 200ms ease-out forwards;
    pointer-events: none;
  }

  .modalStack > * {
    pointer-events: auto;
  }

  .modalStack > :global(*) {
    pointer-events: auto;
  }

  .modalStack.closing {
    animation: modalZoomOut 200ms ease-in forwards;
    pointer-events: none;
  }

  .modalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    cursor: pointer;
    animation: overlayFadeIn 200ms ease-out forwards;
    z-index: 18;
  }

  .modalOverlay.closing {
    animation: overlayFadeOut 200ms ease-in forwards;
    pointer-events: none;
  }

  .modal {
    pointer-events: auto;
  }

  .modal.hidden {
    pointer-events: none;
  }
</style>
