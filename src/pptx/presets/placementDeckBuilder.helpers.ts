/**
 * placementDeckBuilder.helpers.ts
 * Formatters, calculs intermédiaires et builders de slides pour le deck PPTX Placement.
 */

import type {
  PlacementSynthesisSlideSpec,
  PlacementDetailSlideSpec,
  PlacementHypothesesSlideSpec,
  PlacementProjectionSlideSpec,
  BusinessIconName,
} from '../theme/types';
import { paginateYears } from '../slides/buildPlacementProjection';
import type {
  PlacementData,
  PlacementProductConfig,
  PlacementProductData,
  EpargneRowForPptx,
  LiquidationRowForPptx,
} from './placementDeckBuilder.types';

// ============================================================================
// FORMATTERS
// ============================================================================

export const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export const fmtPct = (v: number): string =>
  `${(v * 100).toFixed(2).replace('.', ',')} %`;

const STRATEGIE_LABELS: Record<string, string> = {
  stocker: 'Stocker à 0 %',
  apprehender: 'Appréhender les distributions',
  reinvestir_capi: 'Réinvestissement en capitalisation',
};

// ============================================================================
// ROI
// ============================================================================

export function computeRoi(p: PlacementProductData): number {
  const totalGains = p.totaux.revenusNetsLiquidation + p.totaux.capitalTransmisNet;
  return p.totaux.effortReel > 0 ? totalGains / p.totaux.effortReel : 0;
}

// ============================================================================
// PARAMS BUILDERS
// ============================================================================

export function buildEpargneParams(c: PlacementProductConfig): string[] {
  const lines: string[] = [
    `TMI : ${fmtPct(c.tmi)}`,
    `Perf. capitalisation : ${fmtPct(c.rendementCapi)}`,
  ];
  if (c.repartitionCapi < 100) {
    lines.push(`Perf. distribution : ${fmtPct(c.rendementDistrib)} (revalo. ${fmtPct(c.tauxRevalorisation)})`);
  }
  lines.push(`Répartition : ${c.repartitionCapi} % capi / ${100 - c.repartitionCapi} % distrib.`);
  if (c.repartitionCapi < 100) {
    lines.push(`Stratégie distrib. : ${STRATEGIE_LABELS[c.strategieDistribution] ?? c.strategieDistribution}`);
  }
  const versements: string[] = [];
  if (c.versementInitial > 0) versements.push(`Initial : ${fmt(c.versementInitial)}`);
  if (c.versementAnnuel > 0) versements.push(`Annuel : ${fmt(c.versementAnnuel)}`);
  if (versements.length > 0) lines.push(versements.join('  |  '));
  c.ponctuels.forEach(p => {
    lines.push(`Ponctuel : ${fmt(p.montant)} (année ${p.annee})`);
  });
  lines.push(`Frais d'entrée : ${fmtPct(c.fraisEntree)}`);
  return lines;
}

export function buildLiquidationParams(c: PlacementProductConfig, data: PlacementData): string[] {
  const lines: string[] = [
    `TMI retraite : ${fmtPct(c.tmiRetraite)}`,
    `Perf. capitalisation : ${fmtPct(c.rendementCapi)}`,
  ];
  if (data.liquidationMode === 'epuiser') {
    lines.push(`Stratégie : Épuiser en ${data.liquidationDuree} ans`);
  } else if (data.liquidationMode === 'mensualite') {
    lines.push(`Stratégie : Mensualité cible ${fmt(data.liquidationMensualiteCible)}`);
  } else if (data.liquidationMode === 'unique') {
    lines.push(`Stratégie : Retrait unique ${fmt(data.liquidationMontantUnique)}`);
  }
  lines.push(`Option barème IR : ${c.optionBaremeIR ? 'Oui' : 'Non'}`);
  return lines;
}

export function buildTransmissionParams(data: PlacementData): string[] {
  const lines: string[] = [
    `Âge de décès simulé : ${data.ageAuDeces} ans`,
  ];
  if (data.beneficiaryType === 'enfants') {
    lines.push(`Bénéficiaire : Enfants (${data.nbBeneficiaires})`);
  } else {
    lines.push(`Bénéficiaire : Conjoint`);
  }
  if (data.dmtgTaux != null) {
    lines.push(`Tranche DMTG : ${fmtPct(data.dmtgTaux)}`);
  }
  return lines;
}

// ============================================================================
// SLIDE SPEC BUILDERS
// ============================================================================

