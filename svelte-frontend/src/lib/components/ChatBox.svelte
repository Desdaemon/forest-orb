<script lang="ts">
  const { show = false } = $props<{ show?: boolean }>();
</script>

{#if show}
  <div id="chatboxContainer" class="container">
    <div id="chatbox" class="allChat">
      <div id="chatboxInfo">
        <div id="onlineInfo" class="info hidden">
          <span id="connStatus" class="infoContainer unselectable"
            ><span id="connStatusIcon" class="punct">●</span><span id="connStatusText" class="infoText"
              >Disconnected</span
            ></span
          >
        </div>
        <div id="location" class="info hidden">
          <span id="locationLabel" class="infoLabel nowrap" data-i18n="[html]chatbox.location">Location:&nbsp;</span
          ><span id="locationText" class="infoText nofilter"></span>
        </div>
      </div>
      <div id="chatboxContent">
        <div id="chatboxTabs">
          <div id="chatboxTabChat" class="chatboxTab active" data-tab-section="chat">
            <span class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.chat">Chat</span>
          </div>
          <div id="chatboxTabPlayers" class="chatboxTab" data-tab-section="players">
            <span class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.players">Players</span>
          </div>
          <div id="chatboxTabParties" class="chatboxTab" data-tab-section="parties">
            <span class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.parties">Parties</span>
          </div>
        </div>
        <div id="chat" class="chatboxTabSection">
          <div id="messages" class="chatboxTabContent scrollableContainer"></div>
        </div>
        <div id="players" class="chatboxTabSection hidden">
          <div id="playerList" class="playerList chatboxTabContent scrollableContainer"></div>
        </div>
        <div id="parties" class="chatboxTabSection hidden">
          <div id="partyList" class="partyList chatboxTabContent scrollableContainer"></div>
        </div>
      </div>
      <div id="chatInputContainer">
        <form action="javascript:void(0)">
          <input id="chatInput" type="text" autocomplete="off" maxlength="150" placeholder="Type a message..." />
        </form>
      </div>
      <div id="enterNameContainer"></div>
    </div>
  </div>
{/if}
