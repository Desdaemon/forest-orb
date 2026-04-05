<script lang="ts">
  import { modal } from '$lib/stores/modal';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
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
</script>

<div role="dialog" aria-modal="true" {...props} class={['modal', { fullscreenModal, wideModal }, props.class]}>
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
