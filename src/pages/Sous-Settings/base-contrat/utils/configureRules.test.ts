/**
 * configureRules.test.ts — Tests unitaires pour la logique pure du modal P1-03g.
 *
 * Couvre :
 *  - blockId déterministe (pas de Date.now)
 *  - sortOrder incrémental
 *  - Anti-doublon (1 seul bloc par templateId, y compris note-libre)
 *  - Snapshot minimal de phase après ajout
 */

import { describe, it, expect } from 'vitest';
import {
  countBlocksByTemplateId,
  getNextBlockIndex,
  getNextSortOrder,
  getExistingTemplateIds,
  canAddTemplate,
  appendBlocksToPhase,
} from './configureRules';
import type { Block, Phase } from '@/types/baseContratSettings';
import type { BlockTemplate } from '@/constants/base-contrat/blockTemplates';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBlock(overrides: Partial<Block> & { blockId: string }): Block {
  return {
    blockKind: 'data',
    uiTitle: 'Test',
    audience: 'all',
    payload: {},
    ...overrides,
  };
}

const emptyPhase: Phase = { applicable: true, blocks: [] };

const phaseWithOneBlock: Phase = {
  applicable: true,
  blocks: [
    makeBlock({ blockId: 'ps-sortie__constitution__1', sortOrder: 1 }),
  ],
};

const noteLibreTemplate: BlockTemplate = {
  templateId: 'note-libre',
  uiTitle: 'Note informative (texte libre)',
  description: 'Bloc de texte libre.',
  suggestedPhases: ['constitution', 'sortie', 'deces'],
  suggestedFor: ['Épargne bancaire'],
  defaultBlock: {
    blockKind: 'note',
    uiTitle: 'Note',
    audience: 'all',
    payload: {},
    notes: '',
  },
};

const psSortieTemplate: BlockTemplate = {
  templateId: 'ps-sortie',
  uiTitle: 'Prélèvements sociaux',
  description: 'Taux global PS.',
  suggestedPhases: ['constitution', 'sortie'],
  suggestedFor: ['Épargne bancaire'],
  defaultBlock: {
    blockKind: 'data',
    uiTitle: 'Prélèvements sociaux',
    audience: 'all',
    payload: {
      psRatePercent: { type: 'ref', value: '$ref:ps_settings.patrimony.current.totalRate', unit: '%', calc: true },
    },
  },
};

// ---------------------------------------------------------------------------
// countBlocksByTemplateId
// ---------------------------------------------------------------------------

