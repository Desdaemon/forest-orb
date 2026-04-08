<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
  import { globalConfig, userConfig, setGlobalSetting, setUserSetting, setConfigValue } from '$lib/stores/config';
  import {
    cacheActions,
    settingsFieldsByTab,
    settingsTabs,
    type SettingField,
    type SettingsTabId,
    type GlobalConfig,
    type UserConfig
  } from '$lib/config';
  import { locale } from '../../i18n/i18n-svelte';
  import type { Locales } from '../../i18n/i18n-types';
  import { languageNames } from './SettingsModal';
  import { tooltip } from '$lib/components/Tooltip.svelte';
  import { getInitPayload } from '$lib/init';

  let activeTab = $state<SettingsTabId>('general');

  let passwordForm = $state({ oldPassword: '', newPassword: '', confirmPassword: '' });
  let passwordStatus = $state('');

  function getFieldValue(field: SettingField) {
    if (field.scope === 'global') {
      return $globalConfig[field.key as keyof GlobalConfig];
    }
    return $userConfig[field.key as keyof UserConfig];
  }

  function setFieldValue(field: SettingField, value: unknown) {
    if (field.scope === 'global') {
      setGlobalSetting(field.key as keyof GlobalConfig, value as GlobalConfig[keyof GlobalConfig]);
      return;
    }
    setUserSetting(field.key as keyof UserConfig, value as UserConfig[keyof UserConfig]);
  }

  function toggleField(field: SettingField) {
    if (field.kind !== 'toggle') return;
    const current = Boolean(getFieldValue(field));
    setFieldValue(field, !current);
  }

  function onSelectFieldChange(field: SettingField, event: Event) {
    if (field.kind !== 'select') return;
    const target = event.currentTarget as HTMLSelectElement | null;
    if (!target) return;

    const firstOption = field.options[0]?.value;
    const parsedValue = typeof firstOption === 'number' ? Number(target.value) : target.value;
    setFieldValue(field, parsedValue);
  }

  function onRangeFieldChange(field: SettingField, event: Event) {
    if (field.kind !== 'range') return;
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target) return;
    setFieldValue(field, Number(target.value));
  }

  function clearCache(cacheType: 'location' | 'map' | 'locationColor') {
    setConfigValue(`cleared_${cacheType}_cache`, Date.now());
  }

  function submitPasswordChange(event: Event) {
    event.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      passwordStatus = 'Passwords do not match.';
      return;
    }
    passwordStatus = 'Password update request queued.';
    passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
  }

  async function onLanguageChange(event: Event) {
    const target = event.currentTarget as HTMLSelectElement | null;
    if (!target) return;

    const selectedLanguage = target.value as Locales;
    if (selectedLanguage === $locale) return;

    setConfigValue('lang', selectedLanguage);
  }

  const init = getInitPayload();

  const settingVisibilityOverrides = $derived({
    playBadgeHintSound: $userConfig.badgeHints,
    enableExplorer: init.gameId === '2kki',
    questionablePreloads: $globalConfig.preloads && init.gameId === '2kki'
  });
</script>

