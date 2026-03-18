import { calculateSuccession, type LienParente } from '../../engine/succession';
import type {
  FamilyMember,
  FamilyMemberType,
  SuccessionCivilContext,
  SuccessionEnfant,
  SuccessionPrevoyanceDecesEntry,
} from './successionDraft.types';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import { getPetitEnfantsRepresentants } from './successionEnfants';
import {
  CLAUSE_CONJOINT_LABEL,
} from './successionSimulator.constants';
import {
  getClausePreset,
  isSupportedStructuredClause,
  parseCustomClause,
} from './successionSimulator.helpers';

type PrevoyanceBeneficiaryKey = 'autre' | 'conjoint' | string;

interface PrevoyanceBeneficiaryTarget {
  id: PrevoyanceBeneficiaryKey;
  label: string;
  lien: LienParente;
  isExempt: boolean;
}

interface PrevoyanceBeneficiaryShare extends PrevoyanceBeneficiaryTarget {
  ratio: number;
}

interface SideAnalysis {
  totalCapitalDeces: number;
  totalDernierePrimeTaxable: number;
  totalDroits: number;
  lines: SuccessionPrevoyanceFiscalLine[];
  warnings: string[];
}

export interface SuccessionPrevoyanceFiscalLine {
  id: string;
  label: string;
  lien: LienParente;
  capitalTransmis: number;
  primeTaxableAvant70: number;
  primeTaxableApres70: number;
  taxable990I: number;
  droits990I: number;
  taxable757B: number;
  droits757B: number;
  totalDroits: number;
  netTransmis: number;
}

export interface SuccessionPrevoyanceFiscalPerAssure {
  capitalDeces: number;
  dernierePrimeTaxable: number;
  totalDroits: number;
  lines: SuccessionPrevoyanceFiscalLine[];
}

export interface SuccessionPrevoyanceFiscalAnalysis {
  totalCapitalDeces: number;
  totalDernierePrimeTaxable: number;
  totalDroits: number;
  totalNetTransmis: number;
  lines: SuccessionPrevoyanceFiscalLine[];
  byAssure: Record<'epoux1' | 'epoux2', SuccessionPrevoyanceFiscalPerAssure>;
  warnings: string[];
}

function asAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function getAgeAtDate(birthDate: string | undefined, referenceDate: Date): number | null {
  if (!birthDate) return null;
  const parsedBirthDate = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(parsedBirthDate.getTime())) return null;

  const years = referenceDate.getUTCFullYear() - parsedBirthDate.getUTCFullYear();
  const birthMonth = parsedBirthDate.getUTCMonth();
  const birthDay = parsedBirthDate.getUTCDate();
  const refMonth = referenceDate.getUTCMonth();
  const refDay = referenceDate.getUTCDate();
  const age = years - (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay) ? 1 : 0);

  return age >= 0 ? age : null;
}

function getChildLabel(enfant: SuccessionEnfant, index: number): string {
  return `${enfant.deceased ? '† ' : ''}Enfant ${index + 1}`;
}

function getFamilyMemberTypeLabel(type: FamilyMemberType): string {
  switch (type) {
    case 'petit_enfant':
      return 'Petit-enfant';
    case 'parent':
      return 'Parent';
    case 'frere_soeur':
      return 'Frère / sœur';
    case 'oncle_tante':
      return 'Oncle / tante';
    case 'tierce_personne':
      return 'Tierce personne';
    default:
      return 'Membre';
  }
}

function getFamilyMemberLabel(member: FamilyMember, familyMembers: FamilyMember[]): string {
  const matches = familyMembers.filter((item) => item.type === member.type);
  const index = matches.findIndex((item) => item.id === member.id);
  const ordinal = index >= 0 ? index + 1 : 1;
  return `${getFamilyMemberTypeLabel(member.type)} ${ordinal}`;
}

