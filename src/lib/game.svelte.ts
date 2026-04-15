import { PersistedState } from 'runed';

export const BUILDINGS = [
	{ name: 'Tier 0', desc: 'The simplest possible unit.', baseCost: 10n, baseRate: 0.1 },
	{ name: 'Tier 1', desc: 'Slightly less simple.', baseCost: 100n, baseRate: 1 },
	{ name: 'Tier 2', desc: 'Something is definitely happening.', baseCost: 1_100n, baseRate: 10 },
	{ name: 'Tier 3', desc: 'Efficiency improves noticeably.', baseCost: 12_000n, baseRate: 50 },
	{ name: 'Tier 4', desc: 'A meaningful leap in output.', baseCost: 130_000n, baseRate: 250 },
	{
		name: 'Tier 5',
		desc: 'Production at considerable scale.',
		baseCost: 1_500_000n,
		baseRate: 1500
	},
	{
		name: 'Tier 6',
		desc: 'The numbers are getting abstract.',
		baseCost: 18_000_000n,
		baseRate: 7_500
	},
	{
		name: 'Tier 7',
		desc: 'You have lost track of the units.',
		baseCost: 220_000_000n,
		baseRate: 50_000
	},
	{
		name: 'Tier 8',
		desc: 'Physics is more of a suggestion now.',
		baseCost: 2_700_000_000n,
		baseRate: 250_000
	},
	{
		name: 'Tier 9',
		desc: 'Even the concept of points is tired.',
		baseCost: 34_000_000_000n,
		baseRate: 1_500_000
	}
] as const;

export type BuildingName = (typeof BUILDINGS)[number]['name'];

const UPGRADE_TIERS = [
	{ requires: 10, costFactor: 20n },
	{ requires: 25, costFactor: 100n },
	{ requires: 50, costFactor: 500n },
	{ requires: 100, costFactor: 2_000n },
	{ requires: 150, costFactor: 8_000n },
	{ requires: 200, costFactor: 30_000n },
	{ requires: 300, costFactor: 120_000n },
	{ requires: 400, costFactor: 500_000n },
	{ requires: 500, costFactor: 2_000_000n },
	{ requires: 750, costFactor: 10_000_000n }
];

export const UPGRADES = BUILDINGS.flatMap((b) =>
	UPGRADE_TIERS.map((tier, i) => ({
		id: `${b.name}-${i + 1}`,
		building: b.name as BuildingName,
		desc: `Double ${b.name} output.`,
		cost: b.baseCost * tier.costFactor,
		multiplier: 2,
		requires: tier.requires
	}))
);

export type Upgrade = (typeof UPGRADES)[number];

export const CLICK_UPGRADES = [
	{
		id: 'click-1',
		name: 'Click Frenzy',
		desc: 'Click rapidly to boost production. Max ×2.',
		cost: 100n
	},
	{ id: 'click-2', name: 'Frenzy II', desc: 'Increase max frenzy to ×3.', cost: 2_500n },
	{ id: 'click-3', name: 'Frenzy III', desc: 'Increase max frenzy to ×4.', cost: 50_000n },
	{ id: 'click-4', name: 'Frenzy IV', desc: 'Increase max frenzy to ×5.', cost: 750_000n },
	{ id: 'click-5', name: 'Frenzy V', desc: 'Increase max frenzy to ×6.', cost: 8_000_000n },
	{ id: 'click-6', name: 'Frenzy VI', desc: 'Increase max frenzy to ×7.', cost: 80_000_000n },
	{ id: 'click-7', name: 'Frenzy VII', desc: 'Increase max frenzy to ×8.', cost: 800_000_000n },
	{ id: 'click-8', name: 'Frenzy VIII', desc: 'Increase max frenzy to ×9.', cost: 8_000_000_000n },
	{ id: 'click-9', name: 'Frenzy IX', desc: 'Increase max frenzy to ×10.', cost: 80_000_000_000n },
	{ id: 'click-10', name: 'Frenzy X', desc: 'Increase max frenzy to ×11.', cost: 800_000_000_000n }
] as const;

