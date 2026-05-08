/**
 * buildTresorerieSchema.ts — Slide « Schéma Trésorerie Société IS » (3 phases)
 *
 * Phase 1 — Constitution : Associé → CCA → Société IS
 * Phase 2 — Exploitation : Placements (distribution/capitalisation/crédits/holding)
 * Phase 3 — Retraite : Remboursement CCA + revenus nets → associés
 *
 * Règle wording GOUVERNANCE_EXPORTS.md : aucun vocabulaire source interdit dans les slides client.
 * Wording premium : "Trésorerie société", "Holding patrimoniale", "Société de capitalisation".
 */

import type PptxGenJS from 'pptxgenjs';
import type { TresorerieSchemaSlideSpec, ExportContext } from '../theme/types';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  addHeader,
  addFooter,
} from '../designSystem/serenity';

// ============================================================================
// CONSTANTS
// ============================================================================

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;
const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  if (!n) return '0 €';
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function fmtAns(n: number | null): string {
  if (n == null) return '—';
  return n === 1 ? '1 an' : `${n} ans`;
}

function hex(color: string): string {
  return color.replace('#', '');
}

function contrastText(bgHex: string, darkText: string): string {
  const color = hex(bgHex);
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? hex(darkText) : 'FFFFFF';
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export function buildTresorerieSchema(
  pptx: PptxGenJS,
  spec: TresorerieSchemaSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const totalH = CONTENT_BOTTOM_Y - CONTENT_TOP_Y - 0.1;
  const phaseH = (totalH - 0.25) / 3;
  const phaseW = CONTENT_W * 0.58;
  const kpiX = MARGIN_X + phaseW + 0.15;
  const kpiW = CONTENT_W - phaseW - 0.15;

  const phases = [
    {
      label: 'Phase 1 — Constitution',
      color: theme.colors.color1,
      lines: [
        spec.typeCreation === 'newco' ? 'Société IS à créer (NEWCO)' : 'Société IS existante',
        spec.companyKindLabel ? `${spec.companyKindLabel} (${spec.companyKindCode ?? ''})` : '',
        ...(spec.associates ?? []).map(associate =>
          `${associate.label} — ${associate.capitalPct} capital / ${associate.economicRightsPct} économique`,
        ),
        `Apport en compte courant d'associé`,
        spec.hasCreditIR ? 'Crédit IR personnel — remboursé par dividendes nets' : '',
      ].filter(Boolean),
    },
    {
      label: 'Phase 2 — Exploitation',
      color: theme.colors.color6,
      lines: [
        spec.hasDistribution ? 'Poche de revenus — produits distribués chaque année' : '',
        spec.hasCapitalisation ? 'Poche de capitalisation — IS payé uniquement à la sortie' : '',
        spec.hasAllocationMatrix ? 'Matrice de trésorerie — balayage annuel au-dessus du seuil' : '',
        spec.hasCreditIS ? 'Crédit IS société — intérêts déductibles du résultat fiscal' : '',
        spec.hasHolding ? 'Holding patrimoniale — régime mère-fille (QPFC)' : '',
        ...(spec.subsidiaries ?? []).map(subsidiary =>
          `${subsidiary.label} — détention ${subsidiary.ownershipPct}`,
        ),
        'Impôt sur les sociétés sur le résultat fiscal',
      ].filter(Boolean),
    },
    {
      label: 'Phase 3 — Retraite & Transmission',
      color: theme.colors.color2,
      lines: [
        'Remboursement CCA aux associés (sans PFU)',
        'Distribution de dividendes nets de PFU',
        'Transmission progressive du patrimoine société',
      ],
    },
  ];

  phases.forEach((phase, idx) => {
    const y = CONTENT_TOP_Y + idx * (phaseH + 0.08);
    const phaseTextColor = contrastText(phase.color, theme.textMain);

    slide.addShape('rect', {
      x: MARGIN_X,
      y,
      w: phaseW,
      h: phaseH,
      fill: { color: hex(phase.color) },
      line: { color: hex(phase.color), pt: 0 },
    });

    slide.addText(phase.label, {
      x: MARGIN_X + 0.1,
      y: y + 0.04,
      w: phaseW - 0.2,
      h: 0.22,
      fontSize: TYPO.sizes.bodySmall,
      fontFace: TYPO.fontFace,
      bold: true,
      color: phaseTextColor,
    });

    const bodyLines = phase.lines.map(l => ({ text: `• ${l}`, options: {} }));
    slide.addText(bodyLines, {
      x: MARGIN_X + 0.1,
      y: y + 0.28,
      w: phaseW - 0.2,
      h: phaseH - 0.35,
      fontSize: Math.max(6.5, TYPO.sizes.bodyXSmall),
      fontFace: TYPO.fontFace,
      color: phaseTextColor,
      paraSpaceAfter: 2,
    });
  });

  // ── KPIs colonne droite ──────────────────────────────────────────────────

  const kpis = [
    { label: 'CCA total constitué', value: euro(spec.ccaTotalConstitue) },
    { label: 'IS total décaissé', value: euro(spec.isTotalDecaisse) },
    ...(spec.isLatentCapi > 0 ? [{ label: 'IS latent (non décaissé)', value: euro(spec.isLatentCapi) }] : []),
    { label: 'Revenus nets à la retraite', value: euro(spec.revenusNetsRetraite) },
    { label: 'Valeur nette société', value: euro(spec.valeurNetteSocieteRetraite) },
    { label: 'Durée remboursement CCA', value: fmtAns(spec.dureeRemboursementCCA) },
  ];

  const kpiH = Math.min(0.38, totalH / kpis.length);
  const altColor = hex(theme.colors.color7);
  const panelColor = hex(theme.panelBg);
  const borderColor = hex(theme.panelBorder);

  kpis.forEach((kpi, idx) => {
    const ky = CONTENT_TOP_Y + idx * (kpiH + 0.04);
    const isAlt = idx % 2 === 1;

    slide.addShape('rect', {
      x: kpiX,
      y: ky,
      w: kpiW,
      h: kpiH,
      fill: { color: isAlt ? altColor : panelColor },
      line: { color: borderColor, pt: 0.5 },
    });

    slide.addText(kpi.label, {
      x: kpiX + 0.08,
      y: ky + 0.04,
      w: kpiW - 0.12,
      h: kpiH * 0.45,
      fontSize: 6.5,
      fontFace: TYPO.fontFace,
      color: hex(theme.textBody),
    });

    slide.addText(kpi.value, {
      x: kpiX + 0.08,
      y: ky + kpiH * 0.46,
      w: kpiW - 0.12,
      h: kpiH * 0.50,
      fontSize: TYPO.sizes.bodySmall,
      fontFace: TYPO.fontFace,
      bold: true,
      color: hex(theme.textMain),
    });
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieSchema;
