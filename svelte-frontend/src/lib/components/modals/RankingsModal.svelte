<script lang="ts">
    import { modal } from "$lib/modalStore";

    function close() {
        modal.close();
    }
</script>

<div class="modal" role="dialog" aria-modal="true" aria-label="Rankings">
    <button type="button" class="modalClose" onclick={close} aria-label="Close modal">✖</button>
    <div class="modalHeader"><h1 class="modalTitle">Rankings</h1></div>
    <div class="modalContent">
        <p>Rankings content goes here.</p>
    </div>
</div>
