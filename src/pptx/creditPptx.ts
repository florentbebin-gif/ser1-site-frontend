/**
 * Génération PPTX Crédit
 * Export simple 2-3 slides
 */

import PptxGenJS from 'pptxgenjs';
import { DEFAULT_COLORS } from '../settings/ThemeProvider';
import type { PptxColors, ThemeScope } from '../utils/pptTheme';
import {
  STYLE,
  drawTitleWithOverline,
  drawTitleWithUnderline,
  drawKpiRow,
  drawFooter,
  loadIconAsDataUri,
} from './slideHelpers';

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
  colors?: PptxColors;
  coverUrl?: string | null;
  theme_scope?: ThemeScope;
  clientName?: string;
}

const SHORT_DISCLAIMER = 'Simulation indicative - les conditions réelles dépendent de l’établissement prêteur.';
const LONG_DISCLAIMER = `Document sans valeur contractuelle et purement indicatif, établi sur la base des dispositions légales et règlementaires en vigueur à la date de publication et sont susceptibles d'évolution.

Le contenu et la forme du document et la méthodologie employée, relèvent de la législation sur le droit d'auteur, le droit des marques et, de façon générale, sur la propriété intellectuelle. La société Laplace en est le concepteur.`;

const ICONS = {
  money: '/ppt-assets/icons/icon-money.svg',
  percent: '/ppt-assets/icons/icon-percent.svg',
  document: '/ppt-assets/icons/icon-document.svg',
};

function formatEuro(value?: number | null): string {
  if (!Number.isFinite(value || 0)) return '—';
  return `${Math.round(value || 0).toLocaleString('fr-FR')} €`;
}

