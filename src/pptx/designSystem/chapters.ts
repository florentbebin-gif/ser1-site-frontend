/**
 * Module chapters — pools d'images chapitres par simulateur
 */

// ============================================================================
// CHAPTER IMAGE POOLS
// ============================================================================

/**
 * Pool d'images chapitres par simulateur.
 * Chaque simulateur a ses propres images pour éviter les collisions visuelles.
 * Images disponibles : public/pptx/chapters/ch-01.png .. ch-09.png (range strict 1–9).
 *
 * Matrice de diversité :
 *   ch-01 → IR
 *   ch-02 → Succession, Placement
 *   ch-03 → IR
 *   ch-05 → Credit
 *   ch-06 → Succession
 *   ch-07 → Credit
 *   ch-09 → Placement
 */
export const CHAPTER_IMAGE_POOLS: Record<string, readonly number[]> = {
  ir:         [1, 3],  // source de vérité — inchangé
  credit:     [5, 7],  // diversifié vs IR (était [1, 3])
  per:        [4, 8],  // potentiel PER
  succession: [2, 6],  // diversifié (était [1, 3])
  placement:  [9, 2],  // futur simulateur
} as const;

/**
 * Retourne l'index d'image de chapitre pour un simulateur et un ordinal donné.
 * Utiliser à la place d'un index hardcodé dans les deck builders.
 *
 * @param simId - Identifiant du simulateur ('ir', 'credit', 'succession', 'per', 'placement')
 * @param chapterOrdinal - Ordinal 0-based dans le deck (0 = premier chapitre, 1 = second, etc.)
 * @returns Index d'image valide (1–9)
 */
export function pickChapterImage(simId: string, chapterOrdinal: number): number {
  const pool = CHAPTER_IMAGE_POOLS[simId];
  if (!pool || pool.length === 0) return 1;
  return pool[chapterOrdinal % pool.length];
}
