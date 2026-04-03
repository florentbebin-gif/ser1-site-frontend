import { generateAuditPptx } from '../../pptx/auditPptx';

export type ExportAuditPptxOptions = Parameters<typeof generateAuditPptx>[0];

/**
 * Couche d'adaptation feature-owned pour garder le legacy PPTX hors du composant.
 */
export async function exportAuditPptx(options: ExportAuditPptxOptions): Promise<void> {
  await generateAuditPptx(options);
}
