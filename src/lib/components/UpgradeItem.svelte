<script lang="ts">
	import { fmt } from '$lib/fmt';

	interface Props {
		name: string;
		desc: string;
		cost: bigint;
		purchased: boolean;
		canAfford: boolean;
		unlocked?: boolean;
		showMultiplier?: boolean;
		requiresHint?: string;
		onbuy: () => void;
	}

	let {
		name,
		desc,
		cost,
		purchased,
		canAfford,
		unlocked = true,
		showMultiplier = false,
		requiresHint,
		onbuy
	}: Props = $props();
</script>

<button
	onclick={onbuy}
	disabled={purchased || !unlocked || !canAfford}
	class="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
>
	<div class="min-w-0">
		<div class="font-semibold">{name}</div>
		<div class="text-xs text-gray-400">{desc}</div>
		{#if !purchased && !unlocked && requiresHint}
			<div class="text-gray-300">{requiresHint}</div>
		{/if}
	</div>
	<div class="ml-3 shrink-0 text-right">
		{#if purchased}
			<div class="text-gray-400">✓</div>
		{:else}
			<div class="font-semibold">{fmt(cost)}</div>
			{#if showMultiplier}
				<div class="text-gray-400">(×2)</div>
			{/if}
		{/if}
	</div>
</button>
