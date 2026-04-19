import { get } from 'svelte/store';
import { ynomojiConfig, getYnomojiUrl } from '$lib/stores/ynomoji';

const markdownSyntax = [
  { p: /<\/?[bisux] *>/gi, r: '' },
  { p: /(?:^|([^\\]))(\*{3,})([^*_~|\\]+)\2/g, r: '$1<b><i>$3</i></b>' },
  { p: /(?:^|([^\\]))(\*{2})([^*_~|\\]+)\2/g, r: '$1<b>$3</b>' },
  { p: /(?:^|([^\\]))\*([^*_~|\\]+)\*/g, r: '$1<i>$2</i>' },
  { p: /(?:^|([^\\]))(_{3,})([^*_~|\\]+)\2(?= |$)/g, r: '$1<u><i>$3</i></u>' },
  { p: /(?:^|([^\\]))(_{2})([^*_~|\\]+)\2(?= |$)/g, r: '$1<u>$3</u>' },
  { p: /(?:^|([^\\]))_([^*_~|\\]+)_(?= |$)/g, r: '$1<i>$2</i>' },
  { p: /(?:^|([^\\]))(~{2,})([^*_~|\\]+)\2/g, r: '$1<s>$3</s>' },
  { p: /(?:^|([^\\]))(\|{2,})([^*_~|\\]+)\2/g, r: '$1<x>$3</x>' },
  { p: /\\\*/g, r: '*' },
  { p: /\\_/g, r: '_' },
  { p: /\\~/g, r: '~' },
  { p: /\\\|/g, r: '|' }
];

export function parseMarkdown(msg: string): string {
  for (const syntax of markdownSyntax) {
    msg = msg.replace(syntax.p, syntax.r);
  }
  return msg;
}

export function hydrateMessageContents(msg: string): string {
  let html = parseMarkdown(msg);

  // Replace ynomoji tags with image wrappers
  const ynomojiPattern = /:([a-z0-9_-]+):/gi;
  html = html.replace(ynomojiPattern, (match, id) => {
    const config = get(ynomojiConfig);
    const ynomojiId = Object.keys(config).find((key) => key === id);
    if (ynomojiId) {
      const imageUrl = getYnomojiUrl(ynomojiId);
      if (imageUrl) {
        return `<span class="ynomojiWrapper"><img src="${imageUrl}" class="ynomoji" title="${ynomojiId}" /></span>`;
      }
    }
    return match;
  });

  return html;
}
