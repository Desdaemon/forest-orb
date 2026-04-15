<script lang="ts">
  import TestStage1 from '$lib/modals/TestStage1.svelte';
  import TestStage2 from '$lib/modals/TestStage2.svelte';
  import { modal } from '$lib/stores/modal';
  import { onMount, onDestroy, type Snippet } from 'svelte';

  const { children }: { children?: Snippet } = $props();

  let modalContainer: HTMLElement | undefined = $state();

  const modalStack = $derived($modal.stack);
  // const activeModal = $derived(modalStack.length ? modalStack[modalStack.length - 1] : undefined);
  let open = $derived($modal.open);
  let isModalVisible = $derived(!!modalStack.length);

  function closeModalHandler() {
    modal.close();
  }

  function handleModalOutroEnd() {
    if (isModalVisible) return;

    modal.finalizeClose();
  }

  function handleModalIntroStart() {
    // Add fadeIn class for the new modal
    const modalEl = document.getElementById(`modal-${modalStack[modalStack.length - 1]?.id}`);
    if (modalEl) {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('fadeIn');
    }
  }

  function handleModalOutroStart() {
    // Remove fadeIn class and add hidden class for the closing modal
    const modalEl = document.getElementById(`modal-${modalStack[modalStack.length - 1]?.id}`);
    if (modalEl) {
      modalEl.classList.remove('fadeIn');
      modalEl.classList.add('hidden');
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModalHandler();
    }
  }

  onMount(() => {
    if (modalContainer) {
      modalContainer.addEventListener('YNO_OUTROEND', handleModalOutroEnd);
      modalContainer.addEventListener('YNO_INTROSTART', handleModalIntroStart);
      modalContainer.addEventListener('YNO_OUTROSTART', handleModalOutroStart);
    }
  });

  onDestroy(() => {
    if (modalContainer) {
      modalContainer.removeEventListener('YNO_OUTROEND', handleModalOutroEnd);
      modalContainer.removeEventListener('YNO_INTROSTART', handleModalIntroStart);
      modalContainer.removeEventListener('YNO_OUTROSTART', handleModalOutroStart);
    }
  });
</script>

<div role="presentation" inert={isModalVisible}>
  {@render children?.()}
</div>

<div
  bind:this={modalContainer}
  class="modalContainer"
  class:isVisible={isModalVisible}
  role="button"
  tabindex={isModalVisible ? 0 : -1}
  aria-hidden={!isModalVisible}
  onclick={handleOverlayClick}
>
  <div class="modalStack">
    {#if open}
      {#each modalStack as modalItem, idx (`${modalItem.id}::${idx}`)}
        <div class:hidden={idx !== modalStack.length - 1} class:fadeIn={idx === modalStack.length - 1}>
          {#if modalItem.id === 'loginModal'}
            {@const { default: LoginModal } = await import('$lib/modals/LoginModal.svelte')}
            <LoginModal />
          {:else if modalItem.id === 'registerModal'}
            {@const { default: RegisterModal } = await import('$lib/modals/RegisterModal.svelte')}
            <RegisterModal />
          {:else if modalItem.id === 'schedulesModal'}
            {@const { default: SchedulesModal } = await import('$lib/modals/SchedulesModal.svelte')}
            <SchedulesModal />
          {:else if modalItem.id === 'editEventModal'}
            {@const { default: EditEventModal } = await import('$lib/modals/ScheduleEditModal.svelte')}
            <EditEventModal schedule={modalItem.data} />
          {:else if modalItem.id === 'locationsModal'}
            {@const { default: LocationsModal } = await import('$lib/modals/LocationsModal.svelte')}
            <LocationsModal />
          {:else if modalItem.id === 'communityScreenshotsModal'}
            {@const { default: CommunityScreenshotsModal } = await import('$lib/modals/CommunityScreenshotsModal.svelte')}
            <CommunityScreenshotsModal />
          {:else if modalItem.id === 'rankingsModal'}
            {@const { default: RankingsModal } = await import('$lib/modals/RankingsModal.svelte')}
            <RankingsModal />
          {:else if modalItem.id === 'eventsModal'}
            {@const { default: ExpeditionsModal } = await import('$lib/modals/ExpeditionsModal.svelte')}
            <ExpeditionsModal />
          {:else if modalItem.id === 'badgesModal'}
            {@const { default: BadgesModal } = await import('$lib/modals/BadgesModal.svelte')}
            <BadgesModal />
          {:else if modalItem.id === 'badgePresetModal'}
            {@const { default: BadgePresetModal } = await import('$lib/modals/BadgePresetModal.svelte')}
            <BadgePresetModal />
          {:else if modalItem.id === 'uiThemesModal'}
            {@const { default: UiThemesModal } = await import('$lib/modals/UiThemesModal.svelte')}
            <UiThemesModal />
          {:else if modalItem.id === 'settingsModal'}
            {@const { default: SettingsModal } = await import('$lib/modals/SettingsModal.svelte')}
            <SettingsModal />
          {:else if modalItem.id === 'testStage1'}
            <TestStage1 />
          {:else if modalItem.id === 'testStage2'}
            <TestStage2 />
          {:else if modalItem.id === 'confirmModal'}
            {@const { default: ConfirmModal } = await import('$lib/modals/ConfirmModal.svelte')}
            <ConfirmModal 
              message={modalItem.data?.message}
              onOk={() => {
                modal.close('confirmModal', undefined);
                if (modalItem.data?.onOk) modalItem.data.onOk();
              }}
              onCancel={() => {
                modal.close('confirmModal', undefined);
                if (modalItem.data?.onCancel) modalItem.data.onCancel();
              }}
            />
          {:else if modalItem.id}
            {@const { default: Modal } = await import('$lib/components/Modal.svelte')}
            <Modal aria-label={modalItem.id}>
              <div class="modalHeader">
                Unknown modal {modalItem.id}
              </div>
            </Modal>
          {/if}
        </div>
      {/each}
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
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 19;
    pointer-events: none;
    width: 100%;
    height: 100%;
  }

  .modalStack > * {
    pointer-events: auto;
  }

  .modalStack > :global(*) {
    pointer-events: auto;
  }

  .modalStack > *:not(:global(*)) {
    pointer-events: auto;
  }

  .modalStack > *:not(:global(*)):not(.fadeIn) {
    opacity: 0;
    pointer-events: none;
  }

  .modalStack > *:not(:global(*)).fadeIn {
    opacity: 1;
    pointer-events: auto;
  }
</style>
