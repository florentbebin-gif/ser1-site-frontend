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

export interface BlockTemplate {
  templateId: string;
  uiTitle: string;
  description: string;
  suggestedPhases: ('constitution' | 'sortie' | 'deces')[];
  suggestedFor: GrandeFamille[];
  defaultBlock: Omit<Block, 'blockId'>;
}

// ---------------------------------------------------------------------------
// Catalogue MVP (10 templates)
// ---------------------------------------------------------------------------

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    templateId: 'pfu-sortie',
    uiTitle: 'PFU — Flat tax (IR + PS)',
    description: 'Taux forfaitaires IR et PS appliqués aux plus-values et revenus mobiliers. Valeurs lues depuis les Paramètres Impôts.',
    suggestedPhases: ['sortie'],
    suggestedFor: ['Assurance', 'Titres vifs', 'Retraite & épargne salariale', 'Non coté/PE', 'Produits structurés'],
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
    suggestedFor: ['Assurance', 'Épargne bancaire', 'Retraite & épargne salariale', 'Immobilier direct', 'Immobilier indirect'],
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
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Art. 990 I — Primes avant 70 ans',
      audience: 'PP',
      payload: {
        abattementParBeneficiaire: { type: 'number', value: 152500, unit: '€', calc: true },
        brackets: {
          type: 'brackets',
          value: [
            { upTo: 852500, ratePercent: 20 },
            { upTo: null, ratePercent: 31.25 },
          ],
          calc: true,
        },
      },
      dependencies: ['primes versées avant 70 ans'],
      notes: 'Barème par bénéficiaire (CGI art. 990 I).',
    },
  },
  {
    templateId: 'art-757B-deces',
    uiTitle: 'Art. 757 B — Primes après 70 ans',
    description: 'Abattement global de 30 500 € puis taxation aux DMTG selon le lien de parenté.',
    suggestedPhases: ['deces'],
    suggestedFor: ['Assurance', 'Retraite & épargne salariale'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Art. 757 B — Primes après 70 ans',
      audience: 'PP',
      payload: {
        abattementGlobal: { type: 'number', value: 30500, unit: '€', calc: true },
        taxationMode: { type: 'enum', value: 'dmtg', options: ['dmtg', 'exonere'], calc: true },
      },
      dependencies: ['primes versées après 70 ans'],
      notes: 'Au-delà de 30 500 € (global), taxation aux DMTG.',
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
    suggestedFor: ['Assurance', 'Retraite & épargne salariale', 'Titres vifs'],
    defaultBlock: {
      blockKind: 'data',
      uiTitle: 'Exonération après ancienneté',
      audience: 'PP',
      payload: {
        ancienneteMinAns: { type: 'number', value: 5, unit: 'ans', calc: true },
        exonerationIRApresAnciennete: { type: 'boolean', value: true, calc: true },
      },
    },
  },
  {
    templateId: 'note-libre',
    uiTitle: 'Note informative (texte libre)',
    description: 'Bloc de texte sans champ calculé — pour des règles descriptives, des précisions réglementaires ou des cas non paramétrables.',
    suggestedPhases: ['constitution', 'sortie', 'deces'],
    suggestedFor: [
      'Assurance', 'Épargne bancaire', 'Titres vifs', 'Fonds/OPC', 'Immobilier direct',
      'Immobilier indirect', 'Crypto-actifs', 'Non coté/PE', 'Produits structurés',
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