function findMember(
  id: string,
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): PrevoyanceBeneficiaryTarget | null {
  if (id === 'conjoint') {
    const isConjointLike = civil.situationMatrimoniale === 'marie' || civil.situationMatrimoniale === 'pacse';
    return {
      id,
      label: civil.situationMatrimoniale === 'pacse' ? 'Partenaire' : 'Conjoint(e)',
      lien: isConjointLike ? 'conjoint' : 'autre',
      isExempt: isConjointLike,
    };
  }
  if (id === 'autre') {
    return { id, label: 'Autre bénéficiaire', lien: 'autre', isExempt: false };
  }

  const enfantIndex = enfants.findIndex((enfant) => enfant.id === id);
  if (enfantIndex >= 0) {
    const enfant = enfants[enfantIndex];
    return {
      id,
      label: getChildLabel(enfant, enfantIndex),
      lien: 'enfant',
      isExempt: false,
    };
  }

  const member = familyMembers.find((item) => item.id === id);
  if (!member) return null;

  if (member.type === 'petit_enfant') {
    return { id, label: getFamilyMemberLabel(member, familyMembers), lien: 'petit_enfant', isExempt: false };
  }
  if (member.type === 'parent') {
    return { id, label: getFamilyMemberLabel(member, familyMembers), lien: 'parent', isExempt: false };
  }
  if (member.type === 'frere_soeur') {
    return { id, label: getFamilyMemberLabel(member, familyMembers), lien: 'frere_soeur', isExempt: false };
  }
  return { id, label: getFamilyMemberLabel(member, familyMembers), lien: 'autre', isExempt: false };
}

function buildCustomClauseTargets(
  clause: string,
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  warnings: string[],
): PrevoyanceBeneficiaryShare[] {
  const parts = parseCustomClause(clause);
  const entries = Object.entries(parts).filter(([, pct]) => pct > 0);
  if (entries.length === 0) return [];

  const rawShares: PrevoyanceBeneficiaryShare[] = [];
  for (const [id, pct] of entries) {
    const enfantIndex = enfants.findIndex((item) => item.id === id);
    const enfant = enfantIndex >= 0 ? enfants[enfantIndex] : null;

    if (enfant?.deceased) {
      const representants = getPetitEnfantsRepresentants(id, familyMembers);
      if (representants.length === 0) {
        warnings.push(`Clause prévoyance décès personnalisée: ${getChildLabel(enfant, enfantIndex)} est décédé sans petit-enfant représentant, part ignorée.`);
        continue;
      }
      warnings.push('Clause prévoyance décès personnalisée: part d’un enfant décédé ventilée entre ses petits-enfants à titre indicatif.');
      representants.forEach((representant) => {
        const target = findMember(representant.id, civil, enfants, familyMembers);
        if (!target) return;
        rawShares.push({
          ...target,
          ratio: pct / representants.length,
        });
      });
      continue;
    }

    const target = findMember(id, civil, enfants, familyMembers);
    if (!target) {
      warnings.push(`Clause prévoyance décès personnalisée: bénéficiaire "${id}" non reconnu, part ignorée.`);
      continue;
    }
    rawShares.push({ ...target, ratio: pct });
  }

  const total = rawShares.reduce((sum, item) => sum + item.ratio, 0);
  if (total <= 0) return [];
  if (Math.abs(total - 100) > 0.01) {
    warnings.push('Clause prévoyance décès personnalisée: répartition normalisée car la somme des pourcentages diffère de 100%.');
  }

  return rawShares.map((item) => ({ ...item, ratio: item.ratio / total }));
}

