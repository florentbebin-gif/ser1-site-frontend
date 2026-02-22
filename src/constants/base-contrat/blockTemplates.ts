/**
 * blockTemplates.ts — Catalogue de blocs réutilisables (P1-03g).
 *
 * Chaque BlockTemplate est proposé dans le modal "Configurer les règles"
 * selon la GrandeFamille du produit et la phase sélectionnée.
 *
 * Source : audit AV/CTO/PEA/PER (baseContratTemplates.ts).
 */

import type { GrandeFamille, Block } from '@/types/baseContratSettings';

// ---------------------------------------------------------------------------
// $ref constants — alignés avec baseContratTemplates.ts
// ---------------------------------------------------------------------------

const REF_PFU_IR = '$ref:tax_settings.pfu.current.rateIR';
const REF_PFU_PS = '$ref:tax_settings.pfu.current.rateSocial';
const REF_PS_PATRIMOINE = '$ref:ps_settings.patrimony.current.totalRate';

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Disclaimer — suggestedFor = aide UX, pas validation fiscale
// ---------------------------------------------------------------------------
// Les tableaux suggestedFor sont des suggestions d'interface pour guider l'admin.
// Ils ne présument pas du régime fiscal applicable qui dépend du contexte
// (enveloppe, date de souscription, option du client, etc.).
// En cas de doute ou de sous-régimes multiples, privilégier note-libre + templates dédiés.
// ---------------------------------------------------------------------------

export interface BlockTemplate {
  templateId: string;
  uiTitle: string;
  description: string;
  suggestedPhases: ('constitution' | 'sortie' | 'deces')[];
  suggestedFor: GrandeFamille[];
  defaultBlock: Omit<Block, 'blockId'>;
}

