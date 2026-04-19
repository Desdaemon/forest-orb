<script lang="ts">
  import { LL } from '$lib';
  import { allGameUiThemes, allGameFullBgUiThemes, getGameFontStyleIndices } from '$lib/allGameUiThemes';
  import { selectedFontStyle, currentSystemName, setFontStyle } from '$lib/stores/uiTheme';
  import Modal from '$lib/components/Modal.svelte';
  import { globalConfig, setUserSetting, toggleGlobal, userConfig } from '$lib/stores/config';
  import { modal } from '$lib/stores/modal';
  import { getGameId } from '$lib/init';

  const { gameId = getGameId(), pickerMode = true, pickerTheme: pickerThemeSeed = 'auto' }: App.UiThemeModalData = $props();

  // svelte-ignore state_referenced_locally: gameId is static
  let themes = allGameUiThemes[gameId];
  let fontStyleIndices = $derived(getGameFontStyleIndices(gameId));

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

  let pickerTheme = $derived(pickerThemeSeed);
  let autoPreview = $derived(pickerMode ? pickerTheme : $currentSystemName || themes[0] || '');
  let autoIsFullBg = $derived(allGameFullBgUiThemes[gameId].includes(autoPreview));
  const userSelectedTheme = $derived(pickerMode ? pickerTheme : $userConfig.uiTheme);
  let autoIsSelected = $derived(userSelectedTheme === 'auto');

  function handleSelect(uiTheme: string) {
    if (pickerMode) {
      pickerTheme = uiTheme;
    } else {
      setUserSetting('uiTheme', uiTheme);
    }
  }

  function willCloseModal() {
    if (pickerMode) {
      modal.close('uiThemesModal', pickerTheme);
    } else {
      modal.close();
    }
  }
</script>

<Modal
  fullscreen
  id="uiThemesModal"
  aria-label={$LL.ui.modal.uiTheme.title()}
  class="uiThemesModal"
  onclose={willCloseModal}
>
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.uiTheme.title()}</h1>
  </div>
  <div class="modalContent itemContainer">
    <div class="uiThemeItem item auto unselectable">
      <span class="unselectable">{$LL.ui.modal.uiTheme.auto()}</span>
      <div class={['uiThemeContainer', { selected: autoIsSelected }]}>
        <div
          class={['uiTheme', { fullBg: autoIsFullBg }]}
          data-ui-theme="auto"
          style:background-image="url('/images/ui/{gameId}/{autoPreview}/containerbg.png')"
          style:border-image="url('/images/ui/{gameId}/{autoPreview}/border.png') 10 repeat"
          role="button"
          tabindex="0"
          onclick={() => handleSelect('auto')}
          onkeydown={(e) => e.key === 'Enter' && handleSelect('auto')}
          aria-label="Select auto theme"
          aria-pressed={autoIsSelected}
        >
          <img src="/images/ui/{gameId}/{autoPreview}/arrowup.png" alt="" />
          <img src="/images/ui/{gameId}/{autoPreview}/arrowdown.png" alt="" />
        </div>
      </div>
    </div>
    {#each themes as uiTheme (uiTheme)}
      {@const isFullBg = allGameFullBgUiThemes[gameId].includes(uiTheme)}
      {@const isSelected = uiTheme === userSelectedTheme}
      <div class="uiThemeItem item unselectable">
        <div class={['uiThemeContainer', { selected: isSelected }]}>
          <div
            class={['uiTheme', { fullBg: isFullBg }]}
            data-ui-theme={uiTheme}
            style:background-image="url('/images/ui/{gameId}/{uiTheme}/containerbg.png')"
            style:border-image="url('/images/ui/{gameId}/{uiTheme}/border.png') 10 repeat"
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
  <div class="modalFooter grid">
    <div class="col-6 col-sm-12">
      <label for="fontStyle" class="unselectable">{$LL.ui.fontStyle.label()}</label>
      <select
        id="fontStyle"
        class="fontStyle"
        value={$selectedFontStyle}
        onchange={(ev) => setFontStyle(gameId, +ev.currentTarget.value)}
      >
        {#each fontStyleIndices as idx (idx)}
          <option value={idx}>{getFontStyleLabel(idx)}</option>
        {/each}
      </select>
    </div>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      role="checkbox"
      tabindex="0"
      aria-checked={$globalConfig.highContrast}
      class="col-6 col-sm-12 toggleRow"
      onclick={() => toggleGlobal('highContrast')}
    >
      <label for="highContrast" class="unselectable">{$LL.ui.highContrast()}</label>
      <button
        type="button"
        id="highContrast"
        class={['checkboxButton unselectable', { toggled: $globalConfig.highContrast }]}
        aria-label={$LL.ui.highContrast()}
      >
        <span></span>
      </button>
    </div>
  </div>
</Modal>

<style lang="scss">
  $breakpoints: (
    sm: 480px
  );

  .grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1rem;
  }

  @for $i from 1 through 12 {
    .col-#{$i} {
      grid-column: span #{$i};
    }
  }

  @each $name, $size in $breakpoints {
    @media (max-width: $size) {
      @for $i from 1 through 12 {
        .col-#{$name}-#{$i} {
          grid-column: span #{$i};
        }
      }
    }
  }

  .toggleRow {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    cursor: pointer;
    transition: background-color 120ms ease;
  }

  .toggleRow:hover {
    background-color: rgba(127, 127, 127, 0.14);
  }
</style>
