<script lang="ts">
    import { modal } from "$lib/modalStore";
</script>

<div class="modal" role="dialog" aria-modal="true" aria-label="Locations">
    <button type="button" class="modalClose" onclick={modal.close} aria-label="Close modal">✖</button>
    <div class="modalHeader"><h1 class="modalTitle">Locations</h1></div>
    <div class="modalContent">
        <p>Locations content goes here.</p>
    </div>
</div>
