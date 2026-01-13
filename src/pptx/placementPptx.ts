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
  applySplitLayout,
  drawAccentBar,
  drawPhaseTimeline,
} from './slideHelpers';

const SHORT_DISCLAIMER = 'Simulation indicative non contractuelle.';
const LONG_DISCLAIMER = `Document sans valeur contractuelle et purement indicatif, établi sur la base des dispositions légales et règlementaires en vigueur à la date de publication et sont susceptibles d'évolution.\n\nLe contenu et la forme du document et la méthodologie employée, relèvent de la législation sur le droit d'auteur, le droit des marques et, de façon générale, sur la propriété intellectuelle. La société Laplace en est le concepteur.`;

const ICONS = {
  capital: '/ppt-assets/icons/icon-money.svg',
  tax: '/ppt-assets/icons/icon-tax.svg',
  net: '/ppt-assets/icons/icon-document.svg',
  perf: '/ppt-assets/icons/icon-percent.svg',
  versement: '/ppt-assets/icons/icon-versement.svg',
  economie: '/ppt-assets/icons/icon-economie.svg',
};

function formatEuro(value?: number | null): string {
  if (!Number.isFinite(value || 0)) return '—';
  return `${Math.round(value || 0).toLocaleString('fr-FR')} €`;
}

// --- DATA STRUCTURES ---

interface EpargneRow {
  annee: number;
  capitalFin: number;
}

interface EpargneResult {
  capitalAcquis: number;
  cumulVersements: number;
  effortReel: number;
  cumulEconomieIR: number;
  rows: EpargneRow[];
}

interface LiquidationRow {
  age: number;
  retraitNet: number;
}

interface LiquidationResult {
  revenuAnnuelMoyenNet: number;
  cumulRetraitsNetsAuDeces: number;
  capitalRestantAuDeces: number;
  rows: LiquidationRow[];
}

interface TransmissionResult {
  capitalTransmis: number;
  regime: string;
  abattement: number;
  taxe: number;
  capitalTransmisNet: number;
}

interface ProductResult {
  envelopeLabel: string;
  epargne: EpargneResult;
  liquidation: LiquidationResult;
  transmission: TransmissionResult;
  versementConfig?: any;
  fraisGestion: number;
  rendements: any;
}

export interface PlacementPptxData {
  produit1: ProductResult | null;
  produit2: ProductResult | null;
  client: {
    ageActuel: number;
  };
  dureeEpargne: number;
  ageAuDeces: number;
  deltas: any;
  recommandations: { critere: string; solution: string }[];
  risques: { [key: string]: string[] };
}

export interface PlacementPptxOptions {
  data: PlacementPptxData;
  colors?: PptxColors;
  coverUrl?: string | null;
  theme_scope?: ThemeScope;
  clientName?: string;
}

function addEpargneSlides(pptx: PptxGenJS, produit1: ProductResult, produit2: ProductResult, colors: PptxColors, icons: any, pageNumber: number): number {
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2;

  drawTitleWithUnderline(slide, { title: 'Phase Épargne : Capital Acquis', color: c1, underlineColor: c2 });

  // KPIs
  const kpis = [
    { label: 'Capital Acquis', value: formatEuro(produit1.epargne.capitalAcquis), iconDataUri: icons.capital },
    { label: 'Versements Cumulés', value: formatEuro(produit1.epargne.cumulVersements), iconDataUri: icons.versement },
    { label: 'Effort Réel', value: formatEuro(produit1.epargne.effortReel), iconDataUri: icons.net },
    { label: 'Économie IR', value: formatEuro(produit1.epargne.cumulEconomieIR), iconDataUri: icons.economie },
  ];
  drawKpiRow(slide, { y: STYLE.MARGIN + 0.8, kpis, title: produit1.envelopeLabel, titleColor: c1 });
  
  const kpis2 = [
    { label: 'Capital Acquis', value: formatEuro(produit2.epargne.capitalAcquis), iconDataUri: icons.capital },
    { label: 'Versements Cumulés', value: formatEuro(produit2.epargne.cumulVersements), iconDataUri: icons.versement },
    { label: 'Effort Réel', value: formatEuro(produit2.epargne.effortReel), iconDataUri: icons.net },
    { label: 'Économie IR', value: formatEuro(produit2.epargne.cumulEconomieIR), iconDataUri: icons.economie },
  ];
  drawKpiRow(slide, { y: STYLE.MARGIN + 2.8, kpis: kpis2, title: produit2.envelopeLabel, titleColor: c1 });

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: colors.c10 });

  // Slide Graphe
  const graphSlide = pptx.addSlide();
  drawTitleWithUnderline(graphSlide, { title: 'Phase Épargne : Évolution du capital', color: c1, underlineColor: c2 });

  const chartData = [
    {
      name: produit1.envelopeLabel,
      labels: produit1.epargne.rows.map((r, i) => `A${i}`),
      values: produit1.epargne.rows.map(r => r.capitalFin),
    },
    {
      name: produit2.envelopeLabel,
      labels: produit2.epargne.rows.map((r, i) => `A${i}`),
      values: produit2.epargne.rows.map(r => r.capitalFin),
    },
  ];

  graphSlide.addChart(pptx.ChartType.line, chartData, {
    x: 0.5, y: 1, w: 9, h: 4, 
    showLegend: true, legendPos: 'b',
    catAxisLabelColor: colors.c10, valAxisLabelColor: colors.c10,
    chartColors: [colors.c2, colors.c3 || '00BFFF'],
  });

  drawFooter(graphSlide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber: pageNumber + 1, color: colors.c10 });

  return 2;
}

