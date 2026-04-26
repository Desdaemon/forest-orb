<script>
	// Owns the game canvas and everything that has to be wired to it once it exists in the
	// document. All of this used to run as import-time side effects in gamecanvas.ts/play.svelte.ts.
	import { hasTouchscreen } from '$lib';
	import { initCanvas, initGameControls, initGamepads } from '$lib/gamecanvas';
	import { iOS, onCanvasKeydown, updateMobileControlType } from '$lib/play.svelte';

	/** @type {HTMLElement} */
	let crashFix;
	/** @type {HTMLCanvasElement} */
	let canvas;

	$effect(() => {
		// TODO: chat initialisation once the EasyRPG runtime is ported
		// easyrpgPlayer['onRuntimeInitialized'] = initChat;
		initCanvas();
		initGamepads();
		initGameControls();

		// iOS webkit crashes without something else painting over the canvas
		if (hasTouchscreen && iOS()) {
			const canvasStyle = window.getComputedStyle(canvas);
			crashFix.style.cssText += 'display: block; opacity: 0%;';
			crashFix.style.width = canvasStyle.width;
			crashFix.style.height = canvasStyle.height;
		}

		if (!hasTouchscreen) return;
		screen.orientation.addEventListener('change', updateMobileControlType);
		return () => screen.orientation.removeEventListener('change', updateMobileControlType);
	});
</script>

<div id="canvasContainer">
	<div id="crashFix" bind:this={crashFix}></div>
	<canvas id="canvas" tabindex="-1" bind:this={canvas} onkeydown={onCanvasKeydown}></canvas>
</div>
