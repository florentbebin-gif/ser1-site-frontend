import {
  isFamilyBranch,
  isFamilyMemberType,
  isLienParente,
  isObject,
} from './successionDraft.guards';
import type { FamilyMember, PersistedHeritierRow } from './successionDraft.types';

export function parsePersistedHeirs(rawHeritiers: unknown): PersistedHeritierRow[] {
  const heritiersRaw = Array.isArray(rawHeritiers) ? rawHeritiers : [];
  const heritiers = heritiersRaw
    .filter((heritier): heritier is Record<string, unknown> => isObject(heritier))
    .map((heritier) => ({
      lien: isLienParente(heritier.lien) ? heritier.lien : 'enfant',
      partSuccession: Number.isFinite(Number(heritier.partSuccession))
        ? Math.max(0, Number(heritier.partSuccession))
        : 0,
    }));

  return heritiers.length > 0 ? heritiers : [{ lien: 'enfant', partSuccession: 0 }];
}

export function parseFamilyMembers(rawFamilyMembers: unknown): FamilyMember[] {
  return (Array.isArray(rawFamilyMembers) ? rawFamilyMembers : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .filter((item) => isFamilyMemberType(item.type))
    .map((item, idx) => ({
      id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `mbr-${idx}`,
      type: item.type as FamilyMember['type'],
      branch: isFamilyBranch(item.branch) ? item.branch : undefined,
      parentEnfantId: typeof item.parentEnfantId === 'string' ? item.parentEnfantId : undefined,
    }));
}
