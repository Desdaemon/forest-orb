<script lang="ts">
  import { onMount } from 'svelte';
  import { getInfo, getSaveSyncTimestamp, type UserInfo } from '$lib/api';
  import { getInitPayload, inferGameId, inferGameName, gameNameMap } from '$lib/init';
  import { setPlayerName, initEasyRpgEngine } from '$lib/play';
  import Header from '$lib/components/Header.svelte';
  import Controls from '$lib/components/Controls.svelte';
  import CanvasArea from '$lib/components/CanvasArea.svelte';
  import ChatBox from '$lib/components/ChatBox.svelte';
  import ThemeContainer from '$lib/components/ThemeContainer.svelte';
  import ModalContainer from '$lib/components/ModalContainer.svelte';
  import { modal, type ModalId } from '$lib/stores/modal';
  import '$lib/config';
  import { initConfig } from '$lib/stores/config';
  import Tooltip from '$lib/components/Tooltip.svelte';

  let info: UserInfo | null = $state(null);
  let loading = $state(true);
  let playerName = $state('');

  // --- Login Modal State and Handlers ---
  let loginUsername = $state('');
  let loginPassword = $state('');
  let loginError = $state('');

  async function handleLogin(event: Event) {
    event.preventDefault();
    loginError = '';
    // NOTE: This is a MOCK. Replace this block with your actual API call that resolves the user info/state.
    console.log('Attempting login for:', loginUsername);

    if (loginUsername && loginPassword) {
      // Mock success: Assume successful login sets the info state and closes the modal
      info = { /* mock user info object */ };
      await loadData(); // Re-fetch/update data after successful login
      modal.close();
    } else {
      loginError = 'Please enter both a username and password.';
    }
  }

  // Function to open the login modal and reset form state
  function openLoginModal() {
    modal.open('loginModal');
    loginUsername = '';
    loginPassword = '';
    loginError = '';
  }

  const init = getInitPayload();
  let gameId = $state(inferGameId(init));
  // let canvasEl = $state<HTMLCanvasElement | undefined>();

  let chatboxVisible = $state(true);
  let isFirefox = $state(false);

  async function loadData() {
    loading = true;
    try {
      info = await getInfo();
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    if (typeof window !== 'undefined') {
      const urlGame = new URLSearchParams(window.location.search).get('game');
      if (urlGame && urlGame in gameNameMap) {
        gameId = urlGame as keyof typeof gameNameMap;
      }
      isFirefox = window.navigator.userAgent.includes('Firefox');
    }
    await initConfig(gameId);

    await initEasyRpgEngine();
    loadData();
  });

  function onToggleChat() {
    chatboxVisible = !chatboxVisible;
  }

  function openModal(modalId: string) {
    modal.open(modalId as ModalId);
  }

  $effect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('browserFirefox', isFirefox);
    }
  });
</script>

<ThemeContainer {gameId}>
  <div id="root-wrapper" role="presentation">
    <div id="background" role="presentation"></div>
    <div id="backgroundOverlay" role="presentation"></div>
    <ModalContainer>
      <div id="content" role="presentation">
        <div id="top" role="presentation"></div>
        <Header onOpenModal={openModal} />
        <div id="layout" role="main">
          <div id="mainContainer" class="container" role="presentation">
            <div id="gameContainer" role="presentation">
              <Controls {onToggleChat} onOpenModal={openModal} />
              <CanvasArea />
            </div>
          </div>
          <ChatBox show={chatboxVisible} />
          <Tooltip />
        </div>
      </div>
    </ModalContainer>
  </div>
</ThemeContainer>

<style>
  #layout {
    min-height: 100vh;
  }
</style>
