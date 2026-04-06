<script lang="ts">
  import { modal, type ModalId } from '$lib/stores/modal';
  import { onDestroy, onMount } from 'svelte';

  const MODAL_ANIM_MS = 200;

  let activeModal = $state<ModalId | null>(null);
  let modalData = $state<Record<string, any>>({});
  let open = $state(false);
  let isModalVisible = $state(false);
  let modalContainer: HTMLElement | undefined = $state();

  const unsubscribe = modal.subscribe((state) => {
    if (state.open) {
      activeModal = state.activeModal;
      modalData = state.modalData || {};
      open = true;
      isModalVisible = state.activeModal !== null;
      return;
    }

    open = false;
    isModalVisible = false;
  });

  onDestroy(() => {
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

  onMount(() => {
    if (modalContainer) {
      modalContainer.addEventListener('YNO_OUTROEND', handleModalOutroEnd);
    }
  });

  function handleModalOutroEnd() {
    if (activeModal !== null) return;

    activeModal = null;
    modalData = {};
    modal.finalizeClose();
  }
</script>

<div
  bind:this={modalContainer}
  class="modalContainer"
  class:isVisible={isModalVisible}
  role="button"
  tabindex={isModalVisible ? 0 : -1}
  aria-hidden={!isModalVisible}
  onclick={handleOverlayClick}
  onkeydown={(event) => {
    if ((event.key === 'Enter' || event.key === ' ') && isModalVisible) closeModalHandler();
  }}
>
  <div class="modalStack">
    {#if open}
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
      <!-- {#if activeModal === 'loginModal'}
        <div
          id="loginModal"
          class="modal"
          transition:scale={{ duration: MODAL_ANIM_MS, start: 0.8 }}
          onoutroend={handleModalOutroEnd}
        >
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
      {/if}

      {#if activeModal === 'registerModal'}
        <div
          id="registerModal"
          class="modal"
          transition:scale={{ duration: MODAL_ANIM_MS, start: 0.8 }}
          onoutroend={handleModalOutroEnd}
        >
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
      {/if}

      {#if activeModal === 'blocklistModal'}
        <div
          id="blocklistModal"
          class="modal"
          transition:scale={{ duration: MODAL_ANIM_MS, start: 0.8 }}
          onoutroend={handleModalOutroEnd}
        >
          <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
          <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.blocklist.title()}</h1></div>
          <div class="modalContent">
            <span id="blocklistModalEmptyLabel" class="infoLabel">{$LL.ui.modal.blocklist.empty()}</span>
            <div id="blocklistModalPlayerListContainer" class="scrollableContainer">
              <div id="blocklistModalPlayerList" class="playerList"></div>
            </div>
          </div>
        </div>
      {/if}

      {#if activeModal === 'chatSettingsModal'}
        <div
          id="chatSettingsModal"
          class="modal"
          transition:scale={{ duration: MODAL_ANIM_MS, start: 0.8 }}
          onoutroend={handleModalOutroEnd}
        >
          <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
          <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.chatSettings.title()}</h1></div>
          <div class="modalContent">
            <p>Chat settings form goes here.</p>
          </div>
        </div>
      {/if}

      {#if activeModal === 'screenshotSettingsModal'}
        <div
          id="screenshotSettingsModal"
          class="modal"
          transition:scale={{ duration: MODAL_ANIM_MS, start: 0.8 }}
          onoutroend={handleModalOutroEnd}
        >
          <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
          <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.screenshotSettings.title()}</h1></div>
          <div class="modalContent">
            <p>Screenshot settings form goes here.</p>
          </div>
        </div>
      {/if}

      {#if activeModal === 'notificationSettingsModal'}
        <div
          id="notificationSettingsModal"
          class="modal"
          transition:scale={{ duration: MODAL_ANIM_MS, start: 0.8 }}
          onoutroend={handleModalOutroEnd}
        >
          <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
          <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.notificationSettings.title()}</h1></div>
          <div class="modalContent">
            <p>Notification settings form goes here.</p>
          </div>
        </div>
      {/if}

      {#if activeModal === 'cacheSettingsModal'}
        <div
          id="cacheSettingsModal"
          class="modal"
          transition:scale={{ duration: MODAL_ANIM_MS, start: 0.8 }}
          onoutroend={handleModalOutroEnd}
        >
          <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
          <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.cacheSettings.title()}</h1></div>
          <div class="modalContent">
            <p>Cache controls go here.</p>
          </div>
        </div>
      {/if}

      {#if activeModal === 'accountSettingsModal'}
        <div
          id="accountSettingsModal"
          class="modal"
          transition:scale={{ duration: MODAL_ANIM_MS, start: 0.8 }}
          onoutroend={handleModalOutroEnd}
        >
          <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
          <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.accountSettings.title()}</h1></div>
          <div class="modalContent">
            <p>Account settings form goes here.</p>
          </div>
        </div>
      {/if}

      {#if activeModal === 'confirmModal'}
        <div
          id="confirmModal"
          class="modal modalStage"
          transition:scale={{ duration: MODAL_ANIM_MS, start: 0.8 }}
          onoutroend={handleModalOutroEnd}
        >
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
      {/if} -->
    {/if}
  </div>
</div>

<style>
  .modalContainer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 10000;
  }

  .modalContainer::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 200ms ease;
    z-index: 18;
  }

  .modalContainer.isVisible {
    pointer-events: auto;
  }

  .modalContainer.isVisible::before {
    opacity: 1;
  }

  .modalStack {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 19;
    pointer-events: none;
  }

  .modalStack > * {
    pointer-events: auto;
  }

  .modalStack > :global(*) {
    pointer-events: auto;
  }
</style>
