import type { PptxThemeRoles } from '@/pptx/theme/types';
import { addBusinessIconToSlide } from '@/pptx/icons/addBusinessIcon';
import { addTextFr, roleColor, SLIDE_SIZE, TYPO } from '@/pptx/designSystem/serenity';

import { euro, fmtEuroShort, formatDuree, pct, ymEnd, ymToDisplay } from './formatters';
import { LAYOUT } from './layout';
import type { CreditKpi, CreditSlide, CreditSynthesisData } from './types';

function getBarColor(segment: 'capital' | 'interets' | 'assurance', theme: PptxThemeRoles): string {
  switch (segment) {
    case 'capital':
      return theme.colors.color4.replace('#', '');
    case 'interets':
      return theme.colors.color2.replace('#', '');
    case 'assurance':
      return theme.colors.color5.replace('#', '');
  }
}

function getRelativeLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getTextColorForBackground(bgColor: string, theme: PptxThemeRoles): string {
  const luminance = getRelativeLuminance(bgColor);
  return luminance < 0.4 ? 'FFFFFF' : theme.textMain.replace('#', '');
}

export function addCreditKpis(
  slide: CreditSlide,
  data: CreditSynthesisData,
  theme: PptxThemeRoles,
): void {
  const kpiData: CreditKpi[] = [
    {
      icon: 'money',
      label: 'Capital emprunté',
      value: euro(data.capitalEmprunte),
    },
    {
      icon: 'calculator',
      label: 'Durée du prêt',
      value: formatDuree(data.dureeMois),
      subValue: `(${data.dureeMois} mois)`,
    },
    {
      icon: 'cheque',
      label: 'Mensualité totale',
      value: euro(data.mensualiteTotale),
      subValue:
        data.coutTotalAssurance > 0
          ? `dont ${euro(data.mensualiteTotale - data.mensualiteHorsAssurance)} assurance`
          : undefined,
    },
    {
      icon: 'percent',
      label: 'Taux nominal',
      value: pct(data.tauxNominal),
      subValue: data.tauxAssurance > 0 ? `+ ${pct(data.tauxAssurance)} assurance` : undefined,
    },
  ];

  const totalKpiWidth = LAYOUT.kpi.colWidth * 4 + LAYOUT.kpi.colSpacing * 3;
  const kpiStartX = (SLIDE_SIZE.width - totalKpiWidth) / 2;

  kpiData.forEach((kpi, idx) => {
    const colX = kpiStartX + idx * (LAYOUT.kpi.colWidth + LAYOUT.kpi.colSpacing);
    const centerX = colX + LAYOUT.kpi.colWidth / 2;

    addBusinessIconToSlide(
      slide,
      kpi.icon,
      {
        x: centerX - LAYOUT.kpi.iconSize / 2,
        y: LAYOUT.kpi.iconY,
        w: LAYOUT.kpi.iconSize,
        h: LAYOUT.kpi.iconSize,
      },
      theme,
      'accent',
    );

    addTextFr(slide, kpi.label, {
      x: colX,
      y: LAYOUT.kpi.labelY,
      w: LAYOUT.kpi.colWidth,
      h: 0.22,
      fontSize: 9,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      align: 'center',
      valign: 'middle',
    });

    addTextFr(slide, kpi.value, {
      x: colX,
      y: LAYOUT.kpi.valueY,
      w: LAYOUT.kpi.colWidth,
      h: 0.3,
      fontSize: 15,
      fontFace: TYPO.fontFace,
      color: theme.textMain.replace('#', ''),
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    if (kpi.subValue) {
      addTextFr(slide, kpi.subValue, {
        x: colX,
        y: LAYOUT.kpi.valueY + 0.3,
        w: LAYOUT.kpi.colWidth,
        h: 0.2,
        fontSize: 8,
        fontFace: TYPO.fontFace,
        color: theme.textBody.replace('#', ''),
        italic: true,
        align: 'center',
        valign: 'top',
      });
    }
  });
}

export function addCreditDateRange(
  slide: CreditSlide,
  data: CreditSynthesisData,
  theme: PptxThemeRoles,
): void {
  addTextFr(slide, `${ymToDisplay(data.startYM)}  \u2192  ${ymEnd(data.startYM, data.dureeMois)}`, {
    x: LAYOUT.marginX,
    y: LAYOUT.kpi.sectionEndY + 0.04,
    w: LAYOUT.contentWidth,
    h: 0.18,
    fontSize: 9,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    italic: true,
    align: 'center',
    valign: 'middle',
  });
}

export function addCreditHero(
  slide: CreditSlide,
  data: CreditSynthesisData,
  theme: PptxThemeRoles,
): void {
  addTextFr(slide, 'Coût total de votre crédit', {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.labelHeight,
    fontSize: 14,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    align: 'center',
    valign: 'middle',
  });

  addTextFr(slide, euro(data.coutTotalCredit), {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y + LAYOUT.hero.labelHeight,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.valueHeight,
    fontSize: 32,
    fontFace: TYPO.fontFace,
    color: theme.textMain.replace('#', ''),
    bold: true,
    align: 'center',
    valign: 'middle',
  });

  const breakdownText =
    data.coutTotalAssurance > 0
      ? `(${euro(data.coutTotalInterets)} intérêts + ${euro(data.coutTotalAssurance)} assurance)`
      : `(${euro(data.coutTotalInterets)} intérêts)`;
  addTextFr(slide, breakdownText, {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y + LAYOUT.hero.labelHeight + LAYOUT.hero.valueHeight,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.subLabelHeight,
    fontSize: 10,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    italic: true,
    align: 'center',
    valign: 'top',
  });

  slide.addShape('line', {
    x: SLIDE_SIZE.width / 2 - 1.8,
    y: LAYOUT.hero.lineY,
    w: 3.6,
    h: 0,
    line: { color: theme.accent.replace('#', ''), width: 1.5 },
  });
}

export function addCreditSplitBar(
  slide: CreditSlide,
  data: CreditSynthesisData,
  theme: PptxThemeRoles,
): void {
  const totalRembourse = data.capitalEmprunte + data.coutTotalCredit;
  const capitalRatio = data.capitalEmprunte / totalRembourse;
  const coutRatio = data.coutTotalCredit / totalRembourse;
  const barWidth = SLIDE_SIZE.width - LAYOUT.bar.marginX * 2;
  const capitalBarWidth = barWidth * capitalRatio;
  const coutBarWidth = barWidth * coutRatio;
  const capitalColor = getBarColor('capital', theme);
  const coutColor = getBarColor('interets', theme);

  slide.addShape('rect', {
    x: LAYOUT.bar.marginX,
    y: LAYOUT.bar.y,
    w: capitalBarWidth - 0.02,
    h: LAYOUT.bar.height,
    fill: { color: capitalColor },
    line: { color: capitalColor, width: 0 },
  });

  slide.addShape('rect', {
    x: LAYOUT.bar.marginX + capitalBarWidth,
    y: LAYOUT.bar.y,
    w: coutBarWidth,
    h: LAYOUT.bar.height,
    fill: { color: coutColor },
    line: { color: coutColor, width: 0 },
  });

  if (capitalBarWidth > 1.5) {
    addTextFr(slide, `Capital : ${euro(data.capitalEmprunte)}`, {
      x: LAYOUT.bar.marginX,
      y: LAYOUT.bar.y,
      w: capitalBarWidth - 0.02,
      h: LAYOUT.bar.height,
      fontSize: 10,
      fontFace: TYPO.fontFace,
      color: getTextColorForBackground(capitalColor, theme),
      bold: true,
      align: 'center',
      valign: 'middle',
    });
  }

  if (coutBarWidth > 1.5) {
    addTextFr(slide, `Coût : ${euro(data.coutTotalCredit)}`, {
      x: LAYOUT.bar.marginX + capitalBarWidth,
      y: LAYOUT.bar.y,
      w: coutBarWidth,
      h: LAYOUT.bar.height,
      fontSize: 10,
      fontFace: TYPO.fontFace,
      color: getTextColorForBackground(coutColor, theme),
      bold: true,
      align: 'center',
      valign: 'middle',
    });
  }
}

export function addCreditAssuranceHistory(
  slide: CreditSlide,
  data: CreditSynthesisData,
  theme: PptxThemeRoles,
): void {
  if (!data.assuranceDecesByYear || !data.assuranceDecesByYear.some((v) => v > 0)) return;

  const histYears = data.assuranceDecesByYear;
  const histStartY = LAYOUT.bar.y + LAYOUT.bar.height + 0.04;
  const histZoneX = LAYOUT.bar.marginX;
  const histZoneW = SLIDE_SIZE.width - LAYOUT.bar.marginX * 2;
  const tickCount = histYears.length;
  const tickGap = 0.008;
  const tickW = (histZoneW - (tickCount - 1) * tickGap) / Math.max(tickCount, 1);
  const tickH = 0.18;
  const panelColor = roleColor(theme, 'panelBorder');
  const bodyColor = roleColor(theme, 'textBody');

  addTextFr(slide, 'Capital décès assuré (par an)', {
    x: LAYOUT.bar.marginX,
    y: histStartY,
    w: LAYOUT.contentWidth,
    h: 0.14,
    fontSize: 7,
    italic: true,
    color: bodyColor,
    fontFace: TYPO.fontFace,
    align: 'left',
    valign: 'middle',
  });

  histYears.forEach((val, i) => {
    const tickX = histZoneX + i * (tickW + tickGap);
    slide.addShape('rect', {
      x: tickX,
      y: histStartY + 0.16,
      w: tickW,
      h: tickH,
      fill: { color: panelColor },
      line: { color: panelColor, width: 0 },
    });
    addTextFr(slide, fmtEuroShort(val > 0 ? val : 0), {
      x: tickX,
      y: histStartY + 0.16 + tickH + 0.02,
      w: tickW,
      h: 0.1,
      fontSize: 5,
      color: bodyColor,
      fontFace: TYPO.fontFace,
      align: 'center',
    });
  });
}
