<script lang="ts">
  import { modal } from '$lib/modalStore';
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
  <button type="button" class="modalClose" onclick={modal.close} aria-label="Close modal">✖</button>
  {@render children?.()}
</div>
