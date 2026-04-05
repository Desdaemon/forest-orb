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
  } from '$lib/settingsSchema';
  import { locale } from '../../i18n/i18n-svelte';
  import type { Locales } from '../../i18n/i18n-types';
  import { languageNames } from './SettingsModal';

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
</script>

<Modal id="settingsModal" aria-label="Settings">
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.settings.title()}</h1>
    <div class="subTabs settingsTabs">
      {#each settingsTabs as tab}
        <button type="button" class="subTab" class:active={activeTab === tab.id} onclick={() => (activeTab = tab.id)}>
          <small class="subTabLabel infoLabel unselectable">{tab.label($LL)}</small>
          <div class="subTabBg"></div>
        </button>
      {/each}
    </div>
  </div>
  <div class="modalContent">
    <ul class="formControls" hidden={activeTab !== 'general'}>
      <li class="formControlRow">
        <label for="lang">{$LL.ui.modal.settings.fields.lang()}</label>
        <select id="lang" name="lang" value={$locale} onchange={onLanguageChange}>
          {#each Object.entries(languageNames) as [locale, name]}
            <option value={locale}>{name}</option>
          {/each}
        </select>
      </li>
    </ul>

    <ul class="formControls" hidden={activeTab === 'cache' || activeTab === 'account'}>
      {#each settingsFieldsByTab[activeTab] as field (field.name)}
        <li class="formControlRow" class:indent={field.kind === 'toggle' ? field.indent : false}>
          {#if field.kind === 'toggle'}
            <span class="unselectable">{field.label($LL)}</span>
            <div>
              <button
                type="button"
                aria-label={field.ariaLabel ? field.ariaLabel($LL) : field.label($LL)}
                class="checkboxButton unselectable"
                class:inverseToggle={field.invert}
                class:toggled={field.invert ? !Boolean(getFieldValue(field)) : Boolean(getFieldValue(field))}
                onclick={() => toggleField(field)}><span></span></button
              >
            </div>
          {:else}
            <label for={field.name} class="unselectable">{field.label($LL)}</label>
            <div>
              <select
                name={field.name}
                value={String(getFieldValue(field))}
                size={field.size}
                onchange={(event) => onSelectFieldChange(field, event)}
              >
                {#each field.options as option}
                  <option value={String(option.value)}>{option.label($LL)}</option>
                {/each}
              </select>
            </div>
          {/if}
        </li>
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

  .settingsTabs .subTab {
    max-width: 100%;
  }

  .formControls {
    width: 100%;
  }
</style>
