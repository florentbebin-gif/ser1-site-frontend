import type {
  GroupementFoncierType,
  SuccessionAssetDetailEntry,
  SuccessionGroupementFoncierEntry,
  SuccessionPatrimonialContext,
  SuccessionPreciputSelection,
} from './successionDraft';
import type { SuccessionAssetPocket } from './successionPatrimonialModel';
import { RESIDENCE_PRINCIPALE_SUBCATEGORY } from './successionSimulator.constants';
import type { SuccessionEstateTaxableBasis } from './successionTransmissionBasis';

function asAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
}

export interface SuccessionPreciputCandidate {
  key: string;
  sourceType: SuccessionPreciputSelection['sourceType'];
  sourceId: string;
  label: string;
  pocket: SuccessionAssetPocket;
  maxAmount: number;
  isResidencePrincipale: boolean;
  groupementType?: GroupementFoncierType;
}

export interface SuccessionResolvedPreciputSelection {
  selection: SuccessionPreciputSelection;
  candidate: SuccessionPreciputCandidate;
  amount: number;
}

export interface SuccessionResolvedPreciputApplication {
  mode: SuccessionPatrimonialContext['preciputMode'] | 'none';
  requestedAmount: number;
  targetedSelections: SuccessionResolvedPreciputSelection[];
  usesGlobalFallback: boolean;
}

function buildAssetCandidateLabel(entry: SuccessionAssetDetailEntry): string {
  const label = entry.label?.trim();
  const subCategory = entry.subCategory.trim();
  if (label && label.length > 0 && label !== subCategory) {
    return `${label} (${subCategory})`;
  }
  return label && label.length > 0 ? label : subCategory;
}

function buildGroupementCandidateLabel(entry: SuccessionGroupementFoncierEntry): string {
  const label = entry.label?.trim();
  return label && label.length > 0 ? `${entry.type} - ${label}` : entry.type;
}

export function getSuccessionPreciputSelectionKey(
  sourceType: SuccessionPreciputSelection['sourceType'],
  sourceId: string,
): string {
  return `${sourceType}:${sourceId}`;
}

export function getSuccessionPreciputEligiblePocket({
  isCommunityRegime,
  isSocieteAcquetsRegime,
}: {
  isCommunityRegime: boolean;
  isSocieteAcquetsRegime: boolean;
}): SuccessionAssetPocket | null {
  if (isSocieteAcquetsRegime) return 'societe_acquets';
  if (isCommunityRegime) return 'communaute';
  return null;
}

