/**
 * Génération PPTX Crédit
 * Export simple 2-3 slides
 */

import PptxGenJS from 'pptxgenjs';
import type { ThemeColors } from '../settings/ThemeProvider';
import { DEFAULT_COLORS } from '../settings/ThemeProvider';

// Type pour les lignes de tableau
type TableData = Array<Array<{ text: string }>>;

function toTableRows(data: string[][]): TableData {
  return data.map(row => row.map(cell => ({ text: cell })));
}

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
export async function generateCreditPptx(options: CreditPptxOptions): Promise<void> {
  const { data, colors = DEFAULT_COLORS, clientName = 'Client' } = options;

  const pptx = new PptxGenJS();
  pptx.title = 'Simulation Crédit';
  pptx.author = 'SER1 - Cabinet CGP';

  const c1 = colors.c1.replace('#', '');
  const c2 = colors.c2.replace('#', '');
  const c4 = colors.c4.replace('#', '');
  const c7 = colors.c7.replace('#', '');
  const c10 = colors.c10.replace('#', '');

  // ========== SLIDE 1 : TITRE ==========
  const slide1 = pptx.addSlide();
  slide1.background = { color: c1 };

  slide1.addText('Simulation Crédit Immobilier', {
    x: '10%', y: '35%', w: '80%', h: '15%',
    fontSize: 36, color: 'FFFFFF', align: 'center', bold: true, fontFace: 'Arial',
  });

  slide1.addText(clientName, {
    x: '10%', y: '50%', w: '80%', h: '10%',
    fontSize: 24, color: c4, align: 'center', fontFace: 'Arial',
  });

  slide1.addText(new Date().toLocaleDateString('fr-FR'), {
    x: '10%', y: '62%', w: '80%', h: '8%',
    fontSize: 16, color: 'AAAAAA', align: 'center', fontFace: 'Arial',
  });

  // ========== SLIDE 2 : PARAMÈTRES ==========
  const slide2 = pptx.addSlide();
  slide2.addText('Paramètres du crédit', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  const paramRows: string[][] = [
    ['Capital emprunté', `${data.capitalEmprunte.toLocaleString('fr-FR')} €`],
    ['Durée', `${data.dureeAnnees} ans (${data.dureeAnnees * 12} mois)`],
    ['Taux nominal', `${data.tauxNominal.toFixed(2)} %`],
  ];

  if (data.tauxAssurance) {
    paramRows.push(['Taux assurance', `${data.tauxAssurance.toFixed(2)} %`]);
  }

  if (data.taeg) {
    paramRows.push(['TAEG', `${data.taeg.toFixed(2)} %`]);
  }

  slide2.addTable(toTableRows(paramRows), {
    x: 0.5, y: 1, w: 6,
    fontSize: 16,
    color: c10,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
    colW: [3.5, 2.5],
  });

  // ========== SLIDE 3 : RÉSULTATS ==========
  const slide3 = pptx.addSlide();
  slide3.addText('Résultats', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  const resultRows: string[][] = [
    ['Mensualité (hors assurance)', `${data.mensualiteHorsAssurance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
    ['Mensualité totale', `${data.mensualiteTotale.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
    ['Coût total des intérêts', `${data.coutTotalInterets.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
    ['Coût total assurance', `${data.coutTotalAssurance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
    ['Coût total du crédit', `${data.coutTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
  ];

  slide3.addTable(toTableRows(resultRows), {
    x: 0.5, y: 1, w: 7,
    fontSize: 16,
    color: c10,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
    colW: [4, 3],
  });

  // Montant total remboursé
  const totalRembourse = data.capitalEmprunte + data.coutTotal;
  slide3.addText(`Total remboursé : ${totalRembourse.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, {
    x: 0.5, y: 4, w: 9, h: 0.4,
    fontSize: 18, color: c2, bold: true, fontFace: 'Arial',
  });

  // Disclaimer
  slide3.addText('Simulation indicative - Les conditions réelles dépendent de l\'établissement prêteur.', {
    x: 0.5, y: 4.8, w: 9, h: 0.3,
    fontSize: 10, color: '666666', fontFace: 'Arial', italic: true,
  });

  const filename = `Credit_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
