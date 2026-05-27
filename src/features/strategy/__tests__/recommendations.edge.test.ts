import { describe, expect, it } from 'vitest';
import { createEmptyDossier } from '../../audit/types';
import { generateRecommendations } from '../utils/recommendations';

describe('recommendations edge cases', () => {
  it('ne génère aucune recommandation sans objectif client', () => {
    const dossier = createEmptyDossier();

    expect(generateRecommendations(dossier)).toEqual([]);
  });

  it('ne recommande pas le PER fiscal si la TMI est sous le seuil', () => {
    const dossier = createEmptyDossier();
    dossier.objectifs = ['reduire_fiscalite'];
    dossier.situationFiscale.tmi = 0;

    const recommandations = generateRecommendations(dossier);

    expect(recommandations.some((recommandation) => recommandation.id === 'reco-per-ir')).toBe(
      false,
    );
  });
});
