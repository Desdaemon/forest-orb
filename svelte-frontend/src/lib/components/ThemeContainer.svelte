<script lang="ts">
  import type { Snippet } from 'svelte';
  import { activatedThemes } from '$lib/stores/uiTheme';
  import ThemeDefinition from './ThemeDefinition.svelte';

  const {
    gameId,
    children
  }: {
    gameId: string;
    children?: Snippet;
  } = $props();
</script>

<!--
  Render a ThemeDefinition for every theme that has ever been activated.
  Entries are never removed from `activatedThemes`, so the corresponding
  <style> elements injected by ThemeDefinition persist for the lifetime of
  the page.
-->

{@render children?.()}
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
  <defs id="svgDefs">
    {#each $activatedThemes as theme (`${theme.gameId}/${theme.uiTheme}`)}
      <ThemeDefinition uiTheme={theme.uiTheme} themeGameId={theme.gameId} {gameId} />
    {/each}
  </defs>
</svg>
