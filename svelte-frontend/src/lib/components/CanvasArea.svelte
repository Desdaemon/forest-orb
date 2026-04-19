<script lang="ts">
  import { onMount } from 'svelte';

  let hasTouchscreen = $state(false);
  onMount(() => {
    hasTouchscreen = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  });
</script>

<div id="canvasContainer">
  <div id="crashFix"></div>
  <canvas id="canvas" tabindex="-1"></canvas>
</div>

<div id="gameChatContainer" class="hidden">
  <div id="gameChatInputContainer" class="gameChatMessageContainer">
    <div class="gameChatMessage message">
      <div class="messageContents">
        >&nbsp;<span id="gameChatModeIcon"></span>
        <div class="globalCooldownIcon icon hidden">
          <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
            <circle class="bgCircle" cx="9" cy="9" r="9" /><circle class="timerCircle" cx="9" cy="9" r="9" />
          </svg>
        </div>
        <span id="gameChatInput" contenteditable="true"></span>
      </div>
    </div>
  </div>
</div>

<div id="locationDisplayContainer" class="unselectable">
  <div id="locationDisplayLabelContainer"><span id="locationDisplayLabel"></span></div>
  <div id="locationDisplayLabelContainerOverlay"></div>
  <span id="locationDisplayLabelOverlay"></span>
</div>

<div id="dpad" class={['unselectable', { hidden: !hasTouchscreen }]}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" class="baseColorFill">
    <path
      id="dpad-up"
      data-key="ArrowUp"
      data-key-code="38"
      d="M48,5.8C48,2.5,45.4,0,42,0H29.9C26.6,0,24,2.4,24,5.8V24h24V5.8z"
    />
    <path
      id="dpad-right"
      data-key="ArrowRight"
      data-key-code="39"
      d="M66.2,24H48v24h18.2c3.3,0,5.8-2.7,5.8-6V29.9C72,26.5,69.5,24,66.2,24z"
    />
    <path
      id="dpad-down"
      data-key="ArrowDown"
      data-key-code="40"
      d="M24,66.3c0,3.3,2.6,5.7,5.9,5.7H42c3.3,0,6-2.4,6-5.7V48H24V66.3z"
    />
    <path
      id="dpad-left"
      data-key="ArrowLeft"
      data-key-code="37"
      d="M5.7,24C2.4,24,0,26.5,0,29.9V42c0,3.3,2.3,6,5.7,6H24V24H5.7z"
    />
    <rect id="dpad-center" x="24" y="24" width="24" height="24" />
  </svg>
</div>

<div id="apad" class={['unselectable', { hidden: !hasTouchscreen }]}>
  <div id="apad-escape" class="baseColorBg apadCircBtn apadBtn" data-key="Escape" data-key-code="27"></div>
  <div id="apad-enter" class="baseColorBg apadCircBtn apadBtn" data-key="Enter" data-key-code="13"></div>
</div>

<div id="joystick" class={['unselectable', { hidden: !hasTouchscreen }]}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" class="baseColorFill hidden" data-style="joystick">
    <defs>
      <mask id="joystickInset">
        <rect width="100%" height="100%" fill="white" />
        <circle id="insetCircle" cx="25" cy="25" r="20" fill="black" />
      </mask>
    </defs>
    <circle id="joystickCircle" cx="25" cy="25" r="25" mask="url(#joystickInset)" />
  </svg>
</div>
