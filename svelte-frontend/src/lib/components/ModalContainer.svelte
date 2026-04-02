<script lang="ts">
    import { modal, type ModalId } from "$lib/modalStore";
    import { onDestroy } from "svelte";
    import SchedulesModal from "$lib/components/modals/SchedulesModal.svelte";
    import LocationsModal from "$lib/components/modals/LocationsModal.svelte";
    import CommunityScreenshotsModal from "$lib/components/modals/CommunityScreenshotsModal.svelte";
    import RankingsModal from "$lib/components/modals/RankingsModal.svelte";
    import BadgesModal from "$lib/components/modals/BadgesModal.svelte";

    let activeModal = $state<ModalId | null>(null);
    let modalData = $state<Record<string, any>>({});
    let open = $state(false);

    const unsubscribe = modal.subscribe((state) => {
        activeModal = state.activeModal;
        modalData = state.modalData || {};
        open = state.open;
    });

    onDestroy(() => {
        unsubscribe();
    });

    function closeModalHandler() {
        modal.close();
    }
</script>

<div class="modalContainer" class:hidden={!open}>
    <div class="modalOverlay" role="button" tabindex="0" onclick={closeModalHandler} onkeydown={event => { if (event.key === "Enter" || event.key === " ") closeModalHandler(); }}></div>

    {#if activeModal === "schedulesModal"}
        <SchedulesModal />
    {/if}
    {#if activeModal === "locationsModal"}
        <LocationsModal />
    {/if}
    {#if activeModal === "communityScreenshotsModal"}
        <CommunityScreenshotsModal />
    {/if}
    {#if activeModal === "rankingsModal"}
        <RankingsModal />
    {/if}
    {#if activeModal === "badgesModal"}
        <BadgesModal />
    {/if}

    <!-- Recreated modals from index.php -->
    <div id="loginModal" class="modal" class:hidden={activeModal !== "loginModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Login</h1></div>
        <div class="modalContent">
            <form id="loginForm" onsubmit={e => { e.preventDefault(); console.log("login submit"); }}> 
                <ul class="formControls">
                    <li class="formControlRow">
                        <label for="loginUsername">Username</label>
                        <input id="loginUsername" name="user" type="text" autocomplete="off" maxlength="12" />
                    </li>
                    <li class="formControlRow">
                        <label for="loginPassword">Password</label>
                        <input id="loginPassword" name="password" type="password" autocomplete="off" />
                    </li>
                </ul>
                <button type="submit">Submit</button>
            </form>
        </div>
        <div class="modalFooter">
            <span class="infoLabel">Don't have an account? </span>
            <button type="button" class="modalLink" onclick={() => modal.open('registerModal', {}, 'loginModal')} >Register</button>
        </div>
    </div>

    <div id="registerModal" class="modal" class:hidden={activeModal !== "registerModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Register</h1></div>
        <div class="modalContent">
            <form id="registerForm" onsubmit={e => { e.preventDefault(); console.log("register submit"); }}> 
                <ul class="formControls">
                    <li class="formControlRow">
                        <label for="registerUsername">Username</label>
                        <input id="registerUsername" name="user" type="text" autocomplete="off" maxlength="12" />
                    </li>
                    <li class="formControlRow">
                        <label for="registerPassword">Password</label>
                        <input id="registerPassword" name="password" type="password" autocomplete="off" maxlength="72" />
                    </li>
                    <li class="formControlRow">
                        <label for="registerConfirmPassword">Confirm Password</label>
                        <input id="registerConfirmPassword" type="password" autocomplete="off" maxlength="72" />
                    </li>
                </ul>
                <button type="submit">Submit</button>
            </form>
        </div>
        <div class="modalFooter">
            <span class="infoLabel">Already have an account? </span>
            <button type="button" class="modalLink" onclick={() => modal.open('loginModal', {}, 'registerModal')} >Login</button>
        </div>
    </div>

    <div id="settingsModal" class="modal" class:hidden={activeModal !== "settingsModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Settings</h1></div>
        <div class="modalContent">
            <ul class="formControls">
                <li class="formControlRow">
                    <label for="lang">Language</label>
                    <select id="lang" name="lang"><option value="en">English</option></select>
                </li>
                <li class="formControlRow">
                    <label for="soundVolume">Sound Volume</label>
                    <input id="soundVolume" type="range" min="0" max="100" />
                </li>
            </ul>
        </div>
    </div>

    <div id="blocklistModal" class="modal" class:hidden={activeModal !== "blocklistModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Blocklist</h1></div>
        <div class="modalContent">
            <span id="blocklistModalEmptyLabel" class="infoLabel">Your blocklist is currently empty</span>
            <div id="blocklistModalPlayerListContainer" class="scrollableContainer">
                <div id="blocklistModalPlayerList" class="playerList"></div>
            </div>
        </div>
    </div>

    <!-- Placeholders / copy of other modal structure -->
    <div id="chatSettingsModal" class="modal" class:hidden={activeModal !== "chatSettingsModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Chat Settings</h1></div>
        <div class="modalContent">
            <p>Chat settings form goes here.</p>
        </div>
    </div>

    <div id="screenshotSettingsModal" class="modal" class:hidden={activeModal !== "screenshotSettingsModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Screenshot Settings</h1></div>
        <div class="modalContent">
            <p>Screenshot settings form goes here.</p>
        </div>
    </div>

    <div id="notificationSettingsModal" class="modal" class:hidden={activeModal !== "notificationSettingsModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Notification Settings</h1></div>
        <div class="modalContent">
            <p>Notification settings form goes here.</p>
        </div>
    </div>

    <div id="cacheSettingsModal" class="modal" class:hidden={activeModal !== "cacheSettingsModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Cache Settings</h1></div>
        <div class="modalContent">
            <p>Cache controls go here.</p>
        </div>
    </div>

    <div id="accountSettingsModal" class="modal" class:hidden={activeModal !== "accountSettingsModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Account Settings</h1></div>
        <div class="modalContent">
            <p>Account settings form goes here.</p>
        </div>
    </div>

    <div id="confirmModal" class="modal" class:hidden={activeModal !== "confirmModal"}>
        <button type="button" class="modalClose" onclick={closeModalHandler} aria-label="Close modal">✖</button>
        <div class="modalHeader"><h1 class="modalTitle">Confirm</h1></div>
        <div class="modalContent">
            <p>{modalData.message || "Are you sure?"}</p>
        </div>
        <div class="modalFooter">
            <button type="button" onclick={() => {
                modalData.onOk?.();
                closeModalHandler();
            }}>
                OK
            </button>
            <button type="button" onclick={() => {
                modalData.onCancel?.();
                closeModalHandler();
            }}>
                Cancel
            </button>
        </div>
    </div>
</div>
