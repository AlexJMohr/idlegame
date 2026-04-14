<script lang="ts">
	import {
		pointsState,
		ownedState,
		BUILDINGS,
		costOf,
		click,
		buy,
		tick,
		type BuildingName
	} from '$lib/game.svelte';

	const pointsPerSecond = $derived(
		BUILDINGS.reduce((sum, b) => sum + ownedState.current[b.name] * b.baseRate, 0)
	);

	const fmtCompact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
	const fmtStandard = new Intl.NumberFormat('en');

	function fmt(n: bigint | number): string {
		const v = typeof n === 'bigint' ? Number(n) : n;
		return v >= 1e6 ? fmtCompact.format(v) : fmtStandard.format(Math.floor(v));
	}


	$effect(() => {
		let lastTime = Date.now();
		let frameId: number;

		function frame() {
			const now = Date.now();
			tick((now - lastTime) / 1000);
			lastTime = now;
			frameId = requestAnimationFrame(frame);
		}

		frameId = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(frameId);
	});
</script>

<div class="flex h-screen font-mono text-sm">
	<!-- Left: clicker -->
	<div class="flex flex-1 flex-col items-center justify-center gap-4 border-r border-gray-200">
		<div class="text-5xl font-bold tabular-nums">{fmt(pointsState.current)}</div>
		<div class="text-gray-400">points</div>

		<button
			onclick={click}
			class="mt-4 rounded-lg bg-gray-900 px-14 py-8 text-lg font-semibold text-white transition-transform select-none hover:bg-gray-700 active:scale-95"
		>
			Click
		</button>

		<div class="text-gray-400">{fmt(pointsPerSecond)} / sec</div>
	</div>

	<!-- Right: shop -->
	<div class="flex w-72 flex-col overflow-y-auto">
		<div
			class="border-b border-gray-200 px-4 py-3 text-xs font-semibold tracking-widest text-gray-400 uppercase"
		>
			Buildings
		</div>
		{#each BUILDINGS as building (building.name)}
			{@const cost = costOf(building.name as BuildingName)}
			{@const canAfford = pointsState.current >= cost}
			<button
				onclick={() => buy(building.name as BuildingName)}
				disabled={!canAfford}
				class="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
			>
				<div class="min-w-0">
					<div class="font-semibold">{building.name}</div>
					<div class="truncate text-gray-400">{building.desc}</div>
					<div class="text-gray-300">+{building.baseRate}/sec each</div>
				</div>
				<div class="ml-3 shrink-0 text-right">
					<div class="font-semibold">{fmt(cost)}</div>
					<div class="text-gray-400">owned: {ownedState.current[building.name]}</div>
				</div>
			</button>
		{/each}
	</div>
</div>
