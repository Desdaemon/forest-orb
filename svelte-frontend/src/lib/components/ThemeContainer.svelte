<script lang="ts">
  import type { Snippet } from 'svelte';
  import { activatedThemes } from '$lib/uiThemeStore';
  import ThemeDefinition from './ThemeDefinition.svelte';

  const {
    gameId,
    children,
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
{#each $activatedThemes as theme (`${theme.gameId}/${theme.uiTheme}`)}
  <ThemeDefinition uiTheme={theme.uiTheme} themeGameId={theme.gameId} {gameId} />
{/each}

{@render children?.()}
