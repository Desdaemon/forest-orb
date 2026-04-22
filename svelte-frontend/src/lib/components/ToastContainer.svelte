<script lang="ts">
	import { notificationConfig } from '$lib/toast.svelte';
	import { onMount } from 'svelte';
	import type { Icons } from '$lib/icons';
	import Icon from './Icon.svelte';
	import ToastItem, { type ToastProps } from './ToastItem.svelte';

	type ToastItem = Omit<ToastProps, 'onclose'> & { id: number }

	let toastContainer: HTMLDivElement = $state(undefined as any);
	let toasts: ToastItem[] = $state([]);
	let toastId = 0;
	let toastAnimEndTimer: any;
	let anim = $state(false);
	let top = $state(false);
	let right = $state(false);
	const fadeToastQueue: any[] = [];

	export function showToastMessage(
		message: string,
		icon: Icons,
		filledIcon: boolean,
		systemName: string,
		persist = false
	) {
		if (!notificationConfig.all) return;

		const toast: ToastItem = {
			id: toastId++,
			message,
			systemName,
			icon,
			filledIcon,
			onmount: ctrl => {
				const rootStyle = toastContainer.style;
				rootStyle.setProperty('--toast-offset', `-${ctrl.element.getBoundingClientRect().height + 8}px`);
				setTimeout(() => {
					anim = true;
					rootStyle.setProperty('--toast-offset', '0');
					toastAnimEndTimer = setTimeout(() => {
						anim = false;
						toastAnimEndTimer = undefined;
					}, 500);

					// NB: moved this block outside of toastAnimEndTimer so it's unconditionally closed
					if (!persist) {
						if (document.hidden) {
							fadeToastQueue.push(ctrl.scheduleClose)
						} else {
							setTimeout(ctrl.scheduleClose, 10000);
						}
					}
				}, 10)
			}
		}
		toasts = [...toasts, toast];

		if (toastAnimEndTimer) {
			clearInterval(toastAnimEndTimer);
			anim = false;
		}
	}

	function flushToasts() {
		if (!document.hidden) {
			while (fadeToastQueue.length) {
				setTimeout(fadeToastQueue.shift(), 10000);
			}
		}
	}

	onMount(() => {
		window.showToastMessage = showToastMessage;
	});
</script>

<svelte:document onvisibilitychange={flushToasts}/>

<div id="toastContainer" bind:this={toastContainer} class={{ anim, top, right }}>
	{#each toasts as toast, idx (toast.id)}
		<ToastItem {...toast} onclose={() => toasts.splice(idx, 1)}/>
	{/each}
</div>

<style>
	#toastContainer {
		position: fixed;
		display: flex;
		flex-direction: column;
		width: min(320px, calc(100vw - 40px));
		bottom: var(--toast-offset);
		left: 0;
		margin: 0 0 8px;
		margin-inline-start: 8px;
		z-index: 20;
	}

	#toastContainer.top {
		flex-direction: column-reverse;
		bottom: unset;
		top: var(--toast-offset);
		margin-top: 8px;
		margin-bottom: 0;
	}

	#toastContainer.right {
		left: unset;
		right: 0;
		margin-inline-start: 0;
		margin-inline-end: 8px;
	}

	#toastContainer.anim {
		transition: bottom 0.5s cubic-bezier(0.7, 0, 0.7, 1.5);
	}

	#toastContainer.top.anim {
		transition: top 0.5s cubic-bezier(0.7, 0, 0.7, 1.5);
	}


	#toastContainer.top :global(.toast) {
		margin-top: 8px;
		margin-bottom: 0;
	}

	#toastContainer.right :global(.toast) {
		margin-inline-start: -8px;
	}

</style>
