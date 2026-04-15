<script lang="ts">
	import {
		pointsState,
		ownedState,
		purchasedState,
		revealedState,
		BUILDINGS,
		UPGRADES,
		CLICK_UPGRADES,
		costOf,
		click,
		buy,
		buyUpgrade,
		multiplierFor,
		frenzyMultiplier,
		clickHeatState,
		tick,
		reset,
		type BuildingName
	} from '$lib/game.svelte';
	import PointsDisplay from '$lib/components/PointsDisplay.svelte';
	import ClickButton from '$lib/components/ClickButton.svelte';
	import FrenzyBar from '$lib/components/FrenzyBar.svelte';
	import Building from '$lib/components/Building.svelte';
	import UpgradeItem from '$lib/components/UpgradeItem.svelte';

	const purchasedFrenzyLevels = $derived(
		CLICK_UPGRADES.filter((u) => purchasedState.current[u.id]).length
	);

	const maxFrenzy = $derived(1 + purchasedFrenzyLevels);

	const basePPS = $derived(
		BUILDINGS.reduce(
			(sum, b) => sum + (ownedState.current[b.name] ?? 0) * b.baseRate * multiplierFor(b.name),
			0
		)
	);

	const pointsPerSecond = $derived(basePPS * frenzyMultiplier());

	let activeTab: 'buildings' | 'upgrades' = $state('buildings');

	if (import.meta.env.DEV) {
		$effect(() => {
			Object.assign(window, { cheat: { pointsState, purchasedState, reset } });
		});
	}

	const visibleClickUpgrades = $derived.by(() => {
		const nextIdx = CLICK_UPGRADES.findIndex((u) => !purchasedState.current[u.id]);
		return nextIdx === -1 ? [...CLICK_UPGRADES] : CLICK_UPGRADES.slice(0, nextIdx + 1);
	});

	const visibleBuildings = $derived.by(() => {
		const result: (typeof BUILDINGS)[number][] = [];
		for (let i = 0; i < BUILDINGS.length; i++) {
			const b = BUILDINGS[i];
			const owned = (ownedState.current[b.name] ?? 0) > 0;
			const revealed = !!revealedState.current[b.name];
			if (owned || revealed) {
				result.push(b);
			} else if (i <= 1 || pointsState.current >= b.baseCost / 10n) {
				result.push(b);
				break;
			} else {
				break;
			}
		}
		return result;
	});

	$effect(() => {
		const unseen = visibleBuildings.filter((b) => !revealedState.current[b.name]);
		if (unseen.length > 0) {
			const updates = Object.fromEntries(unseen.map((b) => [b.name, true]));
			revealedState.current = { ...revealedState.current, ...updates };
		}
	});

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
		<PointsDisplay points={pointsState.current} {pointsPerSecond} />

		<ClickButton onclick={click} />

		<FrenzyBar
			heat={clickHeatState.current}
			multiplier={frenzyMultiplier()}
			{maxFrenzy}
			visible={purchasedFrenzyLevels > 0}
		/>

		<button
			onclick={() => confirm('Reset all progress?') && reset()}
			class="mt-4 text-xs text-gray-300 transition-colors hover:text-gray-500"
		>
			Reset
		</button>
	</div>

	<!-- Right: shop -->
	<div class="flex w-72 flex-col overflow-hidden">
		<!-- Tabs -->
		<div class="flex shrink-0 border-b border-gray-200">
			<button
				onclick={() => (activeTab = 'buildings')}
				class="flex-1 px-4 py-3 text-xs font-semibold tracking-widest uppercase transition-colors {activeTab ===
				'buildings'
					? 'border-b-2 border-gray-900 text-gray-900'
					: 'text-gray-400 hover:text-gray-600'}"
			>
				Buildings
			</button>
			<button
				onclick={() => (activeTab = 'upgrades')}
				class="flex-1 px-4 py-3 text-xs font-semibold tracking-widest uppercase transition-colors {activeTab ===
				'upgrades'
					? 'border-b-2 border-gray-900 text-gray-900'
					: 'text-gray-400 hover:text-gray-600'}"
			>
				Upgrades
			</button>
		</div>

		<!-- Buildings tab -->
		{#if activeTab === 'buildings'}
			<div class="overflow-y-auto">
				{#each visibleBuildings as building (building.name)}
					<Building
						name={building.name}
						desc={building.desc}
						cost={costOf(building.name as BuildingName)}
						canAfford={pointsState.current >= costOf(building.name as BuildingName)}
						owned={ownedState.current[building.name] ?? 0}
						effectiveRate={building.baseRate * multiplierFor(building.name as BuildingName)}
						onclick={() => buy(building.name as BuildingName)}
					/>
				{/each}
			</div>
		{/if}

		<!-- Upgrades tab -->
		{#if activeTab === 'upgrades'}
			<div class="overflow-y-auto">
				<!-- Click upgrades -->
				<div
					class="border-b border-gray-200 px-4 py-2 text-xs font-semibold tracking-widest text-gray-400 uppercase"
				>
					Clicking
				</div>
				{#each visibleClickUpgrades as u (u.id)}
					<UpgradeItem
						name={u.name}
						desc={u.desc}
						cost={u.cost}
						purchased={!!purchasedState.current[u.id]}
						canAfford={pointsState.current >= u.cost}
						onbuy={() => buyUpgrade(u.id, u.cost)}
					/>
				{:else}
					<div class="px-4 py-3 text-gray-300">All click upgrades purchased.</div>
				{/each}

				<!-- Building upgrades -->
				<div
					class="border-b border-gray-200 px-4 py-2 text-xs font-semibold tracking-widest text-gray-400 uppercase"
				>
					Buildings
				</div>
				{#each UPGRADES as u (u.id)}
					<UpgradeItem
						name={u.building}
						desc={u.desc}
						cost={u.cost}
						purchased={!!purchasedState.current[u.id]}
						canAfford={pointsState.current >= u.cost}
						unlocked={(ownedState.current[u.building] ?? 0) >= u.requires}
						showMultiplier={true}
						requiresHint="need {u.requires} owned"
						onbuy={() => buyUpgrade(u.id, u.cost)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
