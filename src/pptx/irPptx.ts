/**
 * Génération PPTX IR (Impôt sur le Revenu)
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
  drawSegmentedBar,
  drawResultLine,
  drawFooter,
  loadIconAsDataUri,
  paginateTableRows,
  drawPedagogicalBlock,
} from './slideHelpers';
export interface IRPptxData {
  revenuNetImposable: number;
  nombreParts: number;
  impotBrut: number;
  tmi: number;
  revenuParPart: number;
  detailTranches?: Array<{ tranche: string; montant: number; taux: number }>;
  montantDansTmi?: number;
  margeAvantChangement?: number;
}

interface IRPptxOptions {
  data: IRPptxData;
  colors?: PptxColors;
  coverUrl?: string | null;
  theme_scope?: ThemeScope;
  clientName?: string;
}

const SHORT_DISCLAIMER = "Simulation indicative - les résultats réels peuvent varier.";
const LONG_DISCLAIMER = `Document sans valeur contractuelle et purement indicatif, établi sur la base des dispositions légales et règlementaires en vigueur à la date de publication et sont susceptibles d'évolution.

Le contenu et la forme du document et la méthodologie employée, relèvent de la législation sur le droit d'auteur, le droit des marques et, de façon générale, sur la propriété intellectuelle. La société Laplace en est le concepteur.`;

const ICONS = {
  income: 'public/ppt-assets/icons/icon-money.svg',
  document: 'public/ppt-assets/icons/icon-document.svg',
  parts: 'public/ppt-assets/icons/icon-scale.svg',
  percent: 'public/ppt-assets/icons/icon-percent.svg',
};

function formatEuro(value: number | undefined | null): string {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value || 0).toLocaleString('fr-FR')} €`;
}

function formatRate(value: number | undefined | null): string {
  if (!Number.isFinite(value)) return '—';
  return `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;
}

/**
 * Génère un PPTX simple pour le calcul IR
 */
