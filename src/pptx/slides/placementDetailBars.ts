import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, PlacementDetailFlowBar, PlacementDetailGainBar } from '../theme/types';
import { TYPO, addTextFr } from '../designSystem/serenity';
import { PLACEMENT_DETAIL_PANEL, formatPlacementMoney, lightenHex } from './placementDetailLayout';

export function drawFlowBar(
  slide: PptxGenJS.Slide,
  flowBar: PlacementDetailFlowBar,
  panelX: number,
  panelW: number,
  startY: number,
  productColor: string,
  theme: ExportContext['theme'],
): void {
  const barMaxW = panelW - 2 * PLACEMENT_DETAIL_PANEL.metricPaddingX;
  const barX = panelX + PLACEMENT_DETAIL_PANEL.metricPaddingX;
  const netRatio = flowBar.gross > 0 ? Math.min(1, flowBar.net / flowBar.gross) : 0;
  const taxRatio = flowBar.gross > 0 ? Math.min(1, flowBar.tax / flowBar.gross) : 0;

  const bgColor = lightenHex(theme.colors.color8.replace('#', ''), 0.3);
  const warningColor = lightenHex(theme.colors.color9.replace('#', ''), 0.35);

  const barH = 0.24;
  const barY = startY + 0.22;
  const labelsY = barY + barH + 0.04;

  addTextFr(slide, `Brut : ${formatPlacementMoney(flowBar.gross)}`, {
    x: barX,
    y: startY,
    w: barMaxW,
    h: 0.18,
    fontSize: 7,
    italic: true,
    color: theme.colors.color9.replace('#', ''),
    align: 'right',
    valign: 'middle',
  });

  slide.addShape('rect', {
    x: barX,
    y: barY,
    w: barMaxW,
    h: barH,
    fill: { color: bgColor },
    line: { color: bgColor, width: 0 },
  });

  const netW = Math.max(0, barMaxW * netRatio);
  if (netW > 0) {
    slide.addShape('rect', {
      x: barX,
      y: barY,
      w: netW,
      h: barH,
      fill: { color: productColor },
      line: { color: productColor, width: 0 },
    });
  }

  const taxAvailable = barMaxW - netW;
  const taxW = taxRatio > 0 ? Math.max(0, Math.min(taxAvailable, barMaxW * taxRatio)) : 0;
  if (taxW > 0) {
    slide.addShape('rect', {
      x: barX + netW,
      y: barY,
      w: taxW,
      h: barH,
      fill: { color: warningColor },
      line: { color: warningColor, width: 0 },
    });
  }

  addTextFr(slide, `Net : ${formatPlacementMoney(flowBar.net)}`, {
    x: barX,
    y: labelsY,
    w: barMaxW * 0.6,
    h: 0.16,
    fontSize: TYPO.sizes.footer,
    bold: true,
    color: productColor,
    align: 'left',
    valign: 'middle',
  });
  addTextFr(slide, `${flowBar.taxLabel} : ${formatPlacementMoney(flowBar.tax)}`, {
    x: barX + barMaxW * 0.4,
    y: labelsY,
    w: barMaxW * 0.6,
    h: 0.16,
    fontSize: TYPO.sizes.footer,
    bold: false,
    color: warningColor,
    align: 'right',
    valign: 'middle',
  });
}

export function drawGainBar(
  slide: PptxGenJS.Slide,
  gainBar: PlacementDetailGainBar,
  panelX: number,
  panelW: number,
  startY: number,
  productColor: string,
  theme: ExportContext['theme'],
): void {
  const barMaxW = panelW - 2 * PLACEMENT_DETAIL_PANEL.metricPaddingX;
  const barX = panelX + PLACEMENT_DETAIL_PANEL.metricPaddingX;
  const lightColor = lightenHex(productColor, 0.45);
  const color9 = theme.colors.color9.replace('#', '');

  const versementsRatio =
    gainBar.capitalAcquis > 0 ? Math.min(1, gainBar.versements / gainBar.capitalAcquis) : 1;
  const gainsRatio =
    gainBar.capitalAcquis > 0 && gainBar.gains > 0 ? gainBar.gains / gainBar.capitalAcquis : 0;

  const barH = 0.24;
  const barY = startY + 0.22;
  const labelsY = barY + barH + 0.04;

  addTextFr(slide, `Capital acquis : ${formatPlacementMoney(gainBar.capitalAcquis)}`, {
    x: barX,
    y: startY,
    w: barMaxW,
    h: 0.18,
    fontSize: 7,
    italic: true,
    color: color9,
    align: 'right',
    valign: 'middle',
  });

  const versW = barMaxW * versementsRatio;
  slide.addShape('rect', {
    x: barX,
    y: barY,
    w: versW,
    h: barH,
    fill: { color: productColor },
    line: { color: productColor, width: 0 },
  });

  if (gainBar.gains > 0) {
    const gainsW = barMaxW * gainsRatio;
    slide.addShape('rect', {
      x: barX + versW,
      y: barY,
      w: gainsW,
      h: barH,
      fill: { color: lightColor },
      line: { color: lightColor, width: 0 },
    });
  }

  addTextFr(slide, `Versements : ${formatPlacementMoney(gainBar.versements)}`, {
    x: barX,
    y: labelsY,
    w: barMaxW * 0.6,
    h: 0.16,
    fontSize: TYPO.sizes.footer,
    bold: true,
    color: productColor,
    align: 'left',
    valign: 'middle',
  });

  if (gainBar.gains > 0) {
    addTextFr(slide, `Gains : ${formatPlacementMoney(gainBar.gains)}`, {
      x: barX + barMaxW * 0.4,
      y: labelsY,
      w: barMaxW * 0.6,
      h: 0.16,
      fontSize: TYPO.sizes.footer,
      bold: false,
      color: lightColor,
      align: 'right',
      valign: 'middle',
    });
  } else if (gainBar.shortfall) {
    addTextFr(slide, `Écart : −${formatPlacementMoney(gainBar.shortfall)}`, {
      x: barX + barMaxW * 0.4,
      y: labelsY,
      w: barMaxW * 0.6,
      h: 0.16,
      fontSize: TYPO.sizes.footer,
      bold: false,
      italic: true,
      color: color9,
      align: 'right',
      valign: 'middle',
    });
  }

  if (gainBar.revenusPercus) {
    addTextFr(slide, `dont ${formatPlacementMoney(gainBar.revenusPercus)} reçus hors capital`, {
      x: barX,
      y: labelsY + 0.16,
      w: barMaxW,
      h: 0.14,
      fontSize: 6.5,
      italic: true,
      color: color9,
      align: 'right',
      valign: 'middle',
    });
  }
}
