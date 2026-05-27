import { REGIMES_MATRIMONIAUX } from '@/engine/succession/civil';
import {
  CHOIX_LEGAL_CONJOINT_OPTIONS,
  DISPOSITION_TESTAMENTAIRE_OPTIONS,
  DONATION_ENTRE_EPOUX_OPTIONS,
  PACS_CONVENTION_OPTIONS,
  SITUATION_OPTIONS,
} from '../successionSimulator.constants';
import {
  computeFiliationOrgchartLayout,
  type FiliationOrgLayout,
} from '../filiationOrgchartLayout';
import type {
  FamilyMember,
  SituationMatrimoniale,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionDonationPartageAct,
  SuccessionEnfant,
  SuccessionPatrimonialContext,
  SuccessionPrimarySide,
} from '../successionDraft.types';
import { summarizeDonationPartageActs } from '../successionDonationPartage';

export interface SuccessionFamilyContextExport {
  situationLabel: string;
  regimeLabel?: string;
  pacsConventionLabel?: string;
  dispositions: string[];
  filiation: FiliationOrgLayout;
}

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

function optionLabel<T extends string>(
  options: Array<{ value: T | string; label: string }>,
  value: T | string | null | undefined,
): string | undefined {
  return options.find((option) => option.value === value)?.label;
}

function sideLabel(
  side: SuccessionPrimarySide,
  situationMatrimoniale: SituationMatrimoniale,
): string {
  if (situationMatrimoniale === 'pacse') {
    return side === 'epoux1' ? 'Partenaire 1' : 'Partenaire 2';
  }
  if (situationMatrimoniale === 'concubinage') {
    return side === 'epoux1' ? 'Personne 1' : 'Personne 2';
  }
  return side === 'epoux1' ? 'Époux 1' : 'Époux 2';
}

function getDonationDisplayAmount(entry: SuccessionDonationEntry): number {
  return entry.valeurActuelle ?? entry.valeurDonation ?? entry.montant ?? 0;
}

function buildDonationSummary(
  donationsContext: SuccessionDonationEntry[],
  donationPartageActs: SuccessionDonationPartageAct[] = [],
): string | null {
  const totals = new Map<SuccessionDonationEntry['type'], { count: number; total: number }>();

  for (const entry of donationsContext) {
    if (entry.type === 'donation_partage' && entry.sourceDonationPartageActId) continue;
    const amount = getDonationDisplayAmount(entry);
    const hasMeaningfulData =
      amount > 0 || Boolean(entry.date || entry.donateur || entry.donataire);
    if (!hasMeaningfulData) continue;

    const current = totals.get(entry.type) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += amount;
    totals.set(entry.type, current);
  }

  const parts = (['rapportable', 'hors_part', 'legs_particulier'] as const)
    .map((type) => {
      const current = totals.get(type);
      if (!current) return null;

      const baseLabel =
        type === 'rapportable'
          ? `${current.count} avance${current.count > 1 ? 's' : ''} de part successorale`
          : type === 'hors_part'
            ? `${current.count} donation${current.count > 1 ? 's' : ''} hors part`
            : `${current.count} legs particulier${current.count > 1 ? 's' : ''}`;

      return current.total > 0 ? `${baseLabel} (${fmtCurrency(current.total)})` : baseLabel;
    })
    .filter((value): value is string => value !== null);
  const donationPartageSummary = summarizeDonationPartageActs(donationPartageActs);
  if (donationPartageSummary) parts.push(donationPartageSummary);

  return parts.length > 0 ? `Donations antérieures : ${parts.join(' ; ')}` : null;
}

