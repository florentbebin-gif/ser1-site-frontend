import { LEGAL_REFERENCES, type LegalReferenceId } from '@/domain/legal-references';

import { MEMENTO_CHAPTERS } from './chapters';
import { MEMENTO_ENTRIES } from './entries';
import type { MementoChapterId } from './types';

export const MEMENTO_LEXICON_SENSITIVITY_VALUES = [
  'pedagogique',
  'juridique',
  'fiscal',
  'social',
  'calculatoire',
] as const;

export type MementoLexiconSensitivity = (typeof MEMENTO_LEXICON_SENSITIVITY_VALUES)[number];

export const MEMENTO_LEXICON_STATUS_VALUES = ['sourced', 'a_verifier'] as const;

export type MementoLexiconStatus = (typeof MEMENTO_LEXICON_STATUS_VALUES)[number];

export interface MementoLexiconTerm {
  key: string;
  term: string;
  shortDefinition: string;
  chapterIds: readonly MementoChapterId[];
  sensitivities: readonly MementoLexiconSensitivity[];
  status: MementoLexiconStatus;
  refIds: readonly LegalReferenceId[];
  entryKeys: readonly string[];
}

export interface MementoLexiconValidationResult {
  ok: boolean;
  errors: string[];
}

const SENSITIVE_LEXICON_VALUES = new Set<MementoLexiconSensitivity>([
  'juridique',
  'fiscal',
  'social',
  'calculatoire',
]);

export const MEMENTO_LEXICON_TERMS = [
  {
    key: 'per',
    term: 'PER',
    shortDefinition:
      'Famille de plans d’épargne retraite articulant constitution de droits, sortie retraite et fiscalité selon le compartiment concerné.',
    chapterIds: ['epargne-retraite'],
    sensitivities: ['fiscal', 'juridique'],
    status: 'sourced',
    refIds: ['cmf-l224-1', 'cgi-163-quatervicies'],
    entryKeys: ['epargne-retraite.per-individuel'],
  },
  {
    key: 'perin',
    term: 'PER individuel',
    shortDefinition:
      'Plan souscrit à titre individuel, suivi dans SER1 par les règles de versement, de sortie et de décès du catalogue Base-Contrat.',
    chapterIds: ['epargne-retraite'],
    sensitivities: ['fiscal', 'juridique'],
    status: 'sourced',
    refIds: ['base-source-service-public-per-individuel', 'base-source-art-163-quatervicies-cgi'],
    entryKeys: ['epargne-retraite.per-individuel', 'epargne-retraite.per-transfert'],
  },
  {
    key: 'article-83-pero',
    term: 'Article 83 et PERO',
    shortDefinition:
      'Contrats retraite obligatoires d’entreprise, historiques ou issus du cadre PER, distingués des dispositifs individuels.',
    chapterIds: ['epargne-retraite'],
    sensitivities: ['fiscal', 'juridique', 'social'],
    status: 'sourced',
    refIds: [
      'base-source-art-83-cgi-ancien',
      'base-source-service-public-per-d-entreprise-obligatoire',
      'cmf-l224-1',
    ],
    entryKeys: ['epargne-retraite.article-83-pero'],
  },
  {
    key: 'madelin-retraite',
    term: 'Madelin retraite',
    shortDefinition:
      'Ancien contrat retraite des travailleurs non salariés, relié aux règles de déduction et de sortie documentées par le catalogue.',
    chapterIds: ['epargne-retraite', 'dirigeant'],
    sensitivities: ['fiscal', 'social'],
    status: 'sourced',
    refIds: [
      'cgi-154-bis',
      'base-source-art-154-bis-cgi-tns-madelin-retraite',
      'base-source-art-163-quatervicies-cgi-perp-madelin-sortie-rente',
    ],
    entryKeys: ['epargne-retraite.madelin', 'dirigeant.charges-sociales-tns'],
  },
  {
    key: 'percol-perco',
    term: 'PERCOL et PERCO',
    shortDefinition:
      'Dispositifs collectifs d’épargne salariale orientés retraite, rattachés aux sources Code du travail et Service-Public.',
    chapterIds: ['epargne-retraite', 'societe'],
    sensitivities: ['juridique', 'social'],
    status: 'sourced',
    refIds: [
      'code-travail-l3312-1',
      'code-travail-l3332-1',
      'base-source-service-public-epargne-salariale-pee',
    ],
    entryKeys: ['epargne-retraite.epargne-salariale-retraite', 'societe.epargne-salariale'],
  },
  {
    key: 'fiscalite-sortie-retraite',
    term: 'Fiscalité de sortie retraite',
    shortDefinition:
      'Traitement fiscal des pensions, rentes et sorties de contrats retraite, lu depuis les claims IR, PER et prélèvements sociaux.',
    chapterIds: ['epargne-retraite', 'retraite', 'fiscalite-foyer'],
    sensitivities: ['fiscal', 'calculatoire'],
    status: 'sourced',
    refIds: [
      'boi-rsa-pens-30-10-10',
      'css-l136-8',
      'base-source-art-158-6-cgi-rentes-viageres-a-titre-onereux',
    ],
    entryKeys: ['epargne-retraite.fiscalite-sortie-retraite', 'fiscalite-foyer.ir'],
  },
  {
    key: 'prelevements-sociaux-retraite',
    term: 'Prélèvements sociaux retraite',
    shortDefinition:
      'Famille de prélèvements sociaux appliqués aux revenus de retraite selon les paramètres administrés dans Prélèvements.',
    chapterIds: ['retraite', 'epargne-retraite'],
    sensitivities: ['social', 'calculatoire'],
    status: 'sourced',
    refIds: ['css-l136-8', 'boss-protection-sociale-complementaire'],
    entryKeys: ['retraite.globale', 'epargne-retraite.fiscalite-sortie-retraite'],
  },
  {
    key: 'base-cg-retraite',
    term: 'Base CG retraite',
    shortDefinition:
      'Référentiel documentaire des contrats retraite, distinct des règles fiscales et des moteurs de calcul.',
    chapterIds: ['epargne-retraite'],
    sensitivities: ['juridique'],
    status: 'sourced',
    refIds: ['cmf-l224-1', 'cmf-l224-40'],
    entryKeys: ['epargne-retraite.base-cg-retraite'],
  },
] as const satisfies readonly MementoLexiconTerm[];

