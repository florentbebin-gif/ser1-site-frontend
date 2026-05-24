import { describe, expect, it } from 'vitest';
import { prevoyanceRegimeSettingsSchema } from '../schema';

function sources(organisme: string, titre: string, url: string, valeursCouvertes: string[]) {
  return {
    references: [
      {
        organisme,
        titre,
        url,
        dateConsultation: '2026-05-24',
        valeursCouvertes,
        confiance: 'haute' as const,
      },
    ],
  };
}

const goldenRegimes = [
  {
    code: 'salarie-cpam',
    label: 'Salarié secteur privé — CPAM',
    caisse: 'CPAM',
    population: 'salarie',
    defaultContractKind: 'collectif',
    year: 2026,
    data: {
      arret: {
        carences: {
          maladie: 3,
          accident: 3,
          hospitalisation: 3,
        },
        maxDurationDays: 1095,
        paliers: [
          {
            fromDay: 4,
            toDay: 1095,
            label: 'IJSS — 50% du salaire journalier moyen plafonné à 1,4 SMIC',
            amount: {
              mode: 'fixed_eur_day',
              value: 41.95,
              unit: '€/jour brut max',
              label: 'Max 41,95 €/j 2026',
            },
          },
        ],
        notes: [
          "Durée max 12 mois sur 3 ans glissants (3 ans en cas d'ALD).",
          'Conditions : avoir travaillé 150 h sur 3 mois ou cotisé sur 1015 SMIC horaire sur 6 mois.',
          "Pas de carence en cas de reprise d'activité < 48 h ou d'ALD.",
        ],
      },
      invalidite: {
        paliers: [
          {
            fromRate: 66,
            toRate: null,
            label: "Catégorie 1 — capable d'exercer une activité",
            amount: {
              mode: 'percent_salary',
              value: 30,
              unit: '% du salaire annuel moyen 10 meilleures années (plafonné PASS)',
              label: 'Cat 1 : 4 059,72 € min / 14 418 € max 2026',
            },
            category: '1',
          },
          {
            fromRate: 66,
            toRate: null,
            label: "Catégorie 2 — incapable d'exercer toute activité",
            amount: {
              mode: 'percent_salary',
              value: 50,
              unit: '% du salaire annuel moyen 10 meilleures années (plafonné PASS)',
              label: 'Cat 2 : 4 059,72 € min / 24 030 € max 2026',
            },
            category: '2',
          },
          {
            fromRate: 66,
            toRate: null,
            label: 'Catégorie 3 — incapacité totale + tierce personne',
            amount: {
              mode: 'percent_salary',
              value: 50,
              unit: '% du salaire + majoration tierce personne',
              label: 'Cat 3 : 19 641 € min / 39 611,28 € max 2026',
            },
            category: '3',
          },
        ],
        notes: [
          'Seuil de déclenchement : 2/3 (66%).',
          "Versement jusqu'à l'âge légal de retraite (62 ans), prorogeable à 67 ans si activité.",
          "Cumul pension + revenus plafonné à l'ancien salaire.",
        ],
      },
      deces: {
        capital: {
          mode: 'fixed_eur_year',
          value: 4009,
          label: 'Capital décès forfaitaire 2026 (revalorisé en avril)',
        },
        doublementAccident: false,
        doubleEffet: false,
        renteConjoint: null,
        renteEducation: null,
        notes: ['Bénéficiaires : conjoint/PACS > enfants > ascendants.'],
      },
      cotisations: {
        mode: 'percent_salary',
        value: 13,
        assiette: 'TA-TB-TC',
        min: null,
        max: null,
        repartition: {
          employeur: 100,
          salarie: 0,
        },
        madelinEligible: false,
        notes: [
          'Taux réduit à 7% si rémunération brute ≤ 2,5 SMIC (non ouvert aux assimilés salariés).',
          'Cotisation supplémentaire en régime local Alsace-Moselle.',
        ],
      },
    },
    sources: sources(
      'Ameli',
      'Invalidité, arrêt maladie et capital décès',
      'https://www.ameli.fr/assure/remboursements/pensions-allocations-rentes/invalidite',
      ['arret', 'invalidite', 'deces', 'cotisations'],
    ),
  },
  {
    code: 'ssi-artisan-commercant',
    label: 'Artisan / commerçant — SSI',
    caisse: 'SSI',
    population: 'tns',
    defaultContractKind: 'individuel',
    year: 2026,
    data: {
      arret: {
        carences: {
          maladie: 3,
          accident: 3,
          hospitalisation: 3,
        },
        maxDurationDays: 1095,
        paliers: [
          {
            fromDay: 4,
            toDay: 1095,
            label: 'IJ SSI — 1/730 revenu moyen 3 ans plafonné PASS',
            amount: {
              mode: 'fixed_eur_day',
              value: 65.84,
              unit: '€/jour max',
              label: 'Max 65,84 €/j 2026 — Min 26,33 €/j (cotisation min)',
            },
          },
        ],
        notes: [
          'Durée 360 jours sur 3 ans glissants.',
          'Reprise activité temps partiel : versement maintenu 90 jours, montant divisé par 2.',
          "Condition : 12 mois d'affiliation continue (sauf passage régime général sans interruption).",
        ],
      },
      invalidite: {
        paliers: [
          {
            fromRate: 66,
            toRate: null,
            label: 'PIPM — Pension Incapacité Partielle au Métier',
            amount: {
              mode: 'percent_income',
              value: 30,
              unit: '% revenu annuel moyen 10 meilleures années',
              label: '6 362,52 € min / 14 418 € max 2026',
            },
            category: 'PIPM',
          },
          {
            fromRate: 66,
            toRate: null,
            label: 'PITD — Pension Invalidité Totale et Définitive',
            amount: {
              mode: 'percent_income',
              value: 50,
              label: '8 964 € min / 24 030 € max 2026',
            },
            category: 'PITD',
          },
          {
            fromRate: 66,
            toRate: null,
            label: 'PITD + Majoration Tierce Personne',
            amount: {
              mode: 'percent_income',
              value: 50,
              label: '24 545,28 € min / 39 611,28 € max 2026',
            },
            category: 'PITD+MTP',
          },
        ],
      },
      deces: {
        capital: {
          mode: 'fixed_eur_year',
          value: 9612,
          label: '20% du PASS 2026 = 9 612 € (+5% PASS par enfant < 16 ans à charge)',
        },
        doublementAccident: false,
        doubleEffet: false,
        renteConjoint: null,
        renteEducation: null,
      },
      cotisations: {
        mode: 'percent_income',
        value: 1.3,
        assiette: 'TA',
        min: 11.5,
        max: null,
        repartition: null,
        madelinEligible: true,
        notes: [
          'Bloc invalidité-décès : 1,3% revenu plafonné 1 PASS, assiette min 11,5% PASS.',
          'Cotisation arrêt IJ séparée : 0,85% revenu plafonné 5 PASS, assiette min 40% PASS.',
        ],
      },
    },
    sources: sources(
      'Ameli',
      'Indépendant : indemnités journalières et invalidité',
      'https://www.ameli.fr/assure/remboursements/indemnites-journalieres/arret-maladie-independants',
      ['arret', 'invalidite', 'deces', 'cotisations'],
    ),
  },
  {
    code: 'carmf',
    label: 'Médecin — CARMF',
    caisse: 'CARMF',
    population: 'liberal',
    defaultContractKind: 'individuel',
    year: 2026,
    data: {
      arret: {
        carences: {
          maladie: 90,
          accident: 90,
          hospitalisation: 90,
        },
        maxDurationDays: 1095,
        paliers: [
          {
            fromDay: 91,
            toDay: 1095,
            label: 'IJ médecin < 62 ans — classe A',
            amount: {
              mode: 'fixed_eur_day',
              value: 65.84,
              label: 'Classe A : 65,84 €/j 2026',
            },
          },
          {
            fromDay: 91,
            toDay: 1095,
            label: 'IJ médecin < 62 ans — classe B',
            amount: {
              mode: 'formula',
              value: null,
              label: 'Classe B : 1/730ième des revenus',
            },
          },
          {
            fromDay: 91,
            toDay: 1095,
            label: 'IJ médecin < 62 ans — classe C',
            amount: {
              mode: 'fixed_eur_day',
              value: 197.51,
              label: 'Classe C : 197,51 €/j 2026',
            },
          },
        ],
        notes: [
          'Carence 90 jours.',
          'Barème dégressif 62-69 ans : 100% / 75% / 50% selon année.',
          '70+ ans : 50% du taux normal.',
          "Versement cesse en cas de reprise d'activité, même à temps partiel.",
        ],
      },
      invalidite: {
        paliers: [
          {
            fromRate: 100,
            toRate: null,
            label: 'Invalidité totale et définitive — classe A',
            amount: {
              mode: 'fixed_eur_year',
              value: 23662,
              label: 'Classe A : 23 662 €/an 2026',
            },
            category: 'A',
          },
          {
            fromRate: 100,
            toRate: null,
            label: 'Invalidité totale et définitive — classe B',
            amount: {
              mode: 'formula',
              value: null,
              label: 'Classe B : variable selon revenus',
            },
            category: 'B',
          },
          {
            fromRate: 100,
            toRate: null,
            label: 'Invalidité totale et définitive — classe C',
            amount: {
              mode: 'fixed_eur_year',
              value: 31549,
              label: 'Classe C : 31 549 €/an 2026',
            },
            category: 'C',
          },
        ],
        notes: [
          "Versement uniquement si incapacité totale et définitive (pas d'invalidité partielle).",
          'Majoration +35% si tierce personne ou conjoint < 25 001,60 € de revenus.',
          'Majoration +10% si ≥ 3 enfants.',
          'Rente éducation par enfant identique à la rente décès.',
        ],
      },
      deces: {
        capital: {
          mode: 'fixed_eur_year',
          value: 71500,
          label: 'Capital décès forfaitaire 71 500 € 2026',
        },
        doublementAccident: false,
        doubleEffet: false,
        renteConjoint: {
          mode: 'fixed_eur_year',
          value: 12835,
          label: 'Moyenne 8 557,20 € à 17 114,40 €/an 2026 selon points cotisés',
        },
        renteEducation: {
          mode: 'fixed_eur_year',
          value: 10078.48,
          label: "10 078,48 €/an 2026 par enfant (jusqu'à 18 ans, 25 si études)",
        },
        notes: [
          'Rente conjoint majorée +10% si conjoint a eu ≥ 3 enfants.',
          "Conjoint marié ≥ 2 ans (dérogation si enfant à charge), versée jusqu'à 60 ans.",
        ],
      },
      cotisations: {
        mode: 'formula',
        value: null,
        assiette: 'TA',
        repartition: null,
        madelinEligible: true,
        notes: [
          'Classe A (revenus < 1 PASS) : 626 € 2026.',
          'Classe B (revenus < 3 PASS) : 434 € + 0,4% revenus 2026.',
          'Classe C (revenus > 3 PASS) : 1 010 € 2026.',
          "Début d'activité : 2 premières années en classe A.",
        ],
      },
    },
    sources: sources('CARMF', 'Régime invalidité décès 2026', 'https://www.carmf.fr', [
      'arret',
      'invalidite',
      'deces',
      'cotisations',
    ]),
  },
  {
    code: 'cnbf',
    label: 'Avocat — CNBF',
    caisse: 'CNBF',
    population: 'avocat',
    defaultContractKind: 'individuel',
    year: 2026,
    data: {
      arret: {
        carences: {
          maladie: 90,
          accident: 90,
          hospitalisation: 90,
        },
        maxDurationDays: 1095,
        paliers: [
          {
            fromDay: 91,
            toDay: 1095,
            label: 'IJ avocat CNBF',
            amount: {
              mode: 'fixed_eur_day',
              value: 90,
              label: '90 €/j forfaitaire 2026',
            },
          },
        ],
        notes: [
          'Garanties complémentaires LPA ou AON pour les 90 premiers jours (selon barreau).',
          "Condition : 12 mois d'affiliation, cessation totale d'activité.",
        ],
      },
      invalidite: {
        paliers: [
          {
            fromRate: 100,
            toRate: null,
            label: "Invalidité totale et définitive < 20 ans d'affiliation",
            amount: {
              mode: 'fixed_eur_year',
              value: 9577,
              label: '9 577 €/an 2026 = 50% retraite forfaitaire',
            },
          },
          {
            fromRate: 100,
            toRate: null,
            label: "Invalidité totale et définitive ≥ 20 ans d'affiliation",
            amount: {
              mode: 'formula',
              value: null,
              label: '50% de la retraite de base proportionnelle',
            },
          },
        ],
        notes: [
          "Prise en charge après 1095 jours d'arrêt de travail.",
          'Garanties complémentaires LPA/AON pour invalidité partielle.',
        ],
      },
      deces: {
        capital: {
          mode: 'fixed_eur_year',
          value: 50000,
          label: 'Capital décès 50 000 € 2026',
        },
        doublementAccident: false,
        doubleEffet: false,
        renteConjoint: null,
        renteEducation: {
          mode: 'fixed_eur_year',
          value: 4789,
          label: '25% retraite forfaitaire = 4 789 €/an 2026 + 25% points complémentaires',
        },
        notes: ['Pas de rente conjoint dans le régime obligatoire.'],
      },
      cotisations: {
        mode: 'fixed_eur',
        value: 170,
        assiette: 'TA',
        repartition: null,
        madelinEligible: true,
        notes: [
          "68 € les 4 premières années d'affiliation puis 170 € pour 2026.",
          'Cotisation forfaitaire supplémentaire versée par le Barreau pour chaque avocat non-salarié.',
        ],
      },
    },
    sources: sources('CNBF', 'Prévoyance avocat 2026', 'https://www.cnbf.fr', [
      'arret',
      'invalidite',
      'deces',
      'cotisations',
    ]),
  },
] as const;

describe('seed prévoyance 2026 golden', () => {
  it('valide quatre régimes représentatifs sourcés', () => {
    for (const regime of goldenRegimes) {
      const parsed = prevoyanceRegimeSettingsSchema.safeParse(regime);
      expect(parsed.success, regime.code).toBe(true);
    }
  });

  it('fige quelques valeurs métier structurantes', () => {
    const byCode = new Map(goldenRegimes.map((regime) => [regime.code, regime]));
    expect(byCode.get('salarie-cpam')?.data.arret.paliers[0]?.amount.value).toBe(41.95);
    expect(byCode.get('ssi-artisan-commercant')?.data.deces.capital.label).toContain('20% du PASS');
    expect(byCode.get('carmf')?.data.arret.paliers).toHaveLength(3);
    expect(byCode.get('cnbf')?.data.cotisations.mode).toBe('fixed_eur');
  });
});
