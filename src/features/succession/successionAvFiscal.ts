import { calculateSuccession, type LienParente } from '../../engine/succession';
import type {
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionEnfant,
} from './successionDraft';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import {
  getEnfantParentLabel,
  getPetitEnfantsRepresentants,
} from './successionEnfants';
import { getUsufruitRateFromAge } from './successionUsufruit';

const CLAUSE_CONJOINT_LABEL = 'Conjoint survivant, à défaut enfants, à défaut héritiers';
const CLAUSE_ENFANTS_LABEL = 'Les enfants par parts égales';

type AvBeneficiaryKey = 'conjoint' | 'autre' | string;

interface AvBeneficiaryTarget {
  id: AvBeneficiaryKey;
  label: string;
  lien: LienParente;
  isExempt: boolean;
  allowance990IRatio?: number;
}

interface AvBeneficiaryShare extends AvBeneficiaryTarget {
  ratio: number;
}

interface SideAnalysis {
  totalCapitauxDeces: number;
  totalDroits: number;
  lines: SuccessionAvFiscalLine[];
  warnings: string[];
}

export interface SuccessionAvFiscalLine {
  id: string;
  label: string;
  lien: LienParente;
  capitauxAvant70: number;
  capitauxApres70: number;
  taxable990I: number;
  droits990I: number;
  taxable757B: number;
  droits757B: number;
  totalDroits: number;
  netTransmis: number;
}

export interface SuccessionAvFiscalPerAssure {
  capitauxDeces: number;
  totalDroits: number;
  lines: SuccessionAvFiscalLine[];
}

export interface SuccessionAvFiscalAnalysis {
  totalCapitauxDeces: number;
  totalDroits: number;
  totalNetTransmis: number;
  lines: SuccessionAvFiscalLine[];
  byAssure: Record<'epoux1' | 'epoux2', SuccessionAvFiscalPerAssure>;
  warnings: string[];
}

function asAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function parseCustomClause(clause: string): Record<string, number> {
  if (!clause.startsWith('CUSTOM:')) return {};
  const result: Record<string, number> = {};
  for (const part of clause.slice(7).split(';')) {
    const sep = part.indexOf(':');
    if (sep > 0) result[part.slice(0, sep)] = Number(part.slice(sep + 1)) || 0;
  }
  return result;
}

function getClausePreset(clause?: string): 'conjoint_enfants' | 'enfants_parts_egales' | 'personnalisee' {
  if (!clause || clause === CLAUSE_CONJOINT_LABEL) return 'conjoint_enfants';
  if (clause === CLAUSE_ENFANTS_LABEL) return 'enfants_parts_egales';
  return 'personnalisee';
}

function findMember(
  id: string,
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): AvBeneficiaryTarget | null {
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
      label: getEnfantParentLabel(enfant, enfantIndex),
      lien: 'enfant',
      isExempt: false,
    };
  }

  const member = familyMembers.find((item) => item.id === id);
  if (!member) return null;

  if (member.type === 'petit_enfant') {
    return { id, label: 'Petit-enfant', lien: 'petit_enfant', isExempt: false };
  }
  if (member.type === 'parent') {
    return { id, label: 'Parent', lien: 'parent', isExempt: false };
  }
  if (member.type === 'frere_soeur') {
    return { id, label: 'Frère / sœur', lien: 'frere_soeur', isExempt: false };
  }
  if (member.type === 'oncle_tante') {
    return { id, label: 'Oncle / tante', lien: 'autre', isExempt: false };
  }
  return { id, label: 'Tierce personne', lien: 'autre', isExempt: false };
}