export function validateMementoLexicon(
  terms: readonly MementoLexiconTerm[] = MEMENTO_LEXICON_TERMS,
): MementoLexiconValidationResult {
  const chapterIds = new Set(MEMENTO_CHAPTERS.map((chapter) => chapter.id));
  const entryKeys = new Set<string>(MEMENTO_ENTRIES.map((entry) => entry.key));
  const legalReferenceIds = new Set(LEGAL_REFERENCES.map((reference) => reference.id));
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const term of terms) {
    if (seen.has(term.key)) {
      errors.push(`${term.key}: terme de lexique dupliqué.`);
    }
    seen.add(term.key);

    if (!term.key || !term.term.trim() || !term.shortDefinition.trim()) {
      errors.push(`${term.key}: key, term et shortDefinition sont obligatoires.`);
    }

    for (const chapterId of term.chapterIds) {
      if (!chapterIds.has(chapterId)) {
        errors.push(`${term.key}: chapitre mémento inconnu (${chapterId}).`);
      }
    }

    for (const sensitivity of term.sensitivities) {
      if (!MEMENTO_LEXICON_SENSITIVITY_VALUES.includes(sensitivity)) {
        errors.push(`${term.key}: sensibilité inconnue (${sensitivity}).`);
      }
    }

    if (!MEMENTO_LEXICON_STATUS_VALUES.includes(term.status)) {
      errors.push(`${term.key}: statut lexique inconnu (${term.status}).`);
    }

    const hasSensitiveMeaning = term.sensitivities.some((sensitivity) =>
      SENSITIVE_LEXICON_VALUES.has(sensitivity),
    );
    if (hasSensitiveMeaning && term.status !== 'sourced' && term.status !== 'a_verifier') {
      errors.push(`${term.key}: terme sensible non classé sourced ou a_verifier.`);
    }
    if (term.status === 'sourced' && term.refIds.length === 0) {
      errors.push(`${term.key}: terme sourced sans référence officielle.`);
    }

    for (const refId of term.refIds) {
      if (!legalReferenceIds.has(refId)) {
        errors.push(`${term.key}: refId juridique inconnu (${refId}).`);
      }
    }

    for (const entryKey of term.entryKeys) {
      if (!entryKeys.has(entryKey)) {
        errors.push(`${term.key}: entrée mémento inconnue (${entryKey}).`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
