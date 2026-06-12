import { MEMENTO_CHAPTERS } from '@/domain/settings-memento/chapters';
import {
  MEMENTO_EDITORIAL_BY_CHAPTER,
  type MementoChapterEditorial,
} from '@/domain/settings-memento/editorial';
import { MEMENTO_ENTRIES } from '@/domain/settings-memento/entries';
import {
  MEMENTO_LEXICON_TERMS,
  type MementoLexiconStatus,
  type MementoLexiconTerm,
} from '@/domain/settings-memento/lexicon';
import type {
  MementoChapter,
  MementoChapterId,
  MementoEntry,
  MementoStatus,
} from '@/domain/settings-memento/types';

export type MementoPartId =
  | 'chiffres-cles'
  | 'droit-civil'
  | 'fiscalite'
  | 'demembrement'
  | 'societes-placements'
  | 'successions-liberalites'
  | 'fiscalite-internationale'
  | 'lexique'
  | 'social-protection';

export interface MementoDisplayPartDefinition {
  id: MementoPartId;
  title: string;
  description: string;
  chapterIds: readonly MementoChapterId[];
}

export interface MementoDisplayChapter {
  chapter: MementoChapter;
  editorial: MementoChapterEditorial | null;
  entries: readonly MementoEntry[];
}

export interface MementoDisplayPart {
  definition: MementoDisplayPartDefinition;
  chapters: readonly MementoDisplayChapter[];
  entries: readonly MementoEntry[];
  lexiconTerms: readonly MementoLexiconTerm[];
}

export const MEMENTO_DISPLAY_PARTS = [
  {
    id: 'chiffres-cles',
    title: 'Chiffres clés et produits réglementés',
    description:
      'Les repères patrimoniaux qui cadrent le dossier sans exposer de valeur révisable en dur.',
    chapterIds: ['patrimoine'],
  },
  {
    id: 'droit-civil',
    title: 'Droit civil',
    description:
      'Foyer, filiation, régime matrimonial et protection du conjoint avant toute simulation.',
    chapterIds: ['foyer', 'civil'],
  },
  {
    id: 'fiscalite',
    title: 'Fiscalité',
    description:
      'Impôt du foyer, immobilier et arbitrages fiscaux rattachés aux paramètres centralisés.',
    chapterIds: ['fiscalite-foyer', 'immobilier', 'arbitrage'],
  },
  {
    id: 'demembrement',
    title: 'Démembrement',
    description: 'Usufruit, nue-propriété, donation et transmission préparée avec prudence.',
    chapterIds: [],
  },
  {
    id: 'societes-placements',
    title: 'Impôt sur les sociétés et placements',
    description: 'Société, trésorerie, enveloppes de placement et référentiel contrats.',
    chapterIds: ['societe', 'placements'],
  },
  {
    id: 'successions-liberalites',
    title: 'Successions et libéralités',
    description: 'Succession, assurance-vie décès, donations et transmission d’entreprise.',
    chapterIds: ['transmission', 'transmission-entreprise'],
  },
  {
    id: 'fiscalite-internationale',
    title: 'Fiscalité internationale',
    description:
      'Non-résidents et situations transfrontalières à manier avec les conventions applicables.',
    chapterIds: [],
  },
  {
    id: 'lexique',
    title: 'Lexique',
    description: 'Définitions courtes pour partager un vocabulaire patrimonial commun.',
    chapterIds: [],
  },
  {
    id: 'social-protection',
    title: 'Social et protection sociale',
    description: 'Retraite, épargne retraite, prévoyance et protection sociale du dirigeant.',
    chapterIds: ['retraite', 'epargne-retraite', 'prevoyance', 'dirigeant'],
  },
] as const satisfies readonly MementoDisplayPartDefinition[];

export const MEMENTO_ENTRY_PART_OVERRIDES = {
  'patrimoine.demembrement': 'demembrement',
  'transmission.donation-demembrement': 'demembrement',
  'fiscalite-foyer.non-residents': 'fiscalite-internationale',
  'immobilier.non-residents': 'fiscalite-internationale',
  'transmission.transmission-internationale': 'fiscalite-internationale',
} as const satisfies Partial<Record<string, MementoPartId>>;

const MEMENTO_ENTRY_PART_OVERRIDE_MAP: Partial<Record<string, MementoPartId>> =
  MEMENTO_ENTRY_PART_OVERRIDES;

export const MEMENTO_PRUDENCE_LABELS: Record<MementoStatus, string | null> = {
  couvert: null,
  partiel: 'Périmètre en cours',
  planned: 'Chantier prévu',
  absent: 'Pas encore traité',
  a_verifier: 'À manier avec prudence',
  blocked_missing_official_source: 'Source officielle à compléter',
};

export const MEMENTO_LEXICON_PRUDENCE_LABELS: Record<MementoLexiconStatus, string | null> = {
  sourced: null,
  a_verifier: 'À manier avec prudence',
};

const CHAPTER_BY_ID = new Map<MementoChapterId, MementoChapter>(
  MEMENTO_CHAPTERS.map((chapter) => [chapter.id, chapter]),
);

const DEFAULT_PART_BY_CHAPTER = new Map<MementoChapterId, MementoPartId>(
  MEMENTO_DISPLAY_PARTS.flatMap((part) =>
    part.chapterIds.map((chapterId) => [chapterId, part.id] as const),
  ),
);

export function resolveMementoEntryPartId(entry: MementoEntry): MementoPartId {
  const override = MEMENTO_ENTRY_PART_OVERRIDE_MAP[entry.key];
  if (override) return override;

  const partId = DEFAULT_PART_BY_CHAPTER.get(entry.chapterId);
  if (!partId) {
    throw new Error(`Chapitre mémento non rattaché à une partie V8 : ${entry.chapterId}`);
  }
  return partId;
}

function entriesForPart(partId: MementoPartId): MementoEntry[] {
  return MEMENTO_ENTRIES.filter((entry) => resolveMementoEntryPartId(entry) === partId);
}

function directEntriesForPart(
  part: MementoDisplayPartDefinition,
  entries: readonly MementoEntry[],
): MementoEntry[] {
  return entries.filter(
    (entry) =>
      MEMENTO_ENTRY_PART_OVERRIDE_MAP[entry.key] === part.id ||
      !part.chapterIds.includes(entry.chapterId),
  );
}

function chaptersForPart(
  part: MementoDisplayPartDefinition,
  entries: readonly MementoEntry[],
): MementoDisplayChapter[] {
  return part.chapterIds
    .map((chapterId) => {
      const chapter = CHAPTER_BY_ID.get(chapterId);
      if (!chapter) {
        throw new Error(`Chapitre mémento inconnu dans le plan V8 : ${chapterId}`);
      }

      const chapterEntries = entries.filter(
        (entry) =>
          entry.chapterId === chapterId && MEMENTO_ENTRY_PART_OVERRIDE_MAP[entry.key] === undefined,
      );

      return {
        chapter,
        editorial: MEMENTO_EDITORIAL_BY_CHAPTER.get(chapterId) ?? null,
        entries: chapterEntries,
      };
    })
    .filter((chapter) => chapter.entries.length > 0 || chapter.editorial !== null);
}

export function buildMementoDisplayPlan(): readonly MementoDisplayPart[] {
  return MEMENTO_DISPLAY_PARTS.map((definition) => {
    const partEntries = entriesForPart(definition.id);

    return {
      definition,
      chapters: chaptersForPart(definition, partEntries),
      entries: directEntriesForPart(definition, partEntries),
      lexiconTerms: definition.id === 'lexique' ? MEMENTO_LEXICON_TERMS : [],
    };
  });
}
