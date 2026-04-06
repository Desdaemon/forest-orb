<script lang="ts">
  import { modal } from '$lib/stores/modal';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { scale } from 'svelte/transition';
  
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
  transition:scale={{ duration: 200, start: 0.7 }}
  onoutroend={handleOutroEnd}
  role="dialog"
  aria-modal="true"
  {...props}
  class={['modal', { fullscreenModal, wideModal }, props.class]}
>
  <div
    tabindex="0"
    class="modalClose"
    onclick={modal.close}
    onkeydown={(e) => e.key === 'Enter' && modal.close()}
    aria-label="Close modal"
    role="button"
  >
    ✖
  </div>
  {@render children?.()}
</div>