function buildClauseShares(
  entry: SuccessionPrevoyanceDecesEntry,
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  warnings: string[],
): PrevoyanceBeneficiaryShare[] {
  const clause = entry.clauseBeneficiaire;
  const normalizedClause = isSupportedStructuredClause(clause) ? clause : CLAUSE_CONJOINT_LABEL;
  if (clause && normalizedClause !== clause) {
    warnings.push('Clause prévoyance décès libre non supportée: repli sur la clause standard pour le calcul.');
  }

  const preset = getClausePreset(normalizedClause);
  if (preset === 'personnalisee') {
    return buildCustomClauseTargets(normalizedClause ?? 'CUSTOM:', civil, enfants, familyMembers, warnings);
  }

  if (preset === 'conjoint_enfants') {
    if (civil.situationMatrimoniale === 'marie' || civil.situationMatrimoniale === 'pacse') {
      return [{
        id: 'conjoint',
        label: civil.situationMatrimoniale === 'pacse' ? 'Partenaire' : 'Conjoint(e)',
        lien: 'conjoint',
        isExempt: true,
        ratio: 1,
      }];
    }
    warnings.push('Clause prévoyance décès standard "conjoint puis enfants" sans conjoint/partenaire reconnu: repli sur les enfants vivants.');
  }

  const livingChildren = enfants
    .map((enfant, index) => ({ enfant, index }))
    .filter(({ enfant }) => !enfant.deceased);

  if (livingChildren.length === 0) {
    warnings.push('Prévoyance décès sans bénéficiaire descendant vivant identifiable: fiscalité non détaillée pour ce contrat.');
    return [];
  }

  const ratio = 1 / livingChildren.length;
  return livingChildren.map(({ enfant, index }) => ({
    id: enfant.id,
    label: getChildLabel(enfant, index),
    lien: 'enfant' as const,
    isExempt: false,
    ratio,
  }));
}

function compute990ITax(taxableBase: number, snapshot: SuccessionFiscalSnapshot): number {
  if (taxableBase <= 0) return 0;
  const brackets = snapshot.avDeces.primesApres1998.brackets;
  let previousCeiling = 0;
  let tax = 0;

  for (const bracket of brackets) {
    const upperBound = bracket.upTo ?? Infinity;
    if (taxableBase <= previousCeiling) break;
    const tranche = Math.min(taxableBase, upperBound) - previousCeiling;
    if (tranche > 0) {
      tax += tranche * (bracket.ratePercent / 100);
      previousCeiling = upperBound;
    }
  }

  return Math.round(tax);
}

function compute757BTax(
  taxableBase: number,
  lien: LienParente,
  snapshot: SuccessionFiscalSnapshot,
): number {
  if (taxableBase <= 0) return 0;
  return calculateSuccession({
    actifNetSuccession: taxableBase,
    heritiers: [{ lien, partSuccession: taxableBase }],
    dmtgSettings: snapshot.dmtgSettings,
  }).result.totalDroits;
}

function mergeLineMaps(
  store: Map<string, { amount: number; target: PrevoyanceBeneficiaryTarget }>,
  share: PrevoyanceBeneficiaryShare,
  amount: number,
): void {
  const current = store.get(share.id);
  if (current) {
    current.amount += amount;
    return;
  }
  store.set(share.id, { amount, target: share });
}