function addLiquidationSlides(pptx: PptxGenJS, produit1: ProductResult, produit2: ProductResult, colors: PptxColors, icons: any, pageNumber: number): number {
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2;

  drawTitleWithUnderline(slide, { title: 'Phase Liquidation : Synthèse des revenus', color: c1, underlineColor: c2 });

  const kpis = [
    { label: 'Revenu Annuel Moyen Net', value: formatEuro(produit1.liquidation.revenuAnnuelMoyenNet), iconDataUri: icons.capital },
    { label: 'Cumul Revenus Nets', value: formatEuro(produit1.liquidation.cumulRetraitsNetsAuDeces), iconDataUri: icons.net },
    { label: 'Capital Restant', value: formatEuro(produit1.liquidation.capitalRestantAuDeces), iconDataUri: icons.tax },
  ];
  drawKpiRow(slide, { y: STYLE.MARGIN + 0.8, kpis, title: produit1.envelopeLabel, titleColor: c1 });

  const kpis2 = [
    { label: 'Revenu Annuel Moyen Net', value: formatEuro(produit2.liquidation.revenuAnnuelMoyenNet), iconDataUri: icons.capital },
    { label: 'Cumul Revenus Nets', value: formatEuro(produit2.liquidation.cumulRetraitsNetsAuDeces), iconDataUri: icons.net },
    { label: 'Capital Restant', value: formatEuro(produit2.liquidation.capitalRestantAuDeces), iconDataUri: icons.tax },
  ];
  drawKpiRow(slide, { y: STYLE.MARGIN + 2.8, kpis: kpis2, title: produit2.envelopeLabel, titleColor: c1 });

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: colors.c10 });

  // Slide Graphe
  const graphSlide = pptx.addSlide();
  drawTitleWithUnderline(graphSlide, { title: 'Phase Liquidation : Évolution des retraits', color: c1, underlineColor: c2 });

  const chartData = [
    {
      name: produit1.envelopeLabel,
      labels: produit1.liquidation.rows.map(r => `${r.age}`),
      values: produit1.liquidation.rows.map(r => r.retraitNet),
    },
    {
      name: produit2.envelopeLabel,
      labels: produit2.liquidation.rows.map(r => `${r.age}`),
      values: produit2.liquidation.rows.map(r => r.retraitNet),
    },
  ];

  graphSlide.addChart(pptx.ChartType.bar, chartData, {
    x: 0.5, y: 1, w: 9, h: 4, 
    showLegend: true, legendPos: 'b',
    catAxisLabelColor: colors.c10, valAxisLabelColor: colors.c10,
    barDir: 'col',
  });

  drawFooter(graphSlide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber: pageNumber + 1, color: colors.c10 });

  return 2;
}

