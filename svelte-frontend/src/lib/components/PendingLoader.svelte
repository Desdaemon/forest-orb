<script lang="ts">
  import { loaderSprite } from '$lib/stores/loaderSprite';

  const frameIndexes = [1, 0, 1, 2] as const;

  const {
    visible = false,
    text = 'Loading...'
  }: {
    visible?: boolean;
    text?: string;
  } = $props();

  let frameStep = $state(0);

  const spriteState = $derived($loaderSprite);
  const spriteFrame = $derived(frameIndexes[frameStep]);
  const currentFrameSrc = $derived(spriteState.frameSrcs[spriteFrame] ?? spriteState.spriteSheetSrc);
  const currentFrameProcessed = $derived(!!spriteState.frameSrcs[spriteFrame]);
  const spriteOffsetX = $derived((spriteState.idx % 4) * 72 + 24 * spriteFrame);
  const spriteOffsetY = $derived(Math.floor(spriteState.idx / 4) * 128 + 64);

  $effect(() => {
    if (!visible) {
      frameStep = 0;
      return;
    }

    frameStep = 0;
    const timer = window.setInterval(() => {
      frameStep = (frameStep + 1) % frameIndexes.length;
    }, 150);

    return () => window.clearInterval(timer);
  });
</script>

{#if visible}
  <div class="loader visible" role="status" aria-live="polite" aria-label={text}>
    <div class="pendingLoaderBody">
      <div class="pendingLoaderSpriteShell" aria-hidden="true">
        <div class="pendingLoaderSpriteFrame">
          {#if currentFrameProcessed}
            <img class="pendingLoaderSpriteImage" src={currentFrameSrc} alt="" draggable="false" />
          {:else}
            <img
              class="pendingLoaderSpriteSheet"
              src={currentFrameSrc}
              alt=""
              draggable="false"
              style="left: -{spriteOffsetX}px; top: -{spriteOffsetY}px;"
            />
          {/if}
        </div>
      </div>
      <span class="themeText pendingLoaderLabel">{text}</span>
    </div>
  </div>
{/if}

<style>
  .loader {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .pendingLoaderBody {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .pendingLoaderSpriteShell {
    width: 96px;
    height: 128px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pendingLoaderSpriteFrame {
    position: relative;
    width: 24px;
    height: 32px;
    overflow: hidden;
    transform: scale(4);
    transform-origin: center;
  }

  .pendingLoaderSpriteSheet {
    position: absolute;
    display: block;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    user-select: none;
    max-width: none;
  }

  .pendingLoaderSpriteImage {
    width: 24px;
    height: 32px;
    display: block;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    user-select: none;
  }

  .pendingLoaderLabel {
    font-size: 14px;
  }
</style>
