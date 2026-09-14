export function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

// Exported, but nobody outside this file calls it.
export function formatMoney(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}
