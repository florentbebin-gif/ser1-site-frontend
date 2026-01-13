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

const SHORT_DISCLAIMER = 'Simulation indicative non contractuelle.';
const LONG_DISCLAIMER = `Document sans valeur contractuelle et purement indicatif, établi sur la base des dispositions légales et règlementaires en vigueur à la date de publication et sont susceptibles d'évolution.\n\nLe contenu et la forme du document et la méthodologie employée, relèvent de la législation sur le droit d'auteur, le droit des marques et, de façon générale, sur la propriété intellectuelle. La société Laplace en est le concepteur.`;

const ICONS = {
  capital: '/ppt-assets/icons/icon-money.svg',
  tax: '/ppt-assets/icons/icon-tax.svg',
  net: '/ppt-assets/icons/icon-document.svg',
  perf: '/ppt-assets/icons/icon-percent.svg',
};

function formatEuro(value?: number | null): string {
  if (!Number.isFinite(value || 0)) return '—';
  return `${Math.round(value || 0).toLocaleString('fr-FR')} €`;
}

// Définition des structures de données pour les résultats de simulation
interface EpargneResult {
  capitalFin: number;
  totalVersements: number;
}

interface LiquidationResult {
  totalRetraits: number;
  totalFiscalite: number;
}

interface TransmissionResult {
  capitalTransmisNet: number;
  taxe: number;
}

interface ProductResult {
  envelopeLabel: string;
  epargne: EpargneResult;
  liquidation: LiquidationResult;
  transmission: TransmissionResult;
  versementConfig?: {
    initial?: { montant: number };
    annuel?: { montant: number };
  };
  epargneTable: any[];
  liquidationTable: any[];
}

export interface PlacementPptxData {
  produit1: ProductResult;
  produit2: ProductResult;
  deltas: any;
}

export interface PlacementPptxOptions {
  data: PlacementPptxData;
  colors?: PptxColors;
  coverUrl?: string | null;
  theme_scope?: ThemeScope;
  clientName?: string;
}

function addSyntheseSlide(pptx: PptxGenJS, title: string, data: ProductResult, colors: PptxColors, icons: any, pageNumber: number) {
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2, c10 = colors.c10;

  drawTitleWithUnderline(slide, { title, color: c1, underlineColor: c2 });

  drawKpiRow(slide, {
    y: STYLE.MARGIN + 0.8,
    kpis: [
      { label: 'Capital Acquis (Épargne)', value: formatEuro(data.epargne.capitalFin), iconDataUri: icons.capital },
      { label: 'Total Retraits Nets (Liquidation)', value: formatEuro(data.liquidation.totalRetraits), iconDataUri: icons.net },
      { label: 'Net Transmis (Succession)', value: formatEuro(data.transmission.capitalTransmisNet), iconDataUri: icons.tax },
    ],
  });

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: c10 });
}

function addSynthesisSlide(
  pptx: PptxGenJS,
  produit1: ProductResult | null,
  produit2: ProductResult | null,
  colors: PptxColors,
  pageNumber: number
) {
  if (!produit1 && !produit2) return;
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2, c7 = colors.c7, c10 = colors.c10;

  drawTitleWithUnderline(slide, { title: 'Synthèse comparative', color: c1, underlineColor: c2 });

  const tableData = [
    ['Effort réel', formatEuro(produit1?.epargne?.totalVersements), formatEuro(produit2?.epargne?.totalVersements)],
    ['Capital acquis', formatEuro(produit1?.epargne?.capitalFin), formatEuro(produit2?.epargne?.capitalFin)],
    ['Revenus nets liquidation', formatEuro(produit1?.liquidation?.totalRetraits), formatEuro(produit2?.liquidation?.totalRetraits)],
    ['Net transmis', formatEuro(produit1?.transmission?.capitalTransmisNet), formatEuro(produit2?.transmission?.capitalTransmisNet)],
  ];

  slide.addTable(
    [
      [
        { text: '', options: { bold: true, color: c1 } },
        {
          text: produit1?.envelopeLabel || 'Produit 1',
          options: { bold: true, color: c1, align: 'center' as const },
        },
        {
          text: produit2?.envelopeLabel || 'Produit 2',
          options: { bold: true, color: c1, align: 'center' as const },
        },
      ],
      ...tableData.map((row) => [
        { text: row[0], options: { color: c10, align: 'left' as const } },
        { text: row[1], options: { color: c10, align: 'center' as const } },
        { text: row[2], options: { color: c10, align: 'center' as const } },
      ]),
    ],
    {
      x: STYLE.MARGIN,
      y: STYLE.MARGIN + 0.8,
      w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
      fontSize: 12,
      fill: { color: c7 },
      border: { type: 'solid', color: c2, pt: 0.5 },
      colW: [3.5, 3.25, 3.25],
    }
  );

  slide.addText('Quelle stratégie privilégier ?', {
    x: STYLE.MARGIN,
    y: STYLE.MARGIN + 2.9,
    fontSize: 14,
    color: c1,
    bold: true,
  });

  slide.addText(
    'Le meilleur compromis dépend de votre besoin : effort initial réduit, revenus élevés ou transmission optimisée.',
    {
      x: STYLE.MARGIN,
      y: STYLE.MARGIN + 3.2,
      w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
      fontSize: 12,
      color: c10,
    }
  );

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: c10 });
}

