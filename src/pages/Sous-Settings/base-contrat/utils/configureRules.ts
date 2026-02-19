/**
 * configureRules.ts — Logique pure du modal "Configurer les règles" (P1-03g).
 *
 * Toutes les fonctions sont pures (pas d'effets de bord, pas de React).
 * Testées via configureRules.test.ts.
 *
 * Règles données :
 *  - blockId déterministe : {templateId}__{phaseKey}__{index}
 *  - sortOrder incrémental : max(phase.blocks.sortOrder ?? 0) + 1
 *  - Anti-doublon : 1 seul bloc par templateId par phase (y compris note-libre)
 */

import type { Block, Phase } from '@/types/baseContratSettings';
import type { BlockTemplate } from '@/constants/base-contrat/blockTemplates';

type PhaseKey = 'constitution' | 'sortie' | 'deces';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retourne le nombre de blocs dans la phase dont le blockId commence par
 * "{templateId}__" (format déterministe).
 */
export function countBlocksByTemplateId(blocks: Block[], templateId: string): number {
  return blocks.filter((b) => b.blockId.startsWith(`${templateId}__`)).length;
}

/**
 * Retourne le prochain index (1-based) pour un templateId dans une phase.
 * Ex : si "note-libre__constitution__1" existe → retourne 2.
 */
export function getNextBlockIndex(blocks: Block[], templateId: string, phaseKey: PhaseKey): number {
  const prefix = `${templateId}__${phaseKey}__`;
  const existingIndices = blocks
    .filter((b) => b.blockId.startsWith(prefix))
    .map((b) => {
      const parts = b.blockId.split('__');
      return parseInt(parts[parts.length - 1] ?? '0', 10);
    })
    .filter((n) => !isNaN(n));
  return existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;
}

/**
 * Retourne le prochain sortOrder (max existant + 1, ou 1 si phase vide).
 */
export function getNextSortOrder(blocks: Block[]): number {
  const max = blocks.reduce(
    (acc, b) => (typeof b.sortOrder === 'number' ? Math.max(acc, b.sortOrder) : acc),
    0,
  );
  return max + 1;
}

/**
 * Retourne l'ensemble des templateIds déjà présents dans la phase.
 * Basé sur le préfixe du blockId (format déterministe).
 */
export function getExistingTemplateIds(blocks: Block[]): Set<string> {
  const ids = new Set<string>();
  for (const block of blocks) {
    const idPart = block.blockId.split('__')[0];
    if (idPart) ids.add(idPart);
  }
  return ids;
}

/**
 * Vérifie si un template peut être ajouté à la phase.
 * Règle : 1 seul bloc par templateId par phase (y compris note-libre).
 */
export function canAddTemplate(blocks: Block[], templateId: string): boolean {
  return countBlocksByTemplateId(blocks, templateId) === 0;
}

// ---------------------------------------------------------------------------
// Core : appendBlocksToPhase
// ---------------------------------------------------------------------------

/**
 * Ajoute les blocs sélectionnés à la phase et retourne une nouvelle phase (immutable).
 *
 * Garanties :
 *  - blockId déterministe : {templateId}__{phaseKey}__{index}
 *  - sortOrder incrémental à partir du max existant
 *  - Anti-doublon : si un template est déjà présent, il est ignoré silencieusement
 *  - Payload cloné (pas de mutation partagée)
 */
export function appendBlocksToPhase(
  phase: Phase,
  selectedTemplates: BlockTemplate[],
  ctx: { phaseKey: PhaseKey },
): Phase {
  const newBlocks: Block[] = [];
  let sortOrderCursor = getNextSortOrder(phase.blocks);

  for (const tmpl of selectedTemplates) {
    // Anti-doublon : ignorer si déjà présent
    if (!canAddTemplate(phase.blocks, tmpl.templateId)) continue;

    const index = getNextBlockIndex(phase.blocks, tmpl.templateId, ctx.phaseKey);
    const blockId = `${tmpl.templateId}__${ctx.phaseKey}__${index}`;

    const payload = JSON.parse(JSON.stringify(tmpl.defaultBlock.payload)) as Block['payload'];

    const newBlock: Block = {
      blockId,
      blockKind: tmpl.defaultBlock.blockKind,
      uiTitle: tmpl.defaultBlock.uiTitle,
      audience: tmpl.defaultBlock.audience,
      payload,
      notes: tmpl.defaultBlock.notes,
      dependencies: tmpl.defaultBlock.dependencies,
      sortOrder: sortOrderCursor++,
    };

    newBlocks.push(newBlock);
  }

  return { ...phase, applicable: true, blocks: [...phase.blocks, ...newBlocks] };
}
