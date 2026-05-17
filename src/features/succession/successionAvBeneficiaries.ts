import type { LienParente } from '../../engine/succession';
import type {
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionEnfant,
} from './successionDraft';
import { getEnfantParentLabel, getPetitEnfantsRepresentants } from './successionEnfants';
import { getClausePreset, parseCustomClause } from './successionClauseOptions';

export type AvBeneficiaryKey = 'conjoint' | 'autre' | string;

export interface AvBeneficiaryTarget {
  id: AvBeneficiaryKey;
  label: string;
  lien: LienParente;
  isExempt: boolean;
  allowance990IRatio?: number;
}

export interface AvBeneficiaryShare extends AvBeneficiaryTarget {
  ratio: number;
}

function findMember(
  id: string,
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): AvBeneficiaryTarget | null {
  if (id === 'conjoint') {
    const isConjointLike =
      civil.situationMatrimoniale === 'marie' || civil.situationMatrimoniale === 'pacse';
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
  const enfant = enfantIndex >= 0 ? enfants[enfantIndex] : undefined;
  if (enfant) {
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
        warnings.push(
          `Clause assurance-vie personnalisée: ${getEnfantParentLabel(enfant, enfantIndex)} est décédé sans petit-enfant représentant, part ignorée.`,
        );
        continue;
      }
      warnings.push(
        'Clause assurance-vie personnalisée: part d’un enfant décédé ventilée entre ses petits-enfants à titre indicatif.',
      );
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
      warnings.push(
        `Clause assurance-vie personnalisée: bénéficiaire "${id}" non reconnu, part ignorée.`,
      );
      continue;
    }
    rawShares.push({ ...target, ratio: pct });
  }

  const total = rawShares.reduce((sum, item) => sum + item.ratio, 0);
  if (total <= 0) return [];
  if (Math.abs(total - 100) > 0.01) {
    warnings.push(
      'Clause assurance-vie personnalisée: répartition normalisée car la somme des pourcentages diffère de 100%.',
    );
  }

  return rawShares.map((item) => ({ ...item, ratio: item.ratio / total }));
}

export function buildClauseShares(
  entry: SuccessionAssuranceVieEntry,
  civil: SuccessionCivilContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  warnings: string[],
): AvBeneficiaryShare[] {
  const preset = getClausePreset(entry.clauseBeneficiaire);

  if (preset === 'personnalisee') {
    return buildCustomClauseTargets(
      entry.clauseBeneficiaire ?? 'CUSTOM:',
      civil,
      enfants,
      familyMembers,
      warnings,
    );
  }

  if (preset === 'conjoint_enfants') {
    if (civil.situationMatrimoniale === 'marie' || civil.situationMatrimoniale === 'pacse') {
      return [
        {
          id: 'conjoint',
          label: civil.situationMatrimoniale === 'pacse' ? 'Partenaire' : 'Conjoint(e)',
          lien: 'conjoint',
          isExempt: true,
          ratio: 1,
        },
      ];
    }
    warnings.push(
      'Clause assurance-vie standard "conjoint puis enfants" sans conjoint/partenaire reconnu: repli sur les enfants vivants.',
    );
  }

  const livingChildren = enfants
    .map((enfant, index) => ({ enfant, index }))
    .filter(({ enfant }) => !enfant.deceased);

  if (livingChildren.length === 0) {
    warnings.push(
      'Assurance-vie sans bénéficiaire descendant vivant identifiable: fiscalité non détaillée pour ce contrat.',
    );
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
