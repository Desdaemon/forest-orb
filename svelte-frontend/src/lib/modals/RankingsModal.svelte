<script lang="ts">
  import { LL } from '$lib';
  import { modal } from '$lib/stores/modal';
</script>

<div class="modal" role="dialog" aria-modal="true" aria-label="Rankings">
  <button type="button" class="modalClose" onclick={modal.close} aria-label="Close modal">✖</button>
  <div class="modalHeader"><h1 class="modalTitle">{$LL.ui.modal.rankings.title()}</h1></div>
  <div class="modalContent">
    <p>Rankings content goes here.</p>
  </div>
</div>
