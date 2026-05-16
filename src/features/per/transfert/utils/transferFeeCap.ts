import type { BaseCgRetraiteContractType } from '@/data/basecg';

const LEGACY_TRANSFER_TYPES = new Set<BaseCgRetraiteContractType>([
  'PERP',
  'MADELIN',
  'ARTICLE83',
  'PERCO',
]);

function parseSubscriptionDate(subscriptionDate?: string | null): Date | null {
  if (!subscriptionDate) return null;
  const date = new Date(`${subscriptionDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isAtLeastTenYearsOld(subscriptionDate?: string | null, today = new Date()): boolean {
  const start = parseSubscriptionDate(subscriptionDate);
  if (!start) return false;
  const anniversary = new Date(start);
  anniversary.setFullYear(anniversary.getFullYear() + 10);
  return anniversary <= today;
}

export function defaultOutgoingTransferFeeRate(
  contractType: BaseCgRetraiteContractType,
  contractTransferFeeRate: number | null | undefined,
): number {
  if (contractType === 'PERCO') return 0;
  if (typeof contractTransferFeeRate !== 'number' || !Number.isFinite(contractTransferFeeRate)) return 0;
  return Math.max(0, contractTransferFeeRate);
}

export function capOutgoingTransferFeeRate(
  contractType: BaseCgRetraiteContractType,
  transferFeeRate: number,
  subscriptionDate?: string | null,
  today = new Date(),
): number {
  const rate = Number.isFinite(transferFeeRate) ? Math.max(0, transferFeeRate) : 0;
  if (!LEGACY_TRANSFER_TYPES.has(contractType)) return rate;
  if (isAtLeastTenYearsOld(subscriptionDate, today)) return 0;
  return Math.min(rate, 0.01);
}
