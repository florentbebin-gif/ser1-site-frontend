import type PptxGenJS from 'pptxgenjs';
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
const ROW_H = 0.31;
const LABEL_W = 2.55;
const VALUE_W = SLIDE_SIZE.width - TABLE_X * 2 - LABEL_W;

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'A compléter';
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

  addHeader(slide, spec.title, spec.subtitle ?? '', theme, 'content');

  const rows = [
    ['Compagnie', contract.compagnie],
    ['Contrat', contract.nomContrat],
    ['Type', contract.typeContrat],
    ['Commercialisation', contract.phaseEpargne.dateCommercialisation],
    ['Nombre de supports', contract.phaseEpargne.nombreFonds],
    ['UC / Fonds euros', contract.phaseEpargne.repartitionUcEuro],
    ['Frais sur versements', contract.phaseEpargne.fraisVersements],
    ['Frais de gestion', contract.phaseEpargne.fraisGestion],
    ['Frais de transfert sortant', contract.phaseEpargne.fraisTransfertSortant],
    ['Clause bénéficiaire', contract.phaseEpargne.clauseBeneficiaire],
    ['Âge limite liquidation', contract.phaseLiquidation.ageLimiteLiquidation],
    ['Sortie capital retraite', contract.phaseLiquidation.sortieCapitalRetraite],
    ['Fractionnement capital', contract.phaseLiquidation.fractionnementCapital],
    ['Table conversion rente', contract.phaseLiquidation.tableConversionRente],
    ['Table garantie adhésion', contract.phaseLiquidation.tableGarantieAdhesion],
    ['Taux technique', contract.phaseLiquidation.tauxTechnique],
    ['Frais arrérages', contract.phaseLiquidation.fraisArrerages],
    ['Annuités garanties', contract.phaseLiquidation.annuitesGaranties],
    ['Réversion possible', contract.phaseLiquidation.reversionPossible],
  ];

  rows.forEach(([label, value], index) => {
    const y = TABLE_Y + ROW_H * index;
    const fillColor = (index % 2 === 0 ? theme.colors.color7 : theme.panelBg) ?? theme.panelBg;
    slide.addShape('rect', {
      x: TABLE_X,
      y,
      w: LABEL_W,
      h: ROW_H,
      fill: { color: fillColor.replace('#', '') },
      line: { color: theme.panelBorder.replace('#', ''), width: 0.3 },
    });
    slide.addShape('rect', {
      x: TABLE_X + LABEL_W,
      y,
      w: VALUE_W,
      h: ROW_H,
      fill: { color: fillColor.replace('#', '') },
      line: { color: theme.panelBorder.replace('#', ''), width: 0.3 },
    });
    addTextFr(slide, String(label), {
      x: TABLE_X + 0.08,
      y: y + 0.07,
      w: LABEL_W - 0.16,
      h: 0.18,
      fontSize: 7.4,
      fontFace: TYPO.fontFace,
      bold: true,
      color: theme.textMain.replace('#', ''),
      fit: 'shrink',
    });
    addTextFr(slide, display(value), {
      x: TABLE_X + LABEL_W + 0.08,
      y: y + 0.07,
      w: VALUE_W - 0.16,
      h: 0.18,
      fontSize: 7.2,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      fit: 'shrink',
    });
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}
