/**
 * Templates de pré-remplissage pour le référentiel contrats V3.
 *
 * SOURCES DE VÉRITÉ (par ordre de priorité) :
 *  1. Golden snapshot : src/engine/__tests__/extractFiscalParams.test.ts
 *  2. Fixtures : src/engine/__tests__/fixtures/fiscalitySettingsV1.json
 *  3. Migrator : src/utils/fiscalitySettingsMigrator.ts (CTO/PEA rules)
 *  4. settingsDefaults.ts (AV/PER valeurs numériques)
 *
 * CONVENTION $ref : format repo existant ("$ref:tax_settings.pfu.current.rateIR").
 * DIVERGENCE AV décès tranche 2 : 31.25% (fixture) et NON 35% (settingsDefaults).
 */

import type { VersionedRuleset } from '../types/baseContratSettings';

// ---------------------------------------------------------------------------
// $ref constants — identiques à fiscalitySettingsMigrator.ts REFS
// ---------------------------------------------------------------------------
const REF_PFU_IR = '$ref:tax_settings.pfu.current.rateIR';
const REF_PFU_PS = '$ref:tax_settings.pfu.current.rateSocial';
const REF_PS_PATRIMOINE = '$ref:ps_settings.patrimony.current.totalRate';

// ---------------------------------------------------------------------------
// Assurance-vie
// ---------------------------------------------------------------------------

