export function clampPercentage(value: string): number {
  return Math.min(100, Math.max(0, Number(value) || 0));
}
