<script module lang="ts">
	import { notificationConfig } from '$lib/toast.svelte';
	import type { Icons } from '$lib/icons';
	import type { ToastProps } from './ToastItem.svelte';
	import type { ClassValue } from 'svelte/elements';

	let toastAnimEndTimer: any;
	let anim = $state(false);
	let top = $state(false);
	let right = $state(false);
	const fadeToastQueue: any[] = [];

	type ToastRequest = Omit<ToastProps, 'onclose'> & { id: number };

	let toastContainer: HTMLDivElement = $state(undefined as any);
	let toasts: ToastRequest[] = $state([]);
	let toastId = 0;

	export function showToastMessage(
		message: string,
		{
			icon = undefined as Icons | undefined,
			systemName = undefined as string | undefined,
			filledIcon = false,
			persist = false,
			extraClass = undefined as ClassValue | undefined,
			special = undefined as string | undefined
		} = {}
	) {
		if (!notificationConfig.all) return;

		const toast: ToastRequest = {
			id: toastId++,
			message,
			systemName,
			icon,
			filledIcon,
			class: extraClass,
			'data-special': special,
			onmount: (ctrl) => {
				const rootStyle = toastContainer.style;
				rootStyle.setProperty(
					'--toast-offset',
					`-${ctrl.element.getBoundingClientRect().height + 8}px`
				);
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
							fadeToastQueue.push(ctrl.scheduleClose);
						} else {
							setTimeout(ctrl.scheduleClose, 10000);
						}
					}
				}, 10);
			}
		};
		toasts = [...toasts, toast];

		if (toastAnimEndTimer) {
			clearInterval(toastAnimEndTimer);
			anim = false;
		}
	}

	export function showSystemToastMessage(
		key: Exclude<keyof typeof notificationConfig.system, 'all'>,
		icon: Icons
	) {
		if (
			!notificationConfig.system.all ||
			!notificationConfig.system[key] ||
			toastContainer.querySelector(`.systemToast[data-special='${key}']`)
		)
			return;
		showToastMessage(/* getMassagedLabel(localizedMessages.toast.system[key]) */ '', {
			icon,
			special: key,
			persist: true,
			extraClass: 'systemToast'
		});
	}

	function flushToasts() {
		if (!document.hidden) {
			while (fadeToastQueue.length) {
				setTimeout(fadeToastQueue.shift(), 10000);
			}
		}
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import ToastItem from './ToastItem.svelte';
	onMount(() => {
		window.showToastMessage = showToastMessage;
	});
</script>

<svelte:document onvisibilitychange={flushToasts} />

<div id="toastContainer" bind:this={toastContainer} class={{ anim, top, right }}>
	{#each toasts as toast (toast.id)}
		<ToastItem {...toast} onclose={() => toasts.splice(toasts.indexOf(toast), 1)} />
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