export function buildSuccessionPreciputCandidates({
  assetEntries,
  groupementFoncierEntries,
  allowedPocket,
}: {
  assetEntries: SuccessionAssetDetailEntry[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  allowedPocket: SuccessionAssetPocket | null;
}): SuccessionPreciputCandidate[] {
  if (!allowedPocket) return [];

  const assetCandidates = assetEntries
    .filter((entry) => entry.pocket === allowedPocket)
    .filter((entry) => entry.category !== 'passif')
    .filter((entry) => asAmount(entry.amount) > 0)
    .map((entry) => ({
      key: getSuccessionPreciputSelectionKey('asset', entry.id),
      sourceType: 'asset' as const,
      sourceId: entry.id,
      label: buildAssetCandidateLabel(entry),
      pocket: entry.pocket,
      maxAmount: asAmount(entry.amount),
      isResidencePrincipale: entry.category === 'immobilier'
        && entry.subCategory === RESIDENCE_PRINCIPALE_SUBCATEGORY,
    }));

  const groupementCandidates = groupementFoncierEntries
    .filter((entry) => entry.pocket === allowedPocket)
    .filter((entry) => asAmount(entry.valeurTotale) > 0)
    .map((entry) => ({
      key: getSuccessionPreciputSelectionKey('groupement_foncier', entry.id),
      sourceType: 'groupement_foncier' as const,
      sourceId: entry.id,
      label: buildGroupementCandidateLabel(entry),
      pocket: entry.pocket,
      maxAmount: asAmount(entry.valeurTotale),
      isResidencePrincipale: false,
      groupementType: entry.type,
    }));

  return [...assetCandidates, ...groupementCandidates];
}

export function createSuccessionPreciputSelection(
  candidate: SuccessionPreciputCandidate,
): SuccessionPreciputSelection {
  return {
    id: `prec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceType: candidate.sourceType,
    sourceId: candidate.sourceId,
    labelSnapshot: candidate.label,
    pocket: candidate.pocket,
    amount: candidate.maxAmount,
    enabled: true,
  };
}

export function syncSuccessionPreciputSelections(
  selections: SuccessionPreciputSelection[],
  candidates: SuccessionPreciputCandidate[],
): SuccessionPreciputSelection[] {
  const candidatesByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const seenKeys = new Set<string>();

  return selections.reduce<SuccessionPreciputSelection[]>((acc, selection) => {
    const key = getSuccessionPreciputSelectionKey(selection.sourceType, selection.sourceId);
    if (seenKeys.has(key)) return acc;
    seenKeys.add(key);

    const candidate = candidatesByKey.get(key);
    if (!candidate) return acc;

    acc.push({
      ...selection,
      labelSnapshot: candidate.label,
      pocket: candidate.pocket,
      amount: Math.min(candidate.maxAmount, asAmount(selection.amount)),
      enabled: Boolean(selection.enabled),
    });
    return acc;
  }, []);
}

export function resolveSuccessionPreciputApplication({
  patrimonial,
  candidates,
}: {
  patrimonial?: Partial<Pick<
    SuccessionPatrimonialContext,
    'preciputMode' | 'preciputSelections' | 'preciputMontant'
  >>;
  candidates: SuccessionPreciputCandidate[];
}): SuccessionResolvedPreciputApplication {
  const syncedSelections = syncSuccessionPreciputSelections(
    patrimonial?.preciputSelections ?? [],
    candidates,
  );
  const candidatesByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const targetedSelections = syncedSelections
    .filter((selection) => selection.enabled && selection.amount > 0)
    .map((selection) => {
      const candidate = candidatesByKey.get(
        getSuccessionPreciputSelectionKey(selection.sourceType, selection.sourceId),
      );
      if (!candidate) return null;
      return {
        selection,
        candidate,
        amount: Math.min(candidate.maxAmount, asAmount(selection.amount)),
      };
    })
    .filter((selection): selection is SuccessionResolvedPreciputSelection => selection !== null);

  if (patrimonial?.preciputMode === 'cible' && targetedSelections.length > 0) {
    return {
      mode: 'cible',
      requestedAmount: targetedSelections.reduce((sum, selection) => sum + selection.amount, 0),
      targetedSelections,
      usesGlobalFallback: false,
    };
  }

  const globalAmount = asAmount(patrimonial?.preciputMontant);
  if (globalAmount > 0) {
    return {
      mode: 'global',
      requestedAmount: globalAmount,
      targetedSelections: [],
      usesGlobalFallback: patrimonial?.preciputMode === 'cible',
    };
  }

  return {
    mode: 'none',
    requestedAmount: 0,
    targetedSelections: [],
    usesGlobalFallback: false,
  };
}

export function buildSuccessionTargetedPreciputTaxableBasis(
  selections: SuccessionResolvedPreciputSelection[],
): SuccessionEstateTaxableBasis {
  return selections.reduce<SuccessionEstateTaxableBasis>((acc, resolved) => {
    if (resolved.candidate.sourceType === 'asset') {
      acc.ordinaryNetBeforeForfait += resolved.amount;
      if (resolved.candidate.isResidencePrincipale) {
        acc.residencePrincipaleValeur += resolved.amount;
      }
      return acc;
    }

    if (resolved.candidate.groupementType) {
      acc.groupementEntries.push({
        sourceId: resolved.candidate.sourceId,
        type: resolved.candidate.groupementType,
        valeurTotale: resolved.amount,
      });
    }
    return acc;
  }, {
    ordinaryNetBeforeForfait: 0,
    groupementEntries: [],
    residencePrincipaleValeur: 0,
  });
}
