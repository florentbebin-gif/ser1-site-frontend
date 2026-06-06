/**
 * domain/base-contrat/rules/library/immobilier-groupements-fonciers.ts
 *
 * Règles fiscales — groupements fonciers agricoles, viticoles et forestiers.
 */

import type { ProductRules } from '../types';

export const GROUPEMENT_FONCIER_AGRI_VITI: ProductRules = {
  constitution: [
    {
      title: 'Souscription de parts (GFA / GFV)',
      bullets: [
        'Revenus agricoles (GFA) ou viticoles (GFV) imposés dans la catégorie des bénéfices agricoles (BA).',
        "Exonération partielle d'IFI sur les parts sous conditions de gestion (statuts + engagement de location).",
        'À confirmer selon le visa préfectoral et les statuts du groupement.',
      ],
      tags: ['benefices_agricoles', 'ifi_exoneration_partielle'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 793 bis CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310364',
        },
      ],
      dependencies: ['visa préfectoral', 'statuts du GFA/GFV', 'mise en valeur active'],
    },
  ],
  sortie: [
    {
      title: 'Cession de parts',
      bullets: [
        'Régime des plus-values des particuliers : {capitalGainIr} + {psGeneral}.',
        'Abattements pour durée de détention applicables.',
        'À confirmer selon le statut du cédant et la durée de détention.',
      ],
      tags: ['pv_parts', 'abattement_detention'],
      confidence: 'moyenne',
      dependencies: ['statut du cédant (particulier vs professionnel)'],
    },
  ],
  deces: [
    {
      title: 'Transmission — régime art. 793 bis CGI',
      bullets: [
        'Exonération de 75 % des DMTG (art. 793 bis CGI) si les biens sont donnés à bail long terme (≥ 18 ans) et les parts détenues depuis plus de 2 ans.',
        'Au-delà de 600 000 € par bénéficiaire (seuil relevé par LF 2025 art. 70 — À confirmer selon seuil en vigueur) : exonération réduite à 50 %. Plafond de valeur exonérable : 20 M€ (À confirmer selon plafond en vigueur).',
        'DMTG classiques si aucun bail long terme ou engagement de conservation non respecté.',
        "À confirmer selon l'existence du bail long terme et le respect des conditions de conservation (5 ans).",
      ],
      tags: ['dmtg_classique', 'art_793_bis', 'exoneration_75'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 793 bis CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310364',
        },
      ],
      dependencies: [
        'bail long terme ≥ 18 ans',
        'engagement de conservation 5 ans',
        'seuil d’exonération partielle GFA/GFV en vigueur',
      ],
    },
  ],
};

export const GROUPEMENT_FONCIER_AGRI_VITI_PM: ProductRules = {
  constitution: GROUPEMENT_FONCIER_AGRI_VITI.constitution,
  sortie: GROUPEMENT_FONCIER_AGRI_VITI.sortie,
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession d’activité, les parts sont intégrées aux opérations de clôture de la personne morale.',
        'Le traitement fiscal de sortie est déterminé selon le régime d’imposition et la valorisation retenue à la clôture.',
        'À confirmer selon les modalités de dissolution et la valorisation des parts à la clôture.',
      ],
      tags: ['fin_vie_pm', 'cloture_pm', 'parts_groupement_pm'],
      confidence: 'moyenne',
      dependencies: [
        'modalités de dissolution ou liquidation',
        'régime fiscal de la personne morale',
        'valorisation des parts à la clôture',
      ],
    },
  ],
};

export const GROUPEMENT_FONCIER_FORESTIER: ProductRules = {
  constitution: [
    {
      title: 'Souscription de parts (GFF)',
      bullets: [
        'Revenus forestiers imposés dans la catégorie des bénéfices agricoles (BA) ou forfait forestier selon le cas.',
        "Exonération partielle d'IFI possible si les forêts font l'objet d'un Plan Simple de Gestion (PSG) agréé.",
        'À confirmer selon le PSG et les statuts du groupement.',
      ],
      tags: ['benefices_agricoles', 'ifi_exoneration_partielle', 'psg'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 793 CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310362',
        },
      ],
      dependencies: ['PSG agréé', 'statuts du GFF'],
    },
  ],
  sortie: [
    {
      title: 'Cession de parts',
      bullets: [
        'Régime des plus-values des particuliers : {capitalGainIr} + {psGeneral}.',
        'Abattements pour durée de détention applicables.',
        'À confirmer selon le statut du cédant et la durée de détention.',
      ],
      tags: ['pv_parts', 'abattement_detention'],
      confidence: 'moyenne',
      dependencies: ['statut du cédant (particulier vs professionnel)'],
    },
  ],
  deces: [
    {
      title: 'Transmission — régime art. 793 CGI (forêts)',
      bullets: [
        'Exonération de 75 % des DMTG (art. 793 CGI — Loi Sérot) si les forêts sont couvertes par un Plan Simple de Gestion agréé (PSG) et engagement de conservation.',
        "Contrairement au régime GFA, pas de plafond monétaire sur l'exonération si les conditions PSG sont remplies.",
        "À confirmer selon l'existence du PSG agréé, la durée et les conditions de conservation appliquées.",
      ],
      tags: ['dmtg_classique', 'art_793_cgi', 'exoneration_75', 'psg'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 793 CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310362',
        },
      ],
      dependencies: ['PSG agréé', 'engagement de conservation', 'durée de détention des parts'],
    },
  ],
};

export const GROUPEMENT_FONCIER_FORESTIER_PM: ProductRules = {
  constitution: GROUPEMENT_FONCIER_FORESTIER.constitution,
  sortie: GROUPEMENT_FONCIER_FORESTIER.sortie,
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession d’activité, les parts sont intégrées aux opérations de clôture de la personne morale.',
        'Le traitement fiscal de sortie est déterminé selon le régime d’imposition et la valorisation retenue à la clôture.',
        'À confirmer selon les modalités de dissolution et la valorisation des parts à la clôture.',
      ],
      tags: ['fin_vie_pm', 'cloture_pm', 'parts_groupement_pm'],
      confidence: 'moyenne',
      dependencies: [
        'modalités de dissolution ou liquidation',
        'régime fiscal de la personne morale',
        'valorisation des parts à la clôture',
      ],
    },
  ],
};
