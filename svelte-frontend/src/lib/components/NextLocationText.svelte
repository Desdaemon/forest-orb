<script>
	import { tick } from 'svelte';
	import { getLocalized2kkiLocationsHtml } from '$lib/2kki';
	import { addTooltip } from '$lib/init';
	import { nextLocations } from '$lib/nextLocations.svelte';

	let container;

	$effect(() => {
		if (container && $nextLocations) {
			updateContent($nextLocations);
		}
	})

	async function updateContent(locations) {
		// FIXME: revisit this after implementing tooltips
		throw {todo: locations};
		// container.innerHTML = getLocalized2kkiLocationsHtml(locations, '<br>', true);
		// await tick();
		// Array.from(container.querySelectorAll('.connTypeIcon')).forEach((i) => {
		// 	addTooltip(i, i.dataset.tooltip, true, true);
		// });
	}
</script>

<span bind:this={container} class="infoText nofilter"></span>
