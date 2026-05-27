import {
  createAuditPresentation,
  getAuditClientName,
  getAuditFilename,
  resolveAuditPalette,
} from './sections';
import {
  addAssetsSlide,
  addAuditTitleSlide,
  addCivilSlide,
  addFamilySlide,
  addFiscalSlide,
  addPassifSlide,
  addSuccessionSlide,
} from './slides';
import { addRecommendationsSlide } from './recommendations';
import type { AuditPptxOptions } from './types';

/**
 * Génère le PPTX d'audit complet.
 */
export async function generateAuditPptx(options: AuditPptxOptions): Promise<void> {
  const { dossier, colors, logoBase64 } = options;
  const pptx = createAuditPresentation();
  const palette = resolveAuditPalette(colors);
  const clientName = getAuditClientName(dossier);

  addAuditTitleSlide(pptx, clientName, palette, logoBase64);
  addFamilySlide(pptx, dossier, palette);
  addCivilSlide(pptx, dossier, palette);
  const totalActifs = addAssetsSlide(pptx, dossier, palette);
  addPassifSlide(pptx, dossier, palette, totalActifs);
  addFiscalSlide(pptx, dossier, palette);
  addSuccessionSlide(pptx, dossier, palette);
  addRecommendationsSlide(pptx, dossier, palette);

  await pptx.writeFile({ fileName: getAuditFilename(clientName) });
}
