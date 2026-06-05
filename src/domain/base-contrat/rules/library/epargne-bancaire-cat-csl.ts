/**
 * domain/base-contrat/rules/library/epargne-bancaire-cat-csl.ts
 *
 * Règles fiscales — comptes à terme, comptes sur livret et comptes courants de dépôt.
 */

import type { ProductRules } from '../types';

export const CAT_CSL: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        'Pas de plafond légal de versements.',
        'Accessible aux personnes physiques et morales.',
        'Rémunération librement négociée (taux du marché).',
        'À confirmer selon la source officielle ou contractuelle applicable.',
      ],
      tags: ['no_plafond', 'pp_pm_eligible'],
      confidence: 'moyenne',
      dependencies: ['source officielle ou contractuelle applicable'],
    },
  ],
  sortie: [
    {
      title: 'Fiscalité des intérêts',
      bullets: [
        'Intérêts soumis au {pfu}.',
        "Option possible pour le barème progressif de l'IR.",
        'À confirmer selon la source officielle ou contractuelle applicable.',
      ],
      tags: ['pfu', 'option_bareme'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 200 A CGI — PFU',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122',
        },
      ],
      dependencies: ['source officielle ou contractuelle applicable'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Solde entre dans la succession à sa valeur au jour du décès.',
        'Droits de mutation applicables selon le barème légal.',
        'À confirmer selon la source officielle ou contractuelle applicable.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'moyenne',
      dependencies: ['source officielle ou contractuelle applicable'],
    },
  ],
};

export const CAT_CSL_PM: ProductRules = {
  constitution: CAT_CSL.constitution,
  sortie: CAT_CSL.sortie,
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession d’activité, les soldes sont intégrés aux opérations de clôture de la personne morale.',
        'Le traitement fiscal de clôture dépend du régime d’imposition (IS/IR) et de la qualification comptable des flux.',
        'À confirmer selon la source officielle ou contractuelle applicable.',
      ],
      tags: ['fin_vie_pm', 'cloture_pm', 'traitement_fiscal_cloture'],
      confidence: 'moyenne',
      dependencies: ['source officielle ou contractuelle applicable'],
    },
  ],
};
