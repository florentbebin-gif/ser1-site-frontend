/**
 * domain/base-contrat/catalog.ts
 *
 * Catalogue hardcodé des produits patrimoniaux.
 * Source de vérité PR1 — 100% additive, aucun impact runtime.
 *
 * Champs retenus (minimum nécessaire) :
 *   id, label, grandeFamille, catalogKind, ppEligible, pmEligible, templateKey
 *
 * isActive = true par défaut ; closedDate géré via base_contrat_overrides (PR1.6).
 * Pas de commentaires de qualification ni de références longues (PR1 légère).
 */

import type { CatalogKind, GrandeFamille } from './types';

export interface CatalogProduct {
  id: string;
  label: string;
  grandeFamille: GrandeFamille;
  catalogKind: CatalogKind;
  ppEligible: boolean;
  pmEligible: boolean;
  templateKey: string | null;
}

export const CATALOG_PP_PM_SPLIT_MAP = {
  assurance_emprunteur: { ppId: 'assurance_emprunteur_pp', pmId: 'assurance_emprunteur_pm' },
  contrat_capitalisation: { ppId: 'contrat_capitalisation_pp', pmId: 'contrat_capitalisation_pm' },
  cat_compte_a_terme: { ppId: 'cat_compte_a_terme_pp', pmId: 'cat_compte_a_terme_pm' },
  compte_courant_depot: { ppId: 'compte_courant_depot_pp', pmId: 'compte_courant_depot_pm' },
  csl_compte_sur_livret: { ppId: 'csl_compte_sur_livret_pp', pmId: 'csl_compte_sur_livret_pm' },
  cto: { ppId: 'cto_pp', pmId: 'cto_pm' },
  article_83: { ppId: 'article_83_pp', pmId: 'article_83_pm' },
  article_39: { ppId: 'article_39_pp', pmId: 'article_39_pm' },
  pee: { ppId: 'pee_pp', pmId: 'pee_pm' },
  percol: { ppId: 'percol_pp', pmId: 'percol_pm' },
  perco_ancien: { ppId: 'perco_ancien_pp', pmId: 'perco_ancien_pm' },
  pero: { ppId: 'pero_pp', pmId: 'pero_pm' },
  locatif_nu: { ppId: 'locatif_nu_pp', pmId: 'locatif_nu_pm' },
  immobilier_garage_parking: { ppId: 'immobilier_garage_parking_pp', pmId: 'immobilier_garage_parking_pm' },
  immobilier_terrain: { ppId: 'immobilier_terrain_pp', pmId: 'immobilier_terrain_pm' },
  groupement_foncier_agri_viti: { ppId: 'groupement_foncier_agri_viti_pp', pmId: 'groupement_foncier_agri_viti_pm' },
  groupement_foncier_forestier: { ppId: 'groupement_foncier_forestier_pp', pmId: 'groupement_foncier_forestier_pm' },
  parts_scpi: { ppId: 'parts_scpi_pp', pmId: 'parts_scpi_pm' },
  fcpr: { ppId: 'fcpr_pp', pmId: 'fcpr_pm' },
  fcpi: { ppId: 'fcpi_pp', pmId: 'fcpi_pm' },
  fip: { ppId: 'fip_pp', pmId: 'fip_pm' },
  opci_grand_public: { ppId: 'opci_grand_public_pp', pmId: 'opci_grand_public_pm' },
  actions_cotees: { ppId: 'actions_cotees_pp', pmId: 'actions_cotees_pm' },
  actions_preference: { ppId: 'actions_preference_pp', pmId: 'actions_preference_pm' },
  parts_sociales_cooperatives: { ppId: 'parts_sociales_cooperatives_pp', pmId: 'parts_sociales_cooperatives_pm' },
  titres_participatifs: { ppId: 'titres_participatifs_pp', pmId: 'titres_participatifs_pm' },
  droits_bsa_dps: { ppId: 'droits_bsa_dps_pp', pmId: 'droits_bsa_dps_pm' },
  actions_non_cotees: { ppId: 'actions_non_cotees_pp', pmId: 'actions_non_cotees_pm' },
  crowdfunding: { ppId: 'crowdfunding_pp', pmId: 'crowdfunding_pm' },
  obligations_non_cotees: { ppId: 'obligations_non_cotees_pp', pmId: 'obligations_non_cotees_pm' },
  sofica: { ppId: 'sofica_pp', pmId: 'sofica_pm' },
  ir_pme_madelin: { ppId: 'ir_pme_madelin_pp', pmId: 'ir_pme_madelin_pm' },
  compte_courant_associe: { ppId: 'compte_courant_associe_pp', pmId: 'compte_courant_associe_pm' },
  usufruit_nue_propriete: { ppId: 'usufruit_nue_propriete_pp', pmId: 'usufruit_nue_propriete_pm' },
  crypto_actifs: { ppId: 'crypto_actifs_pp', pmId: 'crypto_actifs_pm' },
  metaux_precieux: { ppId: 'metaux_precieux_pp', pmId: 'metaux_precieux_pm' },
  tontine: { ppId: 'tontine_pp', pmId: 'tontine_pm' },
} as const;

