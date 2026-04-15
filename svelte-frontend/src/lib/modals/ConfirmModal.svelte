<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import { modal } from '$lib/stores/modal';

  interface Props {
    message: string;
    onOk: () => void;
    onCancel: () => void;
  }

  let { message, onOk, onCancel }: Props = $props();
</script>

<Modal aria-label="Confirm">
  <div class="confirmMessage">
    {message}
  </div>
  <div class="confirmButtons">
    <button class="confirmOkButton" onclick={onOk}>
      OK
    </button>
    <button class="confirmCancelButton" onclick={onCancel}>
      Cancel
    </button>
  </div>
</Modal>

<style>
  .confirmMessage {
    margin-bottom: 1rem;
    text-align: center;
  }

  .confirmButtons {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .confirmOkButton,
  .confirmCancelButton {
    padding: 0.5rem 1rem;
    cursor: pointer;
  }
</style>