function addTransmissionSlides(pptx: PptxGenJS, produit1: ProductResult, produit2: ProductResult, colors: PptxColors, icons: any, pageNumber: number): number {
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2;

  drawTitleWithUnderline(slide, { title: 'Phase Transmission : Synthèse', color: c1, underlineColor: c2 });

  const kpis = [
    { label: 'Capital Transmis Brut', value: formatEuro(produit1.transmission.capitalTransmis), iconDataUri: icons.capital },
    { label: 'Abattement', value: formatEuro(produit1.transmission.abattement), iconDataUri: icons.economie },
    { label: 'Fiscalité Décès', value: formatEuro(produit1.transmission.taxe), iconDataUri: icons.tax },
    { label: 'Capital Transmis Net', value: formatEuro(produit1.transmission.capitalTransmisNet), iconDataUri: icons.net },
  ];
  drawKpiRow(slide, { y: STYLE.MARGIN + 0.8, kpis, title: produit1.envelopeLabel, titleColor: c1 });

  const kpis2 = [
    { label: 'Capital Transmis Brut', value: formatEuro(produit2.transmission.capitalTransmis), iconDataUri: icons.capital },
    { label: 'Abattement', value: formatEuro(produit2.transmission.abattement), iconDataUri: icons.economie },
    { label: 'Fiscalité Décès', value: formatEuro(produit2.transmission.taxe), iconDataUri: icons.tax },
    { label: 'Capital Transmis Net', value: formatEuro(produit2.transmission.capitalTransmisNet), iconDataUri: icons.net },
  ];
  drawKpiRow(slide, { y: STYLE.MARGIN + 2.8, kpis: kpis2, title: produit2.envelopeLabel, titleColor: c1 });

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: colors.c10 });

  return 1;
}

function addComparisonSlide(pptx: PptxGenJS, data: PlacementPptxData, colors: PptxColors, pageNumber: number) {
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2, c10 = colors.c10;
  drawTitleWithUnderline(slide, { title: 'Comparaison Globale', color: c1, underlineColor: c2 });

  const p1 = data.produit1;
  const p2 = data.produit2;

  const header = [
    { text: 'Indicateur', options: { bold: true, color: 'FFFFFF', fill: { color: c2 } } },
    { text: p1?.envelopeLabel || '', options: { bold: true, color: 'FFFFFF', fill: { color: c2 } } },
    { text: p2?.envelopeLabel || '', options: { bold: true, color: 'FFFFFF', fill: { color: c2 } } },
  ];

  const rows = [
    ['Effort réel', formatEuro(p1?.epargne.effortReel), formatEuro(p2?.epargne.effortReel)],
    ['Revenus nets (retraite)', formatEuro(p1?.liquidation.cumulRetraitsNetsAuDeces), formatEuro(p2?.liquidation.cumulRetraitsNetsAuDeces)],
    ['Capital transmis net', formatEuro(p1?.transmission.capitalTransmisNet), formatEuro(p2?.transmission.capitalTransmisNet)],
  ];

  const tableData = [header, ...rows.map(row => row.map(cell => ({ text: cell })))];

  slide.addTable(tableData, {
    x: STYLE.MARGIN, y: 1.5, w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    colW: [4, 2.5, 2.5],
    border: { type: 'solid', pt: 1, color: colors.c4 }
  });

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: c10 });
}

function addRisksSlide(pptx: PptxGenJS, data: PlacementPptxData, colors: PptxColors, pageNumber: number) {
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2, c9 = colors.c9, c10 = colors.c10;
  drawTitleWithUnderline(slide, { title: 'Risques et Points de Vigilance', color: c1, underlineColor: c2 });

  const p1Risks = data.risques[data.produit1?.envelopeLabel || ''] || [];
  const p2Risks = data.risques[data.produit2?.envelopeLabel || ''] || [];

  const contentY = 1.8;
  const colWidth = 4;
  const col1X = 1;
  const col2X = 5.5;

  if (data.produit1) {
    drawAccentBar(slide, {x: col1X - 0.2, y: contentY - 0.2, height: 2.5, color: c2});
    slide.addText(data.produit1.envelopeLabel, { x: col1X, y: contentY - 0.3, w: colWidth, h: 0.3, fontSize: 14, bold: true, color: c1 });
    slide.addText(p1Risks.join('\n'), { x: col1X, y: contentY, w: colWidth, h: 2.5, fontSize: 11, color: c10, bullet: true });
  }

  if (data.produit2) {
    drawAccentBar(slide, {x: col2X - 0.2, y: contentY - 0.2, height: 2.5, color: c2});
    slide.addText(data.produit2.envelopeLabel, { x: col2X, y: contentY - 0.3, w: colWidth, h: 0.3, fontSize: 14, bold: true, color: c1 });
    slide.addText(p2Risks.join('\n'), { x: col2X, y: contentY, w: colWidth, h: 2.5, fontSize: 11, color: c10, bullet: true });
  }

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: c10 });
}

