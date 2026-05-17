import type PptxGenJS from 'pptxgenjs';
import {
  formatBaseCgRetraiteRateField,
  normalizeBaseCgRetraiteGestionFees,
} from '@/data/basecg';
import type { ExportContext, PerTransfertAuditContractSlideSpec } from '../theme/types';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  SLIDE_SIZE,
  TYPO,
  addFooter,
  addHeader,
  addTextFr,
} from '../designSystem/serenity';

const TABLE_X = 0.78;
const TABLE_Y = 1.48;
const ROW_H = 0.28;
const COLUMN_GAP = 0.32;
const COLUMN_W = (SLIDE_SIZE.width - TABLE_X * 2 - COLUMN_GAP) / 2;
const LABEL_W = 1.78;
const VALUE_W = COLUMN_W - LABEL_W;

function display(value: unknown, format?: 'rate'): string {
  if (value === null || value === undefined || value === '') return 'A compléter';
  if (format === 'rate') return formatBaseCgRetraiteRateField(value as string | number | null);
  if (typeof value === 'number') {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value);
  }
  return String(value).replace(/\s+/g, ' ').trim();
}

export function buildAuditContractSlide(
  pptx: PptxGenJS,
  spec: PerTransfertAuditContractSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  const { contract } = spec;
  const gestionFees = normalizeBaseCgRetraiteGestionFees(contract.phaseEpargne);

  addHeader(slide, spec.title, spec.subtitle ?? '', theme, 'content');

  const rows = [
    { label: 'Compagnie', value: contract.compagnie },
    { label: 'Contrat', value: contract.nomContrat },
    { label: 'Type', value: contract.typeContrat },
    { label: 'Commercialisation', value: contract.phaseEpargne.dateCommercialisation },
    { label: 'Nombre de supports', value: contract.phaseEpargne.nombreFonds },
    { label: 'Nombre UC', value: contract.phaseEpargne.nombreSupportsUc },
    { label: 'UC / Fonds euros', value: contract.phaseEpargne.repartitionUcEuro },
    { label: 'TMG du contrat', value: contract.phaseEpargne.rendementFondsEuro, format: 'rate' as const },
    { label: 'Fonds euros garantis', value: contract.phaseEpargne.fondsEuroGarantis, format: 'rate' as const },
    { label: 'Frais sur versements', value: contract.phaseEpargne.fraisVersements, format: 'rate' as const },
    { label: 'Frais gestion fonds euros', value: gestionFees.fraisGestionFondsEuro, format: 'rate' as const },
    { label: 'Frais gestion UC', value: gestionFees.fraisGestionUc, format: 'rate' as const },
    { label: 'Frais arbitrage', value: contract.phaseEpargne.fraisArbitrage, format: 'rate' as const },
    { label: 'Frais transfert sortant', value: contract.phaseEpargne.fraisTransfertSortant, format: 'rate' as const },
    { label: 'Modalités en cas de décès', value: contract.phaseEpargne.clauseBeneficiaire },
    { label: 'Garanties complémentaires', value: contract.phaseEpargne.garantiesComplementaires },
    { label: 'Âge limite liquidation', value: contract.phaseLiquidation.ageLimiteLiquidation },
    { label: 'Sortie capital retraite', value: contract.phaseLiquidation.sortieCapitalRetraite },
    { label: 'Fractionnement capital', value: contract.phaseLiquidation.fractionnementCapital },
    { label: 'Rachat libre', value: contract.phaseLiquidation.rachatLibre },
    { label: 'Table conversion rente', value: contract.phaseLiquidation.tableConversionRente },
    { label: 'Table garantie adhésion', value: contract.phaseLiquidation.tableGarantieAdhesion },
    { label: 'Taux technique', value: contract.phaseLiquidation.tauxTechnique, format: 'rate' as const },
    { label: 'Frais arrérages', value: contract.phaseLiquidation.fraisArrerages, format: 'rate' as const },
    { label: 'Annuités garanties', value: contract.phaseLiquidation.annuitesGaranties },
    { label: 'Réversion possible', value: contract.phaseLiquidation.reversionPossible },
    { label: 'Réversion incluse', value: contract.phaseLiquidation.reversionIncluse },
    { label: 'Rente estimée', value: contract.phaseLiquidation.renteEstimee },
  ];

  rows.forEach(({ label, value, format }, index) => {
    const rowsPerColumn = Math.ceil(rows.length / 2);
    const columnIndex = index >= rowsPerColumn ? 1 : 0;
    const rowIndex = index % rowsPerColumn;
    const x = TABLE_X + columnIndex * (COLUMN_W + COLUMN_GAP);
    const y = TABLE_Y + ROW_H * rowIndex;
    const fillColor = (index % 2 === 0 ? theme.colors.color7 : theme.panelBg) ?? theme.panelBg;
    slide.addShape('rect', {
      x,
      y,
      w: LABEL_W,
      h: ROW_H,
      fill: { color: fillColor.replace('#', '') },
      line: { color: theme.panelBorder.replace('#', ''), width: 0.3 },
    });
    slide.addShape('rect', {
      x: x + LABEL_W,
      y,
      w: VALUE_W,
      h: ROW_H,
      fill: { color: fillColor.replace('#', '') },
      line: { color: theme.panelBorder.replace('#', ''), width: 0.3 },
    });
    addTextFr(slide, String(label), {
      x: x + 0.08,
      y: y + 0.07,
      w: LABEL_W - 0.16,
      h: 0.18,
      fontSize: 7.4,
      fontFace: TYPO.fontFace,
      bold: true,
      color: theme.textMain.replace('#', ''),
      fit: 'shrink',
    });
    addTextFr(slide, display(value, format), {
      x: x + LABEL_W + 0.08,
      y: y + 0.07,
      w: VALUE_W - 0.16,
      h: 0.18,
      fontSize: 7.2,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      fit: 'shrink',
    });
  });

  if (spec.legalNote) {
    addTextFr(slide, spec.legalNote, {
      x: TABLE_X,
      y: SLIDE_SIZE.height - 0.72,
      w: SLIDE_SIZE.width - TABLE_X * 2,
      h: 0.24,
      fontSize: 7.2,
      fontFace: TYPO.fontFace,
      italic: true,
      color: theme.footerOnLight.replace('#', ''),
      fit: 'shrink',
    });
  }

  addFooter(slide, ctx, slideIndex, 'onLight');
}
