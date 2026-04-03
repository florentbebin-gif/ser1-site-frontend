import { generateStrategyPptx } from '../../pptx/strategyPptx';

export type ExportStrategyPptxOptions = Parameters<typeof generateStrategyPptx>[0];

/**
 * Couche d'adaptation feature-owned pour garder le legacy PPTX hors du composant.
 */
export async function exportStrategyPptx(options: ExportStrategyPptxOptions): Promise<void> {
  await generateStrategyPptx(options);
}