function addRecommandationSlide(pptx: PptxGenJS, data: PlacementPptxData, colors: PptxColors, pageNumber: number) {
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2, c10 = colors.c10;
  drawTitleWithUnderline(slide, { title: 'Synthèse : Quel Produit Choisir ?', color: c1, underlineColor: c2 });

  const header = [
    { text: 'Votre Priorité', options: { bold: true, color: 'FFFFFF', fill: { color: c2 } } },
    { text: 'Solution Suggérée', options: { bold: true, color: 'FFFFFF', fill: { color: c2 } } },
  ];

  const rows = data.recommandations.map(r => [r.critere, r.solution]);
  const tableData = [header, ...rows.map(row => row.map(cell => ({ text: cell })))];

  slide.addTable(tableData, {
    x: STYLE.MARGIN, y: 1.5, w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    colW: [4, 4.5],
    border: { type: 'solid', pt: 1, color: colors.c4 }
  });

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: c10 });
}

export async function generatePlacementPptx(options: PlacementPptxOptions): Promise<void> {
  const { data, colors = DEFAULT_COLORS as unknown as PptxColors, coverUrl, clientName = 'Client' } = options;
  const pptx = new PptxGenJS();
  pptx.title = 'Étude Comparative Placement';
  pptx.author = 'SER1 - Cabinet CGP';

  const c1 = colors.c1, c2 = colors.c2, c4 = colors.c4;

  const icons = {
    capital: await loadIconAsDataUri(ICONS.capital),
    tax: await loadIconAsDataUri(ICONS.tax),
    net: await loadIconAsDataUri(ICONS.net),
    perf: await loadIconAsDataUri(ICONS.perf),
    versement: await loadIconAsDataUri(ICONS.versement),
    economie: await loadIconAsDataUri(ICONS.economie),
  };

  // Slide 1: Cover
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: c1 };
  drawTitleWithOverline(coverSlide, {
    title: clientName || 'Client',
    subtitle: 'Étude comparative placement patrimonial',
    date: new Date().toLocaleDateString('fr-FR'),
    lineColor: 'FFFFFF', titleColor: 'FFFFFF', subtitleColor: c4,
  });
  if (coverUrl) coverSlide.addImage({ path: coverUrl, x: STYLE.SLIDE_WIDTH * 0.7, y: STYLE.SLIDE_HEIGHT * 0.7, w: 2.5, h: 1.5, transparency: 60 });

  const { produit1, produit2 } = data;
  if (!produit1 || !produit2) {
    const errorSlide = pptx.addSlide();
    errorSlide.addText('Données de simulation incomplètes pour la comparaison.', { x: 1, y: 1, w: 8, h: 2, color: 'FF0000' });
    await pptx.writeFile({ fileName: `Erreur_Placement_${clientName}.pptx` });
    return;
  }

  let page = 2;

  // Slide 2: Objectifs et horizon
  const horizonSlide = pptx.addSlide();
  drawPhaseTimeline(horizonSlide, {
    ageActuel: data.client.ageActuel,
    ageFinEpargne: data.client.ageActuel + data.dureeEpargne,
    ageAuDeces: data.ageAuDeces,
    colors: { epargne: colors.c2, liquidation: colors.c3, transmission: colors.c4, text: colors.c10 },
  });
  drawFooter(horizonSlide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber: page++, color: colors.c10 });

  // Slides 3 & 4: Phase Épargne
  page += addEpargneSlides(pptx, produit1, produit2, colors, icons, page);

  // Slides 5 & 6: Phase Liquidation
  page += addLiquidationSlides(pptx, produit1, produit2, colors, icons, page);

  // Slide 7: Phase Transmission
  page += addTransmissionSlides(pptx, produit1, produit2, colors, icons, page);

  // Slide 8: Comparaison
  addComparisonSlide(pptx, data, colors, page++);

  // Slide 9: Risques
  addRisksSlide(pptx, data, colors, page++);

  // Slide 10: Recommandations
  addRecommandationSlide(pptx, data, colors, page++);

  // Slide N: Disclaimer
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

  const filename = `Placement_${clientName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
