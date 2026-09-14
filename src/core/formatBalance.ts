export function formatBalance(value: string) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "0.00";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}
