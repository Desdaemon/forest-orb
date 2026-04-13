<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
  import { modal } from '$lib/stores/modal';
  import { auth } from '$lib/stores/authStore';

  let username = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let error = $state('');

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    error = '';

    if (password !== confirmPassword) {
      error = $LL.messages.account.register.errors.confirmPasswordMismatch();
      return;
    }

    const form = event.currentTarget as HTMLFormElement;
    const result = await auth.handleRegisterSubmit(new FormData(form));
    if (!result.ok) {
      error = $LL.messages.account.register.errors[result.errorKey]();
    }
  }

  function openLoginModal() {
    error = '';
    modal.open('loginModal', {}, 'registerModal');
  }
</script>

<Modal aria-label={$LL.ui.modal.register.title()}>
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.register.title()}</h1>
  </div>
  <div class="modalContent">
    <form id="registerForm" onsubmit={handleSubmit}>
      <ul class="formControls">
        <li class="formControlRow">
          <label for="registerUsername" class="unselectable">{$LL.ui.modal.register.fields.username()}</label>
          <input
            id="registerUsername"
            name="user"
            type="text"
            autocomplete="off"
            maxlength="12"
            bind:value={username}
          />
        </li>
        <li class="formControlRow">
          <label for="registerPassword" class="unselectable">{$LL.ui.modal.register.fields.password()}</label>
          <input
            id="registerPassword"
            name="password"
            type="password"
            autocomplete="off"
            maxlength="72"
            bind:value={password}
          />
        </li>
        <li class="formControlRow">
          <label for="registerConfirmPassword" class="unselectable"
            >{$LL.ui.modal.register.fields.confirmPassword()}</label
          >
          <input
            id="registerConfirmPassword"
            type="password"
            autocomplete="off"
            maxlength="72"
            bind:value={confirmPassword}
          />
        </li>
        <li id="registerErrorRow" class="formControlRow" class:hidden={!error}>
          <p id="registerError">{error}</p>
        </li>
      </ul>
      <button type="submit">{$LL.ui.modal.register.submit()}</button>
    </form>
  </div>
  <div class="modalFooter">
    <span class="infoLabel">{@html $LL.ui.modal.register.loginPrompt()}</span>
    <button type="button" class="modalLink" onclick={openLoginModal}>
      {$LL.ui.modal.register.login()}
    </button>
  </div>
</Modal>
