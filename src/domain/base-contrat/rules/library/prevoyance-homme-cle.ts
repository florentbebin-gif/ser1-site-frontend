/**
 * domain/base-contrat/rules/library/prevoyance-homme-cle.ts
 *
 * Règles fiscales — assurance homme-clé.
 */

import type { ProductRules } from '../types';

export const ASSURANCE_HOMME_CLE: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (entreprise)',
      bullets: [
        "Cotisations payées par l'entreprise : déductibles du résultat imposable (IS ou IR).",
        "Contrat souscrit par l'entreprise sur la tête d'une personne clé (dirigeant, associé…).",
        "À confirmer selon les statuts de l'entreprise et l'importance réelle de l'homme-clé pour son activité.",
      ],
      tags: ['primes_deductibles_entreprise', 'pm_uniquement'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'BOI-BIC-CHG-40-20-20 §100',
          url: 'https://bofip.impots.gouv.fr/bofip/803-PGP.html/identifiant=BOI-BIC-CHG-40-20-20-20130408',
        },
      ],
      dependencies: ['qualification effective homme-clé', 'caractère indemnitaire du contrat'],
    },
  ],
  sortie: [
    {
      title: 'Sans objet — risque pur',
      bullets: [
        'Contrat de risque pur : pas de valeur de rachat hors sinistre.',
        'À confirmer selon la source officielle ou contractuelle applicable.',
      ],
      tags: ['no_rachat'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'BOI-BIC-CHG-40-20-20 §100',
          url: 'https://bofip.impots.gouv.fr/bofip/803-PGP.html/identifiant=BOI-BIC-CHG-40-20-20-20130408',
        },
      ],
      dependencies: ['source officielle ou contractuelle applicable'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        "Le capital est versé à l'entreprise et intégré dans le résultat imposable (produit exceptionnel, art. 38 CGI).",
        "IS ou IR selon le régime de l'entreprise.",
        'À confirmer selon le type de contrat (indemnitaire ou forfaitaire) et les modalités de clôture.',
      ],
      tags: ['capital_entreprise', 'produit_exceptionnel', 'is_ir', 'fin_vie_pm'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'BOI-BIC-CHG-40-20-20 §100',
          url: 'https://bofip.impots.gouv.fr/bofip/803-PGP.html/identifiant=BOI-BIC-CHG-40-20-20-20130408',
        },
        {
          label: 'Art. 38 CGI — résultat imposable',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302193',
        },
      ],
      dependencies: [
        'type de contrat (indemnitaire vs forfaitaire)',
        'exercice de réalisation du sinistre',
        'modalités de sortie de la personne morale',
      ],
    },
  ],
};