function buildAssuranceVieRuleset(effectiveDate: string): VersionedRuleset {
  return {
    effectiveDate,
    phases: {
      constitution: {
        applicable: true,
        blocks: [
          {
            blockId: 'av-const-versements',
            blockKind: 'data',
            uiTitle: 'Versements',
            audience: 'PP',
            payload: {
              versementDeductibleIR: { type: 'boolean', value: false, calc: true },
              psSurInteretsFondsEuro: { type: 'ref', value: REF_PS_PATRIMOINE, unit: '%', calc: true },
            },
            notes: 'PS sur intérêts (fonds €) prélevés annuellement.',
          },
        ],
      },
      sortie: {
        applicable: true,
        blocks: [
          {
            blockId: 'av-sortie-rachats-post2017-lt8',
            blockKind: 'data',
            uiTitle: 'Rachats — versements depuis 27/09/2017, < 8 ans',
            audience: 'PP',
            payload: {
              irRatePercent: { type: 'ref', value: REF_PFU_IR, unit: '%', calc: true },
              allowBaremeIR: { type: 'boolean', value: true, calc: true },
            },
            dependencies: ['dateVersement > 2017-09-27', 'ancienneté < 8 ans'],
          },
          {
            blockId: 'av-sortie-rachats-post2017-gte8',
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
          {
            blockId: 'av-sortie-rachats-pre2017',
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
          {
            blockId: 'av-sortie-ps',
            blockKind: 'data',
            uiTitle: 'Prélèvements sociaux sur rachats',
            audience: 'all',
            payload: {
              psRatePercent: { type: 'ref', value: REF_PS_PATRIMOINE, unit: '%', calc: true },
            },
            notes: 'Appliqués sur la part d\'intérêts.',
          },
        ],
      },
      deces: {
        applicable: true,
        blocks: [
          {
            blockId: 'av-deces-990I',
            blockKind: 'data',
            uiTitle: 'Art. 990 I — Primes versées avant 70 ans',
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
            dependencies: ['primes versées avant 70 ans', 'contrat souscrit après 13/10/1998'],
            notes: 'Barème par bénéficiaire (CGI art. 990 I).',
          },
          {
            blockId: 'av-deces-757B',
            blockKind: 'data',
            uiTitle: 'Art. 757 B — Primes versées après 70 ans',
            audience: 'PP',
            payload: {
              abattementGlobal: { type: 'number', value: 30500, unit: '€', calc: true },
              taxationMode: { type: 'enum', value: 'dmtg', options: ['dmtg', 'exonere'], calc: true },
            },
            dependencies: ['primes versées après 70 ans'],
            notes: 'Au-delà de 30 500 € (global), taxation aux DMTG.',
          },
        ],
      },
    },
    sources: [{ label: 'BOFiP', url: null, note: 'Source officielle' }],
  };
}

// ---------------------------------------------------------------------------
// CTO
// ---------------------------------------------------------------------------

function buildCtoRuleset(effectiveDate: string): VersionedRuleset {
  return {
    effectiveDate,
    phases: {
      constitution: { applicable: false, blocks: [] },
      sortie: {
        applicable: true,
        blocks: [
          {
            blockId: 'cto-sortie-pfu',
            blockKind: 'data',
            uiTitle: 'PFU (flat tax)',
            audience: 'PP',
            payload: {
              irRatePercent: { type: 'ref', value: REF_PFU_IR, unit: '%', calc: true },
              psRatePercent: { type: 'ref', value: REF_PFU_PS, unit: '%', calc: true },
            },
          },
          {
            blockId: 'cto-sortie-dividendes',
            blockKind: 'data',
            uiTitle: 'Dividendes — option barème',
            audience: 'PP',
            payload: {
              abattementBaremePercent: { type: 'number', value: 40, unit: '%', calc: true },
            },
            notes: 'Abattement de 40 % en cas d\'option pour le barème progressif de l\'IR.',
          },
        ],
      },
      deces: {
        applicable: true,
        blocks: [
          {
            blockId: 'cto-deces-succession',
            blockKind: 'note',
            uiTitle: 'Succession — droit commun',
            audience: 'all',
            payload: {},
            notes: 'Taxation aux DMTG selon le lien de parenté.',
          },
        ],
      },
    },
    sources: [],
  };
}

// ---------------------------------------------------------------------------
// PEA
// ---------------------------------------------------------------------------

function buildPeaRuleset(effectiveDate: string): VersionedRuleset {
  return {
    effectiveDate,
    phases: {
      constitution: { applicable: false, blocks: [] },
      sortie: {
        applicable: true,
        blocks: [
          {
            blockId: 'pea-sortie-anciennete',
            blockKind: 'data',
            uiTitle: 'Exonération après ancienneté',
            audience: 'PP',
            payload: {
              ancienneteMinAns: { type: 'number', value: 5, unit: 'ans', calc: true },
              exonerationIRApresAnciennete: { type: 'boolean', value: true, calc: true },
            },
          },
          {
            blockId: 'pea-sortie-ps',
            blockKind: 'data',
            uiTitle: 'Prélèvements sociaux',
            audience: 'PP',
            payload: {
              psRatePercent: { type: 'ref', value: REF_PS_PATRIMOINE, unit: '%', calc: true },
            },
            notes: 'PS dus même après exonération IR.',
          },
        ],
      },
      deces: { applicable: false, blocks: [] },
    },
    sources: [],
  };
}

// ---------------------------------------------------------------------------
// PER individuel (assurance)
// ---------------------------------------------------------------------------

function buildPerIndividuelAssuranceRuleset(effectiveDate: string): VersionedRuleset {
  return {
    effectiveDate,
    phases: {
      constitution: {
        applicable: true,
        blocks: [
          {
            blockId: 'per-const-deductibilite',
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
        ],
      },
      sortie: {
        applicable: true,
        blocks: [
          {
            blockId: 'per-sortie-capital-pfu',
            blockKind: 'data',
            uiTitle: 'Sortie en capital — PFU sur plus-values',
            audience: 'PP',
            payload: {
              irRatePercent: { type: 'ref', value: REF_PFU_IR, unit: '%', calc: true },
              psRatePercent: { type: 'ref', value: REF_PFU_PS, unit: '%', calc: true },
              allowBaremeIR: { type: 'boolean', value: true, calc: true },
            },
          },
          {
            blockId: 'per-sortie-capital-versements',
            blockKind: 'note',
            uiTitle: 'Sortie en capital — versements déductibles',
            audience: 'PP',
            payload: {},
            notes: 'Les versements déduits sont réintégrés au barème IR (pas de PFU).',
          },
          {
            blockId: 'per-sortie-rente',
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
        ],
      },
      deces: {
        applicable: true,
        blocks: [
          {
            blockId: 'per-deces-assurantiel-990I',
            blockKind: 'data',
            uiTitle: 'PER assurantiel — art. 990 I (avant 70 ans)',
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
          },
          {
            blockId: 'per-deces-assurantiel-757B',
            blockKind: 'data',
            uiTitle: 'PER assurantiel — art. 757 B (après 70 ans)',
            audience: 'PP',
            payload: {
              abattementGlobal: { type: 'number', value: 30500, unit: '€', calc: true },
            },
            dependencies: ['primes versées après 70 ans'],
            notes: 'Au-delà de 30 500 € (global), taxation aux DMTG.',
          },
        ],
      },
    },
    sources: [{ label: 'BOFiP', url: null, note: 'Source officielle' }],
  };
}

// ---------------------------------------------------------------------------
// Public template map
// ---------------------------------------------------------------------------

export type TemplateKey = 'assurance-vie' | 'cto' | 'pea' | 'per-individuel-assurance';

export const TEMPLATE_KEYS: TemplateKey[] = ['assurance-vie', 'cto', 'pea', 'per-individuel-assurance'];

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  'assurance-vie': 'Assurance-vie',
  cto: 'Compte-titres ordinaire (CTO)',
  pea: 'Plan d\'épargne en actions (PEA)',
  'per-individuel-assurance': 'PER individuel (assurance)',
};

export function buildTemplateRuleset(key: TemplateKey, effectiveDate: string): VersionedRuleset {
  switch (key) {
    case 'assurance-vie': return buildAssuranceVieRuleset(effectiveDate);
    case 'cto': return buildCtoRuleset(effectiveDate);
    case 'pea': return buildPeaRuleset(effectiveDate);
    case 'per-individuel-assurance': return buildPerIndividuelAssuranceRuleset(effectiveDate);
  }
}
