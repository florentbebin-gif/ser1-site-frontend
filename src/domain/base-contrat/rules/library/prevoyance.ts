/**
 * domain/base-contrat/rules/library/prevoyance.ts
 *
 * Règles fiscales — Assurance prévoyance.
 * Produits : prévoyance décès, ITT/invalidité, dépendance,
 *            obsèques, emprunteur, homme-clé.
 */

import type { ProductRules, Audience } from '../types';

const PREVOYANCE_DECES: ProductRules = {
  constitution: [
    {
      title: 'Cotisations',
      bullets: [
        'Primes non déductibles de l\'IR pour un contrat individuel souscrit à titre personnel.',
        'Travailleurs non-salariés (TNS) : cotisations Madelin déductibles dans les plafonds prévoyance (2,5 % du PASS + 7,5 % de la rémunération jusqu\'à 8 PASS).',
        'Contrat de risque pur : aucune valeur de rachat, aucune épargne constituée.',
      ],
      tags: ['primes_non_deductibles', 'madelin_tns', 'risque_pur'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Sans objet — contrat de risque pur',
      bullets: [
        'Pas de valeur de rachat, pas de capital disponible hors sinistre.',
        'À l\'échéance du contrat : arrêt sans restitution des primes.',
      ],
      tags: ['no_rachat'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Capital versé aux bénéficiaires',
      bullets: [
        'Capital décès versé hors succession aux bénéficiaires désignés.',
        'Primes versées avant 70 ans (art. 990 I CGI) : abattement de 152 500 € par bénéficiaire.',
        'Primes versées après 70 ans (art. 757 B CGI) : abattement global de 30 500 €.',
        'Exonération totale si les primes sont considérées comme "normales" au regard du patrimoine (contrats courants).',
      ],
      tags: ['art_990_i_cgi', 'art_757_b_cgi', 'hors_succession', 'abattement_152500'],
      confidence: 'elevee',
    },
  ],
};

const PREVOYANCE_ITT: ProductRules = {
  constitution: [
    {
      title: 'Cotisations',
      bullets: [
        'Primes non déductibles de l\'IR pour un contrat individuel souscrit à titre personnel.',
        'TNS (Madelin) : cotisations déductibles dans les plafonds prévoyance.',
        'Pas de valeur de rachat : contrat de risque pur.',
      ],
      tags: ['primes_non_deductibles', 'madelin_tns', 'risque_pur'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Indemnités journalières (IJ) en cas de sinistre',
      bullets: [
        'IJ exonérées d\'IR si les primes ont été payées personnellement (sans déduction).',
        'IJ imposables à l\'IR si les primes ont été déduites (Madelin, contrat collectif employeur).',
        'Régime applicable : traitements et salaires ou BNC selon le statut du bénéficiaire.',
      ],
      tags: ['ij_exonerees', 'ij_imposables', 'madelin_tns'],
      confidence: 'elevee',
    },
    {
      title: 'Rente d\'invalidité',
      bullets: [
        'Régime des rentes viagères à titre onéreux : fraction imposable à l\'IR selon l\'âge au premier versement.',
        'Âge < 50 ans : 70 % imposable. Entre 50 et 59 ans : 50 %. Entre 60 et 69 ans : 40 %. À partir de 70 ans : 30 %.',
      ],
      tags: ['rente_titre_onereux', 'fraction_imposable_age'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Capital décès éventuel',
      bullets: [
        'Certains contrats ITT prévoient un capital décès garanti.',
        'Mêmes règles que la prévoyance décès : art. 990 I (avant 70 ans) ou art. 757 B (après 70 ans).',
      ],
      tags: ['art_990_i_cgi', 'art_757_b_cgi'],
      confidence: 'elevee',
    },
  ],
};

const ASSURANCE_DEPENDANCE: ProductRules = {
  constitution: [
    {
      title: 'Cotisations',
      bullets: [
        'Cotisations non déductibles de l\'IR (contrat individuel).',
        'Contrat de risque : aucune valeur de rachat.',
        'Possibilité de déduction via le crédit d\'impôt pour l\'emploi à domicile si la dépendance est déjà avérée.',
      ],
      tags: ['primes_non_deductibles', 'risque_pur'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Rente dépendance (sinistre)',
      bullets: [
        'Rente versée en cas de perte d\'autonomie : exonérée d\'IR si les primes n\'ont pas été déduites.',
        'Régime similaire aux rentes viagères à titre onéreux si primes déduites.',
      ],
      tags: ['rente_dependance', 'exoneration_conditionnelle'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Sans objet principal',
      bullets: [
        'Contrat d\'assistance vie : pas de capital décès en dehors des contrats mixtes.',
        'Les primes ne sont pas récupérées en cas de décès sans sinistre.',
      ],
      tags: ['no_capital_deces'],
      confidence: 'elevee',
    },
  ],
};

const ASSURANCE_OBSEQUES: ProductRules = {
  constitution: [
    {
      title: 'Cotisations',
      bullets: [
        'Contrat en capital ou en prestations : aucune valeur de rachat utilisable du vivant.',
        'Primes versées non déductibles de l\'IR.',
      ],
      tags: ['primes_non_deductibles'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Sans objet',
      bullets: ['Contrat activé uniquement au décès, pas de sortie anticipée.'],
      tags: ['no_rachat'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Capital obsèques',
      bullets: [
        'Capital versé à l\'opérateur funéraire désigné ou aux proches pour couvrir les frais d\'obsèques.',
        'Exonération de droits de succession pour le capital affecté aux frais funéraires.',
        'Au-delà des frais réels, l\'excédent peut être soumis aux DMTG.',
      ],
      tags: ['exoneration_frais_obseques', 'dmtg_excedent'],
      confidence: 'elevee',
    },
  ],
};

const ASSURANCE_EMPRUNTEUR: ProductRules = {
  constitution: [
    {
      title: 'Cotisations',
      bullets: [
        'Primes non déductibles pour l\'emprunteur particulier.',
        'Exception : primes déductibles des revenus fonciers si le bien est loué (régime réel).',
        'Contrat de risque pur adossé à un prêt immobilier ou professionnel.',
      ],
      tags: ['primes_non_deductibles', 'deductible_revenus_fonciers'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'En cas de sinistre',
      bullets: [
        'Capital versé directement à la banque (remboursement du prêt) — pas d\'imposition pour l\'emprunteur.',
        'IJ invalidité éventuelles : mêmes règles que la prévoyance ITT.',
      ],
      tags: ['capital_banque', 'ij_iti'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Remboursement du prêt',
      bullets: [
        'Le capital est versé à l\'établissement prêteur pour solde du prêt.',
        'Les héritiers récupèrent le bien net de dette.',
        'Pas de droits de succession sur le capital versé directement à la banque.',
      ],
      tags: ['remboursement_pret', 'no_dmtg_capital'],
      confidence: 'elevee',
    },
  ],
};

const ASSURANCE_HOMME_CLE: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (entreprise)',
      bullets: [
        'Cotisations payées par l\'entreprise : déductibles du résultat imposable (IS ou IR).',
        'Contrat souscrit par l\'entreprise sur la tête d\'une personne clé (dirigeant, associé…).',
        'À confirmer selon les statuts de l\'entreprise et l\'importance réelle de l\'homme-clé pour son activité.',
      ],
      tags: ['primes_deductibles_entreprise', 'pm_uniquement'],
      confidence: 'moyenne',
      sources: [{ label: 'BOI-BIC-CHG-40-20-20 §100', url: 'https://bofip.impots.gouv.fr/bofip/803-PGP.html/identifiant=BOI-BIC-CHG-40-20-20-20130408' }],
      dependencies: ['qualification effective homme-clé', 'caractère indemnitaire du contrat'],
    },
  ],
  sortie: [
    {
      title: 'Sans objet — risque pur',
      bullets: ['Contrat de risque pur : pas de valeur de rachat hors sinistre.'],
      tags: ['no_rachat'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Capital versé à l\'entreprise',
      bullets: [
        'Le capital est versé à l\'entreprise (bénéficiaire) et intégré dans le résultat imposable de l\'exercice (produit exceptionnel, art. 38 CGI).',
        'Fiscalité : IS ou IR selon le régime de l\'entreprise.',
        'À confirmer selon le type de contrat : seuls les contrats indemnitaires (indemnité calculée sur la perte réelle) ouvrent droit à la déductibilité des primes ; les contrats forfaitaires en sont exclus.',
      ],
      tags: ['capital_entreprise', 'produit_exceptionnel', 'is_ir'],
      confidence: 'moyenne',
      sources: [{ label: 'BOI-BIC-CHG-40-20-20 §100', url: 'https://bofip.impots.gouv.fr/bofip/803-PGP.html/identifiant=BOI-BIC-CHG-40-20-20-20130408' }],
      dependencies: ['type de contrat (indemnitaire vs forfaitaire)', 'exercice de réalisation du sinistre'],
    },
  ],
};

export function getPrevoyanceRules(
  productId: string,
  audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'prevoyance_individuelle_deces':
      return audience === 'pp' ? PREVOYANCE_DECES : undefined;
    case 'prevoyance_individuelle_itt_invalidite':
      return audience === 'pp' ? PREVOYANCE_ITT : undefined;
    case 'assurance_dependance':
      return ASSURANCE_DEPENDANCE;
    case 'assurance_obseques':
      return ASSURANCE_OBSEQUES;
    case 'assurance_emprunteur':
      return ASSURANCE_EMPRUNTEUR;
    case 'assurance_homme_cle':
      return audience === 'pm' ? ASSURANCE_HOMME_CLE : undefined;
    default:
      return undefined;
  }
}
