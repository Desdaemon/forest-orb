<script lang="ts">
  import { modal, type ModalId } from '$lib/stores/modal';
  import { apiFetch } from '$lib/api';
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
  import { onMount } from 'svelte';

  let selectedPreset = $state('0');
  let presetData = $state<string[][]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function fetchPreset() {
    loading = true;
    error = null;
    try {
      const response = await apiFetch(`badge?command=presetGet&preset=${selectedPreset}`);
      if (!response.ok) throw new Error('Failed to fetch preset');
      presetData = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  async function savePreset() {
    try {
      const response = await apiFetch(`badge?command=presetSave&preset=${selectedPreset}`);
      if (!response.ok) throw new Error('Failed to save preset');
      // In a real app, we might want to refresh the data here.
      await fetchPreset();
      alert('Preset saved!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving preset');
    }
  }

  async function loadPreset() {
    await fetchPreset();
  }

  onMount(async () => {
    await fetchPreset();
  });
</script>

<Modal aria-label="Badge Preset Modal">
  <div class="modalHeader">
    <h1 class="modalTitle">Manage Badge Presets</h1>
    <button class="modalClose" onclick={() => modal.close()}>✖</button>
  </div>

  <div class="modalContent">
    <div class="formControls" style="width:100%">
      <div class="formControlRow">
        <label for="badgePresetSelection">Select Preset</label>
        <select id="badgePresetSelection" bind:value={selectedPreset} onchange={fetchPreset}>
          {#each [0, 1, 2] as preset}
            <option value={preset}>{$LL.ui.modal.badgePreset.presetName(preset + 1)}</option>
          {/each}
        </select>
      </div>
    </div>

    <hr />

    {#if loading}
      <div class="loading">Loading...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else}
      <div class="badgeGrid">
        {#each presetData as row, r}
          <div class="badgeRow">
            {#each row as badgeId, c}
              <div class="badgeSlot" data-row={r} data-col={c}>
                {#if badgeId !== 'null'}
                  <img src="/images/badge/{badgeId}.png" alt={badgeId} />
                {:else}
                  <div class="emptySlot"></div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="modalFooter">
    <button onclick={savePreset}>Save</button>
    <button onclick={loadPreset}>Apply</button>
  </div>
</Modal>

<style>
  .modalContent {
    padding: 1rem;
  }
  .formControlRow {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .badgeGrid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .badgeRow {
    display: flex;
    gap: 0.5rem;
  }
  .badgeSlot {
    width: 50px;
    height: 50px;
    border: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .badgeSlot img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .emptySlot {
    width: 100%;
    height: 100%;
    background: #eee;
  }
  .loading,
  .error {
    padding: 1rem;
    text-align: center;
  }
  .error {
    color: red;
  }
</style>
