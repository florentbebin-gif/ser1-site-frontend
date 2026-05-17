import type { FamilyMember, FamilyMemberType, SuccessionEnfant } from './successionDraft';
import { CLAUSE_CONJOINT_LABEL, CLAUSE_ENFANTS_LABEL } from './successionSimulator.constants';

export type ClauseBeneficiairePreset =
  | 'conjoint_enfants'
  | 'enfants_parts_egales'
  | 'personnalisee';

export function getClausePreset(clause?: string): ClauseBeneficiairePreset {
  if (!clause || clause === CLAUSE_CONJOINT_LABEL) return 'conjoint_enfants';
  if (clause === CLAUSE_ENFANTS_LABEL) return 'enfants_parts_egales';
  return 'personnalisee';
}

export function parseCustomClause(clause: string): Record<string, number> {
  if (!clause.startsWith('CUSTOM:')) return {};

  const result: Record<string, number> = {};
  for (const part of clause.slice(7).split(';')) {
    const sep = part.indexOf(':');
    if (sep > 0) {
      result[part.slice(0, sep)] = Number(part.slice(sep + 1)) || 0;
    }
  }

  return result;
}

export function serializeCustomClause(parts: Record<string, number>): string {
  return (
    'CUSTOM:' +
    Object.entries(parts)
      .map(([id, pct]) => `${id}:${pct}`)
      .join(';')
  );
}

function getGenericFamilyMemberTypeLabel(type: FamilyMemberType): string {
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

export function buildPrevoyanceClauseOptions(
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [
    { value: CLAUSE_CONJOINT_LABEL, label: 'Clause standard' },
  ];

  if (enfantsContext.length > 0) {
    options.push({ value: CLAUSE_ENFANTS_LABEL, label: 'Enfants par parts égales' });
    enfantsContext.forEach((enfant, index) => {
      options.push({
        value: serializeCustomClause({ [enfant.id]: 100 }),
        label: `${enfant.deceased ? '† ' : ''}Enfant ${index + 1}`,
      });
    });
  }

  const counts: Partial<Record<FamilyMemberType, number>> = {};
  familyMembers.forEach((member) => {
    const nextCount = (counts[member.type] ?? 0) + 1;
    counts[member.type] = nextCount;
    options.push({
      value: serializeCustomClause({ [member.id]: 100 }),
      label: `${getGenericFamilyMemberTypeLabel(member.type)} ${nextCount}`,
    });
  });

  return options;
}
