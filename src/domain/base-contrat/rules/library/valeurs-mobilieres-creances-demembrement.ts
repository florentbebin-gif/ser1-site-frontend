/**
 * domain/base-contrat/rules/library/valeurs-mobilieres-creances-demembrement.ts
 *
 * Règles fiscales — créances privées et démembrement.
 */

import type { ProductRules } from '../types';

export const PRET_PARTICULIERS: ProductRules = {
  constitution: [
    {
      title: 'Nature',
      bullets: [
        'Prêt formalisé par une reconnaissance de dette (acte sous seing privé ou notarié).',
        "Déclaration obligatoire à l'administration fiscale si montant > 5 000 €.",
        'À confirmer selon la source officielle ou contractuelle applicable.',
      ],
      tags: ['reconnaissance_dette', 'declaration_fiscale'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 242 ter CGI — déclaration prêt > 5 000 €',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006312267',
        },
      ],
      dependencies: ['source officielle ou contractuelle applicable'],
    },
  ],
  sortie: [
    {
      title: 'Remboursement',
      bullets: [
        'Remboursement du capital : non imposable.',
        "Intérêts éventuels : imposables à l'IR selon le {pfu}.",
        'À confirmer selon la source officielle ou contractuelle applicable.',
      ],
      tags: ['pfu', 'interet_imposable'],
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
        'La créance intègre la succession à sa valeur (solde restant dû).',
        'DMTG selon le barème légal et le lien de parenté.',
        'À confirmer selon la source officielle ou contractuelle applicable.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 779 CGI — abattements DMTG',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018',
        },
      ],
      dependencies: ['source officielle ou contractuelle applicable'],
    },
  ],
};

export const USUFRUIT_NUE_PROPRIETE: ProductRules = {
  constitution: [
    {
      title: 'Démembrement de propriété',
      bullets: [
        "L'usufruit et la nue-propriété représentent deux droits distincts sur un même bien.",
        "Valorisation selon le barème fiscal de l'usufruit (art. 669 CGI) : dépend de l'âge de l'usufruitier.",
        'Donation de la nue-propriété : DMTG calculés sur la seule valeur de la nue-propriété.',
        "À confirmer selon l'origine du démembrement (légal type succession, ou conventionnel type donation/cession).",
      ],
      tags: ['demembrement', 'art_669_cgi', 'bareme_fiscal_usufruit'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 669 CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310228',
        },
      ],
      dependencies: ['origine du démembrement (légal vs conventionnel)', "âge de l'usufruitier"],
    },
  ],
  sortie: [
    {
      title: 'Cession et revenus',
      bullets: [
        "Les loyers ou revenus reviennent à l'usufruitier (imposition en revenus fonciers ou BIC).",
        'Cession de la pleine propriété : PV partagée entre usufruitier et nu-propriétaire selon les droits respectifs.',
        "Réunion de l'usufruit et de la nue-propriété (extinction de l'usufruit) : sans taxation pour le nu-propriétaire.",
        'À confirmer selon la répartition conventionnelle des droits entre usufruitier et nu-propriétaire.',
      ],
      tags: ['revenus_usufruitier', 'pv_demembrement', 'reunion'],
      confidence: 'moyenne',
      dependencies: ['répartition des droits usufruitier/nu-propriétaire'],
    },
  ],
  deces: [
    {
      title: "Extinction de l'usufruit et transmission",
      bullets: [
        "Au décès de l'usufruitier, la pleine propriété se reconstitue sans droits de succession supplémentaires.",
        'La nue-propriété transmise de son vivant évite une double taxation.',
        'Intégration dans la succession des droits détenus à la valeur fiscale.',
        "À confirmer selon la présence éventuelle d'une clause de réversion d'usufruit.",
      ],
      tags: ['reunion_usufruit', 'no_dmtg_reunion', 'optimisation_transmission'],
      confidence: 'moyenne',
      dependencies: ["clause de réversion d'usufruit éventuelle"],
    },
  ],
};
