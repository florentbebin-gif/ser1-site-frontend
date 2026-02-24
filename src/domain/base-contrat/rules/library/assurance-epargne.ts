/**
 * domain/base-contrat/rules/library/assurance-epargne.ts
 *
 * Règles fiscales — Épargne Assurance.
 * Produits : Assurance-vie (PP), Contrat de capitalisation (PP + PM).
 */

import type { ProductRules, Audience } from '../types';

const ASSURANCE_VIE_PP: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        'Versements libres ou programmés, sans plafond légal.',
        'Aucune déductibilité des primes de l\'impôt sur le revenu à l\'entrée.',
        'Neutralité fiscale pendant la phase d\'épargne : intérêts et plus-values non imposés annuellement.',
        'Supports : fonds euros (capital garanti) et unités de compte.',
      ],
      tags: ['neutralite_fiscale', 'supports_fe_uc'],
    },
  ],
  sortie: [
    {
      title: 'Contrat de moins de 8 ans',
      bullets: [
        'Seuls les gains (intérêts et plus-values) sont imposés — pas le capital versé.',
        'Prélèvement forfaitaire unique (PFU) : 30 % (12,8 % IR + 17,2 % prélèvements sociaux).',
        'Option possible pour l\'imposition au barème progressif de l\'IR.',
      ],
      tags: ['pfu_30', 'ps_17_2'],
    },
    {
      title: 'Contrat de 8 ans et plus',
      bullets: [
        'Abattement annuel sur les gains : 4 600 € (personne seule) ou 9 200 € (couple soumis à imposition commune).',
        'Taux IR réduit à 7,5 % si le total des primes versées tous contrats confondus est inférieur à 150 000 €.',
        'Taux IR de 12,8 % si les primes versées dépassent 150 000 €.',
        'Prélèvements sociaux : 17,2 % dans tous les cas (après abattement).',
      ],
      tags: ['abattement_4600_9200', 'seuil_150k', 'taux_7_5', 'art_125_0_a_cgi'],
    },
  ],
  deces: [
    {
      title: 'Capital hors succession',
      bullets: [
        'Le capital décès est versé directement aux bénéficiaires désignés, hors actif successoral.',
        'La rédaction de la clause bénéficiaire est déterminante pour optimiser la transmission.',
      ],
      tags: ['hors_succession', 'clause_beneficiaire'],
    },
    {
      title: 'Primes versées avant 70 ans (art. 990 I CGI)',
      bullets: [
        'Abattement de 152 500 € par bénéficiaire (tous contrats d\'AV du défunt confondus).',
        'Au-delà : taxation à 20 % jusqu\'à 852 500 €, puis 31,25 % au-delà.',
        'Pas de droits de succession classiques sur ces sommes.',
      ],
      tags: ['art_990_i_cgi', 'abattement_152500'],
    },
    {
      title: 'Primes versées après 70 ans (art. 757 B CGI)',
      bullets: [
        'Abattement global de 30 500 € partagé entre tous les bénéficiaires.',
        'Au-delà : intégration aux droits de mutation selon le lien de parenté.',
        'Exception : les intérêts capitalisés restent toujours exonérés de droits, même après 70 ans.',
      ],
      tags: ['art_757_b_cgi', 'abattement_30500'],
    },
  ],
};

const CONTRAT_CAPITALISATION: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        'Versements libres ou programmés, sans plafond légal.',
        'Accessible aux personnes physiques et aux personnes morales (sociétés, SCI, holding…).',
        'Mêmes supports qu\'un contrat d\'assurance-vie : fonds euros et unités de compte.',
      ],
      tags: ['pm_eligible', 'supports_fe_uc'],
    },
  ],
  sortie: [
    {
      title: 'Particulier — même fiscalité que l\'assurance-vie',
      bullets: [
        'Seule la part de gains est imposable (pas le capital remboursé).',
        'Avant 8 ans : PFU 30 % (ou option barème IR).',
        'Après 8 ans : abattement annuel 4 600 € / 9 200 € et taux réduit (7,5 % ou 12,8 % selon le total des primes).',
        'Prélèvements sociaux : 17,2 % dans tous les cas.',
      ],
      tags: ['pfu_30', 'abattement_4600_9200'],
    },
    {
      title: 'Personne morale (IS)',
      bullets: [
        'Les gains sont intégrés au résultat fiscal soumis à l\'IS (25 %, ou 15 % pour les PME jusqu\'à 42 500 € de bénéfice).',
        'Outil de gestion de trésorerie longue durée pour les entreprises.',
      ],
      tags: ['is_25', 'is_15_pme', 'pm_eligible'],
    },
  ],
  deces: [
    {
      title: 'Intégration dans la succession',
      bullets: [
        'Contrairement à l\'assurance-vie, le contrat entre dans la succession à sa valeur de rachat.',
        'Droits de mutation applicables selon le barème et le lien de parenté.',
        'L\'abattement spécifique AV (art. 990 I) ne s\'applique pas.',
      ],
      tags: ['dmtg_classique', 'succession_active'],
    },
    {
      title: 'Avantages de transmissibilité',
      bullets: [
        'Le contrat peut être transmis par donation (avec abattements classiques).',
        'Il peut continuer à vivre après le décès du souscripteur, au profit des héritiers.',
        'Permet une optimisation via démembrement de propriété (usufruit / nue-propriété).',
      ],
      tags: ['donation', 'demembrement', 'continuation'],
    },
  ],
};

export function getAssuranceEpargneRules(
  productId: string,
  _audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'assurance_vie':
      return ASSURANCE_VIE_PP;
    case 'contrat_capitalisation':
      return CONTRAT_CAPITALISATION;
    default:
      return undefined;
  }
}
