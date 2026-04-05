<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
</script>

<Modal aria-label="Locations">
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.locations.title()}</h1>
  </div>
  <div class="modalContent">
    <p>Locations content goes here.</p>
  </div>
</Modal>
