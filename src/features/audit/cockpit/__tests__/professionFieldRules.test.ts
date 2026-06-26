import { describe, expect, it } from 'vitest';

import type { PersonInfo } from '@/domain/audit/types';

import {
  buildProfessionFieldRules,
  isProfessionalSituationComplete,
  normalizeProfessionProfile,
} from '../professionFieldRules';

function person(overrides: Partial<PersonInfo> = {}): PersonInfo {
  return {
    prenom: '',
    nom: '',
    dateNaissance: '',
    ...overrides,
  };
}

function showProfession(rules: ReturnType<typeof buildProfessionFieldRules>): boolean | undefined {
  return rules.showProfession;
}

function showAvantagesNatureDivers(
  rules: ReturnType<typeof buildProfessionFieldRules>,
): boolean | undefined {
  return (rules as { showAvantagesNatureDivers?: boolean }).showAvantagesNatureDivers;
}

function showProfessionLiberaleReglementeeBadge(
  rules: ReturnType<typeof buildProfessionFieldRules>,
): boolean | undefined {
  return rules.showProfessionLiberaleReglementeeBadge;
}

describe('professionFieldRules', () => {
  it('affiche toujours le statut social comme pivot racine', () => {
    const rules = buildProfessionFieldRules(person({ natureActivite: 'sans_activite' }));

    expect(rules.showStatutSocial).toBe(true);
    expect(rules.statutSocialOptions.map((option) => option.value)).toEqual([
      '',
      'salarie_non_cadre_prive',
      'salarie_cadre_prive',
      'salarie_non_cadre_agricole',
      'salarie_cadre_agricole',
      'salarie_non_titulaire_etat',
      'clerc_notaire',
      'fonctionnaire',
      'expert_comptable_salarie',
      'avocat_salarie',
      'tns_article_62',
      'tns_individuel',
      'assimile_salarie',
      'micro_entrepreneur',
      'chomage',
      'maladie_invalidite',
      'retraite',
      'militaire',
      'sans_activite',
    ]);
    expect(
      rules.statutSocialOptions.map((option) => (option as { group?: string }).group ?? null),
    ).toEqual([
      null,
      'Activités salariées',
      'Activités salariées',
      'Activités salariées',
      'Activités salariées',
      'Activités salariées',
      'Activités salariées',
      'Activités salariées',
      'Activités salariées',
      'Activités salariées',
      'Activités chef d’entreprise',
      'Activités chef d’entreprise',
      'Activités chef d’entreprise',
      'Activités chef d’entreprise',
      'Autres',
      'Autres',
      'Autres',
      'Autres',
      'Autres',
    ]);
    expect(rules.showCaisseRetraite).toBe(false);
    expect(showProfession(rules)).toBe(false);
  });

  it('force le régime général pour un assimilé salarié et masque les champs TNS', () => {
    const input = person({
      statutSocial: 'assimile_salarie',
      caisseRetraite: 'carmf',
      statutConventionnel: 'secteur_1',
      tauxPriseEnChargeCpam: 80,
    });

    const rules = buildProfessionFieldRules(input);
    const normalized = normalizeProfessionProfile(input);

    expect(rules.showCaisseRetraite).toBe(true);
    expect(rules.caisseRetraiteOptions.map((option) => option.value)).toEqual([
      '',
      'regime_general',
    ]);
    expect(rules.forcedCaisseRetraite).toBe('regime_general');
    expect(rules.showFichePaieButton).toBe(true);
    expect(showAvantagesNatureDivers(rules)).not.toBe(true);
    expect(normalized).toMatchObject({
      natureActivite: 'salarie',
      caisseRetraite: 'regime_general',
      statutConventionnel: undefined,
      tauxPriseEnChargeCpam: undefined,
    });
  });

  it('affiche le mode d’exercice uniquement pour un TNS individuel et initialise le mandat IS', () => {
    const input = person({
      statutSocial: 'tns_individuel',
      modeExercice: 'societe_is',
    });

    const rules = buildProfessionFieldRules(input);

    expect(rules.showModeExercice).toBe(true);
    expect(rules.showRemunerationMandatPct).toBe(true);
    expect(rules.caisseRetraiteOptions.map((option) => option.value)).toContain('ssi_commercant');
    expect(rules.caisseRetraiteOptions.map((option) => option.value)).toContain('crn');
    expect(normalizeProfessionProfile(input)).toMatchObject({
      natureActivite: 'tns_independant',
      remunerationMandatPct: 5,
    });
  });

  it('range les caisses TNS avec MSA juste après les SSI puis le reste en ordre alphabétique', () => {
    const rules = buildProfessionFieldRules(person({ statutSocial: 'tns_article_62' }));

    expect(rules.caisseRetraiteOptions.map((option) => option.value)).toEqual([
      '',
      'ssi_commercant',
      'ssi_artisan',
      'msa',
      'carcd',
      'carmf',
      'carpimko',
      'carpv',
      'carsf',
      'cavamac',
      'cavec',
      'cavp',
      'cipav',
      'cnbf',
      'crn',
    ]);
  });

  it('masque et nettoie la rémunération du mandat pour commerçant, artisan et MSA', () => {
    for (const caisseRetraite of ['ssi_commercant', 'ssi_artisan', 'msa'] as const) {
      const input = person({
        statutSocial: 'tns_individuel',
        modeExercice: 'societe_is',
        caisseRetraite,
        remunerationMandatPct: 5,
      });
      const rules = buildProfessionFieldRules(input);
      const normalized = normalizeProfessionProfile(input);

      expect(rules.showRemunerationMandatPct).toBe(false);
      expect(normalized.remunerationMandatPct).toBeUndefined();
    }
  });

  it('identifie les caisses de professions libérales réglementées avec leur catégorie', () => {
    for (const caisseRetraite of [
      'carcd',
      'carsf',
      'carmf',
      'carpimko',
      'carpv',
      'cavamac',
      'cavec',
      'cavp',
      'cnbf',
      'crn',
    ] as const) {
      const rules = buildProfessionFieldRules(
        person({ statutSocial: 'tns_article_62', caisseRetraite }),
      );

      expect(showProfessionLiberaleReglementeeBadge(rules)).toBe(true);
      expect(rules.professionLiberaleCategorie).toBeDefined();
      expect(rules.professionLiberaleReglementeeBadgeLabels[0]).toBe('PLR');
    }

    for (const caisseRetraite of ['ssi_commercant', 'ssi_artisan', 'msa'] as const) {
      const rules = buildProfessionFieldRules(
        person({ statutSocial: 'tns_article_62', caisseRetraite }),
      );

      expect(showProfessionLiberaleReglementeeBadge(rules)).toBe(false);
    }
  });

  it('rend le PLR optionnel pour la CIPAV et affiche les catégories possibles', () => {
    const inactive = person({ statutSocial: 'tns_article_62', caisseRetraite: 'cipav' });
    const inactiveRules = buildProfessionFieldRules(inactive);

    expect(inactiveRules.showProfessionLiberaleReglementeeControl).toBe(true);
    expect(inactiveRules.professionLiberaleReglementeeActivationMode).toBe('manual');
    expect(inactiveRules.showProfessionLiberaleReglementeeBadge).toBe(false);
    expect(inactiveRules.professionLiberaleCategorieOptions.map((option) => option.value)).toEqual([
      '',
      'sante',
      'juridique_judiciaire',
      'technique_cadre_vie',
    ]);
    expect(normalizeProfessionProfile(inactive)).toMatchObject({
      professionLiberaleReglementee: undefined,
      professionLiberaleCategorie: undefined,
    });

    const active = person({
      statutSocial: 'tns_article_62',
      caisseRetraite: 'cipav',
      professionLiberaleReglementee: true,
      professionLiberaleCategorie: 'technique_cadre_vie',
    });
    const activeRules = buildProfessionFieldRules(active);

    expect(activeRules.showProfessionLiberaleReglementeeBadge).toBe(true);
    expect(activeRules.professionLiberaleReglementeeBadgeLabels).toEqual([
      'PLR',
      'Technique et cadre de vie',
    ]);
    expect(normalizeProfessionProfile(active)).toMatchObject({
      professionLiberaleReglementee: true,
      professionLiberaleCategorie: 'technique_cadre_vie',
    });
  });

  it('classe CARPIMKO en santé et CAVAMAC en technique et cadre de vie', () => {
    const carpimko = normalizeProfessionProfile(
      person({ statutSocial: 'tns_article_62', caisseRetraite: 'carpimko' }),
    );
    const cavamac = normalizeProfessionProfile(
      person({ statutSocial: 'tns_article_62', caisseRetraite: 'cavamac' }),
    );

    expect(carpimko).toMatchObject({
      professionLiberaleReglementee: true,
      professionLiberaleCategorie: 'sante',
    });
    expect(buildProfessionFieldRules(carpimko).professionLiberaleReglementeeBadgeLabels).toEqual([
      'PLR',
      'Santé',
    ]);
    expect(cavamac).toMatchObject({
      professionLiberaleReglementee: true,
      professionLiberaleCategorie: 'technique_cadre_vie',
    });
    expect(buildProfessionFieldRules(cavamac).professionLiberaleReglementeeBadgeLabels).toEqual([
      'PLR',
      'Technique et cadre de vie',
    ]);
  });

  it('traite le micro entrepreneur comme un indépendant sans mode d’exercice', () => {
    const input = person({
      statutSocial: 'micro_entrepreneur' as PersonInfo['statutSocial'],
      modeExercice: 'societe_is',
      remunerationMandatPct: 5,
      caisseRetraite: 'carmf',
      statutConventionnel: 'secteur_1',
      tauxPriseEnChargeCpam: 100,
    });

    const rules = buildProfessionFieldRules(input);
    const normalized = normalizeProfessionProfile(input);

    expect(showProfession(rules)).toBe(true);
    expect(rules.showModeExercice).toBe(false);
    expect(rules.showRemunerationMandatPct).toBe(false);
    expect(rules.showCaisseRetraite).toBe(true);
    expect(rules.showStatutConventionnel).toBe(true);
    expect(rules.showTauxPriseEnChargeCpam).toBe(true);
    expect(normalized).toMatchObject({
      natureActivite: 'micro_entreprise',
      modeExercice: undefined,
      remunerationMandatPct: undefined,
      caisseRetraite: 'carmf',
    });
  });

  it('limite les salariés et fonctionnaires au libellé de profession', () => {
    for (const statutSocial of [
      'salarie_cadre_prive',
      'salarie_non_titulaire_etat',
      'clerc_notaire',
      'fonctionnaire',
      'expert_comptable_salarie',
      'avocat_salarie',
    ] as const) {
      const input = person({
        statutSocial: statutSocial as PersonInfo['statutSocial'],
        caisseRetraite: 'carmf',
        statutConventionnel: 'secteur_1',
        tauxPriseEnChargeCpam: 100,
        fichePaieAssimileSalarie: { tauxActivitePct: 100 },
      });
      const rules = buildProfessionFieldRules(input);
      const normalized = normalizeProfessionProfile(input);

      expect(showProfession(rules)).toBe(true);
      expect(rules.showCaisseRetraite).toBe(false);
      expect(rules.showFichePaieButton).toBe(false);
      expect(rules.showStatutConventionnel).toBe(false);
      expect(normalized).toMatchObject({
        natureActivite: 'salarie',
        caisseRetraite: undefined,
        statutConventionnel: undefined,
        tauxPriseEnChargeCpam: undefined,
        fichePaieAssimileSalarie: undefined,
      });
    }
  });

  it('révèle les champs conventionnés et CPAM selon la caisse médicale', () => {
    const carcd = person({
      statutSocial: 'tns_article_62',
      caisseRetraite: 'carcd',
      statutConventionnel: 'oui',
      tauxPriseEnChargeCpam: 100,
    });
    const carmfNon = person({
      statutSocial: 'tns_article_62',
      caisseRetraite: 'carmf',
      statutConventionnel: 'non_conventionne',
      tauxPriseEnChargeCpam: 70,
    });

    expect(
      buildProfessionFieldRules(carcd).statutConventionnelOptions.map((option) => option.value),
    ).toEqual(['', 'non_conventionne', 'oui']);
    expect(buildProfessionFieldRules(carcd).showTauxPriseEnChargeCpam).toBe(true);
    expect(buildProfessionFieldRules(carmfNon).showTauxPriseEnChargeCpam).toBe(false);
    expect(normalizeProfessionProfile(carmfNon)).toMatchObject({
      statutConventionnel: 'non_conventionne',
      tauxPriseEnChargeCpam: undefined,
    });
  });

  it('révèle les groupes spécifiques par caisse et nettoie les valeurs impossibles', () => {
    const input = person({
      statutSocial: 'tns_article_62',
      caisseRetraite: 'crn',
      classePrevoyance: 'carpv_maximum',
      classeRetraite: 'cnbf_c2',
      moyenneProduitsEtude: 300000,
      commissionsBrutes: 90000,
      atexa: 'c',
    });

    const rules = buildProfessionFieldRules(input);
    const normalized = normalizeProfessionProfile(input);

    expect(rules.showCrnFields).toBe(true);
    expect(rules.showClassePrevoyance).toBe(false);
    expect(rules.showCommissionsBrutes).toBe(false);
    expect(rules.showAtexa).toBe(false);
    expect(normalized).toMatchObject({
      moyenneProduitsEtude: 300000,
      classePrevoyance: undefined,
      classeRetraite: undefined,
      commissionsBrutes: undefined,
      atexa: undefined,
    });
  });

  it('masque profession et caisse pour les statuts sans activité professionnelle saisissable', () => {
    for (const statutSocial of [
      'chomage',
      'maladie_invalidite',
      'retraite',
      'militaire',
      'sans_activite',
    ] as const) {
      const normalized = normalizeProfessionProfile(
        person({
          statutSocial: statutSocial as PersonInfo['statutSocial'],
          profession: 'Ancienne profession',
          caisseRetraite: 'carmf',
          modeExercice: 'societe_is',
          remunerationMandatPct: 5,
        }),
      );
      const rules = buildProfessionFieldRules(normalized);

      expect(rules.showCaisseRetraite).toBe(false);
      expect(showProfession(rules)).toBe(false);
      expect(rules.showModeExercice).toBe(false);
      expect(normalized.caisseRetraite).toBeUndefined();
      expect(normalized.modeExercice).toBeUndefined();
      expect(normalized.profession).toBeUndefined();
    }
  });

  it('n’expose plus les avantages en nature divers dans le profil professionnel', () => {
    const rules = buildProfessionFieldRules(
      person({ statutSocial: 'tns_article_62', caisseRetraite: 'carmf' }),
    );

    expect(showAvantagesNatureDivers(rules)).not.toBe(true);
  });

  it('considère la situation professionnelle incomplète si le libellé requis manque', () => {
    expect(isProfessionalSituationComplete(person({ statutSocial: 'salarie_cadre_prive' }))).toBe(
      false,
    );
    expect(
      isProfessionalSituationComplete(
        person({ statutSocial: 'salarie_cadre_prive', profession: 'Directrice financière' }),
      ),
    ).toBe(true);
    expect(isProfessionalSituationComplete(person({ statutSocial: 'retraite' }))).toBe(true);
  });
});
