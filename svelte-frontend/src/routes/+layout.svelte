<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link rel="stylesheet" href="/play.css" />
  <link rel="stylesheet" href="/gamecanvas.css" />
  <script src="/ynoengine-simd.js"></script>
</svelte:head>

{@render children()}