function addMatchSlide(pptx: PptxGenJS, produit1: ProductResult, produit2: ProductResult, colors: PptxColors, pageNumber: number) {
  if (!produit1 || !produit2) return;
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2, c7 = colors.c7, c10 = colors.c10;

  drawTitleWithUnderline(slide, { title: 'Match des placements', color: c1, underlineColor: c2 });

  const cardWidth = (STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2 - 0.5) / 2;
  const cardHeight = 2.8;
  const topY = STYLE.MARGIN + 0.7;

  const renderCard = (x: number, produit: ProductResult, label: string, highlight: boolean) => {
    slide.addShape('rect', {
      x,
      y: topY,
      w: cardWidth,
      h: cardHeight,
      fill: { color: c7 },
      line: { color: highlight ? c2 : c1, width: highlight ? 2 : 1 },
    });

    slide.addText(label, {
      x: x + 0.3,
      y: topY + 0.2,
      w: cardWidth - 0.6,
      fontSize: 16,
      color: c1,
      bold: true,
    });

    const metrics = [
      { label: 'Capital acquis', value: formatEuro(produit?.epargne?.capitalFin) },
      { label: 'Revenus nets', value: formatEuro(produit?.liquidation?.totalRetraits) },
      { label: 'Net transmis', value: formatEuro(produit?.transmission?.capitalTransmisNet) },
    ];

    metrics.forEach((metric, index) => {
      slide.addText(metric.label.toUpperCase(), {
        x: x + 0.3,
        y: topY + 0.6 + index * 0.7,
        w: cardWidth - 0.6,
        fontSize: 10,
        color: c10,
        bold: true,
        charSpacing: 50,
      });
      slide.addText(metric.value, {
        x: x + 0.3,
        y: topY + 0.6 + index * 0.7 + 0.2,
        w: cardWidth - 0.6,
        fontSize: 20,
        color: c1,
        bold: true,
      });
    });
  };

  const net1 =
    (produit1?.liquidation?.totalRetraits || 0) + (produit1?.transmission?.capitalTransmisNet || 0);
  const net2 =
    (produit2?.liquidation?.totalRetraits || 0) + (produit2?.transmission?.capitalTransmisNet || 0);

  const winner =
    net1 === net2 ? null : net1 > net2 ? produit1?.envelopeLabel : produit2?.envelopeLabel;

  renderCard(STYLE.MARGIN, produit1, produit1?.envelopeLabel || 'Produit 1', winner === produit1?.envelopeLabel);
  renderCard(STYLE.MARGIN + cardWidth + 0.5, produit2, produit2?.envelopeLabel || 'Produit 2', winner === produit2?.envelopeLabel);

  slide.addText(
    winner
      ? `✅ Avantage global : ${winner}`
      : 'Les deux scénarios offrent des performances équivalentes',
    {
      x: STYLE.MARGIN,
      y: topY + cardHeight + 0.4,
      w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
      fontSize: 14,
      color: c1,
      bold: true,
      align: 'center',
    }
  );

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: c10 });
  return 1;
}

