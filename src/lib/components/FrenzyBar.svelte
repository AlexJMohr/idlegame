<script lang="ts">
	interface Props {
		heat: number;
		multiplier: number;
		maxFrenzy: number;
		visible: boolean;
	}

	let { heat, multiplier, maxFrenzy, visible }: Props = $props();
</script>

<div class="flex w-48 flex-col items-center gap-1 {visible ? '' : 'invisible'}">
	<div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
		<div
			class="h-full rounded-full bg-orange-400 transition-all duration-75"
			style="width: {heat * 100}%"
		></div>
	</div>
	<div class="text-xs {heat > 0.05 ? 'text-orange-400' : 'text-gray-300'}">
		×{multiplier.toFixed(2)} frenzy (max ×{maxFrenzy})
	</div>
</div>
