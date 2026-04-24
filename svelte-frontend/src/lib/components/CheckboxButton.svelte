<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		inverse: inverseToggle = false,
		toggled = $bindable(),
		onclick: onclickProp,
		...props
	}: {
		/** Only relevant if using `bind:toggled`. */
		inverse?: boolean;
		toggled?: boolean;
		onclick?(toggled: boolean, ev: MouseEvent): void;
	} & Omit<HTMLAttributes<HTMLButtonElement>, 'onclick'> = $props();

	function onclick(ev: any) {
		toggled = !toggled;
		onclickProp?.(toggled, ev);
	}
</script>

<button
	role="checkbox"
	aria-checked={toggled !== inverseToggle}
	{...props}
	{onclick}
	class={['checkboxButton unselectable', { inverseToggle, toggled }, props.class]}
	><span role="presentation"></span></button
>
