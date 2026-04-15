<script lang="ts">
	import { fmt } from '$lib/fmt';

	const fmtRate1dp = new Intl.NumberFormat('en', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 1
	});
	const fmtRateCompact = new Intl.NumberFormat('en', {
		notation: 'compact',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	function fmtRate(n: number): string {
		if (n >= 1e3) return fmtRateCompact.format(n);
		return fmtRate1dp.format(n);
	}

	interface Props {
		points: bigint;
		pointsPerSecond: number;
	}

	let { points, pointsPerSecond }: Props = $props();
</script>

<div class="text-5xl font-bold tabular-nums">{fmt(points)}</div>

<div class="text-center text-gray-400">
	<div>{fmtRate(pointsPerSecond)} / sec</div>
</div>