export function buildSynthesisSpec(data: PlacementData): PlacementSynthesisSlideSpec {
  return {
    type: 'placement-synthesis',
    produit1: {
      envelopeLabel: data.produit1.envelopeLabel,
      effortTotal: data.produit1.totaux.effortReel,
      capitalAcquis: data.produit1.epargne.capitalAcquis,
      revenusNets: data.produit1.totaux.revenusNetsLiquidation,
      transmissionNette: data.produit1.totaux.capitalTransmisNet,
      roi: computeRoi(data.produit1),
    },
    produit2: {
      envelopeLabel: data.produit2.envelopeLabel,
      effortTotal: data.produit2.totaux.effortReel,
      capitalAcquis: data.produit2.epargne.capitalAcquis,
      revenusNets: data.produit2.totaux.revenusNetsLiquidation,
      transmissionNette: data.produit2.totaux.capitalTransmisNet,
      roi: computeRoi(data.produit2),
    },
    timeline: {
      ageActuel: data.ageActuel,
      ageDebutLiquidation: data.ageActuel + data.dureeEpargne,
      ageAuDeces: data.ageAuDeces,
    },
  };
}

export function buildEpargneDetail(data: PlacementData): PlacementDetailSlideSpec {
  const buildMetrics = (p: PlacementProductData): PlacementDetailSlideSpec['produit1']['metrics'] => [
    { icon: 'money' as BusinessIconName, label: 'Capital acquis', value: fmt(p.epargne.capitalAcquis) },
    { icon: 'cheque' as BusinessIconName, label: 'Versements cumulés', value: fmt(p.epargne.cumulVersements) },
    { icon: 'calculator' as BusinessIconName, label: 'Effort réel', value: fmt(p.epargne.cumulEffort) },
    { icon: 'percent' as BusinessIconName, label: 'Économie IR cumulée', value: fmt(p.epargne.cumulEconomieIR) },
  ];
  return {
    type: 'placement-detail',
    title: 'Phase Épargne',
    subtitle: 'Constitution du capital',
    produit1: {
      label: data.produit1.envelopeLabel,
      metrics: buildMetrics(data.produit1),
      params: buildEpargneParams(data.produit1.config),
    },
    produit2: {
      label: data.produit2.envelopeLabel,
      metrics: buildMetrics(data.produit2),
      params: buildEpargneParams(data.produit2.config),
    },
  };
}

export function buildLiquidationDetail(data: PlacementData): PlacementDetailSlideSpec {
  const buildMetrics = (p: PlacementProductData): PlacementDetailSlideSpec['produit1']['metrics'] => [
    { icon: 'chart-up' as BusinessIconName, label: 'Retraits nets cumulés', value: fmt(p.liquidation.cumulRetraitsNets) },
    { icon: 'money' as BusinessIconName, label: 'Revenu annuel moyen net', value: fmt(p.liquidation.revenuAnnuelMoyenNet) },
    { icon: 'balance' as BusinessIconName, label: 'Fiscalité cumulée', value: fmt(p.liquidation.cumulFiscalite) },
  ];
  const buildFlowBar = (p: PlacementProductData) => ({
    gross: p.liquidation.cumulRetraitsNets + p.liquidation.cumulFiscalite,
    tax: p.liquidation.cumulFiscalite,
    net: p.liquidation.cumulRetraitsNets,
    taxLabel: 'Fiscalité',
  });
  return {
    type: 'placement-detail',
    title: 'Phase Liquidation',
    subtitle: 'Revenus et fiscalité des retraits',
    produit1: {
      label: data.produit1.envelopeLabel,
      metrics: buildMetrics(data.produit1),
      params: buildLiquidationParams(data.produit1.config, data),
      flowBar: buildFlowBar(data.produit1),
    },
    produit2: {
      label: data.produit2.envelopeLabel,
      metrics: buildMetrics(data.produit2),
      params: buildLiquidationParams(data.produit2.config, data),
      flowBar: buildFlowBar(data.produit2),
    },
  };
}

export function buildTransmissionDetail(data: PlacementData): PlacementDetailSlideSpec {
  const buildMetrics = (p: PlacementProductData): PlacementDetailSlideSpec['produit1']['metrics'] => [
    { icon: 'buildings' as BusinessIconName, label: 'Capital transmis net', value: fmt(p.transmission.capitalTransmisNet) },
    { icon: 'bank' as BusinessIconName, label: 'Régime fiscal', value: p.transmission.regime },
    { icon: 'calculator' as BusinessIconName, label: 'Droits / taxe', value: fmt(p.transmission.taxe) },
  ];
  const buildFlowBar = (p: PlacementProductData) => ({
    gross: p.transmission.capitalTransmisNet + p.transmission.taxe,
    tax: p.transmission.taxe,
    net: p.transmission.capitalTransmisNet,
    taxLabel: 'Droits & taxes',
  });
  const transmissionParams = buildTransmissionParams(data);
  return {
    type: 'placement-detail',
    title: 'Phase Transmission',
    subtitle: 'Capital transmis au décès',
    produit1: {
      label: data.produit1.envelopeLabel,
      metrics: buildMetrics(data.produit1),
      params: transmissionParams,
      flowBar: buildFlowBar(data.produit1),
    },
    produit2: {
      label: data.produit2.envelopeLabel,
      metrics: buildMetrics(data.produit2),
      params: transmissionParams,
      flowBar: buildFlowBar(data.produit2),
    },
  };
}