<Modal id="settingsModal" aria-label={$LL.ui.modal.settings.title()}>
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.settings.title()}</h1>
    <div class="modalTabsContainer settingsTabs" role="tablist" aria-label="Settings Tabs">
      {#each settingsTabs as tab}
        <button type="button" class="modalTab" role="tab" class:active={activeTab === tab.id} onclick={() => (activeTab = tab.id)}>
          <small class="modalTabLabel unselectable" role="presentation">{tab.label($LL)}</small>
        </button>
      {/each}
    </div>
  </div>
  <div class="modalContent">
    <ul class="formControls" hidden={activeTab === 'cache' || activeTab === 'account'}>
      <li class="formControlRow" class:hidden={activeTab !== 'general'}>
        <label for="lang">{$LL.ui.modal.settings.fields.lang()}</label>
        <select id="lang" name="lang" value={$locale} onchange={onLanguageChange}>
          {#each Object.entries(languageNames) as [locale, name]}
            <option value={locale}>{name}</option>
          {/each}
        </select>
      </li>
      {#each settingsFieldsByTab[activeTab] as field (field.name)}
        {#if (settingVisibilityOverrides[field.name as keyof typeof settingVisibilityOverrides] ?? true) !== false}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <div
            class={[
              'formControlRow',
              {
                indent: field.kind === 'toggle' ? field.indent : false,
                toggleRow: field.kind === 'toggle'
              }
            ]}
            role={field.kind === 'toggle' ? 'checkbox' : undefined}
            tabindex={field.kind === 'toggle' ? 0 : undefined}
            aria-checked={Boolean(getFieldValue(field))}
            aria-labelledby="{field.name}-label"
            onclick={() => field.kind === 'toggle' && toggleField(field)}
            onkeydown={ev => field.kind === 'toggle' && ev.key === 'Enter' && (ev.preventDefault(), toggleField(field))}
          >
            {#if field.kind === 'toggle'}
              <label for={field.name} class="unselectable" id="{field.name}-label">
                {field.label($LL)}
                {#if field.tooltip}
                  <span class="helpLink iconLink" {@attach tooltip(field.tooltip($LL))}>
                    <div class="helpIcon icon fillIcon invertFillIcon altIcon">
                      <svg viewBox="0 0 18 18">
                        <path
                          d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
                        />
                      </svg>
                    </div>
                  </span>
                {/if}
              </label>
              <button
                id={field.name}
                type="button"
                role="checkbox"
                tabindex="-1"
                name={field.name}
                aria-checked={Boolean(getFieldValue(field))}
                aria-label={field.ariaLabel ? field.ariaLabel($LL) : field.label($LL)}
                class="checkboxButton unselectable"
                class:inverseToggle={field.invert}
                class:toggled={Boolean(getFieldValue(field))}
              >
                <span role="presentation"></span>
              </button>
            {:else if field.kind === 'select'}
              <label for={field.name} class="unselectable">
                {field.label($LL)}
                {#if field.tooltip}
                  <span class="helpLink iconLink" {@attach tooltip(field.tooltip($LL))}>
                    <div class="helpIcon icon fillIcon invertFillIcon altIcon">
                      <svg viewBox="0 0 18 18">
                        <path
                          d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
                        />
                      </svg>
                    </div>
                  </span>
                {/if}
              </label>
              <select
                id={field.name}
                value={String(getFieldValue(field))}
                size={field.size}
                onchange={(event) => onSelectFieldChange(field, event)}
              >
                {#each field.options as option}
                  <option value={String(option.value)}>{option.label($LL)}</option>
                {/each}
              </select>
            {:else}
              <label for={field.name} class="unselectable">{field.label($LL)}</label>
              {#if field.tooltip}
                <span class="helpLink iconLink" title={field.tooltip($LL)}>
                  <div class="helpIcon icon fillIcon invertFillIcon altIcon">
                    <svg viewBox="0 0 18 18">
                      <path
                        d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25"
                      />
                    </svg>
                  </div>
                </span>
              {/if}
              <input
                id={field.name}
                name={field.name}
                type="range"
                min={String(field.min)}
                max={String(field.max)}
                step={field.step ? String(field.step) : undefined}
                value={String(getFieldValue(field))}
                class="slider"
                oninput={(event) => onRangeFieldChange(field, event)}
                onchange={(event) => onRangeFieldChange(field, event)}
              />
            {/if}
          </div>
        {/if}
      {/each}
    </ul>

    {#if activeTab === 'cache'}
      <ul class="formControls" style="overflow: visible">
        {#each cacheActions as action (action.type)}
          <li class="formControlRow">
            <span class="unselectable">{action.label($LL)}</span>
            <div>
              <button type="button" class="unselectable" onclick={() => clearCache(action.type)}>
                {action.actionLabel($LL)}
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

    {#if activeTab === 'account'}
      <div class="itemContainer">
        <ul class="formControls">
          <li class="formControlRow">
            <span class="unselectable">Blocked Players</span>
            <div>
              <span class="infoLabel">Blocklist management is coming with account API wiring.</span>
            </div>
          </li>
          <li class="formControlRow">
            <span class="unselectable">Change Password</span>
          </li>
        </ul>
        <form id="changePasswordForm" class="fullWidth" onsubmit={submitPasswordChange}>
          <ul class="formControls">
            <li class="formControlRow">
              <label for="oldPassword" class="unselectable">Old Password</label><input
                id="oldPassword"
                name="password"
                type="password"
                autocomplete="off"
                value={passwordForm.oldPassword}
                oninput={(event) =>
                  (passwordForm = { ...passwordForm, oldPassword: (event.currentTarget as HTMLInputElement).value })}
              />
            </li>
            <li class="formControlRow">
              <label for="newPassword" class="unselectable">New Password</label><input
                id="newPassword"
                name="newPassword"
                type="password"
                autocomplete="off"
                value={passwordForm.newPassword}
                oninput={(event) =>
                  (passwordForm = { ...passwordForm, newPassword: (event.currentTarget as HTMLInputElement).value })}
              />
            </li>
            <li class="formControlRow">
              <label for="newConfirmPassword" class="unselectable">Confirm New Password</label><input
                id="newConfirmPassword"
                type="password"
                autocomplete="off"
                value={passwordForm.confirmPassword}
                oninput={(event) =>
                  (passwordForm = {
                    ...passwordForm,
                    confirmPassword: (event.currentTarget as HTMLInputElement).value
                  })}
              />
            </li>
            {#if passwordStatus}
              <li class="formControlRow">
                <span>{passwordStatus}</span>
              </li>
            {/if}
          </ul>
          <button type="submit">Submit</button>
        </form>
      </div>
    {/if}
  </div>
</Modal>

<style>
  .settingsTabs {
    margin-top: 6px;
    margin-bottom: 0;
    flex-wrap: wrap;
    gap: 4px 6px;
  }

  .formControls {
    width: 100%;
  }

  .toggleRow {
    cursor: pointer;
    transition: background-color 120ms ease;
  }

  .toggleRow:hover {
    background-color: rgba(var(--alt-color), 0.14);
  }
</style>