function buildDispositionSummaries(
  civilContext: SuccessionCivilContext,
  devolutionContext: SuccessionDevolutionContext,
  patrimonialContext: SuccessionPatrimonialContext,
  donationsContext: SuccessionDonationEntry[],
  donationPartageActs: SuccessionDonationPartageAct[] = [],
): string[] {
  const dispositions: string[] = [];
  const conjointDetails: string[] = [];

  if (patrimonialContext.donationEntreEpouxActive) {
    conjointDetails.push(
      `donation entre époux : ${optionLabel(DONATION_ENTRE_EPOUX_OPTIONS, patrimonialContext.donationEntreEpouxOption) ?? patrimonialContext.donationEntreEpouxOption}`,
    );
  }

  const choixLegal = devolutionContext.choixLegalConjointSansDDV;
  if (choixLegal) {
    conjointDetails.push(
      `choix du conjoint survivant : ${optionLabel(CHOIX_LEGAL_CONJOINT_OPTIONS, choixLegal) ?? choixLegal}`,
    );
  }

  if (conjointDetails.length > 0) {
    dispositions.push(`Protection du conjoint : ${conjointDetails.join(' ; ')}`);
  }

  const testaments: string[] = [];
  for (const side of ['epoux1', 'epoux2'] as const) {
    const testament = devolutionContext.testamentsBySide[side];
    if (!testament.active) continue;
    const label = optionLabel(DISPOSITION_TESTAMENTAIRE_OPTIONS, testament.dispositionType);
    testaments.push(
      `${sideLabel(side, civilContext.situationMatrimoniale)} : ${label ?? 'Disposition active'}`,
    );
  }

  if (testaments.length > 0) {
    dispositions.push(`Testament${testaments.length > 1 ? 's' : ''} : ${testaments.join(' ; ')}`);
  }

  const clauses: string[] = [];
  if (patrimonialContext.attributionIntegrale) {
    clauses.push('attribution intégrale au conjoint survivant');
  }
  if (
    patrimonialContext.preciputMontant > 0 ||
    patrimonialContext.preciputSelections.some((selection) => selection.enabled)
  ) {
    const enabledSelections = patrimonialContext.preciputSelections.filter(
      (selection) => selection.enabled,
    ).length;
    if (patrimonialContext.preciputMontant > 0) {
      clauses.push(
        `clause de préciput à hauteur de ${fmtCurrency(patrimonialContext.preciputMontant)}`,
      );
    } else if (enabledSelections > 0) {
      clauses.push(
        `clause de préciput sur ${enabledSelections} bien${enabledSelections > 1 ? 's' : ''}`,
      );
    }
  }
  if (patrimonialContext.stipulationContraireCU) {
    clauses.push('stipulation contraire en communauté universelle');
  }

  if (clauses.length > 0) {
    dispositions.push(`Clauses matrimoniales : ${clauses.join(' ; ')}`);
  }

  const donationSummary = buildDonationSummary(donationsContext, donationPartageActs);
  if (donationSummary) {
    dispositions.push(donationSummary);
  }

  const usufruitSuccessifCount = [
    ...donationsContext.filter(
      (donation) => donation.avecReserveUsufruit && donation.usufruitSuccessif,
    ),
    ...donationPartageActs.filter((act) => act.avecReserveUsufruit && act.usufruitSuccessif),
  ].length;
  if (usufruitSuccessifCount > 0) {
    dispositions.push(
      `Usufruit successif au conjoint/partenaire sur ${usufruitSuccessifCount} donation${usufruitSuccessifCount > 1 ? 's' : ''}`,
    );
  }

  return dispositions;
}

export function buildSuccessionFamilyContextExport({
  civilContext,
  devolutionContext,
  patrimonialContext,
  donationsContext,
  donationPartageActs,
  enfantsContext,
  familyMembers,
}: {
  civilContext: SuccessionCivilContext;
  devolutionContext: SuccessionDevolutionContext;
  patrimonialContext: SuccessionPatrimonialContext;
  donationsContext: SuccessionDonationEntry[];
  donationPartageActs?: SuccessionDonationPartageAct[];
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
}): SuccessionFamilyContextExport {
  return {
    situationLabel:
      optionLabel(SITUATION_OPTIONS, civilContext.situationMatrimoniale) ??
      civilContext.situationMatrimoniale,
    regimeLabel: civilContext.regimeMatrimonial
      ? REGIMES_MATRIMONIAUX[civilContext.regimeMatrimonial]?.label
      : undefined,
    pacsConventionLabel:
      civilContext.situationMatrimoniale === 'pacse'
        ? optionLabel(PACS_CONVENTION_OPTIONS, civilContext.pacsConvention)
        : undefined,
    dispositions: buildDispositionSummaries(
      civilContext,
      devolutionContext,
      patrimonialContext,
      donationsContext,
      donationPartageActs,
    ),
    filiation: computeFiliationOrgchartLayout(civilContext, enfantsContext, familyMembers),
  };
}
