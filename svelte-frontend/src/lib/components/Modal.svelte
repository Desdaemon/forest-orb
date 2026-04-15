<script lang="ts">
  import { modal } from '$lib/stores/modal';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  let modalEl = $state<HTMLDivElement | null>(null);

  const {
    children,
    fullscreen: fullscreenModal,
    wide: wideModal,
    ...props
  }: {
    children?: Snippet;
    fullscreen?: boolean;
    wide?: boolean;
    'aria-label': string;
  } & HTMLAttributes<HTMLDivElement> = $props();

  function handleOutroEnd() {
    modalEl?.dispatchEvent(new CustomEvent('YNO_OUTROEND', { bubbles: true }));
  }
</script>

<div
  bind:this={modalEl}
  class={['modal', { fullscreenModal, wideModal }, props.class]}
  onoutroend={handleOutroEnd}
  onintrostart={() => modalEl?.dispatchEvent(new CustomEvent('YNO_INTROSTART', { bubbles: true }))}
  onoutrostart={() => modalEl?.dispatchEvent(new CustomEvent('YNO_OUTROSTART', { bubbles: true }))}
  role="dialog"
  aria-modal="true"
  {...props}
>
  <div
    tabindex="0"
    class="modalClose"
    onclick={() => {
      // @ts-ignore - close can be called without arguments
      modal.close();
    }}
    onkeydown={(e) => {
      // @ts-ignore - close can be called without arguments
      if (e.key === 'Enter') modal.close();
    }}
    aria-label="Close modal"
    role="button"
  >
    ✖
  </div>
  {@render children?.()}
</div>

<style>
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    overflow: auto;
    display: flex;
    flex-direction: column;
    animation: modalScale 0.2s ease-out;
  }

  .modal.hidden {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.7);
  }

  .wideModal {
    max-width: 80%;
  }

  @keyframes modalScale {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.7);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
</style>