function buildCustomClauseTargets(
  clause: string,
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  warnings: string[],
): AvBeneficiaryShare[] {
  const parts = parseCustomClause(clause);
  const entries = Object.entries(parts).filter(([, pct]) => pct > 0);
  if (entries.length === 0) return [];

  const rawShares: AvBeneficiaryShare[] = [];
  for (const [id, pct] of entries) {
    const enfantIndex = enfants.findIndex((item) => item.id === id);
    const enfant = enfantIndex >= 0 ? enfants[enfantIndex] : null;

    if (enfant?.deceased) {
      const representants = getPetitEnfantsRepresentants(id, familyMembers);
      if (representants.length === 0) {
        warnings.push(`Clause assurance-vie personnalisée: ${getEnfantParentLabel(enfant, enfantIndex)} est décédé sans petit-enfant représentant, part ignorée.`);
        continue;
      }
      warnings.push('Clause assurance-vie personnalisée: part d’un enfant décédé ventilée entre ses petits-enfants à titre indicatif.');
      representants.forEach((representant) => {
        rawShares.push({
          id: representant.id,
          label: 'Petit-enfant',
          lien: 'petit_enfant',
          isExempt: false,
          ratio: pct / representants.length,
        });
      });
      continue;
    }

    const target = findMember(id, civil, enfants, familyMembers);
    if (!target) {
      warnings.push(`Clause assurance-vie personnalisée: bénéficiaire "${id}" non reconnu, part ignorée.`);
      continue;
    }
    rawShares.push({ ...target, ratio: pct });
  }

  const total = rawShares.reduce((sum, item) => sum + item.ratio, 0);
  if (total <= 0) return [];
  if (Math.abs(total - 100) > 0.01) {
    warnings.push('Clause assurance-vie personnalisée: répartition normalisée car la somme des pourcentages diffère de 100%.');
  }

  return rawShares.map((item) => ({ ...item, ratio: item.ratio / total }));
}

function buildClauseShares(
  entry: SuccessionAssuranceVieEntry,
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  warnings: string[],
): AvBeneficiaryShare[] {
  const preset = getClausePreset(entry.clauseBeneficiaire);

  if (preset === 'personnalisee') {
    return buildCustomClauseTargets(entry.clauseBeneficiaire ?? 'CUSTOM:', civil, enfants, familyMembers, warnings);
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
    warnings.push('Clause assurance-vie standard "conjoint puis enfants" sans conjoint/partenaire reconnu: repli sur les enfants vivants.');
  }

  const livingChildren = enfants
    .map((enfant, index) => ({ enfant, index }))
    .filter(({ enfant }) => !enfant.deceased);

  if (livingChildren.length === 0) {
    warnings.push('Assurance-vie sans bénéficiaire descendant vivant identifiable: fiscalité non détaillée pour ce contrat.');
    return [];
  }

  const ratio = 1 / livingChildren.length;
  return livingChildren.map(({ enfant, index }) => ({
    id: enfant.id,
    label: enfant.prenom ?? getEnfantParentLabel(enfant, index),
    lien: 'enfant' as const,
    isExempt: false,
    ratio,
  }));
}

