import type {
  FamilyMember,
  SituationMatrimoniale,
  SuccessionEnfant,
} from './successionDraft';

function isCoupleSituation(situation: SituationMatrimoniale): boolean {
  return situation === 'marie' || situation === 'pacse' || situation === 'concubinage';
}

export function canOpenDispositions(
  situation: SituationMatrimoniale,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): boolean {
  if (isCoupleSituation(situation)) return true;
  return enfants.length > 0 || familyMembers.length > 0;
}