function buildSideAnalysis(
  entries: SuccessionPrevoyanceDecesEntry[],
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  snapshot: SuccessionFiscalSnapshot,
  referenceDate: Date,
): SideAnalysis {
  const warnings: string[] = [];
  const grossBefore70ByBeneficiary = new Map<string, { target: PrevoyanceBeneficiaryTarget; amount: number }>();
  const grossAfter70ByBeneficiary = new Map<string, { target: PrevoyanceBeneficiaryTarget; amount: number }>();
  const primeBefore70ByBeneficiary = new Map<string, { target: PrevoyanceBeneficiaryTarget; amount: number }>();
  const primeAfter70ByBeneficiary = new Map<string, { target: PrevoyanceBeneficiaryTarget; amount: number }>();

  entries.forEach((entry) => {
    const capitalDeces = asAmount(entry.capitalDeces);
    const dernierePrimeSaisie = asAmount(entry.dernierePrime);
    const dernierePrimeTaxable = Math.min(capitalDeces, dernierePrimeSaisie);
    if (dernierePrimeSaisie > capitalDeces) {
      warnings.push('Prévoyance décès: dernière prime plafonnée au capital décès saisi pour éviter une base taxable incohérente.');
    }

    const birthDate = entry.assure === 'epoux1'
      ? civil.dateNaissanceEpoux1
      : civil.dateNaissanceEpoux2;
    const ageAtDeath = getAgeAtDate(birthDate, referenceDate);
    const assumeBefore70 = ageAtDeath == null;
    if (ageAtDeath == null) {
      warnings.push(`Prévoyance décès: date de naissance manquante pour ${entry.assure}, hypothèse par défaut d'un décès avant 70 ans.`);
    }

    const capitalAvant70 = assumeBefore70 || ageAtDeath < 70 ? capitalDeces : 0;
    const capitalApres70 = assumeBefore70 || ageAtDeath < 70 ? 0 : capitalDeces;
    const primeAvant70 = assumeBefore70 || ageAtDeath < 70 ? dernierePrimeTaxable : 0;
    const primeApres70 = assumeBefore70 || ageAtDeath < 70 ? 0 : dernierePrimeTaxable;
    const shares = buildClauseShares(entry, civil, enfants, familyMembers, warnings);
    if (shares.length === 0) return;

    shares.forEach((share) => {
      mergeLineMaps(grossBefore70ByBeneficiary, share, capitalAvant70 * share.ratio);
      mergeLineMaps(grossAfter70ByBeneficiary, share, capitalApres70 * share.ratio);
      mergeLineMaps(primeBefore70ByBeneficiary, share, primeAvant70 * share.ratio);
      mergeLineMaps(primeAfter70ByBeneficiary, share, primeApres70 * share.ratio);
    });
  });

  const totalAfter70PrimeTaxable = Array.from(primeAfter70ByBeneficiary.values()).reduce(
    (sum, row) => sum + (row.target.isExempt ? 0 : row.amount),
    0,
  );
  const globalAllowance = snapshot.avDeces.apres70ans.globalAllowance;
  const lineIds = new Set<string>([
    ...grossBefore70ByBeneficiary.keys(),
    ...grossAfter70ByBeneficiary.keys(),
    ...primeBefore70ByBeneficiary.keys(),
    ...primeAfter70ByBeneficiary.keys(),
  ]);

  const lines = Array.from(lineIds).map((id) => {
    const grossBefore70Row = grossBefore70ByBeneficiary.get(id);
    const grossAfter70Row = grossAfter70ByBeneficiary.get(id);
    const primeBefore70Row = primeBefore70ByBeneficiary.get(id);
    const primeAfter70Row = primeAfter70ByBeneficiary.get(id);
    const target = grossBefore70Row?.target
      ?? grossAfter70Row?.target
      ?? primeBefore70Row?.target
      ?? primeAfter70Row?.target;

    if (!target) {
      throw new Error(`Beneficiary target missing for prevoyance analysis (${id})`);
    }

    const capitalTransmis = (grossBefore70Row?.amount ?? 0) + (grossAfter70Row?.amount ?? 0);
    const primeTaxableAvant70 = primeBefore70Row?.amount ?? 0;
    const primeTaxableApres70 = primeAfter70Row?.amount ?? 0;
    const taxable990I = target.isExempt
      ? 0
      : Math.max(0, primeTaxableAvant70 - snapshot.avDeces.primesApres1998.allowancePerBeneficiary);
    const droits990I = target.isExempt ? 0 : compute990ITax(taxable990I, snapshot);
    const allowanceShare = !target.isExempt && totalAfter70PrimeTaxable > 0
      ? globalAllowance * (primeTaxableApres70 / totalAfter70PrimeTaxable)
      : 0;
    const taxable757B = target.isExempt
      ? 0
      : Math.max(0, primeTaxableApres70 - allowanceShare);
    const droits757B = target.isExempt ? 0 : compute757BTax(taxable757B, target.lien, snapshot);
    const totalDroits = droits990I + droits757B;

    return {
      id,
      label: target.label,
      lien: target.lien,
      capitalTransmis,
      primeTaxableAvant70,
      primeTaxableApres70,
      taxable990I,
      droits990I,
      taxable757B,
      droits757B,
      totalDroits,
      netTransmis: Math.max(0, capitalTransmis - totalDroits),
    };
  }).sort((a, b) => b.capitalTransmis - a.capitalTransmis);

  return {
    totalCapitalDeces: entries.reduce((sum, entry) => sum + asAmount(entry.capitalDeces), 0),
    totalDernierePrimeTaxable: entries.reduce((sum, entry) => sum + Math.min(asAmount(entry.capitalDeces), asAmount(entry.dernierePrime)), 0),
    totalDroits: lines.reduce((sum, line) => sum + line.totalDroits, 0),
    lines,
    warnings,
  };
}

