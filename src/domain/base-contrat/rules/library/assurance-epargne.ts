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
      confidence: 'elevee',
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
      confidence: 'elevee',
      sources: [{ label: 'Art. 125-0 A CGI', url: 'https://bofip.impots.gouv.fr/bofip/2279-PGP.html/identifiant=BOI-RPPM-RCM-10-10-80-20220630' }],
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
      confidence: 'elevee',
    },
    {
      title: 'Anciens contrats — régimes antérieurs à 1997',
      bullets: [
        'Primes versées avant le 26 septembre 1997 sur des contrats ouverts avant cette date : gains susceptibles d\'être exonérés d\'IR (art. 125-0 A CGI — régimes I et I bis).',
        'Plusieurs régimes transitoires coexistent selon la date d\'ouverture du contrat et la date de versement de chaque prime.',
        'À confirmer selon l\'historique complet du contrat et les dates précises de versement.',
      ],
      tags: ['anciens_contrats', 'regime_transitoire', 'art_125_0_a_cgi'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 125-0 A CGI — BOFiP RPPM-RCM-10-10-80', url: 'https://bofip.impots.gouv.fr/bofip/2279-PGP.html/identifiant=BOI-RPPM-RCM-10-10-80-20220630' }],
      dependencies: ['date d\'ouverture du contrat', 'dates de versement des primes antérieures au 26/09/1997'],
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
      confidence: 'elevee',
    },
    {
      title: 'Primes versées avant 70 ans (art. 990 I CGI)',
      bullets: [
        'Abattement de 152 500 € par bénéficiaire (tous contrats d\'AV du défunt confondus).',
        'Au-delà : taxation à 20 % jusqu\'à 852 500 €, puis 31,25 % au-delà.',
        'Pas de droits de succession classiques sur ces sommes.',
      ],
      tags: ['art_990_i_cgi', 'abattement_152500'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 990 I CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038612905' }],
    },
    {
      title: 'Primes versées après 70 ans (art. 757 B CGI)',
      bullets: [
        'Abattement global de 30 500 € partagé entre tous les bénéficiaires.',
        'Au-delà : intégration aux droits de mutation selon le lien de parenté.',
        'Exception : les intérêts capitalisés restent toujours exonérés de droits, même après 70 ans.',
      ],
      tags: ['art_757_b_cgi', 'abattement_30500'],
      confidence: 'elevee',
    },
  ],
};

const CONTRAT_CAPITALISATION: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        'Versements libres ou programmés, sans plafond légal.',
        'Accessible aux personnes physiques.',
        'Mêmes supports qu\'un contrat d\'assurance-vie : fonds euros et unités de compte.',
      ],
      tags: ['pp_eligible', 'supports_fe_uc'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Fiscalité des gains — même régime que l\'assurance-vie',
      bullets: [
        'Seule la part de gains est imposable (pas le capital remboursé).',
        'Avant 8 ans : PFU 30 % (12,8 % IR + 17,2 % prélèvements sociaux), ou option barème IR.',
        'Après 8 ans : abattement annuel 4 600 € (personne seule) / 9 200 € (couple). Taux IR 7,5 % si total primes < 150 000 €, sinon 12,8 %.',
        'Prélèvements sociaux : 17,2 % dans tous les cas (après abattement).',
      ],
      tags: ['pfu_30', 'abattement_4600_9200', 'seuil_150k'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 125-0 A CGI', url: 'https://bofip.impots.gouv.fr/bofip/2279-PGP.html/identifiant=BOI-RPPM-RCM-10-10-80-20220630' }],
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
      confidence: 'elevee',
    },
    {
      title: 'Avantages de transmissibilité',
      bullets: [
        'Le contrat peut être transmis par donation (avec abattements classiques).',
        'Il peut continuer à vivre après le décès du souscripteur, au profit des héritiers.',
        'Permet une optimisation via démembrement de propriété (usufruit / nue-propriété).',
      ],
      tags: ['donation', 'demembrement', 'continuation'],
      confidence: 'elevee',
    },
  ],
};

const CONTRAT_CAPITALISATION_PM: ProductRules = {
  constitution: [
    {
      title: 'Versements (Personne Morale)',
      bullets: [
        'Accessible aux personnes morales (sociétés patrimoniales, SCI à l\'IS, holding…).',
        'Versements libres ou programmés, sans plafond légal.',
        'À confirmer selon les statuts de la société : l\'objet social doit autoriser ce type de placement.',
      ],
      tags: ['pm_eligible', 'supports_fe_uc'],
      confidence: 'moyenne',
      dependencies: ['objet social de la société', 'régime IS ou IR'],
    },
  ],
  sortie: [
    {
      title: 'Fiscalité des gains (IS)',
      bullets: [
        'Régime des primes de remboursement (art. 238 septies E CGI) : l\'écart entre le prix d\'acquisition et la valeur de remboursement estimée est rattaché au résultat de chaque exercice selon un taux actuariel fixé à la souscription.',
        'Lors d\'un rachat : imposition de la plus-value réelle, avec déduction des produits déjà rattachés aux exercices antérieurs.',
        'Les gains nets sont intégrés au résultat fiscal soumis à l\'IS (25 %, ou 15 % pour les PME sous conditions).',
        'À confirmer selon la valeur de rachat à la clôture de chaque exercice et le taux actuariel applicable au contrat.',
      ],
      tags: ['is_25', 'is_15_pme', 'taxation_forfaitaire_annuelle', 'tme'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 238 septies E CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006304080' }],
      dependencies: ['type de contrat', 'clôture exercice comptable', 'taux actuariel à la souscription'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / événements de sortie de la personne morale',
      bullets: [
        'Le contrat suit la continuité de la personne morale tant qu\'elle est en activité.',
        'En cas de dissolution, liquidation ou cession d\'activité, le contrat entre dans les opérations de clôture (boni/mali de liquidation selon la situation).',
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_activite'],
      confidence: 'elevee',
    },
  ],
};

export function getAssuranceEpargneRules(
  productId: string,
  audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'assurance_vie':
      return ASSURANCE_VIE_PP;
    case 'contrat_capitalisation':
      return audience === 'pm' ? CONTRAT_CAPITALISATION_PM : CONTRAT_CAPITALISATION;
    default:
      return undefined;
  }
}