// ---------------------------------------------------------------------------
// Catalogue MVP (10 templates) — enrichi Étape B (audit 78 produits seed)
// ---------------------------------------------------------------------------

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    templateId: 'pfu-sortie',
    uiTitle: 'PFU — Flat tax (IR + PS)',
    description: 'Taux forfaitaires IR et PS appliqués aux plus-values et revenus mobiliers. Valeurs lues depuis les Paramètres Impôts.',
    suggestedPhases: ['sortie'],
    suggestedFor: [
      'Assurance', 'Titres vifs', 'Fonds/OPC', 'Retraite & épargne salariale',
      'Non coté/PE', 'Immobilier indirect',
    ],
    // Note : 'Épargne bancaire' exclu — MVP note-libre (voir ROADMAP TODO templates dédiés).
    // 'Crypto-actifs' exclu — régime spécifique art. 150 VH bis (template dédié à créer).
    // 'Immobilier direct' exclu — PV immobilières (abattements durée, template dédié à créer).
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'PFU (flat tax)',
      audience: 'PP',
      payload: {
        irRatePercent: { type: 'ref', value: REF_PFU_IR, unit: '%', calc: true },
        psRatePercent: { type: 'ref', value: REF_PFU_PS, unit: '%', calc: true },
        allowBaremeIR: { type: 'boolean', value: true, calc: true },
      },
    },
  },
  {
    templateId: 'ps-sortie',
    uiTitle: 'Prélèvements sociaux',
    description: 'Taux global PS sur revenus du patrimoine. Valeur lue depuis les Paramètres Prélèvements sociaux.',
    suggestedPhases: ['constitution', 'sortie'],
    suggestedFor: [
      'Assurance', 'Retraite & épargne salariale', 'Immobilier direct', 'Immobilier indirect',
      'Titres vifs', 'Fonds/OPC', 'Non coté/PE',
    ],
    // Note : 'Épargne bancaire' exclu — MVP note-libre (exonération totale LEP/Livret A/LDDS vs imposable CAT/CSL).
    // 'Crypto-actifs' exclu — régime spécifique art. 150 VH bis.
    // 'Immobilier direct' inclus car PS dus sur PV immo (même si IR exonéré RP).
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Prélèvements sociaux',
      audience: 'all',
      payload: {
        psRatePercent: { type: 'ref', value: REF_PS_PATRIMOINE, unit: '%', calc: true },
      },
      notes: 'Appliqués sur la part de revenus ou intérêts imposables.',
    },
  },
  {
    templateId: 'art-990I-deces',
    uiTitle: 'Art. 990 I — Primes avant 70 ans',
    description: 'Abattement par bénéficiaire (152 500 €) puis barème 20 % / 31,25 %. Applicable aux contrats d\'assurance-vie et PER assurantiel.',
    suggestedPhases: ['deces'],
    suggestedFor: ['Assurance', 'Retraite & épargne salariale'],
    // Applicable uniquement aux contrats d'assurance (AV, capitalisation, PER assurantiel).
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Art. 990 I (décès)',
      audience: 'PP',
      payload: {
        abattementParBeneficiaire: { type: 'number', value: 152500, unit: '€', calc: true },
        tranche1Taux: { type: 'number', value: 20, unit: '%', calc: true },
        tranche1Plafond: { type: 'number', value: 700000, unit: '€', calc: true },
        tranche2Taux: { type: 'number', value: 31.25, unit: '%', calc: true },
      },
    },
  },
  {
    templateId: 'art-757B-deces',
    uiTitle: 'Art. 757 B — Primes après 70 ans',
    description: 'Abattement global (30 500 €) puis barème des droits de succession selon lien de parenté.',
    suggestedPhases: ['deces'],
    suggestedFor: ['Assurance', 'Retraite & épargne salariale'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Art. 757 B (décès)',
      audience: 'PP',
      payload: {
        abattementGlobal: { type: 'number', value: 30500, unit: '€', calc: true },
        integrationSuccession: { type: 'boolean', value: true, calc: true },
      },
      notes: 'S\'applique uniquement aux primes versées, les intérêts générés sont exonérés.',
    },
  },
  {
    templateId: 'dmtg-droit-commun',
    uiTitle: 'DMTG — Droits de succession (Droit commun)',
    description: 'Intégration à l\'actif successoral et application du barème des droits de mutation à titre gratuit (DMTG) selon le lien de parenté.',
    suggestedPhases: ['deces'],
    suggestedFor: ['Épargne bancaire', 'Titres vifs', 'Fonds/OPC', 'Immobilier direct', 'Immobilier indirect', 'Crypto-actifs', 'Non coté/PE', 'Créances/Droits', 'Métaux précieux', 'Retraite & épargne salariale'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Droits de succession (droit commun)',
      audience: 'PP',
      payload: {
        integrationSuccession: { type: 'boolean', value: true, calc: true },
      },
    },
  },
  {
    templateId: 'primes-prevoyance',
    uiTitle: 'Primes prévoyance (Madelin)',
    description: 'Règles de déductibilité des primes versées pour les contrats de prévoyance (Loi Madelin).',
    suggestedPhases: ['constitution'],
    suggestedFor: ['Assurance'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Primes (déductibilité)',
      audience: 'PP',
      payload: {
        deductibleMadelin: { type: 'boolean', value: true, calc: true },
        plafondPass: { type: 'number', value: 3.75, unit: '% PASS', calc: true },
        plafondBenefice: { type: 'number', value: 9, unit: '% BNC/BIC', calc: true },
        plafondMax: { type: 'number', value: 3, unit: 'PASS', calc: true },
      },
    },
  },
  {
    templateId: 'rentes-invalidite',
    uiTitle: 'Rentes et indemnités (ITT / Invalidité)',
    description: 'Imposition des prestations perçues en cas de sinistre (imposables si primes déduites).',
    suggestedPhases: ['sortie'],
    suggestedFor: ['Assurance'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Rentes / ITT (fiscalité)',
      audience: 'PP',
      payload: {
        prestationMensuelle: { type: 'number', value: 0, unit: '€/mois', calc: true },
        franchiseJours: { type: 'number', value: 0, unit: 'jours', calc: true },
        dureeMaxMois: { type: 'number', value: 0, unit: 'mois', calc: true },
        imposableIR: { type: 'boolean', value: true, calc: true },
        categorieRevenus: { type: 'enum', value: 'Pensions et Rentes', options: ['Pensions et Rentes', 'BNC/BIC', 'Traitements et Salaires'], calc: true },
      },
      notes: 'À préciser selon garanties (ITT/IPP/PTIA), franchises, durée d’indemnisation, et déductibilité des primes.',
    },
  },
  {
    templateId: 'capital-deces-prevoyance',
    uiTitle: 'Capital décès prévoyance',
    description: 'Exonération totale du capital décès, ou soumission exceptionnelle à l\'article 990I (rare).',
    suggestedPhases: ['deces'],
    suggestedFor: ['Assurance'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Capital décès (Transmission)',
      audience: 'PP',
      payload: {
        capitalDeces: { type: 'number', value: 0, unit: '€', calc: true },
        nombreBeneficiaires: { type: 'number', value: 1, unit: 'pers.', calc: true },
        exonerationTotale: { type: 'boolean', value: true, calc: true },
        soumisArticle990I: { type: 'boolean', value: false, calc: true },
      },
      notes: 'En pratique, de nombreux capitaux décès de prévoyance sont hors succession. À qualifier selon contrat et situation.',
    },
  },
  {
    templateId: 'abattements-av-8ans',
    uiTitle: 'Rachats ≥ 8 ans — abattements AV',
    description: 'Abattements annuels (4 600 € / 9 200 €), seuil 150 000 €, taux réduit 7,5 % sous le seuil.',
    suggestedPhases: ['sortie'],
    suggestedFor: ['Assurance'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Rachats — versements depuis 27/09/2017, ≥ 8 ans',
      audience: 'PP',
      payload: {
        abattementAnnuelSingle: { type: 'number', value: 4600, unit: '€', calc: true },
        abattementAnnuelCouple: { type: 'number', value: 9200, unit: '€', calc: true },
        seuilPrimesNettes: { type: 'number', value: 150000, unit: '€', calc: true },
        irRateUnderThresholdPercent: { type: 'number', value: 7.5, unit: '%', calc: true },
        irRateOverThresholdPercent: { type: 'ref', value: REF_PFU_IR, unit: '%', calc: true },
        allowBaremeIR: { type: 'boolean', value: true, calc: true },
      },
      dependencies: ['dateVersement > 2017-09-27', 'ancienneté ≥ 8 ans'],
    },
  },
  {
    templateId: 'rachats-pre2017',
    uiTitle: 'Rachats — versements avant 2017',
    description: 'Taux dérogatoires selon l\'ancienneté du versement (35 % / 15 % / 7,5 %) pour les primes versées avant le 27/09/2017.',
    suggestedPhases: ['sortie'],
    suggestedFor: ['Assurance'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Rachats — versements avant 27/09/2017',
      audience: 'PP',
      payload: {
        moins4AnsIrRatePercent: { type: 'number', value: 35, unit: '%', calc: true },
        de4a8AnsIrRatePercent: { type: 'number', value: 15, unit: '%', calc: true },
        plus8AnsIrRatePercent: { type: 'number', value: 7.5, unit: '%', calc: true },
        plus8AnsAbattementSingle: { type: 'number', value: 4600, unit: '€', calc: true },
        plus8AnsAbattementCouple: { type: 'number', value: 9200, unit: '€', calc: true },
      },
      dependencies: ['dateVersement ≤ 2017-09-27'],
    },
  },
  {
    templateId: 'deductibilite-per',
    uiTitle: 'Déductibilité versements PER',
    description: 'Plafond de déductibilité (art. 163 quatervicies) : 10 % des revenus, min 1 × PASS, max 8 × PASS.',
    suggestedPhases: ['constitution'],
    suggestedFor: ['Retraite & épargne salariale'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Déductibilité des versements',
      audience: 'PP',
      payload: {
        plafond163QuaterviciesRatePercent: { type: 'number', value: 10, unit: '%', calc: true },
        plafond163QuaterviciesMinPassMultiple: { type: 'number', value: 1, calc: true },
        plafond163QuaterviciesMaxPassMultiple: { type: 'number', value: 8, calc: true },
      },
      notes: 'Plafond = 10 % des revenus, min 1 × PASS, max 8 × PASS (art. 163 quatervicies CGI).',
    },
  },
  {
    templateId: 'rente-rvto',
    uiTitle: 'Sortie en rente viagère (RVTO)',
    description: 'Fraction imposable de la rente selon l\'âge au 1er versement : 70 % (< 50 ans) → 30 % (≥ 70 ans).',
    suggestedPhases: ['sortie'],
    suggestedFor: ['Retraite & épargne salariale', 'Assurance'],
    // RVTO applicable aux PER (bancaire/assurantiel) et aux contrats AV avec option rente.
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Sortie en rente viagère (RVTO)',
      audience: 'PP',
      payload: {
        fractionImposableMoins50: { type: 'number', value: 70, unit: '%', calc: true },
        fractionImposable50a59: { type: 'number', value: 50, unit: '%', calc: true },
        fractionImposable60a69: { type: 'number', value: 40, unit: '%', calc: true },
        fractionImposable70etPlus: { type: 'number', value: 30, unit: '%', calc: true },
      },
      notes: 'Fraction imposable de la rente selon l\'âge du rentier au 1er versement.',
    },
  },
  {
    templateId: 'anciennete-exoneration',
    uiTitle: 'Exonération après ancienneté',
    description: 'Exonération IR après un seuil d\'ancienneté (ex : 5 ans pour PEA). PS restent dus.',
    suggestedPhases: ['sortie'],
    suggestedFor: [
      'Assurance', 'Retraite & épargne salariale', 'Titres vifs', 'Fonds/OPC',
      'Immobilier direct', 'Immobilier indirect', 'Non coté/PE',
    ],
    // PEA (Titres vifs / Fonds/OPC) : exonération IR après 5 ans, PS restent dus.
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Exonération après ancienneté',
      audience: 'PP',
      payload: {
        ancienneteMinAns: { type: 'number', value: 5, unit: 'ans', calc: true },
        exonerationIRApresAnciennete: { type: 'boolean', value: true, calc: true },
      },
      notes: 'Exonération IR après un seuil d\'ancienneté (ex : 5 ans pour PEA). PS restent dus.',
    },
  },
  {
    templateId: 'pv-immobiliere',
    uiTitle: 'Plus-values immobilières',
    description: 'Abattements durée pour PV immobilières : 22 ans (IR), 30 ans (PS). Exonération résidence principale (RP) selon conditions.',
    suggestedPhases: ['sortie'],
    suggestedFor: ['Immobilier direct'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Plus-values immobilières',
      audience: 'PP',
      payload: {
        abattementIrMaxYears: { type: 'number', value: 22, unit: 'ans', calc: true },
        abattementIrFullExoYears: { type: 'number', value: 22, unit: 'ans', calc: true },
        abattementPsMaxYears: { type: 'number', value: 30, unit: 'ans', calc: true },
        abattementPsFullExoYears: { type: 'number', value: 30, unit: 'ans', calc: true },
        exonerationRpConditions: { type: 'enum', value: 'rp_principale', options: ['rp_principale', 'rp_exceptionnelle', 'non'], calc: true },
        surtaxePvImmobiliere: { type: 'boolean', value: false, calc: true },
      },
      notes: 'Abattements durée : IR exonéré après 22 ans, PS exonérés après 30 ans. Exonération RP si conditions remplies.',
    },
  },
  {
    templateId: 'epargne-reglementee-exoneration',
    uiTitle: 'Épargne réglementée — exonération totale',
    description: 'Produits d\'épargne réglementée exonérés d\'IR et de PS : LEP, Livret A, LDDS. Plafonds et taux réglementés.',
    suggestedPhases: ['constitution', 'sortie'],
    suggestedFor: ['Épargne bancaire'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Épargne réglementée exonérée',
      audience: 'PP',
      payload: {
        produitReglementeType: { type: 'enum', value: 'livret_a', options: ['livret_a', 'lep', 'ldds'], calc: true },
        plafondReglementaireEuro: { type: 'number', value: 22950, unit: '€', calc: true },
        tauxInteretReglementePercent: { type: 'number', value: 3.0, unit: '%', calc: true },
        exonerationIR: { type: 'boolean', value: true, calc: true },
        exonerationPS: { type: 'boolean', value: true, calc: true },
        conditionsLEPRevenus: { type: 'boolean', value: false, calc: true },
        referenceLegale: { type: 'string', value: 'CGI art. 163 bis A (Livret A), art. 157 (LEP), art. 163 bis B (LDDS)', calc: false },
      },
      notes: 'LEP, Livret A, LDDS : exonération totale IR + PS. Plafonds réglementaires. LEP soumis à conditions de revenus.',
    },
  },
  // ---------------------------------------------------------------------------
  // Étape C2 — Templates contextuels (sous-régime explicite requis)
  // (epargne-bancaire-imposable livré PR#117 — marqué C2 pour traçabilité)
  // ---------------------------------------------------------------------------
  {
    templateId: 'epargne-bancaire-imposable',
    uiTitle: 'Épargne bancaire imposable',
    description: 'Produits bancaires imposables : CAT, CSL, comptes à terme. IR au barème progressif ou option PFU + PS sur intérêts.',
    suggestedPhases: ['sortie'],
    suggestedFor: ['Épargne bancaire'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Épargne bancaire imposable',
      audience: 'PP',
      payload: {
        produitImposableType: { type: 'enum', value: 'cat', options: ['cat', 'csl', 'compte_terme'], calc: true },
        irOption: { type: 'enum', value: 'bareme', options: ['bareme', 'pfu'], calc: true },
        irRateBaremePercent: { type: 'number', value: 30, unit: '%', calc: true },
        irRatePFUPercent: { type: 'ref', value: REF_PFU_IR, unit: '%', calc: true },
        psRateInteretsPercent: { type: 'ref', value: REF_PS_PATRIMOINE, unit: '%', calc: true },
        prelevementForfaitaireNonLibératoire: { type: 'boolean', value: false, calc: true },
        declarationRevenusAnnuelle: { type: 'boolean', value: true, calc: true },
      },
      notes: 'CAT/CSL : IR au barème (défaut) ou option PFU. PS sur intérêts. Prélèvement forfaitaire non libératoire, à déclarer.',
    },
  },
  // ---------------------------------------------------------------------------
  // Étape C1 — Templates sans ambiguïté de sous-régime
  // ---------------------------------------------------------------------------
  {
    templateId: 'taxe-forfaitaire-metaux',
    uiTitle: 'Taxe forfaitaire — Métaux précieux',
    description: 'Cession de métaux précieux : taxe forfaitaire 11,5 % sur le prix de cession (or, argent, platine) ou option PV mobilières sur justificatif d\'acquisition.',
    suggestedPhases: ['sortie'],
    suggestedFor: ['Métaux précieux'],
    // Régime sans ambiguïté : taxe forfaitaire par défaut, option PV mobilières sur justificatif.
    // Pas de dépendance enveloppe. CGI art. 150 VI.
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Taxe forfaitaire — Métaux précieux',
      audience: 'PP',
      payload: {
        taxeForfaitaireRatePercent: { type: 'number', value: 11.5, unit: '%', calc: true },
        optionPVMobilieres: { type: 'boolean', value: false, calc: true },
        justificatifAcquisitionRequis: { type: 'boolean', value: true, calc: true },
        seuilExonerationEuro: { type: 'number', value: 5000, unit: '€', calc: true },
      },
      notes: '⚠️ Valeurs par défaut = base de travail. À vérifier selon millésime fiscal / BOFiP / CGI. Taxe forfaitaire 11,5 % sur prix de cession (CGI art. 150 VI). Option PV mobilières possible sur justificatif d\'acquisition. Seuil exonération 5 000 €.',
    },
  },
  {
    templateId: 'crypto-pfu-150vhbis',
    uiTitle: 'Crypto-actifs — Art. 150 VH bis',
    description: 'Cessions d\'actifs numériques : 30 % flat (12,8 % IR + 17,2 % PS) sur plus-values nettes annuelles. Seuil d\'exonération 305 € de cessions/an.',
    suggestedPhases: ['sortie'],
    suggestedFor: ['Crypto-actifs'],
    // Régime spécifique art. 150 VH bis — distinct du PFU standard mobilier.
    // Pas de dépendance enveloppe. Option barème IR possible depuis 2023.
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Crypto-actifs — Flat tax art. 150 VH bis',
      audience: 'PP',
      payload: {
        irRateFlatPercent: { type: 'number', value: 12.8, unit: '%', calc: true },
        psRatePercent: { type: 'ref', value: REF_PFU_PS, unit: '%', calc: true },
        totalFlatTaxPercent: { type: 'number', value: 30, unit: '%', calc: true },
        seuilExonerationCessionsEuro: { type: 'number', value: 305, unit: '€', calc: true },
        optionBaremeIRDepuis2023: { type: 'boolean', value: false, calc: true },
        methodePrixAcquisitionMoyen: { type: 'boolean', value: true, calc: true },
      },
      notes: '⚠️ Valeurs par défaut = base de travail. À vérifier selon millésime fiscal / BOFiP / CGI. Art. 150 VH bis : 30 % flat sur PV nettes annuelles. Seuil 305 € de cessions totales/an. Option barème IR possible (depuis 2023). Réf. CGI art. 150 VH bis.',
    },
  },
  // ---------------------------------------------------------------------------
  // Étape C2 — Templates contextuels (sous-régime explicite requis)
  // ---------------------------------------------------------------------------
  {
    templateId: 'avantage-ir-dispositif',
    uiTitle: 'Avantage fiscal IR — Dispositif',
    description: 'Avantage fiscal sur l\'impôt sur le revenu (réduction ou déduction) lié à un investissement : IR-PME, SOFICA, Pinel, Malraux, Monuments Historiques, Denormandie. Le régime dépend du dispositif choisi.',
    suggestedPhases: ['constitution'],
    suggestedFor: ['Non coté/PE', 'Dispositifs fiscaux immo'],
    // ⚠️ Template contextuel : le taux, le plafond, la durée et la NATURE (réduction vs déduction) varient selon le dispositif.
    // L'admin DOIT sélectionner le dispositif ET la nature d'avantage explicitement — pas de règle implicite.
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Avantage fiscal IR — Dispositif',
      audience: 'PP',
      payload: {
        avantageNature: {
          type: 'enum',
          value: 'reduction',
          options: ['reduction', 'deduction'],
          calc: true,
        },
        dispositifType: {
          type: 'enum',
          value: 'ir_pme',
          options: ['ir_pme', 'sofica', 'pinel', 'malraux', 'monuments_historiques', 'loc_avantages', 'denormandie'],
          calc: true,
        },
        tauxAvantagePercent: { type: 'number', value: 18, unit: '%', calc: true },
        plafondInvestissementEuro: { type: 'number', value: 50000, unit: '€', calc: true },
        dureeEngagementAns: { type: 'number', value: 5, unit: 'ans', calc: true },
        plafonnementGlobalNichesEuro: { type: 'number', value: 10000, unit: '€', calc: true },
        reportableAnneesN: { type: 'number', value: 4, unit: 'ans', calc: true },
      },
      notes: '⚠️ Valeurs par défaut = base de travail. À vérifier selon millésime fiscal / BOFiP / CGI. Le régime dépend du dispositif choisi (taux, plafond, durée, nature réduction/déduction). Sélectionner explicitement. Plafonnement global niches 10 000 € (sauf Malraux/MH). Réf. : CGI art. 199 terdecies-0 A (IR-PME), 199 undecies C (SOFICA), 199 novovicies (Pinel), etc.',
    },
  },
  {
    templateId: 'note-libre',
    uiTitle: 'Note informative (texte libre)',
    description: 'Bloc de texte sans champ calculé — pour des règles descriptives, des précisions réglementaires ou des cas non paramétrables.',
    suggestedPhases: ['constitution', 'sortie', 'deces'],
    suggestedFor: [
      'Assurance', 'Épargne bancaire', 'Titres vifs', 'Fonds/OPC', 'Immobilier direct',
      'Immobilier indirect', 'Crypto-actifs', 'Non coté/PE',
      'Créances/Droits', 'Dispositifs fiscaux immo', 'Métaux précieux', 'Retraite & épargne salariale',
    ],
    defaultBlock: {
      blockKind: 'note',
      uiTitle: 'Note',
      audience: 'all',
      payload: {},
      notes: '',
    },
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getTemplateById(id: string): BlockTemplate | undefined {
  return BLOCK_TEMPLATES.find((t) => t.templateId === id);
}

export function getTemplatesForContext(
  grandeFamille: GrandeFamille,
  phase: 'constitution' | 'sortie' | 'deces',
): BlockTemplate[] {
  return BLOCK_TEMPLATES.filter(
    (t) => t.suggestedPhases.includes(phase) && t.suggestedFor.includes(grandeFamille),
  );
}
