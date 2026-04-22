<script lang="ts">
  import { type Icons, icons } from '$lib/icons'
  import type { HTMLAttributes } from 'svelte/elements'
  const {
    icon,
    fill: fillIcon = false,
    ...props
  }: {
    icon: Icons
    fill?: boolean
  } & HTMLAttributes<HTMLDivElement> = $props();

  const d = $derived(icons[icon]);
</script>

<div {...props} class={[`${icon}Icon icon`, { fillIcon }, props.class]}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
    <path {d}>
    </path>
  </svg>
</div>
