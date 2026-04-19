<script lang="ts">
  import { LL } from '$lib';
  import Modal from '$lib/components/Modal.svelte';
  import { modal } from '$lib/stores/modal';
  import { auth } from '$lib/stores/authStore';

  let username = $state('');
  let password = $state('');
  let error = $state('');

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    error = '';

    const form = event.currentTarget as HTMLFormElement;
    const result = await auth.handleLoginSubmit(new FormData(form));
    if (!result.ok) {
      error = $LL.messages.account.login.errors[result.errorKey]();
    }
  }

  function openRegisterModal() {
    error = '';
    modal.open('registerModal');
  }
</script>

<Modal aria-label={$LL.ui.modal.login.title()}>
  <div class="modalHeader">
    <h1 class="modalTitle">{$LL.ui.modal.login.title()}</h1>
  </div>
  <div class="modalContent">
    <form id="loginForm" onsubmit={handleSubmit}>
      <ul class="formControls">
        <li class="formControlRow">
          <label for="loginUsername" class="unselectable">{$LL.ui.modal.login.fields.username()}</label>
          <input id="loginUsername" name="user" type="text" autocomplete="off" maxlength="12" bind:value={username} />
        </li>
        <li class="formControlRow">
          <label for="loginPassword" class="unselectable">{$LL.ui.modal.login.fields.password()}</label>
          <input id="loginPassword" name="password" type="password" autocomplete="off" bind:value={password} />
        </li>
        <li id="loginErrorRow" class={['formControlRow', { hidden: !error }]}>
          <p id="loginError">{error}</p>
        </li>
      </ul>
      <button type="submit">{$LL.ui.modal.login.submit()}</button>
    </form>
  </div>
  <div class="modalFooter">
    <span class="infoLabel">{@html $LL.ui.modal.login.registerPrompt()}</span>
    <button id="loginRegisterLink" type="button" class="modalLink" onclick={openRegisterModal}>
      {$LL.ui.modal.login.register()}
    </button>
  </div>
</Modal>
