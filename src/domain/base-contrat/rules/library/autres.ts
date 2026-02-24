/**
 * domain/base-contrat/rules/library/autres.ts
 *
 * Règles fiscales — Autres produits.
 * Produits : Tontine, Crypto-actifs, Métaux précieux.
 */

import type { ProductRules, Audience } from '../types';

function buildPmLifecycleRules(subject: string, tags: string[] = []): ProductRules {
  return {
    constitution: [
      {
        title: `Détention (${subject})`,
        bullets: [
          'Le produit est détenu par la personne morale selon sa nature juridique et comptable.',
          'Le traitement fiscal courant suit le régime d’imposition (IS/IR) et les règles comptables applicables.',
        ],
        tags: ['pm', 'detention', ...tags],
        confidence: 'elevee',
      },
    ],
    sortie: [
      {
        title: 'Cession / réalisation',
        bullets: [
          'Le résultat de cession ou de réalisation est intégré au résultat fiscal de la personne morale.',
          'Les modalités de calcul dépendent des écritures de clôture et de la documentation comptable.',
        ],
        tags: ['resultat_fiscal', 'cession_pm', ...tags],
        confidence: 'elevee',
      },
    ],
    deces: [
      {
        title: 'Fin de vie / événements de sortie de la personne morale',
        bullets: [
          'En cas de dissolution, liquidation ou cession d’activité, le traitement est effectué dans les opérations de clôture de la personne morale.',
          'La valorisation retenue à la clôture détermine l’assiette fiscale finale selon le régime applicable.',
        ],
        tags: ['fin_vie_pm', 'cloture_pm', ...tags],
        confidence: 'elevee',
      },
    ],
  };
}