describe('countBlocksByTemplateId', () => {
  it('retourne 0 sur phase vide', () => {
    expect(countBlocksByTemplateId([], 'note-libre')).toBe(0);
  });

  it('retourne 1 si 1 bloc note-libre présent', () => {
    const blocks = [makeBlock({ blockId: 'note-libre__constitution__1' })];
    expect(countBlocksByTemplateId(blocks, 'note-libre')).toBe(1);
  });

  it('ne compte pas les blocs d\'autres templates', () => {
    const blocks = [makeBlock({ blockId: 'ps-sortie__constitution__1' })];
    expect(countBlocksByTemplateId(blocks, 'note-libre')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getNextBlockIndex
// ---------------------------------------------------------------------------

describe('getNextBlockIndex', () => {
  it('retourne 1 sur phase vide', () => {
    expect(getNextBlockIndex([], 'note-libre', 'constitution')).toBe(1);
  });

  it('retourne 2 si index 1 existe déjà', () => {
    const blocks = [makeBlock({ blockId: 'note-libre__constitution__1' })];
    expect(getNextBlockIndex(blocks, 'note-libre', 'constitution')).toBe(2);
  });

  it('ignore les blocs d\'autres phases', () => {
    const blocks = [makeBlock({ blockId: 'note-libre__sortie__1' })];
    expect(getNextBlockIndex(blocks, 'note-libre', 'constitution')).toBe(1);
  });

  it('retourne max+1 si plusieurs blocs', () => {
    const blocks = [
      makeBlock({ blockId: 'note-libre__constitution__1' }),
      makeBlock({ blockId: 'note-libre__constitution__2' }),
    ];
    expect(getNextBlockIndex(blocks, 'note-libre', 'constitution')).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getNextSortOrder
// ---------------------------------------------------------------------------

describe('getNextSortOrder', () => {
  it('retourne 1 sur phase vide', () => {
    expect(getNextSortOrder([])).toBe(1);
  });

  it('retourne max+1', () => {
    const blocks = [
      makeBlock({ blockId: 'a__constitution__1', sortOrder: 3 }),
      makeBlock({ blockId: 'b__constitution__1', sortOrder: 7 }),
    ];
    expect(getNextSortOrder(blocks)).toBe(8);
  });

  it('ignore les blocs sans sortOrder', () => {
    const blocks = [makeBlock({ blockId: 'a__constitution__1' })]; // pas de sortOrder
    expect(getNextSortOrder(blocks)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// canAddTemplate
// ---------------------------------------------------------------------------

describe('canAddTemplate', () => {
  it('autorise l\'ajout si template absent', () => {
    expect(canAddTemplate([], 'note-libre')).toBe(true);
  });

  it('refuse l\'ajout si template déjà présent', () => {
    const blocks = [makeBlock({ blockId: 'note-libre__constitution__1' })];
    expect(canAddTemplate(blocks, 'note-libre')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getExistingTemplateIds
// ---------------------------------------------------------------------------

describe('getExistingTemplateIds', () => {
  it('retourne un Set vide sur phase vide', () => {
    expect(getExistingTemplateIds([])).toEqual(new Set());
  });

  it('extrait les templateIds depuis les blockIds', () => {
    const blocks = [
      makeBlock({ blockId: 'ps-sortie__constitution__1' }),
      makeBlock({ blockId: 'note-libre__constitution__1' }),
    ];
    const ids = getExistingTemplateIds(blocks);
    expect(ids.has('ps-sortie')).toBe(true);
    expect(ids.has('note-libre')).toBe(true);
    expect(ids.size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// appendBlocksToPhase — core
// ---------------------------------------------------------------------------

describe('appendBlocksToPhase', () => {
  it('ajoute 1 bloc à une phase vide', () => {
    const result = appendBlocksToPhase(emptyPhase, [noteLibreTemplate], { phaseKey: 'constitution' });
    expect(result.blocks).toHaveLength(1);
    expect(result.applicable).toBe(true);
  });

  it('blockId est déterministe (pas de Date.now)', () => {
    const result = appendBlocksToPhase(emptyPhase, [noteLibreTemplate], { phaseKey: 'constitution' });
    expect(result.blocks[0].blockId).toBe('note-libre__constitution__1');
  });

  it('blockId incrémente si bloc déjà présent (note-libre autorisé)', () => {
    const phase: Phase = {
      applicable: true,
      blocks: [makeBlock({ blockId: 'note-libre__constitution__1', sortOrder: 1 })],
    };
    // canAddTemplate retourne false → note-libre ignorée (anti-doublon)
    const result = appendBlocksToPhase(phase, [noteLibreTemplate], { phaseKey: 'constitution' });
    expect(result.blocks).toHaveLength(1); // pas de doublon
  });

  it('sortOrder est incrémental', () => {
    const result = appendBlocksToPhase(emptyPhase, [psSortieTemplate, noteLibreTemplate], { phaseKey: 'constitution' });
    expect(result.blocks[0].sortOrder).toBe(1);
    expect(result.blocks[1].sortOrder).toBe(2);
  });

  it('sortOrder continue depuis le max existant', () => {
    const phase: Phase = {
      applicable: true,
      blocks: [makeBlock({ blockId: 'ps-sortie__constitution__1', sortOrder: 5 })],
    };
    const result = appendBlocksToPhase(phase, [noteLibreTemplate], { phaseKey: 'constitution' });
    expect(result.blocks[1].sortOrder).toBe(6);
  });

  it('anti-doublon : ignore un template déjà présent', () => {
    const result = appendBlocksToPhase(phaseWithOneBlock, [psSortieTemplate], { phaseKey: 'constitution' });
    // ps-sortie déjà présent → ignoré
    expect(result.blocks).toHaveLength(1);
  });

  it('ne mute pas la phase originale', () => {
    const original = { ...emptyPhase, blocks: [] };
    appendBlocksToPhase(original, [noteLibreTemplate], { phaseKey: 'constitution' });
    expect(original.blocks).toHaveLength(0);
  });

  it('snapshot minimal : structure d\'un bloc ajouté', () => {
    const result = appendBlocksToPhase(emptyPhase, [psSortieTemplate], { phaseKey: 'sortie' });
    const block = result.blocks[0];
    expect(block).toMatchObject({
      blockId: 'ps-sortie__sortie__1',
      blockKind: 'data',
      uiTitle: 'Prélèvements sociaux',
      audience: 'all',
      sortOrder: 1,
    });
    expect(block.payload).toHaveProperty('psRatePercent');
  });
});