const bigintSerializer = {
	serialize: (v: bigint) => v.toString(),
	deserialize: (s: string) => BigInt(s)
};

export const pointsState = new PersistedState('idlegame-points', 0n, {
	serializer: bigintSerializer
});

export const ownedState = new PersistedState(
	'idlegame-owned',
	Object.fromEntries(BUILDINGS.map((b) => [b.name, 0])) as Record<BuildingName, number>
);

export const purchasedState = new PersistedState<Record<string, boolean>>('idlegame-purchased', {});
export const revealedState = new PersistedState<Record<string, boolean>>('idlegame-revealed', {});

let accumulator = 0;

// Tunable frenzy parameters (all independent)
const FRENZY_HEAT_GAIN = 0.05; // heat added per click; 1/FRENZY_HEAT_GAIN clicks to fill
const FRENZY_DECAY_HALFLIFE = 0.5; // seconds for heat to halve when not clicking
const FRENZY_GRACE_PERIOD = 0.15; // seconds after last click before decay starts

const HEAT_DECAY = Math.LN2 / FRENZY_DECAY_HALFLIFE;

let timeSinceClick = Infinity;

export const clickHeatState = $state({ current: 0 }); // 0–1

export function frenzyMultiplier(): number {
	const levels = CLICK_UPGRADES.filter((u) => purchasedState.current[u.id]).length;
	return 1 + levels * clickHeatState.current;
}

export function reset() {
	pointsState.current = 0n;
	ownedState.current = Object.fromEntries(BUILDINGS.map((b) => [b.name, 0])) as Record<
		BuildingName,
		number
	>;
	purchasedState.current = {};
	revealedState.current = {};
	accumulator = 0;
	clickHeatState.current = 0;
	timeSinceClick = Infinity;
}

export function multiplierFor(name: BuildingName): number {
	return UPGRADES.filter((u) => u.building === name).reduce(
		(m, u) => (purchasedState.current[u.id] ? m * u.multiplier : m),
		1
	);
}

export function buyUpgrade(id: string, cost: bigint) {
	if (!purchasedState.current[id] && pointsState.current >= cost) {
		pointsState.current -= cost;
		purchasedState.current = { ...purchasedState.current, [id]: true };
	}
}

export function costOf(name: BuildingName): bigint {
	const b = BUILDINGS.find((b) => b.name === name)!;
	return BigInt(Math.round(Number(b.baseCost) * Math.pow(1.15, ownedState.current[name] ?? 0)));
}

export function click() {
	if (CLICK_UPGRADES.some((u) => purchasedState.current[u.id])) {
		clickHeatState.current = Math.min(1, clickHeatState.current + FRENZY_HEAT_GAIN);
		timeSinceClick = 0;
	}
	pointsState.current += 1n;
}

export function buy(name: BuildingName) {
	const cost = costOf(name);
	if (pointsState.current >= cost) {
		pointsState.current -= cost;
		ownedState.current[name] = (ownedState.current[name] ?? 0) + 1;
	}
}

export function tick(elapsed: number) {
	timeSinceClick += elapsed;
	if (timeSinceClick > FRENZY_GRACE_PERIOD) {
		clickHeatState.current = Math.max(0, clickHeatState.current * Math.exp(-HEAT_DECAY * elapsed));
	}
	const pps = BUILDINGS.reduce(
		(sum, b) => sum + (ownedState.current[b.name] ?? 0) * b.baseRate * multiplierFor(b.name),
		0
	);
	accumulator += pps * frenzyMultiplier() * elapsed;
	if (accumulator >= 1) {
		const whole = Math.floor(accumulator);
		pointsState.current += BigInt(whole);
		accumulator -= whole;
	}
}