export function buildHypothesesSlide(): PlacementHypothesesSlideSpec {
  return {
    type: 'placement-hypotheses',
    title: 'Hypothèses retenues',
    subtitle: 'Paramètres de la simulation',
    sections: [
      {
        icon: 'gauge' as BusinessIconName,
        title: 'Paramètres simulés',
        body: [
          'Taux de rendement et paramètres saisis dans le simulateur',
          'Les taux futurs sont hypothétiques et ne constituent pas une garantie',
        ],
      },
      {
        icon: 'percent' as BusinessIconName,
        title: 'Fiscalité des enveloppes',
        body: [
          'Fiscalité appliquée selon le régime de chaque enveloppe (PFU, barème IR, exonérations)',
          'Prélèvements sociaux selon les taux en vigueur à la date de simulation',
        ],
      },
      {
        icon: 'balance' as BusinessIconName,
        title: 'Transmission / DMTG',
        body: [
          'Transmission calculée selon le barème DMTG et les abattements légaux en vigueur',
          'Régime applicable selon l\'enveloppe (art. 990 I ou DMTG)',
        ],
      },
      {
        icon: 'pen' as BusinessIconName,
        title: 'Limites et arrondis',
        body: [
          'Les montants sont arrondis à l\'euro le plus proche',
          'Résultats donnés à titre indicatif, sans valeur contractuelle',
        ],
      },
    ],
  };
}

// ============================================================================
// PROJECTION SLIDES
// ============================================================================

export function buildEpargneProjectionSlides(
  rows: EpargneRowForPptx[],
  productLabel: string,
  productIndex: 1 | 2,
): PlacementProjectionSlideSpec[] {
  if (rows.length === 0) return [];
  const yearPages = paginateYears(rows.length);
  return yearPages.map((yearsForPage, pageIndex) => ({
    type: 'placement-projection' as const,
    title: `Projection Épargne — ${productLabel}`,
    subtitle: 'Détail année par année de la phase d\'épargne',
    productLabel,
    productIndex,
    phase: 'epargne' as const,
    yearsForPage,
    rows: [
      { label: 'Versement net', values: rows.map(r => r.versementNet) },
      { label: 'Capital début', values: rows.map(r => r.capitalDebut) },
      { label: 'Gains annuels', values: rows.map(r => r.gainsAnnee) },
      { label: 'Capital fin', values: rows.map(r => r.capitalFin) },
      { label: 'Effort réel cumulé', values: rows.map(r => r.effortReel) },
      { label: 'Économie IR', values: rows.map(r => r.economieIR) },
    ],
    pageIndex,
    totalPages: yearPages.length,
  }));
}

export function buildLiquidationProjectionSlides(
  rows: LiquidationRowForPptx[],
  productLabel: string,
  productIndex: 1 | 2,
  deathYearIndex: number | undefined,
): PlacementProjectionSlideSpec[] {
  if (rows.length === 0) return [];
  const yearPages = paginateYears(rows.length);
  return yearPages.map((yearsForPage, pageIndex) => ({
    type: 'placement-projection' as const,
    title: `Projection Liquidation — ${productLabel}`,
    subtitle: 'Détail année par année de la phase de liquidation',
    productLabel,
    productIndex,
    phase: 'liquidation' as const,
    yearsForPage,
    rows: [
      { label: 'Capital début', values: rows.map(r => r.capitalDebut) },
      { label: 'Gains annuels', values: rows.map(r => r.gainsAnnee) },
      { label: 'Retrait brut', values: rows.map(r => r.retraitBrut) },
      { label: 'Fiscalité', values: rows.map(r => r.fiscaliteTotal) },
      { label: 'Retrait net', values: rows.map(r => r.retraitNet) },
      { label: 'Capital fin', values: rows.map(r => r.capitalFin) },
    ],
    pageIndex,
    totalPages: yearPages.length,
    deathYearIndex,
  }));
}
