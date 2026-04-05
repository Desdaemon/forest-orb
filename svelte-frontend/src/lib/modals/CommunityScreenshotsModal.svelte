<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
</script>

<Modal aria-label="Community Screenshots">
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.communityScreenshots.title()}</h1>
  </div>
  <div class="modalContent">
    <p>Community screenshots content goes here.</p>
  </div>
</Modal>
