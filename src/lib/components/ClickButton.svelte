<script lang="ts">
	interface Props {
		onclick: () => void;
	}

	let { onclick }: Props = $props();
</script>

<button
	{onclick}
	class="mt-4 rounded-lg bg-gray-900 px-14 py-8 text-lg font-semibold text-white transition-transform select-none hover:bg-gray-700 active:scale-95"
>
	Click
</button>
