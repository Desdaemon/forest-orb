import { getGameInitState } from './init';

const ignoreSizeChanged = false;

function getId(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function isOverflow(scale?: number): boolean {
  const gameContainer = getId('gameContainer');
  const layout = getId('layout');
  if (!gameContainer || !layout) return false;
  return (
    window.innerWidth < 984 &&
    window.innerHeight <= 594 &&
    (window.innerWidth <= 704 ||
      gameContainer.offsetWidth < 640 * (scale ?? 1) + (layout.classList.contains('overflow') ? 288 : 0))
  );
}

function updateChatboxInfo() {
  const layout = getId('layout');
  const chatboxContainer = getId('chatboxContainer');
  const chatboxInfo = getId('chatboxInfo');
  const chatboxTabs = document.getElementsByClassName('chatboxTab');
  const messages = getId('messages');
  const partyPlayerList = getId('partyPlayerList');

  if (!layout || !chatboxContainer || !chatboxInfo || !messages || !partyPlayerList || chatboxTabs.length === 0) return;

  const backgroundSize = chatboxContainer.classList.contains('fullBg')
    ? getComputedStyle(chatboxContainer).backgroundSize
    : null;
  const backgroundPositionY = `${chatboxContainer.offsetTop - partyPlayerList.getBoundingClientRect().top}px`;
  const hasFlexWrap = getComputedStyle(layout).flexWrap === 'wrap';
  const lastTab = chatboxTabs[chatboxTabs.length - 1] as HTMLElement;
  const lastTabOffset =
    (lastTab as HTMLElement).offsetRight !== undefined
      ? lastTab.offsetLeft + (lastTab as HTMLElement).offsetRight
      : lastTab.offsetLeft;

  for (let i = 0; i < chatboxTabs.length; i++) {
    const tab = chatboxTabs[i] as HTMLElement;
    tab.style.backgroundSize = backgroundSize ?? '';
    const posx = `${-8 + tab.parentElement!.offsetLeft - tab.getBoundingClientRect().left}px`;
    const posy = `${chatboxContainer.offsetTop - tab.parentElement!.getBoundingClientRect().top}px`;
    tab.style.backgroundPositionX = posx;
    tab.style.backgroundPositionY = posy;
  }

  messages.style.backgroundPositionY = partyPlayerList.style.backgroundPositionY = backgroundPositionY;
  if (!layout.classList.contains('immersionMode') && !document.fullscreenElement && hasFlexWrap) {
    const offsetLeft = `${lastTabOffset - 24}px`;
    chatboxInfo.style.marginInlineStart = offsetLeft;
    chatboxInfo.style.marginBottom = '-32px';
    if (chatboxInfo.offsetHeight >= 72) {
      chatboxInfo.setAttribute('style', '');
    }
  } else {
    chatboxInfo.setAttribute('style', '');
  }
}

function updateCanvasOverlays() {
  const contentElement = getId('content');
  const canvasElement = getId('canvas');
  const gameChatContainer = getId('gameChatContainer');
  const locationDisplayContainer = getId('locationDisplayContainer');

  if (!contentElement || !canvasElement || !gameChatContainer || !locationDisplayContainer) return;

  if (document.fullscreenElement) {
    const canvasRect = canvasElement.getBoundingClientRect();
    gameChatContainer.style.top = locationDisplayContainer.style.top = `${canvasRect.y}px`;
    gameChatContainer.style.left = locationDisplayContainer.style.left = `${canvasRect.x}px`;
  } else {
    gameChatContainer.style.top =
      locationDisplayContainer.style.top = `${canvasElement.offsetTop - contentElement.scrollTop}px`;
    gameChatContainer.style.left = locationDisplayContainer.style.left = `${canvasElement.offsetLeft}px`;
  }

  let mapChatWidth = canvasElement.offsetWidth;
  let mapChatHeight = canvasElement.offsetHeight / 2;

  if (!document.fullscreenElement && contentElement.classList.contains('downscale')) {
    if (contentElement.classList.contains('downscale2')) {
      mapChatWidth *= 2;
      mapChatHeight *= 2;
    } else {
      mapChatWidth *= 1 / 0.75;
      mapChatHeight *= 1 / 0.75;
    }
  }

  locationDisplayContainer.style.maxWidth = `${canvasElement.offsetWidth}px`;
  gameChatContainer.style.width = `${mapChatWidth}px`;
  gameChatContainer.style.height = `${mapChatHeight}px`;
  gameChatContainer.style.marginTop = `calc(${canvasElement.offsetHeight / 2}px * var(--canvas-scale))`;
}

function updateYnomojiContainerPos() {
  const chatInput = getId('chatInput');
  const chatboxContainer = getId('chatboxContainer');
  const ynomojiContainer = getId('ynomojiContainer');
  const layout = getId('layout');
  const messages = getId('messages');

  if (!chatInput || !chatboxContainer || !ynomojiContainer || !layout || !messages) return;

  const expandDown = chatInput.dataset.ynomoji === 'expandDown';
  const hasTouchscreen = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isFullscreen = document.fullscreenElement;
  const isWrapped = getComputedStyle(layout).flexWrap === 'wrap';
  const content = getId('content');
  const isDownscale2 = content?.classList.contains('downscale2') ?? false;
  const isFullscreenSide = isFullscreen && (window.innerWidth > 1050 || window.innerHeight < 595);

  if (expandDown) {
    ynomojiContainer.style.removeProperty('bottom');
    ynomojiContainer.style.top = `${chatInput.offsetTop + chatInput.offsetHeight + 2}px`;
  } else {
    ynomojiContainer.style.removeProperty('top');
    if (hasTouchscreen && ((isWrapped && isDownscale2) || isFullscreenSide)) {
      ynomojiContainer.style.bottom = `calc((100% - ${chatInput.offsetTop}px) + max(${isFullscreen ? 6 : 1}rem + 2 * var(--controls-size) - (100% - ${chatInput.offsetTop}px - ${isFullscreen && !isFullscreenSide ? `(${chatboxContainer.style.marginTop} - 24px)` : '0px'}) - var(--content-scroll), 0px))`;
    } else {
      ynomojiContainer.style.bottom = `calc(100% - ${chatInput.offsetTop}px)`;
    }
  }

  if (hasTouchscreen && ((isWrapped && isDownscale2) || isFullscreenSide)) {
    ynomojiContainer.style.maxHeight = `calc(${messages.offsetHeight - 16}px - max(${isFullscreen ? 6 : 1}rem + 2 * var(--controls-size) - (100% - ${chatInput.offsetTop}px - ${isFullscreen && !isFullscreenSide ? `(${chatboxContainer.style.marginTop} - 24px)` : '0px'}) - var(--content-scroll), 0px))`;
  } else {
    ynomojiContainer.style.maxHeight = `${messages.offsetHeight - 16}px`;
  }

  ynomojiContainer.style.width =
    hasTouchscreen && isWrapped && !isDownscale2
      ? `calc(${chatInput.offsetWidth - 24} - 4 * var(--controls-size))`
      : `${chatInput.offsetWidth - 24}px`;

  if (hasTouchscreen && isWrapped && !isDownscale2) {
    ynomojiContainer.style.margin = `0 calc(2 * var(--controls-size) + ${layout.offsetLeft * 2 + 4}px) 9px calc(2 * var(--controls-size) - ${layout.offsetLeft * 2 - 4}px)`;
  } else {
    ynomojiContainer.style.margin = '';
  }
}

export function updateCanvasFullscreenSize() {
  const contentElement = getId('content');
  const layoutElement = getId('layout');
  const canvasElement = getId('canvas');
  const canvasContainerElement = getId('canvasContainer');
  const chatboxContainerElement = getId('chatboxContainer');
  const messages = getId('messages');

  if (
    !contentElement ||
    !layoutElement ||
    !canvasElement ||
    !canvasContainerElement ||
    !chatboxContainerElement ||
    !messages
  )
    return;

  let canvasContainerPaddingRight: string | null = null;
  let canvasContainerMarginTop: string | null = null;
  let chatboxContainerMarginTop: string | null = null;
  let chatboxHeight: string | null = null;
  let chatboxOverlap = false;
  let leftControlsMaxHeight: string | null = null;

  if (document.fullscreenElement) {
    const showChat = !layoutElement.classList.contains('hideChat');
    const { gameId } = getGameInitState();
    const showExplorer =
      gameId === '2kki' &&
      contentElement.classList.contains('loggedIn') &&
      layoutElement.classList.contains('explorer');
    let scaleX = window.innerWidth / canvasElement.offsetWidth;
    let scaleY = window.innerHeight / canvasElement.offsetHeight;
    const scaleFraction = contentElement.classList.contains('downscale') ? 0.25 : 0.5;
    scaleX -= scaleX % scaleFraction;
    scaleY -= scaleY % scaleFraction;
    const scale = Math.max(Math.min(scaleX, scaleY), 0.5);
    canvasElement.style.transform = `scale(${scale})`;
    document.documentElement.style.setProperty('--canvas-scale', String(scale));

    if (window.innerWidth > 1050 || window.innerHeight < 595) {
      const chatboxContainerWidth = chatboxContainerElement.offsetWidth - 24;
      chatboxContainerMarginTop = '24px';
      const freeWidth = window.innerWidth - canvasElement.offsetWidth * scale - chatboxContainerWidth;
      if (freeWidth >= 16) {
        if (showChat) {
          const flushedWidth = freeWidth <= 48 ? freeWidth : 0;
          canvasContainerPaddingRight = `${chatboxContainerWidth + flushedWidth}px`;
          leftControlsMaxHeight = `${canvasElement.offsetHeight * scale}px`;
        }
      } else {
        chatboxOverlap = true;
      }
    } else {
      const canvasScaledHeight = canvasElement.offsetHeight * scale;
      const unusedHeight = window.innerHeight - (canvasScaledHeight + 32);
      let chatboxActualHeight = unusedHeight;
      if (showExplorer) {
        const explorerFrame = getId('explorerFrame');
        if (explorerFrame) {
          chatboxActualHeight -= explorerFrame.offsetHeight + 12;
        }
      }
      if (unusedHeight >= 376 && showChat) {
        canvasContainerMarginTop = `-${(window.innerHeight - canvasScaledHeight) / 2}px`;
        chatboxContainerMarginTop = `${window.innerHeight - unusedHeight - 40}px`;
        chatboxHeight = `${chatboxActualHeight}px`;
        leftControlsMaxHeight = `${canvasScaledHeight}px`;
      } else {
        chatboxContainerMarginTop = '24px';
        if (showChat) {
          chatboxOverlap = true;
        }
      }
    }
  } else {
    canvasElement.style.transform = '';
    document.documentElement.style.setProperty('--canvas-scale', '1');
    leftControlsMaxHeight = `${canvasElement.offsetHeight}px`;
  }

  canvasContainerElement.style.paddingInlineEnd = canvasContainerPaddingRight ?? '';
  canvasContainerElement.style.marginTop = canvasContainerMarginTop ?? '';
  chatboxContainerElement.style.marginTop = chatboxContainerMarginTop ?? '';
  layoutElement.classList.toggle('chatboxOverlap', chatboxOverlap);

  const chatbox = getId('chatbox');
  if (chatbox) {
    chatbox.style.height = chatboxHeight || '';
  }

  const leftControls = getId('leftControls');
  if (leftControls) {
    leftControls.style.maxHeight = leftControlsMaxHeight || '';
  }

  messages.scrollTop = messages.scrollHeight;

  updateYnomojiContainerPos();
  updateCanvasOverlays();
}

export function onResize() {
  if (ignoreSizeChanged) return;

  const content = getId('content');
  const layout = getId('layout');
  if (!content || !layout) return;

  const downscale = window.innerWidth < 704 || window.innerHeight < 577;
  const downscale2 = window.innerWidth < 544 || window.innerHeight < 457;

  content.classList.toggle('noSideBorders', window.innerWidth < 384);

  updateChatboxInfo();

  const bottom = getId('bottom');
  if (bottom) {
    document.documentElement.style.setProperty('--content-height', `${bottom.offsetTop}px`);
  }

  if (window.innerWidth < window.innerHeight) {
    content.classList.toggle('downscale', downscale);
    content.classList.toggle('downscale2', downscale2);
    layout.classList.toggle('overflow', isOverflow(downscale2 ? 0.5 : downscale ? 0.75 : 1));
  } else {
    layout.classList.add('overflow');
    const overflow = isOverflow();
    if (overflow !== isOverflow(0.75)) {
      content.classList.toggle('downscale', downscale || overflow);
      content.classList.remove('downscale2');
      layout.classList.toggle('overflow', !overflow);
    } else if (overflow !== isOverflow(0.5)) {
      content.classList.toggle('downscale', downscale || overflow);
      content.classList.toggle('downscale2', downscale2 || overflow);
      layout.classList.toggle('overflow', !overflow);
    } else {
      content.classList.toggle('downscale', downscale);
      content.classList.toggle('downscale2', downscale2);
      layout.classList.toggle('overflow', overflow);
    }
  }

  const { gameId } = getGameInitState();
  if (gameId === '2kki' && content.classList.contains('loggedIn') && layout.classList.contains('explorer')) {
    const explorerContainer = getId('explorerContainer');
    const explorerParent =
      window.innerWidth >= 1051 && window.innerHeight >= 1000 && !document.fullscreenElement
        ? getId('mainContainer')
        : getId('chatboxContainer');
    if (explorerContainer && explorerParent && explorerContainer.parentElement !== explorerParent) {
      explorerParent.appendChild(explorerContainer);
    }
  }

  updateCanvasFullscreenSize();
}