function compute990ITax(
  taxableBase: number,
  snapshot: SuccessionFiscalSnapshot,
): number {
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

function buildSideAnalysis(
  entries: SuccessionAssuranceVieEntry[],
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  snapshot: SuccessionFiscalSnapshot,
): SideAnalysis {
  const warnings: string[] = [];
  const before70ByBeneficiary = new Map<string, { target: AvBeneficiaryTarget; amount: number }>();
  const after70ByBeneficiary = new Map<string, { target: AvBeneficiaryTarget; amount: number }>();

  entries.forEach((entry) => {
    const capitauxDeces = asAmount(entry.capitauxDeces);
    const versementsApres70 = Math.min(capitauxDeces, asAmount(entry.versementsApres70));
    const capitauxAvant70 = Math.max(0, capitauxDeces - versementsApres70);

    if (entry.versementsApres70 > entry.capitauxDeces) {
      warnings.push('Assurance-vie: versements après 70 ans plafonnés aux capitaux décès saisis.');
    }

    // Clause démembrée : ventilation art. 669 CGI
    if (entry.typeContrat === 'demembree') {
      if (entry.ageUsufruitier != null) {
        const tauxUsufruit = getUsufruitRateFromAge(entry.ageUsufruitier);
        const tauxNuProp = 1 - tauxUsufruit;
        const preset = getClausePreset(entry.clauseBeneficiaire);
        const isConjointLike = civil.situationMatrimoniale === 'marie' || civil.situationMatrimoniale === 'pacse';

        if (preset === 'conjoint_enfants' && isConjointLike) {
          warnings.push(
            `Clause démembrée: ventilation art. 669 CGI — usufruit ${Math.round(tauxUsufruit * 100)}% (conjoint exonéré), nu-propriété ${Math.round(tauxNuProp * 100)}% (enfants).`,
          );

          // Usufruit → conjoint (exonéré)
          const conjointId = 'conjoint';
          const conjointTarget: AvBeneficiaryTarget = {
            id: conjointId,
            label: civil.situationMatrimoniale === 'pacse' ? 'Partenaire' : 'Conjoint(e)',
            lien: 'conjoint',
            isExempt: true,
            allowance990IRatio: tauxUsufruit,
          };
          const conjointAvant70 = capitauxAvant70 * tauxUsufruit;
          const conjointApres70 = versementsApres70 * tauxUsufruit;
          const beforeConjoint = before70ByBeneficiary.get(conjointId);
          if (beforeConjoint) beforeConjoint.amount += conjointAvant70;
          else before70ByBeneficiary.set(conjointId, { target: conjointTarget, amount: conjointAvant70 });
          const afterConjoint = after70ByBeneficiary.get(conjointId);
          if (afterConjoint) afterConjoint.amount += conjointApres70;
          else after70ByBeneficiary.set(conjointId, { target: conjointTarget, amount: conjointApres70 });

          // Nu-propriété → enfants (parts égales parmi enfants vivants)
          const livingChildren = enfants
            .map((enfant, index) => ({ enfant, index }))
            .filter(({ enfant }) => !enfant.deceased);
          if (livingChildren.length === 0) {
            warnings.push('Clause démembrée: aucun enfant vivant identifié pour la nu-propriété.');
          } else {
            const ratioPerChild = tauxNuProp / livingChildren.length;
            livingChildren.forEach(({ enfant, index }) => {
              const childTarget: AvBeneficiaryTarget = {
                id: enfant.id,
                label: enfant.prenom ?? getEnfantParentLabel(enfant, index),
                lien: 'enfant',
                isExempt: false,
                allowance990IRatio: tauxNuProp,
              };
              const childAvant70 = capitauxAvant70 * ratioPerChild;
              const childApres70 = versementsApres70 * ratioPerChild;
              const beforeChild = before70ByBeneficiary.get(enfant.id);
              if (beforeChild) beforeChild.amount += childAvant70;
              else before70ByBeneficiary.set(enfant.id, { target: childTarget, amount: childAvant70 });
              const afterChild = after70ByBeneficiary.get(enfant.id);
              if (afterChild) afterChild.amount += childApres70;
              else after70ByBeneficiary.set(enfant.id, { target: childTarget, amount: childApres70 });
            });
          }
          return;
        }
        warnings.push('Clause démembrée avec clause non standard: ventilation art. 669 non appliquée, traitement simplifié.');
      } else {
        warnings.push('Clause démembrée: saisissez l\'âge de l\'usufruitier pour appliquer la ventilation art. 669 CGI.');
      }
    }

    // Chemin standard
    const entryWarnings: string[] = [];
    const shares = buildClauseShares(entry, civil, enfants, familyMembers, entryWarnings);
    warnings.push(...entryWarnings);
    if (shares.length === 0) return;

    shares.forEach((share) => {
      const before70Amount = capitauxAvant70 * share.ratio;
      const after70Amount = versementsApres70 * share.ratio;

      const beforeRow = before70ByBeneficiary.get(share.id);
      if (beforeRow) beforeRow.amount += before70Amount;
      else before70ByBeneficiary.set(share.id, { target: share, amount: before70Amount });

      const afterRow = after70ByBeneficiary.get(share.id);
      if (afterRow) afterRow.amount += after70Amount;
      else after70ByBeneficiary.set(share.id, { target: share, amount: after70Amount });
    });
  });

  const totalAfter70TaxableGross = Array.from(after70ByBeneficiary.values()).reduce(
    (sum, row) => sum + (row.target.isExempt ? 0 : row.amount),
    0,
  );
  const globalAllowance = snapshot.avDeces.apres70ans.globalAllowance;
  const lineIds = new Set<string>([
    ...before70ByBeneficiary.keys(),
    ...after70ByBeneficiary.keys(),
  ]);

  const lines = Array.from(lineIds).map((id) => {
    const before70Row = before70ByBeneficiary.get(id);
    const after70Row = after70ByBeneficiary.get(id);
    const target = before70Row?.target ?? after70Row?.target;
    if (!target) {
      throw new Error(`Beneficiary target missing for insurance analysis (${id})`);
    }

    const capitauxAvant70 = before70Row?.amount ?? 0;
    const capitauxApres70 = after70Row?.amount ?? 0;
    const allowance990I = snapshot.avDeces.primesApres1998.allowancePerBeneficiary
      * Math.max(0, Math.min(1, target.allowance990IRatio ?? 1));
    const taxable990I = target.isExempt
      ? 0
      : Math.max(0, capitauxAvant70 - allowance990I);
    const droits990I = target.isExempt ? 0 : compute990ITax(taxable990I, snapshot);

    const allowanceShare = !target.isExempt && totalAfter70TaxableGross > 0
      ? globalAllowance * (capitauxApres70 / totalAfter70TaxableGross)
      : 0;
    const taxable757B = target.isExempt
      ? 0
      : Math.max(0, capitauxApres70 - allowanceShare);
    const droits757B = target.isExempt ? 0 : compute757BTax(taxable757B, target.lien, snapshot);
    const totalDroits = droits990I + droits757B;

    return {
      id,
      label: target.label,
      lien: target.lien,
      capitauxAvant70,
      capitauxApres70,
      taxable990I,
      droits990I,
      taxable757B,
      droits757B,
      totalDroits,
      netTransmis: Math.max(0, capitauxAvant70 + capitauxApres70 - totalDroits),
    };
  });

  return {
    totalCapitauxDeces: entries.reduce((sum, entry) => sum + asAmount(entry.capitauxDeces), 0),
    totalDroits: lines.reduce((sum, line) => sum + line.totalDroits, 0),
    lines,
    warnings,
  };
}

function mergeLines(
  epoux1Lines: SuccessionAvFiscalLine[],
  epoux2Lines: SuccessionAvFiscalLine[],
): SuccessionAvFiscalLine[] {
  const merged = new Map<string, SuccessionAvFiscalLine>();

  [...epoux1Lines, ...epoux2Lines].forEach((line) => {
    const current = merged.get(line.id);
    if (!current) {
      merged.set(line.id, { ...line });
      return;
    }
    current.capitauxAvant70 += line.capitauxAvant70;
    current.capitauxApres70 += line.capitauxApres70;
    current.taxable990I += line.taxable990I;
    current.droits990I += line.droits990I;
    current.taxable757B += line.taxable757B;
    current.droits757B += line.droits757B;
    current.totalDroits += line.totalDroits;
    current.netTransmis += line.netTransmis;
  });

  return Array.from(merged.values()).sort((a, b) => b.netTransmis - a.netTransmis);
}

export function buildSuccessionAvFiscalAnalysis(
  entries: SuccessionAssuranceVieEntry[],
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  snapshot: SuccessionFiscalSnapshot,
): SuccessionAvFiscalAnalysis {
  const sideEpoux1 = buildSideAnalysis(
    entries.filter((entry) => entry.assure === 'epoux1'),
    civil,
    enfants,
    familyMembers,
    snapshot,
  );
  const sideEpoux2 = buildSideAnalysis(
    entries.filter((entry) => entry.assure === 'epoux2'),
    civil,
    enfants,
    familyMembers,
    snapshot,
  );

  const totalCapitauxDeces = sideEpoux1.totalCapitauxDeces + sideEpoux2.totalCapitauxDeces;
  const totalDroits = sideEpoux1.totalDroits + sideEpoux2.totalDroits;
  const warnings = Array.from(new Set([
    ...sideEpoux1.warnings,
    ...sideEpoux2.warnings,
    ...(entries.length > 0
      ? ['Assurance-vie décès: ventilation fiscale simplifiée à partir de la clause bénéficiaire et des montants saisis.']
      : []),
  ]));

  return {
    totalCapitauxDeces,
    totalDroits,
    totalNetTransmis: Math.max(0, totalCapitauxDeces - totalDroits),
    lines: mergeLines(sideEpoux1.lines, sideEpoux2.lines),
    byAssure: {
      epoux1: {
        capitauxDeces: sideEpoux1.totalCapitauxDeces,
        totalDroits: sideEpoux1.totalDroits,
        lines: sideEpoux1.lines,
      },
      epoux2: {
        capitauxDeces: sideEpoux2.totalCapitauxDeces,
        totalDroits: sideEpoux2.totalDroits,
        lines: sideEpoux2.lines,
      },
    },
    warnings,
  };
}