const TONTINE: ProductRules = {
  constitution: [
    {
      title: 'Cotisations contractuelles',
      bullets: [
        'Versements périodiques fixés contractuellement sur une durée déterminée (généralement 10 à 25 ans).',
        'Contrat à terme fixe : aucune possibilité de rachat partiel ni de retrait anticipé.',
        'Les membres d\'une association tontinière mutualisent le capital : les survivants héritent des parts des décédés.',
        'À confirmer selon les statuts de l\'association tontinière (frais de gestion et modalités de répartition).',
      ],
      tags: ['tontine', 'terme_fixe', 'no_rachat'],
      confidence: 'moyenne',
      dependencies: ['statuts de l\'association tontinière', 'frais de gestion et modalités de répartition'],
    },
  ],
  sortie: [
    {
      title: 'À l\'échéance du contrat',
      bullets: [
        'Versement de la capitalisation aux membres survivants à la date d\'échéance.',
        'Gains imposables : régime des produits de placement à revenu fixe — PFU 30 % (12,8 % IR + 17,2 % PS).',
        'Base imposable : valeur de répartition reçue moins les cotisations versées.',
        'À confirmer selon la nature exacte du contrat tontinier (association tontinière d\'assurance vs clause tontinière immobilière).',
      ],
      tags: ['pfu_30', 'base_imposable'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 125-0 A CGI', url: 'https://bofip.impots.gouv.fr/bofip/2279-PGP.html/identifiant=BOI-RPPM-RCM-10-10-80-20220630' }],
      dependencies: ['nature du contrat tontinier (assurance vs clause immobilière)'],
    },
  ],
  deces: [
    {
      title: 'En cas de décès avant le terme',
      bullets: [
        'La quote-part revient aux membres survivants de l\'association tontinière — pas aux héritiers du défunt.',
        'Pas de transmission successorale de la quote-part tontinière (principe de l\'aléa viager).',
        'Exception : certains contrats prévoient un capital décès garanti via un contrat d\'assurance adossé.',
        'À confirmer selon la présence ou non d\'une assurance-décès complémentaire souscrite en parallèle.',
      ],
      tags: ['no_succession_tontine', 'alea_viager', 'capital_deces_adosse'],
      confidence: 'moyenne',
      dependencies: ['présence d\'une assurance-décès complémentaire'],
    },
  ],
};

const CRYPTO_ACTIFS: ProductRules = {
  constitution: [
    {
      title: 'Acquisition',
      bullets: [
        'Achat sur plateforme d\'échange ou réception par minage / staking / airdrop.',
        'Prix de revient à conserver précisément pour le calcul des plus-values futures.',
        'Pas de plafond légal d\'investissement.',
      ],
      tags: ['crypto', 'prix_de_revient'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Cession contre monnaie ayant cours légal',
      bullets: [
        'Fait générateur de l\'impôt : cession contre euros ou autre devise (pas les échanges crypto-contre-crypto).',
        'PFU 30 % (12,8 % IR + 17,2 % PS) sur la plus-value nette imposable.',
        'Moins-values imputables sur les plus-values de l\'année (méthode de calcul globale sur le portefeuille).',
        'Option pour le barème progressif de l\'IR possible.',
      ],
      tags: ['pfu_30', 'fait_generateur_cession', 'option_bareme'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 150 VH bis CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038612225' }],
    },
    {
      title: 'Activité habituelle',
      bullets: [
        'Si le volume d\'activité est qualifié de professionnel (minage, trading régulier) : imposition en BNC.',
        'Staking et revenus passifs : imposés à l\'IR à la valeur de marché au moment de la réception.',
      ],
      tags: ['bnc_professionnel', 'staking'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Les crypto-actifs entrent dans la succession à leur valeur de marché au jour du décès.',
        'DMTG selon le barème légal et le lien de parenté.',
        'Attention : l\'accès aux wallets et aux clés privées doit être anticipé (clause testamentaire ou mandat).',
      ],
      tags: ['dmtg_classique', 'acces_wallet'],
      confidence: 'elevee',
    },
  ],
};

const METAUX_PRECIEUX: ProductRules = {
  constitution: [
    {
      title: 'Acquisition',
      bullets: [
        'Achat de lingots, pièces d\'or ou d\'argent reconnus par la Banque de France.',
        'TVA applicable sur l\'argent et le platine (sauf dispense). L\'or de placement est exonéré de TVA.',
        'Conservation physique ou via un dépositaire (coffre bancaire).',
      ],
      tags: ['tva_argent', 'exoneration_tva_or', 'or_placement'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Deux régimes fiscaux au choix',
      bullets: [
        'Régime forfaitaire : taxe de 11 % sur le prix de cession (+ 0,5 % CRDS). Aucune justification de prix d\'achat requise.',
        'Régime des plus-values : IR 36,2 % (19 % + 17,2 % PS) sur la PV réelle avec abattement de 5 % par année de détention au-delà de 2 ans (exonération totale après 22 ans).',
        'Le choix du régime le plus favorable est effectué lors de la déclaration de cession.',
      ],
      tags: ['taxe_forfaitaire_11', 'pv_reelle', 'abattement_detention_22_ans'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 150 VI CGI — métaux précieux', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302728' }],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Les métaux précieux entrent dans la succession à leur valeur vénale au jour du décès.',
        'DMTG selon le barème légal et le lien de parenté.',
        'La valorisation doit être attestée (cours de l\'or/argent à la date du décès).',
      ],
      tags: ['dmtg_classique', 'valeur_marche'],
      confidence: 'elevee',
    },
  ],
};

export function getAutresRules(
  productId: string,
  audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'tontine':
      return audience === 'pm' ? buildPmLifecycleRules('mécanisme tontinier', ['tontine']) : TONTINE;
    case 'crypto_actifs':
      return audience === 'pm' ? buildPmLifecycleRules('crypto-actifs', ['crypto']) : CRYPTO_ACTIFS;
    case 'metaux_precieux':
      return audience === 'pm' ? buildPmLifecycleRules('métaux précieux', ['metaux_precieux']) : METAUX_PRECIEUX;
    default:
      return undefined;
  }
}
