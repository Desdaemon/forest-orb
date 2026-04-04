<script module lang="ts">
  import { computePosition } from '@floating-ui/dom';
  import type { Snippet } from 'svelte';
  import { createAttachmentKey, type Attachment } from 'svelte/attachments';

  let contents = $state<string | Snippet | null>(null);
  let tooltipEl: HTMLElement;

  export function tooltip(content: string | Snippet): Attachment {
    return (el) => {
      function show() {
        computePosition(el, tooltipEl).then(({ x, y }) => {
          Object.assign(tooltipEl.style, {
            left: `${x}px`,
            top: `${y}px`
          });
          contents = content;
          tooltipEl.classList.remove('hidden');
        });
      }

      function hide() {
        contents = null;
        tooltipEl.classList.add('hidden');
      }

      el.addEventListener('mouseenter', show);
      el.addEventListener('mouseleave', hide);

      return () => {
        el.removeEventListener('mouseenter', show);
        el.removeEventListener('mouseleave', hide);
      };
    };
  }

  export function tooltipLabel(content: string) {
    return {
      'aria-label': content,
      [createAttachmentKey()]: tooltip(content)
    };
  }
</script>

<div class="tooltip" bind:this={tooltipEl}>
  {#if typeof contents === 'string'}
    {contents}
  {:else if contents}
    {@render contents()}
  {:else}
    Put dispenser here!
  {/if}
</div>

<style>
  .tooltip {
    width: max-content;
    position: absolute;
    top: 0;
    left: 0;
    background: #222;
    color: white;
    font-weight: bold;
    padding: 5px;
    border-radius: 4px;
    font-size: 90%;
    z-index: 9000;
  }
</style>
