<script lang="ts">
    import { modal } from "$lib/modalStore";
    import ModalClose from "../ModalClose.svelte";
</script>

<div class="modal" role="dialog" aria-modal="true" aria-label="Schedules">
    <ModalClose />
    <div class="modalHeader"><h1 class="modalTitle">Schedules</h1></div>
    <div class="modalContent">
        <p>Schedules content goes here.</p>
    </div>
    <div class="modalFooter">
        <button type="button" onclick={modal.close}>Close</button>
    </div>
</div>
