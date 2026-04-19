<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
  import { tooltip } from '$lib/components/Tooltip.svelte';
  import { getGameInitState } from '$lib/init';
  import { onMount } from 'svelte';
  import { modal } from '$lib/stores/modal';
  import { get } from 'svelte/store';
  import { globalConfig } from '$lib/stores/config';

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
  let availableGames = $state<string[]>([ynoGameId]);

  // Get available game IDs from IndexedDB
  async function getAvailableGameIds(): Promise<string[]> {
    const dbs = await indexedDB.databases();
    return dbs
      .map((d) => (d.name ? (/^\/easyrpg\/([^/]+)\/Save$/.exec(d.name) || [])[1] : undefined))
      .filter((id): id is string => !!id);
  }

  // State
  let slots = $state<SaveSlot[]>([]);
  let reloadNeeded = $state(false);
  let manageOtherClicked = $state(false);

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
            alert($LL.messages.save.download.emptySlot());
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

      const confirmMessage = $LL.messages.save.delete.confirmDelete({ SLOT_ID: slotId });

      modal.confirm(
        confirmMessage,
        () => {
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
        },
        () => resolve(false)
      );
    });
  }

  async function loadSlotData(slot: SaveSlot) {
    slot.loading = true;
    slot.error = null;

    try {
      const data = await getSaveSlotData(gameId, slot.id);
      slot.data = data;
    } catch (err) {
      slot.error = $LL.messages.save.slot.errorLabel();
      console.error(err);
    } finally {
      slot.loading = false;
    }
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

  function handleManageOther() {
    manageOtherClicked = true;
  }

  function handleGameSelect() {
    slots = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      data: null,
      loading: true,
      error: null
    }));
    slots.forEach((slot) => loadSlotData(slot));
  }

  function handleModalClose() {
    manageOtherClicked = false;
    gameId = ynoGameId;
  }

  // Initialize slots on mount
  onMount(() => {
    let modalEl: HTMLDivElement;

    slots = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      data: null,
      loading: true,
      error: null
    }));

    // Load all slots
    slots.forEach((slot) => loadSlotData(slot));

    // Get available game IDs
    getAvailableGameIds().then((ids) => {
      availableGames = [...new Set([ynoGameId, ...ids])];
    });

    // Listen for modal close to reset state
    const interval = setInterval(() => {
      const modalElCandidate = document.querySelector('#saveModal');
      if (modalElCandidate) {
        modalEl = modalElCandidate as HTMLDivElement;
        modalEl.addEventListener('YNO_OUTROEND', handleModalClose);
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (modalEl) {
        modalEl.removeEventListener('YNO_OUTROEND', handleModalClose);
      }
    };
  });
</script>

<Modal aria-label={$LL.ui.modal.save.title()}>
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.save.title()}</h1>
    <span class="helpLink iconLink" title={$LL.ui.modal.save.info()}>
      <div class="helpIcon icon fillIcon invertFillIcon altIcon">
        <svg viewBox="0 0 18 18">
          <path
            d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
          />
        </svg>
      </div>
    </span>
  </div>

  <div class="modalContent">
    <div id="saveSlotList" class="scrollableContainer">
      {#each slots as slot (slot.id)}
        <div class="saveSlotListEntry listEntry" data-slot-id={slot.id}>
          <span class="label">{$LL.messages.save.slot.title({ SLOT_ID: slot.id })}</span>

          <div class="saveSlotListEntryContent">
            {#if slot.loading}
              <span class="label">{$LL.messages.save.slot.readingLabel()}</span>
            {:else if slot.error}
              <span class="label altText">{$LL.messages.save.slot.errorLabel()}</span>
            {:else if slot.data}
              <span class="label altText">
                {slot.data.timestamp.toLocaleString(get(globalConfig).lang === 'en' ? [] : get(globalConfig).lang, {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
              </span>
            {:else}
              <span class="label altText">{$LL.messages.save.slot.emptyLabel()}</span>
            {/if}

            <div class="saveSlotButtonsContainer">
              {#snippet uploadTooltip()}
                {$LL.messages.save.upload.tooltip()}
              {/snippet}
              {#snippet downloadTooltip()}
                {$LL.messages.save.download.tooltip()}
              {/snippet}
              {#snippet deleteTooltip()}
                {$LL.messages.save.delete.tooltip()}
              {/snippet}
              <input type="file" accept=".lsd" class="saveSlotUploadInput" onchange={(e) => handleUpload(slot, e)} />
              <div {@attach tooltip(uploadTooltip)}>
                <button
                  class="saveSlotUploadButton saveSlotButton unselectable iconButton"
                  type="button"
                  disabled={slot.loading}
                  onclick={() => {
                    const input = document.querySelector(
                      `.saveSlotListEntry[data-slot-id="${slot.id}"] .saveSlotUploadInput`
                    ) as HTMLInputElement;
                    if (input) input.click();
                  }}
                >
                  <svg class="icon" viewBox="0 0 18 18">
                    <path
                      d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 0.25 90 0 0 0 3.25"
                    />
                  </svg>
                </button>
              </div>

              {#if slot.data}
                <div {@attach tooltip(downloadTooltip)}>
                  <button
                    class="saveSlotDownloadButton saveSlotButton unselectable iconButton"
                    type="button"
                    onclick={() => handleDownload(slot)}
                    disabled={slot.loading}
                  >
                    <svg class="icon" viewBox="0 0 18 18">
                      <path
                        d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 0.25 90 0 0 0 3.25"
                      />
                    </svg>
                  </button>
                </div>

                <div {@attach tooltip(deleteTooltip)}>
                  <button
                    class="saveSlotDeleteButton saveSlotButton unselectable iconButton"
                    type="button"
                    onclick={() => handleDelete(slot)}
                    disabled={slot.loading}
                  >
                    <svg class="icon" viewBox="0 0 18 18">
                      <path
                        d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 0.25 90 0 0 0 3.25"
                      />
                    </svg>
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="modalFooter">
    <button class="saveModalManageOtherButton" type="button" onclick={handleManageOther}>
      {$LL.ui.modal.save.manageOther()}
    </button>

    <select class="gameSelect {manageOtherClicked ? '' : 'hidden'}" bind:value={gameId} onchange={handleGameSelect}>
      {#each availableGames as game (game)}
        <option value={game}>{game}</option>
      {/each}
    </select>

    <button
      class="saveModalReloadButton unselectable {reloadNeeded ? '' : 'hidden'}"
      type="button"
      onclick={() => (window.location.href = window.location.href)}
    >
      {$LL.ui.modal.save.reload()}
    </button>
  </div>
</Modal>

<style>
  :global(#saveSlotList) {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  :global(#saveSlotList .saveSlotListEntry) {
    width: 214px;
    height: 64px;
    flex-direction: column;
    align-items: flex-start;
    padding: 8px;
  }

  :global(#saveSlotList .saveSlotListEntry .saveSlotListEntryContent) {
    margin-top: 8px;
    height: 100%;
  }

  :global(#saveSlotList .saveSlotListEntry .saveSlotListEntryContent .saveSlotButtonsContainer) {
    display: flex;
    margin-top: 8px;
  }

  :global(#saveSlotList .saveSlotListEntry .saveSlotListEntryContent .saveSlotButtonsContainer .saveSlotButton) {
    width: 18px;
    height: 18px;
    margin-inline-end: 8px;
  }

  .saveSlotUploadInput {
    display: none;
  }
</style>