function addPhaseSlide(
  pptx: PptxGenJS,
  title: string,
  metrics: { label: string; value: string; iconDataUri?: string }[],
  narrative: string,
  colors: PptxColors,
  pageNumber: number
) {
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2, c10 = colors.c10;

  drawTitleWithUnderline(slide, { title, color: c1, underlineColor: c2 });

  drawKpiRow(slide, {
    y: STYLE.MARGIN + 0.7,
    kpis: metrics,
  });

  slide.addShape('line', {
    x: STYLE.MARGIN,
    y: STYLE.MARGIN + 2.7,
    w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    h: 0,
    line: { color: c2, width: 1 },
  });

  slide.addText(narrative, {
    x: STYLE.MARGIN,
    y: STYLE.MARGIN + 3.0,
    w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    fontSize: 13,
    color: c10,
    align: 'left',
  });

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: c10 });
}

function addAnnexesSlide(pptx: PptxGenJS, title: string, table: any[], columns: {key: string, label: string}[], colors: PptxColors, pageNumber: number) {
  if (!table || table.length === 0) return;
  const slide = pptx.addSlide();
  const c1 = colors.c1, c2 = colors.c2, c7 = colors.c7, c4 = colors.c4, c10 = colors.c10;

  drawTitleWithUnderline(slide, { title, color: c1, underlineColor: c2 });

  const head = [columns.map(c => ({ text: c.label, options: { bold: true, fill: c2, color: 'FFFFFF' } }))];
  const body = table.map(row => columns.map(col => ({ text: formatEuro(row[col.key] ?? 0) })));

  slide.addTable([...head, ...body], {
    x: STYLE.MARGIN_SLIM,
    y: STYLE.MARGIN + 0.6,
    w: STYLE.SLIDE_WIDTH - STYLE.MARGIN_SLIM * 2,
    fontSize: 8,
    fill: { color: c7 },
    border: { type: 'solid', color: c4, pt: 1 },
    autoPage: true,
    colW: columns.map(() => (STYLE.SLIDE_WIDTH - STYLE.MARGIN_SLIM * 2) / columns.length),
  });

  drawFooter(slide, { date: new Date().toLocaleDateString('fr-FR'), disclaimer: SHORT_DISCLAIMER, pageNumber, color: c10 });
}

