import type { SuccessionInterMassClaim } from './successionDraft.types';
import type { SuccessionAssetPocket } from './successionPatrimonialModel';

export interface SuccessionResolvedInterMassClaim {
  id: string;
  kind: SuccessionInterMassClaim['kind'];
  label?: string;
  fromPocket: SuccessionAssetPocket;
  toPocket: SuccessionAssetPocket;
  requestedAmount: number;
  appliedAmount: number;
}

export interface SuccessionInterMassClaimsSummary {
  configured: boolean;
  totalRequestedAmount: number;
  totalAppliedAmount: number;
  claims: SuccessionResolvedInterMassClaim[];
  warnings: string[];
  adjustmentsByPocket: Record<SuccessionAssetPocket, number>;
}

export interface SuccessionAffectedLiabilitySummary {
  totalAmount: number;
  byPocket: Array<{
    pocket: SuccessionAssetPocket;
    amount: number;
  }>;
}

const EMPTY_POCKET_ADJUSTMENTS: Record<SuccessionAssetPocket, number> = {
  epoux1: 0,
  epoux2: 0,
  communaute: 0,
  societe_acquets: 0,
  indivision_pacse: 0,
  indivision_concubinage: 0,
  indivision_separatiste: 0,
};

function asAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
}

export function getSuccessionInterMassClaimKindLabel(
  kind: SuccessionInterMassClaim['kind'],
): string {
  return kind === 'recompense' ? 'Recompense' : 'Creance entre masses';
}

export function getSuccessionPocketLabel(pocket: SuccessionAssetPocket): string {
  if (pocket === 'epoux1') return 'Epoux 1';
  if (pocket === 'epoux2') return 'Epoux 2';
  if (pocket === 'communaute') return 'Communaute';
  if (pocket === 'societe_acquets') return "Societe d'acquets";
  if (pocket === 'indivision_pacse') return 'Indivision PACS';
  if (pocket === 'indivision_separatiste') return 'Indivision';
  return 'Indivision concubinage';
}

export function cloneSuccessionInterMassClaimsSummaryAdjustments(): Record<SuccessionAssetPocket, number> {
  return { ...EMPTY_POCKET_ADJUSTMENTS };
}

export function resolveSuccessionInterMassClaims({
  claims,
  availableByPocket,
}: {
  claims: SuccessionInterMassClaim[];
  availableByPocket: Record<SuccessionAssetPocket, number>;
}): SuccessionInterMassClaimsSummary {
  const enabledClaims = claims.filter((claim) => claim.enabled && asAmount(claim.amount) > 0);
  const configured = enabledClaims.length > 0;
  const warnings: string[] = [];
  const adjustmentsByPocket = cloneSuccessionInterMassClaimsSummaryAdjustments();
  const remainingByPocket = {
    ...availableByPocket,
  };

  const resolvedClaims = enabledClaims.map((claim) => {
    const requestedAmount = asAmount(claim.amount);
    if (claim.fromPocket === claim.toPocket) {
      warnings.push(
        `${getSuccessionInterMassClaimKindLabel(claim.kind)} ignoree: masse debitrice et creanciere identiques (${getSuccessionPocketLabel(claim.fromPocket)}).`,
      );
      return {
        id: claim.id,
        kind: claim.kind,
        label: claim.label,
        fromPocket: claim.fromPocket,
        toPocket: claim.toPocket,
        requestedAmount,
        appliedAmount: 0,
      };
    }

    const available = asAmount(remainingByPocket[claim.fromPocket]);
    const appliedAmount = Math.min(requestedAmount, available);

    if (requestedAmount > available) {
      warnings.push(
        `${getSuccessionInterMassClaimKindLabel(claim.kind)} ${claim.label ?? claim.id}: montant plafonne a ${Math.round(appliedAmount).toLocaleString('fr-FR')} EUR faute d'actif disponible suffisant dans ${getSuccessionPocketLabel(claim.fromPocket)}.`,
      );
    }

    remainingByPocket[claim.fromPocket] = Math.max(0, available - appliedAmount);
    remainingByPocket[claim.toPocket] = asAmount(remainingByPocket[claim.toPocket]) + appliedAmount;
    adjustmentsByPocket[claim.fromPocket] -= appliedAmount;
    adjustmentsByPocket[claim.toPocket] += appliedAmount;

    return {
      id: claim.id,
      kind: claim.kind,
      label: claim.label,
      fromPocket: claim.fromPocket,
      toPocket: claim.toPocket,
      requestedAmount,
      appliedAmount,
    };
  });

  return {
    configured,
    totalRequestedAmount: resolvedClaims.reduce((sum, claim) => sum + claim.requestedAmount, 0),
    totalAppliedAmount: resolvedClaims.reduce((sum, claim) => sum + claim.appliedAmount, 0),
    claims: resolvedClaims,
    warnings,
    adjustmentsByPocket,
  };
}

export function buildSuccessionAffectedLiabilitySummary(
  passifsParPocket: Record<SuccessionAssetPocket, number>,
): SuccessionAffectedLiabilitySummary {
  const byPocket = (Object.keys(passifsParPocket) as SuccessionAssetPocket[])
    .map((pocket) => ({
      pocket,
      amount: asAmount(passifsParPocket[pocket]),
    }))
    .filter((entry) => entry.amount > 0);

  return {
    totalAmount: byPocket.reduce((sum, entry) => sum + entry.amount, 0),
    byPocket,
  };
}
