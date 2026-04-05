<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
</script>

<Modal aria-label="Schedules">
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.schedule.title()}</h1>
  </div>
  <div class="modalContent">
    <p>Schedules content goes here.</p>
  </div>
</Modal>