export async function generatePlacementPptx(options: PlacementPptxOptions): Promise<void> {
  const { data, colors = DEFAULT_COLORS as unknown as PptxColors, coverUrl, clientName = 'Client' } = options;
  const pptx = new PptxGenJS();
  pptx.title = 'Comparatif de Placements';
  pptx.author = 'SER1 - Cabinet CGP';

  const c1 = colors.c1, c2 = colors.c2, c4 = colors.c4, c10 = colors.c10;

  const icons = {
    capital: await loadIconAsDataUri(ICONS.capital),
    tax: await loadIconAsDataUri(ICONS.tax),
    net: await loadIconAsDataUri(ICONS.net),
    perf: await loadIconAsDataUri(ICONS.perf),
  };
  const safeIcon = (icon?: string | null) => (icon ? icon : undefined);

  // Slide 1: Cover
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: c1 };
  drawTitleWithOverline(coverSlide, {
    title: 'Analyse de Placements',
    subtitle: clientName,
    date: new Date().toLocaleDateString('fr-FR'),
    lineColor: 'FFFFFF', titleColor: 'FFFFFF', subtitleColor: c4,
  });
  if (coverUrl) coverSlide.addImage({ path: coverUrl, x: STYLE.SLIDE_WIDTH * 0.7, y: STYLE.SLIDE_HEIGHT * 0.7, w: 2.5, h: 1.5, transparency: 20 });

  const produit1 = data.produit1 || null;
  const produit2 = data.produit2 || null;

  let page = 2;

  if (produit1 && produit2) {
    page += addMatchSlide(pptx, produit1, produit2, colors, page) || 0;
    page++;
  }

  const versements1 = produit1?.epargne?.totalVersements;
  const versements2 = produit2?.epargne?.totalVersements;

  addPhaseSlide(
    pptx,
    'Phase Épargne — Je constitue',
    [
      { label: `${produit1?.envelopeLabel || 'Produit 1'} — Versements cumulés`, value: formatEuro(versements1), iconDataUri: safeIcon(icons.net) },
      { label: `${produit2?.envelopeLabel || 'Produit 2'} — Versements cumulés`, value: formatEuro(versements2), iconDataUri: safeIcon(icons.net) },
      { label: 'Capital acquis', value: `${formatEuro(produit1?.epargne?.capitalFin)} / ${formatEuro(produit2?.epargne?.capitalFin)}`, iconDataUri: safeIcon(icons.capital) },
    ],
    'Chaque année, vos versements réguliers et ponctuels sont répartis sur les supports choisis. Les intérêts composés font diverger progressivement les capitalisations.',
    colors,
    page++
  );

  addPhaseSlide(
    pptx,
    'Phase Liquidation — Je profite',
    [
      { label: `${produit1?.envelopeLabel || 'Produit 1'} — Revenus nets`, value: formatEuro(produit1?.liquidation?.totalRetraits), iconDataUri: safeIcon(icons.net) },
      { label: `${produit2?.envelopeLabel || 'Produit 2'} — Revenus nets`, value: formatEuro(produit2?.liquidation?.totalRetraits), iconDataUri: safeIcon(icons.net) },
      { label: 'Fiscalité totale', value: `${formatEuro(produit1?.liquidation?.totalFiscalite)} / ${formatEuro(produit2?.liquidation?.totalFiscalite)}`, iconDataUri: safeIcon(icons.tax) },
    ],
    'Les retraits suivent la stratégie paramétrée (mensuels, annuels ou à la carte). Nous suivons la fiscalité associée pour garantir un revenu net maîtrisé.',
    colors,
    page++
  );

  addPhaseSlide(
    pptx,
    'Phase Transmission — Je transmets',
    [
      { label: `${produit1?.envelopeLabel || 'Produit 1'} — Net transmis`, value: formatEuro(produit1?.transmission?.capitalTransmisNet), iconDataUri: safeIcon(icons.capital) },
      { label: `${produit2?.envelopeLabel || 'Produit 2'} — Net transmis`, value: formatEuro(produit2?.transmission?.capitalTransmisNet), iconDataUri: safeIcon(icons.capital) },
      { label: 'Fiscalité décès', value: `${formatEuro(produit1?.transmission?.taxe)} / ${formatEuro(produit2?.transmission?.taxe)}`, iconDataUri: safeIcon(icons.tax) },
    ],
    'En cas de décès à l’âge projeté, chaque enveloppe applique son régime fiscal (AV, PER, etc.). Cette slide visualise la part nette perçue par vos bénéficiaires.',
    colors,
    page++
  );

  addSynthesisSlide(pptx, produit1, produit2, colors, page++);

  // Slides de synthèse par produit (détails)
  if (produit1) {
    addSyntheseSlide(pptx, `Synthèse - ${produit1.envelopeLabel}`, produit1, colors, icons, page++);
  }
  if (produit2) {
    addSyntheseSlide(pptx, `Synthèse - ${produit2.envelopeLabel}`, produit2, colors, icons, page++);
  }

  // Séparateur Annexes
  const sepSlide = pptx.addSlide();
  sepSlide.background = { color: c2 };
  drawTitleWithOverline(sepSlide, { title: 'ANNEXES', lineColor: 'FFFFFF', titleColor: 'FFFFFF' });
  page++;

  // Slides Annexes
  const epargneCols = [
    { key: 'age', label: 'Âge' },
    { key: 'capitalDebut', label: 'Capital Début' },
    { key: 'versementNet', label: 'Versement' },
    { key: 'gainsAnnee', label: 'Gains' },
    { key: 'capitalFin', label: 'Capital Fin' },
  ];
  if (data.produit1) {
    addAnnexesSlide(pptx, `Annexe Épargne - ${data.produit1.envelopeLabel}`, data.produit1.epargneTable, epargneCols, colors, page++);
  }
  if (data.produit2) {
    addAnnexesSlide(pptx, `Annexe Épargne - ${data.produit2.envelopeLabel}`, data.produit2.epargneTable, epargneCols, colors, page++);
  }

  const liqCols = [
    { key: 'age', label: 'Âge' },
    { key: 'capitalDebut', label: 'Capital Début' },
    { key: 'retraitBrut', label: 'Retrait Brut' },
    { key: 'fiscalite', label: 'Fiscalité' },
    { key: 'retraitNet', label: 'Retrait Net' },
    { key: 'capitalFin', label: 'Capital Fin' },
  ];
  if (data.produit1) {
    addAnnexesSlide(pptx, `Annexe Liquidation - ${data.produit1.envelopeLabel}`, data.produit1.liquidationTable, liqCols, colors, page++);
  }
  if (data.produit2) {
    addAnnexesSlide(pptx, `Annexe Liquidation - ${data.produit2.envelopeLabel}`, data.produit2.liquidationTable, liqCols, colors, page++);
  }

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

  const filename = `Placement_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
