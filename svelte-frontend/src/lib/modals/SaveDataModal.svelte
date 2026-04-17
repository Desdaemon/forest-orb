<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
  import { getGameInitState } from '$lib/init';

  type SaveSlotData = {
    timestamp: Date;
  } | null;

  type SaveSlot = {
    id: number;
    data: SaveSlotData;
    loading: boolean;
    error: string | null;
  };

  // Get the current game ID from the init state
  const { ynoGameId } = getGameInitState();
  let gameId = $state<string>(ynoGameId);

  // State
  let slots = $state<SaveSlot[]>([]);
  let reloadNeeded = $state(false);

  const MAIN_GAME_OPTION = $derived(gameId === ynoGameId);

  // IndexedDB helpers
  async function getSaveSlotData(gameId: string, slotId: number): Promise<SaveSlotData> {
    return new Promise((resolve) => {
      if (!slotId || slotId < 1) {
        resolve(null);
        return;
      }

      const formattedSlotId = slotId < 10 ? `0${slotId}` : slotId.toString();
      const request = indexedDB.open(`/easyrpg/${gameId}/Save`);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('FILE_DATA')) {
          db.createObjectStore('FILE_DATA');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['FILE_DATA'], 'readwrite');
        const objectStore = transaction.objectStore('FILE_DATA');
        const objectStoreRequest = objectStore.get(`/easyrpg/${gameId}/Save/Save${formattedSlotId}.lsd`);

        objectStoreRequest.onsuccess = () => resolve(objectStoreRequest.result ?? null);
        objectStoreRequest.onerror = () => resolve(null);
      };

      request.onerror = () => resolve(null);
    });
  }

  async function uploadSaveFile(gameId: string, file: File, slotId: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (!file || !slotId) {
        resolve(false);
        return;
      }

      if (!/\.lsd$/i.test(file.name)) {
        alert($LL.messages.save.upload.invalidSaveFile());
        resolve(false);
        return;
      }

      const request = indexedDB.open(`/easyrpg/${gameId}/Save`);

      request.onsuccess = () => {
        const reader = new FileReader();

        reader.onload = () => {
          const readerResult = reader.result;
          const saveFile = {
            timestamp: new Date(),
            mode: 33206,
            contents: new Uint8Array(readerResult as ArrayBuffer)
          };

          const db = request.result;
          const transaction = db.transaction(['FILE_DATA'], 'readwrite');
          const objectStorePutRequest = transaction
            .objectStore('FILE_DATA')
            .put(saveFile, `/easyrpg/${gameId}/Save/Save${slotId}.lsd`);

          objectStorePutRequest.onsuccess = () => resolve(true);
          objectStorePutRequest.onerror = () => resolve(false);
        };

        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(file);
      };

      request.onerror = () => resolve(false);
    });
  }

  async function downloadSaveFile(gameId: string, slotId: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (!slotId) {
        resolve(false);
        return;
      }

      const request = indexedDB.open(`/easyrpg/${gameId}/Save`);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['FILE_DATA'], 'readwrite');
        const objectStore = transaction.objectStore('FILE_DATA');
        const objectStoreRequest = objectStore.get(`/easyrpg/${gameId}/Save/Save${slotId}.lsd`);

        objectStoreRequest.onsuccess = () => {
          const record = objectStoreRequest.result;

          if (!record) {
            alert($LL.save.download.emptySlot());
            resolve(false);
            return;
          }

          const blob = new Blob([record.contents], { type: 'text/json' });
          const date = record.timestamp;
          const link = document.createElement('a');

          const [month, day, year, hour, minute, second] = [
            date.getMonth(),
            date.getDate(),
            date.getFullYear(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
          ];
          const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}-${hour.toString().padStart(2, '0')}h${minute.toString().padStart(2, '0')}m${second.toString().padStart(2, '0')}s`;

          link.href = window.URL.createObjectURL(blob);
          link.download = `${gameId}_Save${slotId}_${formattedDate}.lsd`;
          link.click();
          link.remove();
          resolve(true);
        };

        objectStoreRequest.onerror = () => resolve(false);
      };

      request.onerror = () => resolve(false);
    });
  }

  async function deleteSaveFile(gameId: string, slotId: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (!slotId) {
        resolve(false);
        return;
      }

      const confirmMessage = $LL.save.delete.confirmDelete().replace('{SLOT_ID}', String(slotId));

      // Use the ConfirmModal for deletion confirmation
      // This is a simplified version - in production, you'd use the modal stack
      if (confirm(confirmMessage)) {
        const request = indexedDB.open(`/easyrpg/${gameId}/Save`);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['FILE_DATA'], 'readwrite');
          const objectStoreDeleteRequest = transaction
            .objectStore('FILE_DATA')
            .delete(`/easyrpg/${gameId}/Save/Save${slotId}.lsd`);

          objectStoreDeleteRequest.onsuccess = () => resolve(true);
          objectStoreDeleteRequest.onerror = () => resolve(false);
        };

        request.onerror = () => resolve(false);
      } else {
        resolve(false);
      }
    });
  }

  async function loadSlotData(slot: SaveSlot) {
    slot.loading = true;
    slot.error = null;

    try {
      const data = await getSaveSlotData(gameId, slot.id);
      slot.data = data;
    } catch (err) {
      slot.error = $LL.save.slot.errorLabel();
      console.error(err);
    } finally {
      slot.loading = false;
    }
  }

  function formatSlotId(slotId: number): string {
    return slotId < 10 ? `0${slotId}` : slotId.toString();
  }

  function handleUpload(slot: SaveSlot, event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      uploadSaveFile(gameId, file, slot.id)
        .then((success) => {
          if (success) {
            reloadNeeded = true;
            loadSlotData(slot);
          }
        })
        .catch((err) => {
          console.error('Upload failed:', err);
        });
    }

    // Reset the file input
    target.value = '';
  }

  function handleDownload(slot: SaveSlot) {
    if (slot.data) {
      downloadSaveFile(gameId, slot.id).then((success) => {
        if (success) {
          reloadNeeded = true;
        }
      });
    }
  }

  function handleDelete(slot: SaveSlot) {
    if (slot.data) {
      deleteSaveFile(gameId, slot.id).then((success) => {
        if (success) {
          reloadNeeded = true;
          loadSlotData(slot);
        }
      });
    }
  }

  // Initialize slots on mount
  $effect(() => {
    slots = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      data: null,
      loading: true,
      error: null
    }));

    // Load all slots
    slots.forEach((slot) => loadSlotData(slot));
  });
</script>

<Modal aria-label="Manage Save Data">
  <h1 data-i18n="[html]modal.save.title">Manage Save Data</h1>
  <a href="#" class="helpLink iconLink" title={$LL.ui.modal.save.info()}>
    <div class="helpIcon icon fillIcon invertFillIcon altIcon">
      <svg viewBox="0 0 18 18">
        <path
          d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
        />
      </svg>
    </div>
  </a>

  {#each slots as slot (slot.id)}
    <div class="saveSlotListEntry listEntry" data-slot-id={slot.id}>
      <span class="label" data-i18n="[html]modal.save.slot.title">
        File {slot.id}
      </span>

      <div class="saveSlotListEntryContent">
        {#if slot.loading}
          <span class="label" data-i18n="[html]modal.save.slot.readingLabel"> Reading File Data... </span>
        {:else if slot.error}
          <span class="label altText" data-i18n="[html]modal.save.slot.errorLabel"> Error </span>
        {:else if slot.data}
          <span class="label altText">
            {$LL.ui.timestamp.time(slot.data.timestamp)()}
          </span>
        {:else}
          <span class="label altText" data-i18n="[html]modal.save.slot.emptyLabel"> Empty </span>
        {/if}

        <div class="saveSlotButtonsContainer">
          <input type="file" accept=".lsd" class="saveSlotUploadInput" onchange={(e) => handleUpload(slot, e)} />
          <button
            class="saveSlotUploadButton saveSlotButton unselectable iconButton"
            title={$LL.messages.save.upload.tooltip()}
            type="button"
            disabled={slot.loading}
          >
            <svg class="icon" viewBox="0 0 18 18">
              <path
                d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
              />
            </svg>
          </button>

          <button
            class="saveSlotDownloadButton saveSlotButton unselectable iconButton {slot.data ? '' : 'hidden'}"
            title={$LL.messages.save.download.tooltip()}
            type="button"
            onclick={() => handleDownload(slot)}
            disabled={slot.loading}
          >
            <svg class="icon" viewBox="0 0 18 18">
              <path
                d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
              />
            </svg>
          </button>

          <button
            class="saveSlotDeleteButton saveSlotButton unselectable iconButton {slot.data ? '' : 'hidden'}"
            title={$LL.messages.save.delete.tooltip()}
            type="button"
            onclick={() => handleDelete(slot)}
            disabled={slot.loading}
          >
            <svg class="icon" viewBox="0 0 18 18">
              <path
                d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/each}

  <button
    class="saveModalManageOtherButton"
    type="button"
    data-i18n="[html]modal.save.manageOther"
    onclick={() => (window.location.href = '?manage_other_saves=1')}
  >
    Manage Different Game&hellip;
  </button>

  <select
    class="gameSelect hidden"
    bind:value={gameId}
    onchange={() => {
      // Reload slots when game changes
      slots = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        data: null,
        loading: true,
        error: null
      }));
      slots.forEach((slot) => loadSlotData(slot));
    }}
  >
    <option value="2kki">Yume 2kki</option>
    <option value="amillusion">Amillusion</option>
    <option value="braingirl">Braingirl</option>
    <option value="cold">[COLD]</option>
    <option value="unconscious">Collective Unconscious</option>
    <option value="deepdreams">Deep Dreams</option>
    <option value="flow">.flow</option>
    <option value="fog">FOG</option>
    <option value="genie">Dream Genie</option>
    <option value="if">If</option>
    <option value="loveyou">Love You</option>
    <option value="mikan">Mikan Muzou</option>
    <option value="muma">Muma Rope</option>
    <option value="nostalgic">nostAlgic</option>
    <option value="oneshot">OneShot</option>
    <option value="oversomnia">Oversomnia</option>
    <option value="prayers">Answered Prayers</option>
    <option value="sheawaits">She Awaits</option>
    <option value="someday">Someday</option>
    <option value="tsushin">Yume Tsushin</option>
    <option value="ultraviolet">Ultra Violet</option>
    <option value="unaccomplished">Unaccomplished</option>
    <option value="unevendream">Uneven Dream</option>
    <option value="yume">Yume Nikki</option>
  </select>

  <button
    class="saveModalReloadButton unselectable {reloadNeeded ? '' : 'hidden'}"
    type="button"
    data-i18n="[html]modal.save.reload"
    onclick={() => (window.location = window.location)}
  >
    Save Changes and Reload
  </button>
</Modal>

<style>
  :global(.saveSlotListEntry) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--borderColor);
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  :global(.saveSlotListEntryContent) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  :global(.saveSlotButtonsContainer) {
    display: flex;
    gap: 0.5rem;
  }

  :global(.saveSlotButton) {
    padding: 0.5rem;
    border-radius: 4px;
    background: var(--buttonBg);
    border: 1px solid var(--borderColor);
    cursor: pointer;
    transition: background 0.2s;
  }

  :global(.saveSlotButton:hover) {
    background: var(--buttonHoverBg);
  }

  :global(.saveSlotUploadInput) {
    display: none;
  }

  :global(.saveModalManageOtherButton) {
    margin-right: auto;
  }

  :global(.gameSelect) {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--borderColor);
    border-radius: 4px;
    background: var(--inputBg);
    color: var(--textColor);
  }

  :global(.saveModalReloadButton) {
    margin-left: auto;
    padding: 0.75rem 1.5rem;
    background: var(--primaryColor);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  :global(.saveModalReloadButton:hover) {
    background: var(--primaryHoverColor);
  }
</style>