type SplitLegacyProductId = keyof typeof CATALOG_PP_PM_SPLIT_MAP;

function splitAudienceCatalogProduct(
  legacyId: SplitLegacyProductId,
  base: Omit<CatalogProduct, 'id' | 'ppEligible' | 'pmEligible'>,
): [CatalogProduct, CatalogProduct] {
  const split = CATALOG_PP_PM_SPLIT_MAP[legacyId];
  return [
    {
      ...base,
      id: split.ppId,
      ppEligible: true,
      pmEligible: false,
    },
    {
      ...base,
      id: split.pmId,
      ppEligible: false,
      pmEligible: true,
    },
  ];
}

export const CATALOG: CatalogProduct[] = [
  // ── Assurance prévoyance ─────────────────────────────────────────────────
  {
    id: 'assurance_dependance',
    label: 'Assurance dépendance',
    grandeFamille: 'Assurance prévoyance',
    catalogKind: 'protection',
    ppEligible: true,
    pmEligible: false,
    templateKey: null,
  },
  ...splitAudienceCatalogProduct('assurance_emprunteur', {
    label: 'Assurance emprunteur',
    grandeFamille: 'Assurance prévoyance',
    catalogKind: 'protection',
    templateKey: null,
  }),
  {
    id: 'assurance_obseques',
    label: 'Assurance obsèques',
    grandeFamille: 'Assurance prévoyance',
    catalogKind: 'protection',
    ppEligible: true,
    pmEligible: false,
    templateKey: null,
  },
  {
    id: 'prevoyance_individuelle_deces',
    label: 'Prévoyance individuelle décès',
    grandeFamille: 'Assurance prévoyance',
    catalogKind: 'protection',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'insurance_risk_generic',
  },
  {
    id: 'prevoyance_individuelle_itt_invalidite',
    label: 'Prévoyance individuelle arrêt de travail / invalidité',
    grandeFamille: 'Assurance prévoyance',
    catalogKind: 'protection',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'insurance_risk_generic',
  },
  {
    id: 'assurance_homme_cle',
    label: 'Assurance homme-clé',
    grandeFamille: 'Assurance prévoyance',
    catalogKind: 'protection',
    ppEligible: false,
    pmEligible: true,
    templateKey: 'insurance_risk_generic',
  },

  // ── Épargne Assurance ────────────────────────────────────────────────────
  {
    id: 'assurance_vie',
    label: 'Assurance-vie',
    grandeFamille: 'Épargne Assurance',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'insurance_life_savings',
  },
  ...splitAudienceCatalogProduct('contrat_capitalisation', {
    label: 'Contrat de capitalisation',
    grandeFamille: 'Épargne Assurance',
    catalogKind: 'wrapper',
    templateKey: 'capitalisation_contract',
  }),

  // ── Épargne bancaire ─────────────────────────────────────────────────────
  ...splitAudienceCatalogProduct('cat_compte_a_terme', {
    label: 'Compte à terme / dépôt à terme (CAT)',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    templateKey: 'bank_account',
  }),
  ...splitAudienceCatalogProduct('compte_courant_depot', {
    label: 'Compte courant (compte de dépôt)',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    templateKey: 'bank_account',
  }),
  ...splitAudienceCatalogProduct('csl_compte_sur_livret', {
    label: 'Compte sur livret (CSL)',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    templateKey: 'bank_account',
  }),
  {
    id: 'cel',
    label: 'CEL (Compte épargne logement)',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'bank_account',
  },
  {
    id: 'ldds',
    label: 'LDDS',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'regulated_savings',
  },
  {
    id: 'lep',
    label: 'LEP',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'regulated_savings',
  },
  {
    id: 'livret_a',
    label: 'Livret A',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'regulated_savings',
  },
  {
    id: 'livret_jeune',
    label: 'Livret Jeune',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'regulated_savings',
  },
  {
    id: 'pel',
    label: 'PEL (Plan épargne logement)',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'bank_account',
  },
  {
    id: 'peac',
    label: 'PEAC (Plan d\'épargne avenir climat)',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'regulated_savings',
  },
  ...splitAudienceCatalogProduct('cto', {
    label: 'Compte-titres ordinaire (CTO)',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    templateKey: 'securities_account',
  }),
  {
    id: 'pea',
    label: 'PEA (Plan d\'épargne en actions)',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'securities_account',
  },
  {
    id: 'pea_pme',
    label: 'PEA-PME',
    grandeFamille: 'Épargne bancaire',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'securities_account',
  },

  // ── Retraite & épargne salariale ─────────────────────────────────────────
  ...splitAudienceCatalogProduct('article_83', {
    label: 'Article 83 (anciens contrats "retraite entreprise")',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    templateKey: 'retirement_company',
  }),
  ...splitAudienceCatalogProduct('article_39', {
    label: 'Article 39 (retraite supplémentaire à prestations définies)',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    templateKey: 'retirement_company',
  }),
  {
    id: 'madelin_retraite_ancien',
    label: 'Madelin retraite (ancien)',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'retirement_individual',
  },
  ...splitAudienceCatalogProduct('pee', {
    label: 'PEE (Plan d\'épargne entreprise)',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    templateKey: 'employee_savings_plan',
  }),
  {
    id: 'interessement',
    label: 'Intéressement',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    ppEligible: false,
    pmEligible: true,
    templateKey: 'employee_savings_plan',
  },
  {
    id: 'participation',
    label: 'Participation',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    ppEligible: false,
    pmEligible: true,
    templateKey: 'employee_savings_plan',
  },
  {
    id: 'perin_assurance',
    label: 'PERIN assurantiel (PER individuel assurance)',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'retirement_individual',
  },
  {
    id: 'perin_bancaire',
    label: 'PERIN bancaire (PER individuel compte-titres)',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'retirement_individual',
  },
  ...splitAudienceCatalogProduct('percol', {
    label: 'PERCOL (PER collectif)',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    templateKey: 'retirement_company',
  }),
  ...splitAudienceCatalogProduct('perco_ancien', {
    label: 'PERCO (ancien)',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    templateKey: 'retirement_company',
  }),
  ...splitAudienceCatalogProduct('pero', {
    label: 'PERO (PER obligatoire)',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    templateKey: 'retirement_company',
  }),
  {
    id: 'perp_ancien',
    label: 'PERP (ancien)',
    grandeFamille: 'Retraite & épargne salariale',
    catalogKind: 'wrapper',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'retirement_individual',
  },

  // ── Dispositifs fiscaux immobilier ───────────────────────────────────────
  {
    id: 'censi_bouvard',
    label: 'Censi-Bouvard (LMNP "réduction")',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },
  {
    id: 'denormandie',
    label: 'Denormandie (ancien à rénover)',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },
  {
    id: 'duflot',
    label: 'Duflot',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },
  {
    id: 'loc_avantages',
    label: 'Loc\'Avantages (convention Anah)',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },
  {
    id: 'louer_abordable_cosse',
    label: 'Louer abordable (Cosse) — déduction',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },
  {
    id: 'malraux',
    label: 'Malraux',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },
  {
    id: 'monuments_historiques',
    label: 'Monuments historiques',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },
  {
    id: 'pinel_pinel_plus',
    label: 'Pinel / Pinel+',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },
  {
    id: 'relance_logement_jeanbrun',
    label: 'Relance logement (dit "Jeanbrun")',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },
  {
    id: 'scellier',
    label: 'Scellier',
    grandeFamille: 'Dispositifs fiscaux immobilier',
    catalogKind: 'tax_overlay',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'tax_overlay_real_estate',
  },

  // ── Immobilier direct ────────────────────────────────────────────────────
  {
    id: 'residence_principale',
    label: 'Résidence principale',
    grandeFamille: 'Immobilier direct',
    catalogKind: 'asset',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'real_estate_direct',
  },
  {
    id: 'residence_secondaire',
    label: 'Résidence secondaire',
    grandeFamille: 'Immobilier direct',
    catalogKind: 'asset',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'real_estate_direct',
  },
  ...splitAudienceCatalogProduct('locatif_nu', {
    label: 'Immobilier locatif nu (revenus fonciers)',
    grandeFamille: 'Immobilier direct',
    catalogKind: 'asset',
    templateKey: 'real_estate_direct',
  }),
  {
    id: 'locatif_meuble_lmnp',
    label: 'Immobilier locatif meublé (LMNP)',
    grandeFamille: 'Immobilier direct',
    catalogKind: 'asset',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'real_estate_direct',
  },
  {
    id: 'locatif_meuble_lmp',
    label: 'Immobilier locatif meublé (LMP)',
    grandeFamille: 'Immobilier direct',
    catalogKind: 'asset',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'real_estate_direct',
  },
  ...splitAudienceCatalogProduct('immobilier_garage_parking', {
    label: 'Garage / parking / lot annexe',
    grandeFamille: 'Immobilier direct',
    catalogKind: 'asset',
    templateKey: 'real_estate_direct',
  }),
  ...splitAudienceCatalogProduct('immobilier_terrain', {
    label: 'Terrain (constructible / non constructible)',
    grandeFamille: 'Immobilier direct',
    catalogKind: 'asset',
    templateKey: 'real_estate_direct',
  }),

  // ── Immobilier indirect ──────────────────────────────────────────────────
  ...splitAudienceCatalogProduct('groupement_foncier_agri_viti', {
    label: 'Groupement foncier agricole / viticole (GFA / GFV)',
    grandeFamille: 'Immobilier indirect',
    catalogKind: 'asset',
    templateKey: 'real_estate_indirect',
  }),
  ...splitAudienceCatalogProduct('groupement_foncier_forestier', {
    label: 'Groupement forestier (GFF / GF)',
    grandeFamille: 'Immobilier indirect',
    catalogKind: 'asset',
    templateKey: 'real_estate_indirect',
  }),
  ...splitAudienceCatalogProduct('parts_scpi', {
    label: 'Parts de SCPI',
    grandeFamille: 'Immobilier indirect',
    catalogKind: 'asset',
    templateKey: 'scpi',
  }),

  // ── Valeurs mobilières ───────────────────────────────────────────────────
  ...splitAudienceCatalogProduct('fcpr', {
    label: 'FCPR (fonds commun de placement à risques)',
    grandeFamille: 'Valeurs mobilières',
    catalogKind: 'asset',
    templateKey: 'fund_opc',
  }),
  ...splitAudienceCatalogProduct('fcpi', {
    label: 'FCPI',
    grandeFamille: 'Valeurs mobilières',
    catalogKind: 'asset',
    templateKey: 'fund_opc',
  }),
  ...splitAudienceCatalogProduct('fip', {
    label: 'FIP',
    grandeFamille: 'Valeurs mobilières',
    catalogKind: 'asset',
    templateKey: 'fund_opc',
  }),
  ...splitAudienceCatalogProduct('opci_grand_public', {
    label: 'OPCI grand public',
    grandeFamille: 'Valeurs mobilières',
    catalogKind: 'asset',
    templateKey: 'fund_opc',
  }),
  ...splitAudienceCatalogProduct('actions_cotees', {
    label: 'Actions (cotées)',
    grandeFamille: 'Valeurs mobilières',
    catalogKind: 'asset',
    templateKey: 'listed_securities',
  }),
  ...splitAudienceCatalogProduct('actions_preference', {
    label: 'Actions de préférence',
    grandeFamille: 'Valeurs mobilières',
    catalogKind: 'asset',
    templateKey: 'listed_securities',
  }),
  ...splitAudienceCatalogProduct('parts_sociales_cooperatives', {
    label: 'Parts sociales (banques mutualistes / coopératives)',
    grandeFamille: 'Valeurs mobilières',
    catalogKind: 'asset',
    templateKey: 'listed_securities',
  }),
  ...splitAudienceCatalogProduct('titres_participatifs', {
    label: 'Titres participatifs',
    grandeFamille: 'Valeurs mobilières',
    catalogKind: 'asset',
    templateKey: 'listed_securities',
  }),
  ...splitAudienceCatalogProduct('droits_bsa_dps', {
    label: 'Bon de souscription d\'actions / Droits / DPS',
    grandeFamille: 'Valeurs mobilières',
    catalogKind: 'asset',
    templateKey: 'listed_securities',
  }),

  // ── Non coté / Private Equity ────────────────────────────────────────────
  ...splitAudienceCatalogProduct('actions_non_cotees', {
    label: 'Actions non cotées (parts/actions de société)',
    grandeFamille: 'Non coté/PE',
    catalogKind: 'asset',
    templateKey: 'private_equity',
  }),
  ...splitAudienceCatalogProduct('crowdfunding', {
    label: 'Crowdfunding (actions/obligations via plateforme)',
    grandeFamille: 'Non coté/PE',
    catalogKind: 'asset',
    templateKey: 'private_equity',
  }),
  ...splitAudienceCatalogProduct('obligations_non_cotees', {
    label: 'Obligations non cotées (PME, club deals)',
    grandeFamille: 'Non coté/PE',
    catalogKind: 'liability',
    templateKey: 'private_debt',
  }),
  ...splitAudienceCatalogProduct('sofica', {
    label: 'SOFICA',
    grandeFamille: 'Non coté/PE',
    catalogKind: 'asset',
    templateKey: 'tax_incentive_fund',
  }),
  ...splitAudienceCatalogProduct('ir_pme_madelin', {
    label: 'Souscription au capital de PME (IR-PME / "Madelin")',
    grandeFamille: 'Non coté/PE',
    catalogKind: 'asset',
    templateKey: 'tax_incentive_equity',
  }),

  // ── Créances / Droits ────────────────────────────────────────────────────
  ...splitAudienceCatalogProduct('compte_courant_associe', {
    label: 'Compte courant d\'associé (créance)',
    grandeFamille: 'Créances/Droits',
    catalogKind: 'liability',
    templateKey: 'claim_right',
  }),
  {
    id: 'pret_entre_particuliers',
    label: 'Prêt entre particuliers (reconnaissance de dette)',
    grandeFamille: 'Créances/Droits',
    catalogKind: 'liability',
    ppEligible: true,
    pmEligible: false,
    templateKey: 'claim_right',
  },
  ...splitAudienceCatalogProduct('usufruit_nue_propriete', {
    label: 'Usufruit / nue-propriété (droits patrimoniaux)',
    grandeFamille: 'Créances/Droits',
    catalogKind: 'asset',
    templateKey: 'claim_right',
  }),

  // ── Autres ───────────────────────────────────────────────────────────────
  ...splitAudienceCatalogProduct('crypto_actifs', {
    label: 'Crypto-actifs',
    grandeFamille: 'Autres',
    catalogKind: 'asset',
    templateKey: 'crypto_asset',
  }),
  ...splitAudienceCatalogProduct('metaux_precieux', {
    label: 'Métaux précieux',
    grandeFamille: 'Autres',
    catalogKind: 'asset',
    templateKey: 'precious_metals',
  }),
  ...splitAudienceCatalogProduct('tontine', {
    label: 'Tontine (association tontinière)',
    grandeFamille: 'Autres',
    catalogKind: 'wrapper',
    templateKey: null,
  }),
];

export const CATALOG_BY_ID: Readonly<Record<string, CatalogProduct>> =
  Object.fromEntries(CATALOG.map((p) => [p.id, p]));

export function getCatalogProduct(id: string): CatalogProduct | undefined {
  return CATALOG_BY_ID[id];
}