export async function generateIRPptx(options: IRPptxOptions): Promise<void> {
  const {
    data,
    colors = DEFAULT_COLORS as unknown as PptxColors,
    coverUrl,
    clientName = 'Client',
  } = options;

  const pptx = new PptxGenJS();
  pptx.title = 'Simulation Impôt sur le Revenu';
  pptx.author = 'SER1 - Cabinet CGP';

  const c1 = colors.c1;
  const c2 = colors.c2;
  const c4 = colors.c4;
  const c7 = colors.c7;
  const c8 = colors.c8 || colors.c7;
  const c10 = colors.c10;

  const icons = {
    income: await loadIconAsDataUri(ICONS.income).catch(() => null),
    document: await loadIconAsDataUri(ICONS.document).catch(() => null),
    parts: await loadIconAsDataUri(ICONS.parts).catch(() => null),
    percent: await loadIconAsDataUri(ICONS.percent).catch(() => null),
  };

  // Slide 1: cover
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: c1 };
  drawTitleWithOverline(coverSlide, {
    title: 'Simulation Impôt sur le Revenu',
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

  // Slide 2: KPI page
  const slide2 = pptx.addSlide();
  drawTitleWithUnderline(slide2, {
    title: 'Estimation de la situation fiscale',
    color: c1,
    underlineColor: c2,
    y: STYLE.MARGIN,
  });

  const displayRate = formatRate(data.tmi);
  const kpiStartY = STYLE.MARGIN + 0.7;

  drawKpiRow(slide2, {
    y: kpiStartY,
    kpis: [
      {
        label: 'Estimation de vos revenus',
        value: formatEuro(data.revenuNetImposable),
        sublabel: `Par part : ${formatEuro(data.revenuParPart)}`,
        iconDataUri: icons.income,
      },
      {
        label: 'Revenu imposable',
        value: formatEuro(data.revenuNetImposable),
        sublabel: 'Base calcul',
        iconDataUri: icons.document,
      },
      {
        label: 'Nombre de parts fiscales',
        value: Number.isFinite(data.nombreParts) ? `${data.nombreParts}` : '—',
        sublabel: 'Quotient familial',
        iconDataUri: icons.parts,
      },
      {
        label: 'TMI',
        value: displayRate !== '—' ? displayRate : '—',
        sublabel: 'Tranche marginale',
        iconDataUri: icons.percent,
      },
    ],
  });

  const palette = [c7, c8, c4, c2, c1];
  const detailTranches = data.detailTranches || [];
  const totalTrancheMontant = detailTranches.reduce((sum, tranche) => {
    const value = Number(tranche?.montant) || 0;
    return sum + Math.max(value, 0);
  }, 0);

  const segments = detailTranches.map((tranche, index) => {
    const montant = Math.max(Number(tranche?.montant) || 0, 0);
    const widthPct =
      totalTrancheMontant > 0
        ? (montant / totalTrancheMontant) * 100
        : 100 / detailTranches.length || 100;
    return {
      label: tranche?.tranche || formatRate(tranche?.taux),
      widthPct,
      color: palette[index % palette.length],
    };
  });

  const activeIndex =
    detailTranches.findIndex((tranche) => Number(tranche?.taux) === Number(data.tmi)) ??
    -1;
  const montantDansTranche =
    data.montantDansTmi ??
    detailTranches[activeIndex >= 0 ? activeIndex : detailTranches.length - 1]?.montant ??
    null;
  const subMarkerValue =
    typeof data.margeAvantChangement === 'number'
      ? `Marge avant changement : ${formatEuro(data.margeAvantChangement)}`
      : undefined;

  if (segments.length) {
    drawSegmentedBar(slide2, {
      y: kpiStartY + 2.0,
      segments,
      activeIndex:
        activeIndex >= 0
          ? activeIndex
          : segments.length > 0
          ? segments.length - 1
          : undefined,
      markerValue: formatEuro(montantDansTranche as number | undefined),
      subMarkerValue,
      labelColor: c1,
      activeColor: c2,
    });
  }

  const infoY = kpiStartY + 3.0;
  slide2.addText(
    `Montant dans la tranche ${displayRate !== '—' ? displayRate : ''} : ${formatEuro(
      montantDansTranche as number | undefined
    )}`,
    {
      x: STYLE.MARGIN,
      y: infoY,
      w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
      fontSize: 12,
      color: c1,
    }
  );

  slide2.addText(`Marge avant changement de tranche : —`, {
    x: STYLE.MARGIN,
    y: infoY + 0.3,
    w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    fontSize: 12,
    color: c1,
  });

  const tauxMoyen =
    data.revenuNetImposable > 0
      ? ((data.impotBrut / data.revenuNetImposable) * 100).toFixed(2)
      : '0';

  drawResultLine(slide2, {
    label: 'Estimation du montant de votre impôt sur le revenu',
    value: formatEuro(data.impotBrut),
    y: infoY + 0.8,
    labelColor: c1,
    valueColor: c2,
  });

  let pageNumber = 2;
  drawFooter(slide2, {
    date: new Date().toLocaleDateString('fr-FR'),
    disclaimer: SHORT_DISCLAIMER,
    pageNumber,
    color: c10,
  });
  pageNumber++;

  // Slide Annexe: Hypothèses & Méthodologie
  const annexIntroSlide = pptx.addSlide();
  drawTitleWithUnderline(annexIntroSlide, {
    title: 'Annexe IR — Hypothèses & Méthode',
    color: c1,
    underlineColor: c2,
  });

  drawPedagogicalBlock(annexIntroSlide, {
    title: 'Hypothèses de calcul',
    content: [
      `Revenu Net Imposable : ${formatEuro(data.revenuNetImposable)}`,
      `Nombre de parts fiscales : ${data.nombreParts}`,
      `Quotient Familial (Revenu / Parts) : ${formatEuro(data.revenuParPart)}`,
    ],
    x: STYLE.MARGIN, y: 1.5, w: 4, h: 3, 
    backgroundColor: c7
  });

  drawPedagogicalBlock(annexIntroSlide, {
    title: 'Méthodologie',
    content: [
      '1. Calcul du Quotient Familial (QF).',
      '2. Application du barème progressif sur le QF.',
      '3. L\'impôt par part est obtenu.',
      '4. Multiplication par le nombre de parts pour l\'impôt brut.',
    ],
    x: STYLE.MARGIN + 4.5, y: 1.5, w: 4, h: 3, 
    backgroundColor: c7
  });

  drawFooter(annexIntroSlide, {
    date: new Date().toLocaleDateString('fr-FR'),
    disclaimer: SHORT_DISCLAIMER,
    pageNumber: pageNumber++,
    color: c10,
  });

  const trancheChunks = paginateTableRows(data.detailTranches || [], 12);
  trancheChunks.forEach((chunk, index) => {
    const annexSlide = pptx.addSlide();
    drawTitleWithUnderline(annexSlide, {
      title: `Annexe IR — Calcul par tranche (${index + 1}/${trancheChunks.length})`,
      color: c1,
      underlineColor: c2,
    });

    const textY = STYLE.MARGIN + 0.6;
    annexSlide.addText('Hypothèses', {
      x: STYLE.MARGIN,
      y: textY,
      fontSize: 13,
      color: c1,
      bold: true,
    });
    annexSlide.addText(
      'Barème progressif fourni par le moteur fiscal (revenu net imposable / nombre de parts).',
      {
        x: STYLE.MARGIN,
        y: textY + 0.2,
        fontSize: 11,
        color: c10,
      }
    );

    annexSlide.addText('Méthodologie', {
      x: STYLE.MARGIN,
      y: textY + 0.55,
      fontSize: 13,
      color: c1,
      bold: true,
    });
    annexSlide.addText(
      'Chaque tranche applique son taux sur le montant correspondant. Le total par part est multiplié par le nombre de parts.',
      {
        x: STYLE.MARGIN,
        y: textY + 0.75,
        fontSize: 11,
        color: c10,
      }
    );

    annexSlide.addText('Références techniques', {
      x: STYLE.MARGIN,
      y: textY + 1.1,
      fontSize: 13,
      color: c1,
      bold: true,
    });
    annexSlide.addText('detailTranches[].{tranche, taux, montant}', {
      x: STYLE.MARGIN,
      y: textY + 1.3,
      fontSize: 11,
      color: c10,
    });

    const tableRows = [
      [
        { text: 'Tranche', options: { bold: true, color: c1, align: 'left' as const } },
        { text: 'Montant', options: { bold: true, color: c1, align: 'right' as const } },
        { text: 'Taux', options: { bold: true, color: c1, align: 'center' as const } },
      ],
      ...chunk.map((tranche) => [
        { text: tranche?.tranche || '—', options: { color: c10, align: 'left' as const } },
        { text: formatEuro(tranche?.montant), options: { color: c10, align: 'right' as const } },
        { text: formatRate(tranche?.taux), options: { color: c10, align: 'center' as const } },
      ]),
    ];

    annexSlide.addTable(tableRows, {
      x: STYLE.MARGIN,
      y: textY + 1.65,
      w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
      border: { type: 'solid', color: c2, pt: 0.5 },
      fontSize: 11,
    });

    drawFooter(annexSlide, {
      date: new Date().toLocaleDateString('fr-FR'),
      disclaimer: SHORT_DISCLAIMER,
      pageNumber,
      color: c10,
    });
    pageNumber++;
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

  const filename = `IR_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
