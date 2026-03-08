import type { SuccessionEnfant, SuccessionEnfantRattachement, SituationMatrimoniale } from './successionDraft';

export function countLivingEnfants(enfants: SuccessionEnfant[]): number {
  return enfants.filter((enfant) => !enfant.deceased).length;
}

export function countLivingNonCommuns(enfants: SuccessionEnfant[]): number {
  return enfants.filter((enfant) => !enfant.deceased && enfant.rattachement !== 'commun').length;
}

export function getEnfantNodeLabel(index: number, deceased?: boolean): string {
  return `${deceased ? '†' : ''}E${index + 1}`;
}

export function getEnfantParentLabel(enfant: SuccessionEnfant, index: number): string {
  const baseLabel = enfant.prenom ?? getEnfantNodeLabel(index, enfant.deceased);
  return enfant.deceased ? `† ${baseLabel}` : baseLabel;
}

export function getEnfantRattachementOptions(
  situation: SituationMatrimoniale,
): Array<{ value: SuccessionEnfantRattachement; label: string }> {
  if (situation === 'marie') return [
    { value: 'commun', label: '◉ Enfant commun' },
    { value: 'epoux1', label: "○ Enfant de l'époux 1" },
    { value: 'epoux2', label: "○ Enfant de l'époux 2" },
  ];
  if (situation === 'pacse' || situation === 'concubinage') return [
    { value: 'commun', label: '◉ Enfant commun' },
    { value: 'epoux1', label: '○ Enfant du partenaire 1' },
    { value: 'epoux2', label: '○ Enfant du partenaire 2' },
  ];
  if (situation === 'divorce') return [
    { value: 'epoux1', label: '○ Enfant du/de la défunt(e)' },
    { value: 'commun', label: '◉ Enfant commun (ex-couple)' },
    { value: 'epoux2', label: "○ Enfant de l'ex-conjoint(e)" },
  ];
  return [{ value: 'epoux1', label: '○ Enfant du/de la défunt(e)' }];
}