function mergeLines(
  epoux1Lines: SuccessionPrevoyanceFiscalLine[],
  epoux2Lines: SuccessionPrevoyanceFiscalLine[],
): SuccessionPrevoyanceFiscalLine[] {
  const merged = new Map<string, SuccessionPrevoyanceFiscalLine>();

  [...epoux1Lines, ...epoux2Lines].forEach((line) => {
    const current = merged.get(line.id);
    if (!current) {
      merged.set(line.id, { ...line });
      return;
    }
    current.capitalTransmis += line.capitalTransmis;
    current.primeTaxableAvant70 += line.primeTaxableAvant70;
    current.primeTaxableApres70 += line.primeTaxableApres70;
    current.taxable990I += line.taxable990I;
    current.droits990I += line.droits990I;
    current.taxable757B += line.taxable757B;
    current.droits757B += line.droits757B;
    current.totalDroits += line.totalDroits;
    current.netTransmis += line.netTransmis;
  });

  return Array.from(merged.values()).sort((a, b) => b.capitalTransmis - a.capitalTransmis);
}

export function buildSuccessionPrevoyanceFiscalAnalysis(
  entries: SuccessionPrevoyanceDecesEntry[],
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  snapshot: SuccessionFiscalSnapshot,
  referenceDate: Date,
): SuccessionPrevoyanceFiscalAnalysis {
  const sideEpoux1 = buildSideAnalysis(
    entries.filter((entry) => entry.assure === 'epoux1'),
    civil,
    enfants,
    familyMembers,
    snapshot,
    referenceDate,
  );
  const sideEpoux2 = buildSideAnalysis(
    entries.filter((entry) => entry.assure === 'epoux2'),
    civil,
    enfants,
    familyMembers,
    snapshot,
    referenceDate,
  );

  const totalCapitalDeces = sideEpoux1.totalCapitalDeces + sideEpoux2.totalCapitalDeces;
  const totalDernierePrimeTaxable = sideEpoux1.totalDernierePrimeTaxable + sideEpoux2.totalDernierePrimeTaxable;
  const totalDroits = sideEpoux1.totalDroits + sideEpoux2.totalDroits;

  return {
    totalCapitalDeces,
    totalDernierePrimeTaxable,
    totalDroits,
    totalNetTransmis: Math.max(0, totalCapitalDeces - totalDroits),
    lines: mergeLines(sideEpoux1.lines, sideEpoux2.lines),
    byAssure: {
      epoux1: {
        capitalDeces: sideEpoux1.totalCapitalDeces,
        dernierePrimeTaxable: sideEpoux1.totalDernierePrimeTaxable,
        totalDroits: sideEpoux1.totalDroits,
        lines: sideEpoux1.lines,
      },
      epoux2: {
        capitalDeces: sideEpoux2.totalCapitalDeces,
        dernierePrimeTaxable: sideEpoux2.totalDernierePrimeTaxable,
        totalDroits: sideEpoux2.totalDroits,
        lines: sideEpoux2.lines,
      },
    },
    warnings: Array.from(new Set([
      ...sideEpoux1.warnings,
      ...sideEpoux2.warnings,
      ...(entries.length > 0
        ? ['Prévoyance décès: ventilation fiscale simplifiée sur la base du capital décès transmis et de la seule dernière prime taxable.']
        : []),
    ])),
  };
}

export type { PrevoyanceBeneficiaryTarget, PrevoyanceBeneficiaryShare };
