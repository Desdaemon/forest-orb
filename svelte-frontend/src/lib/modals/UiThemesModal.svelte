<script lang="ts">
  import { LL } from '$lib';
  import { onDestroy } from 'svelte';
  import { modal } from '$lib/stores/modal';
  import { allGameUiThemes, allGameFullBgUiThemes, getGameFontStyleIndices, type GameId } from '$lib/allGameUiThemes';
  import {
    selectedUiTheme,
    selectedFontStyle,
    currentSystemName,
    selectTheme,
    setFontStyle
  } from '$lib/stores/uiTheme';
  import Modal from '$lib/components/Modal.svelte';
  import { setUserSetting } from '$lib/stores/config';

  let modalData = $state<Record<string, any>>({});
  const unsubscribeModal = modal.subscribe((state) => {
    if (state.activeModal === 'uiThemesModal') {
      modalData = state.modalData ?? {};
    }
  });
  onDestroy(unsubscribeModal);

  let gameId = $derived<GameId>(modalData.gameId ?? '2kki');
  let themes = $derived<readonly string[]>(allGameUiThemes[gameId] ?? []);
  let fontStyleIndices = $derived(getGameFontStyleIndices(gameId));

  let currentTheme = $state<string | null>(null);
  let currentFontStyle = $state<number>(0);
  let systemName = $state<string | null>(null);

  const unsubTheme = selectedUiTheme.subscribe((t) => {
    currentTheme = t;
  });
  const unsubFontStyle = selectedFontStyle.subscribe((f) => {
    currentFontStyle = f;
  });
  const unsubSystemName = currentSystemName.subscribe((n) => {
    systemName = n;
  });
  onDestroy(unsubTheme);
  onDestroy(unsubFontStyle);
  onDestroy(unsubSystemName);

  function getFontStyleLabel(index: number) {
    switch (index) {
      case 0:
        return $LL.ui.fontStyle.values.style1();
      case 1:
        return $LL.ui.fontStyle.values.style2();
      case 2:
        return $LL.ui.fontStyle.values.style3();
      case 3:
        return $LL.ui.fontStyle.values.style4();
      case 4:
        return $LL.ui.fontStyle.values.style5();
      case 5:
        return $LL.ui.fontStyle.values.style6();
      case 6:
        return $LL.ui.fontStyle.values.style7();
      default:
        return `Style ${index + 1}`;
    }
  }

  let autoPreview = $derived(systemName ?? themes[0] ?? '');
  let autoIsFullBg = $derived((allGameFullBgUiThemes[gameId] ?? []).includes(autoPreview));
  let autoIsSelected = $derived(currentTheme === 'auto');

  function handleSelect(uiTheme: string) {
    setUserSetting('uiTheme', uiTheme);
  }

  function handleFontStyleChange(e: Event) {
    const val = parseInt((e.target as HTMLSelectElement).value, 10);
    setFontStyle(gameId, val);
  }
</script>

<Modal fullscreen id="uiThemesModal" aria-label="UI Theme" class="uiThemesModal">
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.uiTheme.title()}</h1>
  </div>
  <div class="modalContent itemContainer">
    <div class="uiThemeItem item auto unselectable">
      <span class="unselectable">AUTO</span>
      <div class="uiThemeContainer" class:selected={autoIsSelected}>
        <div
          class="uiTheme"
          class:fullBg={autoIsFullBg}
          data-ui-theme="auto"
          style:background-image="url('images/ui/{gameId}/{autoPreview}/containerbg.png')"
          style:border-image="url('images/ui/{gameId}/{autoPreview}/border.png') 10 repeat"
          role="button"
          tabindex="0"
          onclick={() => handleSelect('auto')}
          onkeydown={(e) => e.key === 'Enter' && handleSelect('auto')}
          aria-label="Select auto theme"
          aria-pressed={autoIsSelected}
        >
          <img src="images/ui/{gameId}/{autoPreview}/arrowup.png" alt="" />
          <img src="images/ui/{gameId}/{autoPreview}/arrowdown.png" alt="" />
        </div>
      </div>
    </div>
    {#each themes as uiTheme (uiTheme)}
      {@const isFullBg = (allGameFullBgUiThemes[gameId] ?? []).includes(uiTheme)}
      {@const isSelected = uiTheme === currentTheme}
      <div class="uiThemeItem item unselectable">
        <div class="uiThemeContainer" class:selected={isSelected}>
          <div
            class="uiTheme"
            class:fullBg={isFullBg}
            data-ui-theme={uiTheme}
            style:background-image="url('images/ui/{gameId}/{uiTheme}/containerbg.png')"
            style:border-image="url('images/ui/{gameId}/{uiTheme}/border.png') 10 repeat"
            role="button"
            tabindex="0"
            onclick={() => handleSelect(uiTheme)}
            onkeydown={(e) => e.key === 'Enter' && handleSelect(uiTheme)}
            aria-label="Select theme {uiTheme}"
            aria-pressed={isSelected}
          >
            <img src="images/ui/{gameId}/{uiTheme}/arrowup.png" alt="" />
            <img src="images/ui/{gameId}/{uiTheme}/arrowdown.png" alt="" />
          </div>
        </div>
      </div>
    {/each}
  </div>
  <div class="modalFooter">
    <div class="uiControl">
      <label for="fontStyle" class="unselectable">{$LL.ui.fontStyle.label()}</label>
      <select id="fontStyle" class="fontStyle" value={currentFontStyle} onchange={handleFontStyleChange}>
        {#each fontStyleIndices as idx}
          <option value={idx}>{getFontStyleLabel(idx)}</option>
        {/each}
      </select>
    </div>
  </div>
</Modal>
