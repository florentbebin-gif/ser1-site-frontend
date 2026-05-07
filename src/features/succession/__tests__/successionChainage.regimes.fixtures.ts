import { DEFAULT_DMTG } from '../../../engine/civil';
import type { FamilyMember, SuccessionEnfant } from '../successionDraft';

export const DMTG_SETTINGS = DEFAULT_DMTG;

export const ENFANTS_COMMUNS: SuccessionEnfant[] = [
  { id: 'E1', rattachement: 'commun' },
  { id: 'E2', rattachement: 'commun' },
];

export const NO_FAMILY_MEMBERS: FamilyMember[] = [];