function formatRate(value?: number | null): string {
  if (!Number.isFinite(value || 0)) return '—';
  return `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;
}

function formatDuration(years?: number | null): string {
  if (!Number.isFinite(years || 0)) return '—';
  return `${Math.round(years || 0)} ans`;
}

/**
 * Génère un PPTX simple pour le calcul Crédit
 */
export async function generateCreditPptx(options: CreditPptxOptions): Promise<void> {
  const {
    data,
    colors = DEFAULT_COLORS as unknown as PptxColors,
    coverUrl,
    theme_scope,
    clientName = 'Client',
  } = options;

  const pptx = new PptxGenJS();
  pptx.title = 'Simulation Crédit';
  pptx.author = 'SER1 - Cabinet CGP';

  const c1 = colors.c1;
  const c2 = colors.c2;
  const c4 = colors.c4;
  const c7 = colors.c7;
  const c10 = colors.c10;

  const icons = {
    mensualite: await loadIconAsDataUri(ICONS.money),
    cout: await loadIconAsDataUri(ICONS.document),
    taux: await loadIconAsDataUri(ICONS.percent),
    duree: await loadIconAsDataUri(ICONS.document),
  };

  // Slide 1: Cover
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: c1 };
  drawTitleWithOverline(coverSlide, {
    title: 'Simulation Crédit Immobilier',
    subtitle: clientName,
    date: new Date().toLocaleDateString('fr-FR'),
    lineColor: 'FFFFFF',
    titleColor: 'FFFFFF',
    subtitleColor: c4,
  });

  if (coverUrl) {
    coverSlide.addImage({
      path: coverUrl,
      x: STYLE.SLIDE_WIDTH * 0.7,
      y: STYLE.SLIDE_HEIGHT * 0.7,
      w: 2.5,
      h: 1.5,
      transparency: 20,
    });
  }

  // Slide 2: Carte synthèse
  const synthSlide = pptx.addSlide();
  drawTitleWithUnderline(synthSlide, {
    title: 'Carte synthèse du prêt',
    color: c1,
    underlineColor: c2,
  });

  const cardX = STYLE.MARGIN;
  const cardY = STYLE.MARGIN + 0.6;
  const cardWidth = STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2;
  const cardHeight = 2.8;

  synthSlide.addShape('rect', {
    x: cardX,
    y: cardY,
    w: cardWidth,
    h: cardHeight,
    fill: { color: c7 },
    line: { color: c4, width: 1 },
  });

  const textX = cardX + 0.4;
  let lineY = cardY + 0.25;
  const colWidth = cardWidth / 2 - 0.5;

  const addCardBlock = (label: string, value: string, options: { sublabel?: string; xOffset?: number; valueColor?: string }) => {
    const offset = options?.xOffset ?? 0;
    synthSlide.addText(label.toUpperCase(), {
      x: textX + offset,
      y: lineY,
      w: colWidth,
      fontSize: 12,
      color: c10,
      bold: true,
      charSpacing: 50,
    });
    synthSlide.addText(value, {
      x: textX + offset,
      y: lineY + 0.25,
      w: colWidth,
      fontSize: 28,
      color: options?.valueColor ?? c1,
      bold: true,
    });
    if (options?.sublabel) {
      synthSlide.addText(options.sublabel, {
        x: textX + offset,
        y: lineY + 0.25 + 0.45,
        w: colWidth,
        fontSize: 12,
        color: c10,
      });
    }
  };

  addCardBlock('Capital emprunté', formatEuro(data.capitalEmprunte), { });
  addCardBlock(
    'Durée',
    formatDuration(data.dureeAnnees),
    { sublabel: `${Math.round((data.dureeAnnees || 0) * 12)} mois`, xOffset: colWidth + 0.8 }
  );

  lineY += 1.1;
  addCardBlock('Taux nominal', formatRate(data.tauxNominal), { });
  addCardBlock(
    'Mensualité totale',
    formatEuro(data.mensualiteTotale),
    { sublabel: `Hors assurance ${formatEuro(data.mensualiteHorsAssurance)}`, xOffset: colWidth + 0.8, valueColor: c2 }
  );

  synthSlide.addShape('line', {
    x: cardX + 0.2,
    y: lineY + 0.9,
    w: cardWidth - 0.4,
    h: 0,
    line: { color: c4, width: 1 },
  });

  lineY += 1.1;
  addCardBlock('Coût total', formatEuro(data.coutTotal), {
    sublabel: `Intérêts ${formatEuro(data.coutTotalInterets)} • Assurance ${formatEuro(data.coutTotalAssurance)}`,
  });
  addCardBlock(
    'TAEG',
    data.taeg ? formatRate(data.taeg) : '—',
    { xOffset: colWidth + 0.8 }
  );

  const secondaryY = cardY + cardHeight + 0.5;
  synthSlide.addText('Paramètres secondaires', {
    x: STYLE.MARGIN,
    y: secondaryY,
    fontSize: 14,
    color: c1,
    bold: true,
  });

  drawKpiRow(synthSlide, {
    y: secondaryY + 0.35,
    kpis: [
      {
        label: 'Taux assurance',
        value: formatRate(data.tauxAssurance),
        sublabel: 'Sur capital initial',
        iconDataUri: icons.taux,
      },
      {
        label: 'Coût assurance',
        value: formatEuro(data.coutTotalAssurance),
        sublabel: 'Total sur la durée',
        iconDataUri: icons.cout,
      },
      {
        label: 'Mensualité hors assurance',
        value: formatEuro(data.mensualiteHorsAssurance),
        sublabel: '',
        iconDataUri: icons.mensualite,
      },
    ],
  });

  drawFooter(synthSlide, {
    date: new Date().toLocaleDateString('fr-FR'),
    disclaimer: SHORT_DISCLAIMER,
    pageNumber: 2,
    color: c10,
  });

  // Slide 3: Annexes (paramètres)
  const annexSlide = pptx.addSlide();
  drawTitleWithUnderline(annexSlide, {
    title: 'Annexes crédit',
    color: c1,
    underlineColor: c2,
  });

  const annexRows: string[][] = [
    ['Capital emprunté', formatEuro(data.capitalEmprunte)],
    ['Durée', formatDuration(data.dureeAnnees)],
    ['Taux nominal', formatRate(data.tauxNominal)],
  ];

  if (data.tauxAssurance != null) {
    annexRows.push(['Taux assurance', formatRate(data.tauxAssurance)]);
  }

  if (data.taeg != null) {
    annexRows.push(['TAEG', formatRate(data.taeg)]);
  }

  annexRows.push(
    ['Mensualité hors assurance', formatEuro(data.mensualiteHorsAssurance)],
    ['Mensualité totale', formatEuro(data.mensualiteTotale)],
    ['Coût intérêts', formatEuro(data.coutTotalInterets)],
    ['Coût assurance', formatEuro(data.coutTotalAssurance)],
    ['Coût total crédit', formatEuro(data.coutTotal)],
  );

  annexSlide.addTable(
    annexRows.map(([label, value]) => [
      { text: label, options: { bold: true, color: c1 } },
      { text: value, options: { color: c2, align: 'right' } },
    ]),
    {
      x: STYLE.MARGIN,
      y: STYLE.MARGIN + 0.6,
      w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
      fontSize: 12,
      fill: { color: c7 },
      border: { type: 'solid', color: c4, pt: 1 },
      colW: [4, 3],
    },
  );

  drawFooter(annexSlide, {
    date: new Date().toLocaleDateString('fr-FR'),
    disclaimer: SHORT_DISCLAIMER,
    pageNumber: 3,
    color: c10,
  });

  const disclaimerSlide = pptx.addSlide();
  disclaimerSlide.background = { color: 'FFFFFF' };
  drawTitleWithUnderline(disclaimerSlide, {
    title: 'Disclaimer',
    color: c1,
    underlineColor: c2,
  });

  disclaimerSlide.addText(LONG_DISCLAIMER, {
    x: STYLE.MARGIN,
    y: STYLE.MARGIN + 0.6,
    w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    h: STYLE.SLIDE_HEIGHT - STYLE.MARGIN * 2 - 0.6,
    align: 'justify',
    fontSize: 11,
    color: c1,
    fontFace: 'Arial',
  });

  const filename = `Credit_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
