<script>
  import Modal from '$lib/components/Modal.svelte';
  import { modal } from '$lib/stores/modal';

  let response = $state();

  async function onclick() {
    response = await modal.open('testStage2');
  }
</script>

<Modal aria-label="Stage 1">
  <button {onclick}>
    {#if response}
      Got response: {response}
    {:else}
      Go to Stage 2
    {/if}
  </button>
</Modal>
