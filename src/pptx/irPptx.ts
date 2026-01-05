/**
 * Génération PPTX IR (Impôt sur le Revenu)
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
export async function generateIRPptx(options: IRPptxOptions): Promise<void> {
  const { data, colors = DEFAULT_COLORS, clientName = 'Client' } = options;

  const pptx = new PptxGenJS();
  pptx.title = 'Simulation Impôt sur le Revenu';
  pptx.author = 'SER1 - Cabinet CGP';

  const c1 = colors.c1.replace('#', '');
  const c4 = colors.c4.replace('#', '');
  const c7 = colors.c7.replace('#', '');
  const c10 = colors.c10.replace('#', '');

  // ========== SLIDE 1 : TITRE ==========
  const slide1 = pptx.addSlide();
  slide1.background = { color: c1 };

  slide1.addText('Simulation Impôt sur le Revenu', {
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

  // ========== SLIDE 2 : RÉSULTATS ==========
  const slide2 = pptx.addSlide();
  slide2.addText('Résultats de la simulation', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
  });

  const resultRows: string[][] = [
    ['Revenu net imposable', `${data.revenuNetImposable.toLocaleString('fr-FR')} €`],
    ['Nombre de parts', `${data.nombreParts}`],
    ['Revenu par part', `${Math.round(data.revenuParPart).toLocaleString('fr-FR')} €`],
    ['Tranche Marginale d\'Imposition (TMI)', `${data.tmi} %`],
    ['Impôt brut', `${data.impotBrut.toLocaleString('fr-FR')} €`],
  ];

  slide2.addTable(toTableRows(resultRows), {
    x: 0.5, y: 1, w: 6,
    fontSize: 16,
    color: c10,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
    colW: [3.5, 2.5],
  });

  // Taux moyen
  const tauxMoyen = data.revenuNetImposable > 0 
    ? ((data.impotBrut / data.revenuNetImposable) * 100).toFixed(2)
    : '0';

  slide2.addText(`Taux moyen d'imposition : ${tauxMoyen} %`, {
    x: 0.5, y: 4, w: 9, h: 0.4,
    fontSize: 18, color: c1, bold: true, fontFace: 'Arial',
  });

  // ========== SLIDE 3 : DÉTAIL TRANCHES (si disponible) ==========
  if (data.detailTranches && data.detailTranches.length > 0) {
    const slide3 = pptx.addSlide();
    slide3.addText('Détail par tranche', {
      x: 0.5, y: 0.3, w: 9, h: 0.5,
      fontSize: 24, color: c1, bold: true, fontFace: 'Arial',
    });

    const trancheRows: string[][] = [['Tranche', 'Taux', 'Montant']];
    data.detailTranches.forEach(t => {
      trancheRows.push([
        t.tranche,
        `${t.taux} %`,
        `${Math.round(t.montant).toLocaleString('fr-FR')} €`,
      ]);
    });

    slide3.addTable(toTableRows(trancheRows), {
      x: 0.5, y: 1, w: 9,
      fontSize: 14,
      color: c10,
      fill: { color: c7 },
      border: { type: 'solid', color: c4, pt: 1 },
      colW: [4.5, 1.5, 3],
    });
  }

  // Disclaimer sur slide2
  slide2.addText('Simulation indicative - Les résultats réels peuvent varier.', {
    x: 0.5, y: 4.8, w: 9, h: 0.3,
    fontSize: 10, color: '666666', fontFace: 'Arial', italic: true,
  });

  const filename = `IR_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
