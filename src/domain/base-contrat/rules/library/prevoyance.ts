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
        "Primes non déductibles de l'IR pour un contrat individuel souscrit à titre personnel.",
        'Contrat de risque pur : aucune valeur de rachat, aucune épargne constituée.',
      ],
      tags: ['primes_non_deductibles', 'risque_pur'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — assurance décès',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F35395',
        },
      ],
    },
  ],
  sortie: [
    {
      title: 'Sans objet — contrat de risque pur',
      bullets: [
        'Pas de valeur de rachat, pas de capital disponible hors sinistre.',
        "À l'échéance du contrat : arrêt sans restitution des primes.",
      ],
      tags: ['no_rachat'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — assurance décès',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F35395',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Capital versé aux bénéficiaires',
      bullets: [
        'Capital décès versé hors succession aux bénéficiaires désignés.',
        'Avant 70 ans (art. 990 I CGI) : abattement de {assuranceVie990IAllowance} ; au-delà : {assuranceVie990IRates}.',
        'Après 70 ans (art. 757 B CGI) : abattement global de {assuranceVie757BAllowance}.',
        "Contrat de risque pur : seule la prime de risque de la dernière année constitue l'assiette — À confirmer selon les stipulations contractuelles.",
      ],
      tags: ['art_990_i_cgi', 'art_757_b_cgi', 'hors_succession', 'abattement_990_i'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 990 I CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038612905',
        },
        {
          label: 'Art. 757 B CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006307539',
        },
      ],
      dependencies: [
        'nature du contrat (risque pur vs épargne)',
        'stipulations contractuelles sur la prime de risque',
      ],
    },
  ],
};

const PREVOYANCE_ITT: ProductRules = {
  constitution: [
    {
      title: 'Cotisations',
      bullets: [
        "Primes non déductibles de l'IR pour un contrat individuel souscrit à titre personnel.",
        'TNS (Madelin) : cotisations déductibles dans les plafonds prévoyance (art. 154 bis CGI — À confirmer selon les plafonds en vigueur).',
        'Pas de valeur de rachat : contrat de risque pur.',
      ],
      tags: ['primes_non_deductibles', 'risque_pur'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'BOSS — Prévoyance TNS',
          url: 'https://boss.gouv.fr/portail/accueil/prevoyance-tns.html',
        },
      ],
      dependencies: ['source officielle ou contractuelle applicable'],
    },
  ],
  sortie: [
    {
      title: 'Indemnités journalières (IJ) en cas de sinistre',
      bullets: [
        "IJ exonérées d'IR si les primes ont été payées personnellement (sans déduction).",
        "IJ imposables à l'IR si les primes ont été déduites (contrat collectif employeur ou TNS avec déduction).",
        "TNS : traitement social des IJ — À confirmer selon le régime d'affiliation (SSI / régime général) et les règles BOSS/URSSAF en vigueur.",
      ],
      tags: ['ij_exonerees', 'ij_imposables', 'tns_deduction'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'BOSS — Prévoyance TNS',
          url: 'https://boss.gouv.fr/portail/accueil/prevoyance-tns.html',
        },
      ],
      dependencies: ["régime d'affiliation TNS (SSI ou régime général)", 'BOSS/URSSAF à confirmer'],
    },
    {
      title: "Rente d'invalidité",
      bullets: [
        "Régime des rentes viagères à titre onéreux : fraction imposable à l'IR selon l'âge au premier versement.",
        '{rvtoTaxableFractions}',
      ],
      tags: ['rente_titre_onereux', 'fraction_imposable_age'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 158-6 CGI — rentes viagères à titre onéreux',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033810417',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Sans objet — couverture décès distincte',
      bullets: [
        "Ce produit couvre l'incapacité de travail (ITT) et l'invalidité. La couverture décès relève d'un produit dédié (prévoyance décès).",
      ],
      tags: ['no_capital_deces'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — pension d’invalidité',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F672',
        },
      ],
    },
  ],
};

const ASSURANCE_DEPENDANCE: ProductRules = {
  constitution: [
    {
      title: 'Cotisations',
      bullets: [
        "Cotisations non déductibles de l'IR (contrat individuel).",
        'Contrat de risque : aucune valeur de rachat.',
        "Possibilité de déduction via le crédit d'impôt pour l'emploi à domicile si la dépendance est déjà avérée.",
      ],
      tags: ['primes_non_deductibles', 'risque_pur'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — allocation personnalisée d’autonomie',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F10009',
        },
      ],
    },
  ],
  sortie: [
    {
      title: 'Rente dépendance (sinistre)',
      bullets: [
        "Rente versée en cas de perte d'autonomie : exonérée d'IR si les primes n'ont pas été déduites.",
        'Régime similaire aux rentes viagères à titre onéreux si primes déduites.',
      ],
      tags: ['rente_dependance', 'exoneration_conditionnelle'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — rentes viagères',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F3173',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Sans objet principal',
      bullets: [
        "Contrat d'assistance vie : pas de capital décès en dehors des contrats mixtes.",
        'Les primes ne sont pas récupérées en cas de décès sans sinistre.',
      ],
      tags: ['no_capital_deces'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — allocation personnalisée d’autonomie',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F10009',
        },
      ],
    },
  ],
};

