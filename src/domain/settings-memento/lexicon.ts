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
    key: 'acquets',
    term: 'Acquêts',
    shortDefinition:
      'Biens acquis par les époux pendant le mariage sous un régime de communauté, en principe communs aux deux époux.',
    chapterIds: ['civil'],
    sensitivities: ['juridique'],
    status: 'a_verifier',
    refIds: [],
    entryKeys: ['civil.regime-matrimonial'],
  },
  {
    key: 'avancement-hoirie',
    term: 'Avancement d’hoirie',
    shortDefinition:
      'Ancienne expression désignant une donation consentie par avance sur la part successorale du bénéficiaire.',
    chapterIds: ['transmission'],
    sensitivities: ['juridique'],
    status: 'a_verifier',
    refIds: [],
    entryKeys: ['transmission.donations-anterieures'],
  },
  {
    key: 'biens-indivis',
    term: 'Biens indivis',
    shortDefinition:
      'Biens appartenant simultanément à plusieurs personnes, chacune détenant une quote-part sans division matérielle du bien.',
    chapterIds: ['civil', 'patrimoine'],
    sensitivities: ['juridique'],
    status: 'a_verifier',
    refIds: [],
    entryKeys: ['civil.regime-matrimonial', 'patrimoine.actif-passif'],
  },
  {
    key: 'biens-propres',
    term: 'Biens propres',
    shortDefinition:
      'Biens conservés dans le patrimoine personnel d’un époux, notamment lorsqu’ils existent avant le mariage ou sont reçus par libéralité.',
    chapterIds: ['civil'],
    sensitivities: ['juridique'],
    status: 'a_verifier',
    refIds: [],
    entryKeys: ['civil.regime-matrimonial'],
  },
  {
    key: 'conjoint-survivant',
    term: 'Conjoint survivant',
    shortDefinition:
      'Époux encore en vie au décès de son conjoint, dont les droits successoraux dépendent de la famille du défunt et des libéralités reçues.',
    chapterIds: ['foyer', 'civil', 'transmission'],
    sensitivities: ['juridique'],
    status: 'sourced',
    refIds: ['code-civil-757'],
    entryKeys: ['civil.devolution-conjoint-survivant'],
  },
  {
    key: 'demembrement-propriete',
    term: 'Démembrement de propriété',
    shortDefinition:
      'Division du droit de propriété entre usufruit et nue-propriété, avec des pouvoirs et une valorisation distincts.',
    chapterIds: ['civil', 'patrimoine', 'transmission'],
    sensitivities: ['juridique', 'fiscal'],
    status: 'sourced',
    refIds: ['code-civil-578', 'cgi-669'],
    entryKeys: ['patrimoine.demembrement', 'transmission.donation-demembrement'],
  },
  {
    key: 'usufruit',
    term: 'Usufruit',
    shortDefinition:
      'Droit d’utiliser un bien ou d’en percevoir les revenus, sans en détenir la nue-propriété.',
    chapterIds: ['civil', 'patrimoine', 'transmission'],
    sensitivities: ['juridique', 'fiscal'],
    status: 'sourced',
    refIds: ['code-civil-578', 'cgi-669'],
    entryKeys: ['patrimoine.demembrement', 'transmission.donation-demembrement'],
  },
  {
    key: 'nue-propriete',
    term: 'Nue-propriété',
    shortDefinition:
      'Droit de disposer du bien à terme, séparé de l’usufruit qui porte l’usage et les revenus pendant le démembrement.',
    chapterIds: ['civil', 'patrimoine', 'transmission'],
    sensitivities: ['juridique', 'fiscal'],
    status: 'sourced',
    refIds: ['code-civil-578', 'cgi-669'],
    entryKeys: ['patrimoine.demembrement', 'transmission.donation-demembrement'],
  },
  {
    key: 'heritiers-reservataires',
    term: 'Héritiers réservataires',
    shortDefinition:
      'Héritiers auxquels la loi garantit une fraction minimale de la succession, appelée réserve héréditaire.',
    chapterIds: ['civil', 'transmission'],
    sensitivities: ['juridique'],
    status: 'sourced',
    refIds: ['code-civil-912'],
    entryKeys: ['civil.reserve-quotite'],
  },
  {
    key: 'quotite-disponible',
    term: 'Quotité disponible',
    shortDefinition:
      'Fraction du patrimoine dont une personne peut librement disposer par donation ou testament.',
    chapterIds: ['civil', 'transmission'],
    sensitivities: ['juridique'],
    status: 'sourced',
    refIds: ['code-civil-912', 'code-civil-913'],
    entryKeys: ['civil.reserve-quotite'],
  },
  {
    key: 'rapport-liberalites',
    term: 'Rapport des libéralités',
    shortDefinition:
      'Mécanisme civil qui réintègre certaines donations dans les comptes successoraux afin de préserver l’équilibre entre héritiers.',
    chapterIds: ['transmission'],
    sensitivities: ['juridique'],
    status: 'sourced',
    refIds: ['code-civil-843'],
    entryKeys: ['transmission.donations-anterieures'],
  },
  {
    key: 'donation-partage',
    term: 'Donation-partage',
    shortDefinition:
      'Acte qui organise une transmission anticipée et une répartition entre bénéficiaires, avec une logique de partage immédiat.',
    chapterIds: ['transmission'],
    sensitivities: ['juridique'],
    status: 'sourced',
    refIds: ['code-civil-1075', 'code-civil-1078'],
    entryKeys: ['transmission.donation-demembrement', 'transmission.liberalites'],
  },
  {
    key: 'soulte',
    term: 'Soulte',
    shortDefinition:
      'Somme versée pour compenser une inégalité de valeur dans un partage, un échange ou une attribution patrimoniale.',
    chapterIds: ['civil', 'transmission'],
    sensitivities: ['juridique'],
    status: 'a_verifier',
    refIds: [],
    entryKeys: ['civil.regime-matrimonial'],
  },
  {
    key: 'plus-value',
    term: 'Plus-value',
    shortDefinition:
      'Gain réalisé lors de la cession d’un actif, lu différemment selon la nature du bien et le régime fiscal applicable.',
    chapterIds: ['fiscalite-foyer', 'immobilier', 'placements', 'societe'],
    sensitivities: ['fiscal'],
    status: 'sourced',
    refIds: ['cgi-150-0-a', 'base-source-art-150-u-cgi-plus-values-immobilieres'],
    entryKeys: [
      'immobilier.pv-immobilieres',
      'placements.enveloppes-titres',
      'societe.cession-titres',
    ],
  },
  {
    key: 'prelevements-sociaux',
    term: 'Prélèvements sociaux',
    shortDefinition:
      'Contributions sociales appliquées à certains revenus ou gains, en complément de l’impôt proprement dit.',
    chapterIds: ['fiscalite-foyer', 'placements', 'retraite'],
    sensitivities: ['fiscal', 'social'],
    status: 'sourced',
    refIds: ['css-l136-8', 'service-public-ps-revenus-capital-2026'],
    entryKeys: ['placements.ps-pfu-revenus-capital', 'retraite.globale'],
  },
  {
    key: 'retenue-source',
    term: 'Retenue à la source',
    shortDefinition:
      'Prélèvement opéré directement par le débiteur d’un revenu, fréquent dans les situations de non-résidence.',
    chapterIds: ['fiscalite-foyer'],
    sensitivities: ['fiscal'],
    status: 'sourced',
    refIds: ['cgi-182-a', 'cgi-187'],
    entryKeys: ['fiscalite-foyer.non-residents'],
  },
  {
    key: 'eee',
    term: 'EEE',
    shortDefinition:
      'Espace économique européen, regroupant l’Union européenne, la Norvège, l’Islande et le Liechtenstein.',
    chapterIds: ['fiscalite-foyer'],
    sensitivities: ['fiscal'],
    status: 'a_verifier',
    refIds: [],
    entryKeys: ['fiscalite-foyer.non-residents'],
  },
  {
    key: 'etnc',
    term: 'ETNC',
    shortDefinition:
      'États ou territoires non coopératifs, notion fiscale utilisée pour qualifier certaines situations internationales sensibles.',
    chapterIds: ['fiscalite-foyer'],
    sensitivities: ['fiscal'],
    status: 'a_verifier',
    refIds: [],
    entryKeys: ['fiscalite-foyer.non-residents'],
  },
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
      'Plan souscrit à titre individuel, avec des règles propres de versement, transfert, sortie et décès selon le support retenu.',
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
      'Ancien contrat retraite des travailleurs non salariés, à lire avec les règles de déduction, de disponibilité et de sortie applicables.',
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
      'Traitement fiscal des pensions, rentes et sorties de contrats retraite selon la nature des sommes perçues et le mode de sortie choisi.',
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
      'Famille de prélèvements sociaux appliqués aux revenus de retraite selon la nature du revenu et la situation du foyer.',
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
      'Référentiel documentaire des clauses, garanties et supports des contrats retraite.',
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
