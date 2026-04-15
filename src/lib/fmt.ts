const fmtCompact = new Intl.NumberFormat('en', {
	notation: 'compact',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
const fmtStandard = new Intl.NumberFormat('en');

export function fmt(n: bigint | number): string {
	const v = typeof n === 'bigint' ? Number(n) : n;
	return v >= 1e6 ? fmtCompact.format(v) : fmtStandard.format(Math.floor(v));
}
