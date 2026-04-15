<script lang="ts">
	import { fmt } from '$lib/fmt';

	interface Props {
		name: string;
		desc: string;
		cost: bigint;
		canAfford: boolean;
		owned: number;
		effectiveRate: number;
		onclick: () => void;
	}

	let { name, desc, cost, canAfford, owned, effectiveRate, onclick }: Props = $props();
</script>

<button
	{onclick}
	disabled={!canAfford}
	class="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
>
	<div class="min-w-0">
		<div class="font-semibold">{name}</div>
		<div class="truncate text-gray-400">{desc}</div>
		<div class="text-gray-300">+{effectiveRate}/sec each</div>
	</div>
	<div class="ml-3 shrink-0 text-right">
		<div class="font-semibold">{fmt(cost)}</div>
		<div class="text-gray-400">{owned} owned</div>
	</div>
</button>
