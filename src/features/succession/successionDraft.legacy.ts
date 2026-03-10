import { DEFAULT_SUCCESSION_TESTAMENT_CONFIG } from './successionDraft.defaults';
import {
  asBoolean,
  asPercent,
  isPrimarySide,
  isSuccessionBeneficiaryRef,
} from './successionDraft.guards';
import type {
  FamilyMember,
  ParsedSuccessionDraftPayload,
  SuccessionBeneficiaryRef,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionEnfant,
  SuccessionLiquidationContext,
  SuccessionParticularLegacyEntry,
  SuccessionPatrimonialContext,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from './successionDraft.types';

export const SUPPORTED_SUCCESSION_DRAFT_VERSIONS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
] as const;

export function isSupportedSuccessionDraftVersion(
  version: unknown,
): version is (typeof SUPPORTED_SUCCESSION_DRAFT_VERSIONS)[number] {
  return typeof version === 'number'
    && SUPPORTED_SUCCESSION_DRAFT_VERSIONS.includes(
      version as (typeof SUPPORTED_SUCCESSION_DRAFT_VERSIONS)[number],
    );
}

export function deriveLegacyEnfants(
  liquidation: SuccessionLiquidationContext,
  devolution: SuccessionDevolutionContext,
): SuccessionEnfant[] {
  const total = Math.max(0, Math.floor(liquidation.nbEnfants));
  const nonCommuns = Math.min(Math.max(0, Math.floor(devolution.nbEnfantsNonCommuns)), total);
  const communs = Math.max(0, total - nonCommuns);

  const enfants: SuccessionEnfant[] = [];
  for (let i = 0; i < communs; i += 1) {
    enfants.push({
      id: `E${enfants.length + 1}`,
      rattachement: 'commun',
    });
  }
  for (let i = 0; i < nonCommuns; i += 1) {
    enfants.push({
      id: `E${enfants.length + 1}`,
      rattachement: i % 2 === 0 ? 'epoux1' : 'epoux2',
    });
  }

  return enfants;
}

export function deriveLegacyDonations(
  patrimonial: SuccessionPatrimonialContext,
): SuccessionDonationEntry[] {
  const donations: SuccessionDonationEntry[] = [];

  if (patrimonial.donationsRapportables > 0) {
    donations.push({
      id: 'don-rapportable-legacy',
      type: 'rapportable',
      montant: patrimonial.donationsRapportables,
    });
  }
  if (patrimonial.donationsHorsPart > 0) {
    donations.push({
      id: 'don-hors-part-legacy',
      type: 'hors_part',
      montant: patrimonial.donationsHorsPart,
    });
  }
  if (patrimonial.legsParticuliers > 0) {
    donations.push({
      id: 'don-legs-particulier-legacy',
      type: 'legs_particulier',
      montant: patrimonial.legsParticuliers,
    });
  }

  return donations;
}

export function deriveLegacyAssetEntries(
  liquidation: SuccessionLiquidationContext,
): ParsedSuccessionDraftPayload['assetEntries'] {
  const entries: ParsedSuccessionDraftPayload['assetEntries'] = [];

  if (liquidation.actifEpoux1 > 0) {
    entries.push({
      id: 'asset-epoux1-legacy',
      owner: 'epoux1',
      category: 'divers',
      subCategory: 'Saisie agrégée',
      amount: liquidation.actifEpoux1,
      label: 'Migration agrégée legacy',
    });
  }
  if (liquidation.actifEpoux2 > 0) {
    entries.push({
      id: 'asset-epoux2-legacy',
      owner: 'epoux2',
      category: 'divers',
      subCategory: 'Saisie agrégée',
      amount: liquidation.actifEpoux2,
      label: 'Migration agrégée legacy',
    });
  }
  if (liquidation.actifCommun > 0) {
    entries.push({
      id: 'asset-commun-legacy',
      owner: 'commun',
      category: 'divers',
      subCategory: 'Saisie agrégée',
      amount: liquidation.actifCommun,
      label: 'Migration agrégée legacy',
    });
  }

  return entries;
}

export function getLegacyTestamentConfig(raw: Record<string, unknown>): SuccessionTestamentConfig {
  const active = asBoolean(raw.testamentActif, DEFAULT_SUCCESSION_TESTAMENT_CONFIG.active);
  const parsedDisposition = raw.typeDispositionTestamentaire;
  const dispositionType = parsedDisposition === 'legs_universel'
    || parsedDisposition === 'legs_titre_universel'
    || parsedDisposition === 'legs_particulier'
    ? parsedDisposition
    : DEFAULT_SUCCESSION_TESTAMENT_CONFIG.dispositionType;

  return {
    active,
    dispositionType: active ? (dispositionType ?? 'legs_universel') : dispositionType,
    beneficiaryRef: null,
    quotePartPct: asPercent(
      raw.quotePartLegsTitreUniverselPct,
      DEFAULT_SUCCESSION_TESTAMENT_CONFIG.quotePartPct,
    ),
    particularLegacies: [],
  };
}

function resolveLegacyBeneficiaryRef(
  donation: SuccessionDonationEntry,
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): {
  donorSide: SuccessionPrimarySide;
  beneficiaryRef: SuccessionBeneficiaryRef | null;
} {
  const donorSide = isPrimarySide(donation.donateur) ? donation.donateur : 'epoux1';
  let beneficiaryRef: SuccessionBeneficiaryRef | null = null;

  if (
    donation.donataire === 'conjoint'
    && civil.situationMatrimoniale !== 'celibataire'
    && civil.situationMatrimoniale !== 'divorce'
    && civil.situationMatrimoniale !== 'veuf'
  ) {
    beneficiaryRef = `principal:${donorSide === 'epoux1' ? 'epoux2' : 'epoux1'}`;
  } else if (
    typeof donation.donataire === 'string'
    && enfants.some((enfant) => enfant.id === donation.donataire)
  ) {
    beneficiaryRef = `enfant:${donation.donataire}`;
  } else if (
    typeof donation.donataire === 'string'
    && familyMembers.some((member) => member.id === donation.donataire)
  ) {
    beneficiaryRef = `family:${donation.donataire}`;
  } else if (isSuccessionBeneficiaryRef(donation.donataire)) {
    beneficiaryRef = donation.donataire;
  }

  return { donorSide, beneficiaryRef };
}

export function collectLegacyParticularLegacies(
  donations: SuccessionDonationEntry[],
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): {
  donations: SuccessionDonationEntry[];
  particularLegaciesBySide: Record<SuccessionPrimarySide, SuccessionParticularLegacyEntry[]>;
} {
  const particularLegaciesBySide: Record<SuccessionPrimarySide, SuccessionParticularLegacyEntry[]> = {
    epoux1: [],
    epoux2: [],
  };

  const filteredDonations = donations.filter((donation) => {
    if (donation.type !== 'legs_particulier') {
      return true;
    }

    const { donorSide, beneficiaryRef } = resolveLegacyBeneficiaryRef(
      donation,
      civil,
      enfants,
      familyMembers,
    );

    particularLegaciesBySide[donorSide].push({
      id: `legacy-${donation.id}`,
      beneficiaryRef,
      amount: Math.max(0, donation.valeurActuelle ?? donation.montant),
      label: donation.donataire,
    });

    return false;
  });

  return {
    donations: filteredDonations,
    particularLegaciesBySide,
  };
}
