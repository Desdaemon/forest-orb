<script lang="ts">
	import type { Icons } from "$lib/icons";
	import { themeClass } from "$lib/system";
	import { onMount } from "svelte";
	import Icon from "./Icon.svelte";

	export type ToastProps = {
		message: string
		onclose(): void;

		systemName?: string
		icon?: Icons
		filledIcon?: boolean
		onmount?(_: ToastController): void;
	}

	type ToastController = {
		element: HTMLDivElement
		scheduleClose(): void;
	}

	let fade = $state(false);

	let props: ToastProps = $props();
	let element: HTMLDivElement;

	function scheduleClose() {
		fade = true;
		setTimeout(() => {
			if (!element) return; // unmounted
			props.onclose();
		}, 1000);
	}

	onMount(() => {
		props.onmount?.({ element, scheduleClose });
	});
</script>


<div bind:this={element} class={['toast', { fade }, themeClass(props.systemName)]}>
	{#if props.icon}
		<Icon icon={props.icon} fill={props.filledIcon}/>
	{/if}
	<div class="toastMessageContainer">
		<div class="toastMessage">{@html props.message}</div>
	</div>
	<!-- svelte-ignore a11y_invalid_attribute -->
	<a href="javascript:void(0)" role="button" class="closeToast" onclick={props.onclose}>✖</a>
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
