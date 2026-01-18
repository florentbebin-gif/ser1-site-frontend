/**
 * Génération PPTX Crédit
 * Export simple 2-3 slides
 */

import type { ThemeColors } from '../settings/ThemeProvider';

export interface CreditPptxData {
  capitalEmprunte: number;
  dureeAnnees: number;
  tauxNominal: number;
  tauxAssurance?: number;
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotal: number;
  taeg?: number;
}

interface CreditPptxOptions {
  data: CreditPptxData;
  colors?: ThemeColors;
  clientName?: string;
}

/**
 * Génère un PPTX simple pour le calcul Crédit
 */
export async function generateCreditPptx(): Promise<void> {
  console.warn('[PPTX] generateCreditPptx is deprecated. Use buildCreditStudyDeck/exportStudyDeck instead.');
}