const ASSURANCE_OBSEQUES: ProductRules = {
  constitution: [
    {
      title: 'Cotisations',
      bullets: [
        'Contrat en capital ou en prestations : aucune valeur de rachat utilisable du vivant.',
        "Primes versées non déductibles de l'IR.",
      ],
      tags: ['primes_non_deductibles'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — frais d’obsèques',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F17059',
        },
      ],
    },
  ],
  sortie: [
    {
      title: 'Sans objet',
      bullets: ['Contrat activé uniquement au décès, pas de sortie anticipée.'],
      tags: ['no_rachat'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — inhumation et contrat obsèques',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F14935',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Capital obsèques',
      bullets: [
        "Capital versé à l'opérateur funéraire désigné ou aux proches pour couvrir les frais d'obsèques.",
        'Exonération de droits de succession pour le capital affecté aux frais funéraires.',
        "Au-delà des frais réels, l'excédent peut être soumis aux DMTG.",
      ],
      tags: ['exoneration_frais_obseques', 'dmtg_excedent'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 796-0 bis CGI — exonération frais funéraires',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310479',
        },
      ],
    },
  ],
};

const ASSURANCE_EMPRUNTEUR_PP: ProductRules = {
  constitution: [
    {
      title: 'Cotisations',
      bullets: [
        "Primes non déductibles pour l'emprunteur particulier.",
        'Exception : primes déductibles des revenus fonciers si le bien est loué (régime réel).',
        'Contrat de risque pur adossé à un prêt immobilier ou professionnel.',
      ],
      tags: ['primes_non_deductibles', 'deductible_revenus_fonciers'],
      confidence: 'elevee',
      sources: [
        {
          label: 'BOFiP RFPI — primes d’assurance déductibles',
          url: 'https://bofip.impots.gouv.fr/doctrine/pgp/5807-PGP',
        },
      ],
    },
  ],
  sortie: [
    {
      title: 'En cas de sinistre',
      bullets: [
        "Capital versé directement à la banque (remboursement du prêt) — pas d'imposition pour l'emprunteur.",
        'IJ invalidité éventuelles : mêmes règles que la prévoyance ITT.',
      ],
      tags: ['capital_banque', 'ij_iti'],
      confidence: 'elevee',
      sources: [
        {
          label: 'BOFiP RFPI — intérêts et frais d’emprunt',
          url: 'https://bofip.impots.gouv.fr/bofip/5808-PGP.html/identifiant=BOI-RFPI-BASE-20-80-20170901',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Remboursement du prêt',
      bullets: [
        "Le capital est versé à l'établissement prêteur pour solde du prêt.",
        'Les héritiers récupèrent le bien net de dette.',
        'Pas de droits de succession sur le capital versé directement à la banque.',
      ],
      tags: ['remboursement_pret', 'no_dmtg_capital'],
      confidence: 'elevee',
      sources: [
        {
          label: 'BOFiP RFPI — intérêts et frais d’emprunt',
          url: 'https://bofip.impots.gouv.fr/bofip/5808-PGP.html/identifiant=BOI-RFPI-BASE-20-80-20170901',
        },
      ],
    },
  ],
};

const ASSURANCE_EMPRUNTEUR_PM: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (société)',
      bullets: [
        'Primes payées par la société : déductibles du résultat imposable (IS ou IR) si adossées à un prêt professionnel.',
        "Contrat de risque pur adossé à un prêt professionnel (immobilier ou d'exploitation).",
      ],
      tags: ['primes_deductibles_entreprise'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 38 CGI — résultat imposable',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302193',
        },
      ],
    },
  ],
  sortie: [
    {
      title: 'En cas de sinistre',
      bullets: [
        'Capital versé à la banque : extinction partielle ou totale de la dette du prêt — enregistrement comptable en produit exceptionnel et charge (remboursement emprunt).',
        'IJ invalidité éventuelles : intégrées au résultat imposable de la société (IS ou IR).',
      ],
      tags: ['capital_banque', 'produit_exceptionnel'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 38 CGI — résultat imposable',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302193',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        "Le capital est versé à l'établissement prêteur : extinction de la dette.",
        'À la clôture de la société, le traitement comptable et fiscal dépend du régime (IS/IR) et des modalités de liquidation.',
        'À confirmer selon le traitement comptable retenu et les modalités de clôture.',
      ],
      tags: ['remboursement_pret', 'benefice_exceptionnel', 'is_ir'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 38 CGI — résultat imposable',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302193',
        },
      ],
      dependencies: [
        'régime fiscal de la société (IS ou IR)',
        'traitement comptable du sinistre',
        'modalités de clôture de la société',
      ],
    },
  ],
};

const ASSURANCE_HOMME_CLE: ProductRules = {
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
      bullets: ['Contrat de risque pur : pas de valeur de rachat hors sinistre.'],
      tags: ['no_rachat'],
      confidence: 'elevee',
      sources: [
        {
          label: 'BOI-BIC-CHG-40-20-20 §100',
          url: 'https://bofip.impots.gouv.fr/bofip/803-PGP.html/identifiant=BOI-BIC-CHG-40-20-20-20130408',
        },
      ],
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
    case 'assurance_emprunteur_pp':
      return ASSURANCE_EMPRUNTEUR_PP;
    case 'assurance_emprunteur_pm':
      return ASSURANCE_EMPRUNTEUR_PM;
    case 'assurance_emprunteur':
      return audience === 'pm' ? ASSURANCE_EMPRUNTEUR_PM : ASSURANCE_EMPRUNTEUR_PP;
    case 'assurance_homme_cle':
      return audience === 'pm' ? ASSURANCE_HOMME_CLE : undefined;
    default:
      return undefined;
  }
}
