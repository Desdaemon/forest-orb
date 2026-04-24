<script module lang="ts">
	export let toastAnimEndTimer: any;
	export const toastState = $state({
		anim: false,
		top: false,
		right: false
	});
	const fadeToastQueue: any[] = [];

	export function flushToasts() {
		if (!document.hidden) {
			while (fadeToastQueue.length) {
				setTimeout(fadeToastQueue.shift(), 10000);
			}
		}
	}
</script>

<script lang="ts">
	import type { Icons } from '$lib/icons';
	import { themeClass } from '$lib/system.svelte';
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import type { ClassValue } from 'svelte/elements';

	export type ToastProps = {
		message: string;
		onclose(): void;

		systemName?: string;
		icon?: Icons;
		filledIcon?: boolean;
		class?: ClassValue;
		['data-special']?: string;
		persist?: boolean;
	};

	type ToastController = {
		element: HTMLDivElement;
		scheduleClose(): void;
	};

	let fade = $state(false);

	let {
		message,
		onclose,
		systemName,
		icon,
		filledIcon,
		persist = false,
		...divProps
	}: ToastProps = $props();
	let element: HTMLDivElement;

	function scheduleClose() {
		fade = true;
		setTimeout(() => {
			if (!element) return; // unmounted
			onclose();
		}, 1000);
	}

	onMount(() => {
		const toastContainer = element.parentElement!;
		const rootStyle = toastContainer.style;
		rootStyle.setProperty('--toast-offset', `-${element.getBoundingClientRect().height + 8}px`);
		setTimeout(() => {
			toastState.anim = true;
			rootStyle.setProperty('--toast-offset', '0');
			toastAnimEndTimer = setTimeout(() => {
				toastState.anim = false;
				toastAnimEndTimer = undefined;
			}, 500);

			// NB: moved this block outside of toastAnimEndTimer so it's unconditionally closed
			if (!persist) {
				if (document.hidden) {
					fadeToastQueue.push(scheduleClose);
				} else {
					setTimeout(scheduleClose, 10510);
				}
			}
		}, 10);
	});
</script>

<div
	bind:this={element}
	{...divProps}
	class={['toast', { fade }, themeClass(systemName), divProps.class]}
>
	{#if icon}
		<Icon {icon} fill={filledIcon} />
	{/if}
	<div class="toastMessageContainer">
		<div class="toastMessage">{@html message}</div>
	</div>
	<!-- svelte-ignore a11y_invalid_attribute -->
	<a href="javascript:void(0)" role="button" class="closeToast" onclick={onclose}>✖</a>
</div>

<style>
	.toastMessageContainer {
		width: 100%;
	}

	.screenshotToast .toastMessageContainer {
		text-align: center;
	}

	.toastMessage {
		display: inline;
	}

	.closeToast {
		right: 0;
		text-decoration: none;
		image-rendering: auto;
		padding-inline-start: 8px;
	}

	.toast > :global(.icon) {
		width: 24px;
		height: 24px;
		min-width: 24px;
		min-height: 24px;
		margin: 4px 0 4px 0;
		margin-inline-end: 8px;
	}

	.toast.fade {
		transition: opacity 1s ease-in-out;
		opacity: 0;
	}

	.toast > :global(.badgeContainer) {
		margin-inline-end: 8px;
	}

	:global {
		.toast > .badgeContainer > .badge {
			width: 37px;
			height: 37px;
		}
	}

	.toast {
		display: flex;
		align-items: center;
		width: calc(100% - 24px);
		margin: 0 0 8px 8px;
		background-image: var(--container-bg-image-url) !important;
		background-size: 35px;
		background-position-y: -8px;
		justify-content: space-between;
	}

	.toast.fullBg {
		background-origin: border-box;
		background-size: contain;
		background-position: 0;
	}
</style>
