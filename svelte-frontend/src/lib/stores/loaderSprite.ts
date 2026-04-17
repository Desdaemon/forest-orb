import { browser } from '$app/environment';
import { registerEngineAPIHandler } from '$lib/engineApi';
import { getGameInitState, type GameId } from '$lib/init';
import { writable } from 'svelte/store';

type LoaderFrameIndex = 0 | 1 | 2;

type LoaderSpriteState = {
  gameId: GameId;
  sprite: string;
  idx: number;
  spriteSheetSrc: string;
  frameSrcs: Partial<Record<LoaderFrameIndex, string>>;
};

type SpriteSpec = {
  sprite: string;
  idx?: number;
};

const defaultLoaderSprites: Record<GameId, SpriteSpec> = {
  '2kki': { sprite: 'syujinkou1' },
  amillusion: { sprite: 'parapluie ', idx: 1 },
  braingirl: { sprite: 'mikan2' },
  unconscious: { sprite: 'protag_main_01' },
  deepdreams: { sprite: 'main' },
  flow: { sprite: 'sabituki' },
  fog: { sprite: 'FOG_leon' },
  genie: { sprite: 'syujinkou1' },
  if: { sprite: 'syujinkou' },
  mikan: { sprite: 'syuzinkou_01' },
  muma: { sprite: 'muma1' },
  nostalgic: { sprite: 'syujinkou' },
  oversomnia: { sprite: 'player-01' },
  oneshot: { sprite: 'niko1', idx: 4 },
  prayers: { sprite: 'Flourette' },
  sheawaits: { sprite: 'sprite-noelia' },
  someday: { sprite: 'itsuki1' },
  tsushin: { sprite: 'actor' },
  ultraviolet: { sprite: 'ch-主人公1' },
  unaccomplished: { sprite: 'YM_1' },
  unevendream: { sprite: 'kubo' },
  yume: { sprite: '0000000078' }
};

const LOADER_FRAME_INDEXES = [0, 1, 2] as const;
const FRAME_WIDTH = 24;
const FRAME_HEIGHT = 32;
const FRAME_ROW_OFFSET = 64;
const FRAME_COLUMN_WIDTH = 72;
const FRAME_ROW_HEIGHT = 128;

let activeRequestId = 0;
let activeFrameUrls: string[] = [];

function getDefaultLoaderSprite(gameId: GameId): LoaderSpriteState {
  const sprite = defaultLoaderSprites[gameId] ?? defaultLoaderSprites['2kki'];
  return {
    gameId,
    sprite: sprite.sprite,
    idx: sprite.idx ?? 0,
    spriteSheetSrc: getSpriteSrc(gameId, sprite.sprite),
    frameSrcs: {}
  };
}

function getSpriteSrc(gameId: string, sprite: string, fallback = false) {
  const encodedSprite = encodeURIComponent(sprite);
  if (fallback) {
    return `/images/charsets/${gameId}/${encodedSprite}.png`;
  }
  return `/data/${gameId}/CharSet/${encodedSprite}.png`;
}

function clearTransparentPixels(imageData: ImageData, isBrave: boolean) {
  const { data } = imageData;
  const transRed = data[0];
  const transGreen = data[1];
  const transBlue = data[2];

  const checkPixelTransparent = isBrave
    ? (i: number) =>
        (data[i] === transRed || data[i] - 1 === transRed) &&
        (data[i + 1] === transGreen || data[i + 1] - 1 === transGreen) &&
        (data[i + 2] === transBlue || data[i + 2] - 1 === transBlue)
    : (i: number) => data[i] === transRed && data[i + 1] === transGreen && data[i + 2] === transBlue;

  for (let offset = 0; offset < data.length; offset += 4) {
    if (checkPixelTransparent(offset)) {
      data[offset + 3] = 0;
    }
  }
}

function revokeFrameUrls(urls: string[]) {
  for (const url of urls) {
    URL.revokeObjectURL(url);
  }
}

async function loadSpriteSheet(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load sprite sheet: ${src}`));
    img.src = src;
  });
}

async function createFrameUrl(img: HTMLImageElement, idx: number, frameIdx: LoaderFrameIndex, isBrave: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_WIDTH;
  canvas.height = FRAME_HEIGHT;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('Unable to create sprite extraction context');
  }

  const startX = (idx % 4) * FRAME_COLUMN_WIDTH + FRAME_WIDTH * frameIdx;
  const startY = Math.floor(idx / 4) * FRAME_ROW_HEIGHT + FRAME_ROW_OFFSET;
  context.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  context.drawImage(img, startX, startY, FRAME_WIDTH, FRAME_HEIGHT, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  const imageData = context.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  clearTransparentPixels(imageData, isBrave);
  context.putImageData(imageData, 0, 0, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob);
        return;
      }

      reject(new Error('Failed to encode loader sprite frame'));
    }, 'image/png');
  });

  return URL.createObjectURL(blob);
}

async function loadProcessedFrames(gameId: GameId, sprite: string, idx: number) {
  const nav = navigator as Navigator & { brave?: { isBrave: () => Promise<boolean> } };
  const isBrave = nav.brave ? await nav.brave.isBrave() : false;

  const sources = [getSpriteSrc(gameId, sprite), getSpriteSrc(gameId, sprite, true)];

  for (const src of sources) {
    try {
      const img = await loadSpriteSheet(src);
      const entries = await Promise.all(
        LOADER_FRAME_INDEXES.map(async (frameIdx) => [frameIdx, await createFrameUrl(img, idx, frameIdx, isBrave)] as const)
      );

      return {
        spriteSheetSrc: src,
        frameSrcs: Object.fromEntries(entries) as Partial<Record<LoaderFrameIndex, string>>
      };
    } catch {
      // Fall through to the next source and keep raw-sheet fallback if both fail.
    }
  }

  return {
    spriteSheetSrc: sources[1],
    frameSrcs: {}
  };
}

function queueLoaderSpriteUpdate(gameId: GameId, sprite: string, idx: number) {
  const nextRequestId = ++activeRequestId;
  const nextSheetSrc = getSpriteSrc(gameId, sprite);

  state.set({
    gameId,
    sprite,
    idx,
    spriteSheetSrc: nextSheetSrc,
    frameSrcs: {}
  });

  void loadProcessedFrames(gameId, sprite, idx).then((processed) => {
    if (nextRequestId !== activeRequestId) {
      revokeFrameUrls(Object.values(processed.frameSrcs).filter((url): url is string => !!url));
      return;
    }

    const previousUrls = activeFrameUrls;
    activeFrameUrls = Object.values(processed.frameSrcs).filter((url): url is string => !!url);

    state.set({
      gameId,
      sprite,
      idx,
      spriteSheetSrc: processed.spriteSheetSrc,
      frameSrcs: processed.frameSrcs
    });

    revokeFrameUrls(previousUrls);
  });
}

const initialGameId = getGameInitState().gameId;
const state = writable<LoaderSpriteState>(getDefaultLoaderSprite(initialGameId));

if (browser) {
  const initialSprite = getDefaultLoaderSprite(initialGameId);
  queueLoaderSpriteUpdate(initialSprite.gameId, initialSprite.sprite, initialSprite.idx);

  registerEngineAPIHandler('onPlayerSpriteUpdated', (sprite, idx, id) => {
    if (id !== -1 || typeof sprite !== 'string' || !sprite) {
      return;
    }

    queueLoaderSpriteUpdate(getGameInitState().gameId, sprite, typeof idx === 'number' && idx >= 0 ? idx : 0);
  });
}

export const loaderSprite = {
  subscribe: state.subscribe
};
