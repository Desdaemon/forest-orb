<script>
	import { initGameLogo } from '$lib/play.svelte';

	// Sizing the logo needs the image's natural dimensions, so it stays imperative —
	// but it now runs when the logo is in the document rather than at import time.
	$effect(() => {
		initGameLogo();
	});
</script>

<div id="gameLogoContainer">
	<div id="gameLogo" class="transparent">
		<div id="gameLogoOverlay"></div>
	</div>
</div>
