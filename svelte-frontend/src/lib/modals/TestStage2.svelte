<script>
  import Modal from "$lib/components/Modal.svelte";
  import { modal } from "$lib/stores/modal";

  function onclick() {
    modal.close('testStage2', '42')
  }

</script>
<Modal aria-label="Stage 2">
  <button {onclick}>
    Close and go back to Stage 1
  </button>
</Modal>