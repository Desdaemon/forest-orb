<script lang="ts">
  import { onMount } from 'svelte';
  import { getInfo, getSaveSyncTimestamp, type UserInfo } from '$lib/api';
  import { getInitPayload, inferGameId, inferGameName, gameNameMap, isBrowser } from '$lib/init';
  import { initEasyRpgEngine } from '$lib/play';
  import Header from '$lib/components/Header.svelte';
  import Controls from '$lib/components/Controls.svelte';
  import CanvasArea from '$lib/components/CanvasArea.svelte';
  import ChatBox from '$lib/components/ChatBox.svelte';
  import ThemeContainer from '$lib/components/ThemeContainer.svelte';
  import ModalContainer from '$lib/components/ModalContainer.svelte';
  import PendingLoader from '$lib/components/PendingLoader.svelte';
  import { modal } from '$lib/stores/modal';
  import { addLoader, loaderActive, removeLoader } from '$lib/stores/pendingLoader';
  import '$lib/config';
  import { initConfig } from '$lib/stores/config';

  import ToastContainer from '$lib/components/ToastContainer.svelte';
  import { initPushNotifications } from '$lib/pushNotifications';
  import { toast } from '$lib/stores/toast';
  import { onResize, updateCanvasFullscreenSize } from '$lib/canvasResize';

  let info: UserInfo | null = $state(null);
  let loading = $state(true);
  const loadingOverlayActive = loaderActive('loadingOverlay');

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
    if (!isBrowser) return;

    // Expose modal store globally for testing/debugging
    (window as any).__svelte_modal = modal;

    window.addEventListener('error', (event) => {
      if (event.error?.message?.includes('side-effect in debug-evaluate') && event.defaultPrevented) return;
      toast.system(`error: ${event.error?.message || event.message || event.error}`);
    });

    addLoader('loadingOverlay');
    const urlGame = new URLSearchParams(window.location.search).get('game');
    if (urlGame && urlGame in gameNameMap) {
      gameId = urlGame as keyof typeof gameNameMap;
    }
    isFirefox = window.navigator.userAgent.includes('Firefox');
    try {
      await initConfig(gameId);
      await initEasyRpgEngine();
      await loadData();
      initPushNotifications((message, icon, persist) => toast.show(message, icon, persist));
    } finally {
      removeLoader('loadingOverlay');
    }

    window.onresize = function () {
      setTimeout(onResize, 0);
    };
    document.addEventListener('fullscreenchange', updateCanvasFullscreenSize);

    setTimeout(onResize, 0);
  });

  function onToggleChat() {
    chatboxVisible = !chatboxVisible;
  }

  $effect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('browserFirefox', isFirefox);
    }
  });
</script>

<ThemeContainer {gameId}>
  <div id="root-wrapper" role="presentation">
    <div id="loadingOverlay" class={[{ loaded: !$loadingOverlayActive }]} role="presentation">
      <PendingLoader visible={$loadingOverlayActive} text="Loading..." />
    </div>
    <div id="background" role="presentation"></div>
    <div id="backgroundOverlay" role="presentation"></div>
    <ModalContainer>
      <div id="content" role="presentation">
        <div id="top" role="presentation"></div>
        <Header />
        <div id="layout" role="main">
          <div id="mainContainer" class="container" role="presentation">
            <div id="gameContainer" role="presentation">
              <Controls {onToggleChat} />
              <CanvasArea />
            </div>
          </div>
          <ChatBox show={chatboxVisible} />
        </div>
      </div>
    </ModalContainer>
    <ToastContainer />
  </div>
</ThemeContainer>

<style>
  #layout {
    min-height: 100vh;
  }
</style>
