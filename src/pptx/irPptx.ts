/**
 * Génération PPTX IR (Impôt sur le Revenu)
 * Export simple 2-3 slides
 */

import type { ThemeColors } from '../settings/ThemeProvider';

export interface IRPptxData {
  revenuNetImposable: number;
  nombreParts: number;
  impotBrut: number;
  tmi: number;
  revenuParPart: number;
  detailTranches?: Array<{ tranche: string; montant: number; taux: number }>;
}

interface IRPptxOptions {
  data: IRPptxData;
  colors?: ThemeColors;
  clientName?: string;
}

/**
 * Génère un PPTX simple pour le calcul IR
 */
export async function generateIRPptx(): Promise<void> {
  console.warn('[PPTX] generateIRPptx is deprecated. Use buildIrStudyDeck/exportStudyDeck instead.');
}
