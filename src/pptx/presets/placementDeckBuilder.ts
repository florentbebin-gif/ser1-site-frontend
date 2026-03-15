/**
 * Placement Deck Builder
 *
 * Generates a StudyDeckSpec for placement simulation results.
 * Structure: Cover → Chapter → Synthesis → Detail (×3) →
 *            Chapter → Hypotheses → Projection tables → End
 */

import type {
  StudyDeckSpec,
  ChapterSlideSpec,
  PlacementSynthesisSlideSpec,
  PlacementDetailSlideSpec,
  PlacementHypothesesSlideSpec,
  PlacementProjectionSlideSpec,
  LogoPlacement,
  BusinessIconName,
} from '../theme/types';
import { isDebugEnabled } from '../../utils/debugFlags';
import { pickChapterImage } from '../designSystem/serenity';
import { paginateYears } from '../slides/buildPlacementProjection';

const DEBUG_PPTX = isDebugEnabled('pptx');

// ============================================================================
// DATA INTERFACES
// ============================================================================

export interface PlacementProductConfig {
  tmi: number;
  tmiRetraite: number;
  rendementCapi: number;
  rendementDistrib: number;
  tauxRevalorisation: number;
  repartitionCapi: number;
  strategieDistribution: string;
  versementInitial: number;
  versementAnnuel: number;
  ponctuels: Array<{ annee: number; montant: number }>;
  fraisEntree: number;
  optionBaremeIR: boolean;
}

export interface EpargneRowForPptx {
  annee: number;
  versementNet: number;
  capitalDebut: number;
  gainsAnnee: number;
  capitalFin: number;
  effortReel: number;
  economieIR: number;
}

export interface LiquidationRowForPptx {
  annee: number;
  capitalDebut: number;
  gainsAnnee: number;
  retraitBrut: number;
  fiscaliteTotal: number;
  retraitNet: number;
  capitalFin: number;
}

export interface PlacementProductData {
  envelopeLabel: string;
  epargne: {
    capitalAcquis: number;
    cumulVersements: number;
    cumulEffort: number;
    cumulEconomieIR: number;
  };
  liquidation: {
    cumulRetraitsNets: number;
    revenuAnnuelMoyenNet: number;
    cumulFiscalite: number;
  };
  transmission: {
    capitalTransmisNet: number;
    taxe: number;
    regime: string;
  };
  totaux: {
    effortReel: number;
    revenusNetsLiquidation: number;
    fiscaliteTotale: number;
    capitalTransmisNet: number;
    revenusNetsTotal: number;
  };
  config: PlacementProductConfig;
  epargneRows: EpargneRowForPptx[];
  liquidationRows: LiquidationRowForPptx[];
}

export interface PlacementData {
  clientName?: string;
  produit1: PlacementProductData;
  produit2: PlacementProductData;
  ageActuel: number;
  dureeEpargne: number;
  ageAuDeces: number;
  liquidationMode: string;
  liquidationDuree: number;
  liquidationMensualiteCible: number;
  liquidationMontantUnique: number;
  beneficiaryType: string;
  nbBeneficiaires: number;
  dmtgTaux: number | null;
}

export interface UiSettingsForPptx {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

const LEGAL_TEXT = `Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des dispositions légales et réglementaires en vigueur à la date de sa remise, lesquelles sont susceptibles d'évoluer.

Les informations qu'il contient sont strictement confidentielles et destinées exclusivement aux personnes expressément autorisées.

Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procédé que ce soit, ainsi que toute vente, revente, retransmission ou mise à disposition de tiers, est strictement encadrée. Le non-respect de ces dispositions est susceptible de constituer une contrefaçon engageant la responsabilité civile et pénale de son auteur, conformément aux articles L335-1 à L335-10 du Code de la propriété intellectuelle.`;

// ============================================================================
// FORMATTERS
// ============================================================================

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number): string =>
  `${(v * 100).toFixed(2).replace('.', ',')} %`;

const STRATEGIE_LABELS: Record<string, string> = {
  stocker: 'Stocker à 0 %',
  apprehender: 'Appréhender les distributions',
  reinvestir_capi: 'Réinvestissement en capitalisation',
};

// ============================================================================
// ROI
// ============================================================================

function computeRoi(p: PlacementProductData): number {
  const totalGains = p.totaux.revenusNetsLiquidation + p.totaux.capitalTransmisNet;
  return p.totaux.effortReel > 0 ? totalGains / p.totaux.effortReel : 0;
}

// ============================================================================
// PARAMS BUILDERS
// ============================================================================

function buildEpargneParams(c: PlacementProductConfig): string[] {
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

function buildLiquidationParams(c: PlacementProductConfig, data: PlacementData): string[] {
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

function buildTransmissionParams(data: PlacementData): string[] {
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

function buildSynthesisSpec(data: PlacementData): PlacementSynthesisSlideSpec {
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

function buildEpargneDetail(data: PlacementData): PlacementDetailSlideSpec {
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

function buildLiquidationDetail(data: PlacementData): PlacementDetailSlideSpec {
  const buildMetrics = (p: PlacementProductData): PlacementDetailSlideSpec['produit1']['metrics'] => [
    { icon: 'chart-up' as BusinessIconName, label: 'Retraits nets cumulés', value: fmt(p.liquidation.cumulRetraitsNets) },
    { icon: 'money' as BusinessIconName, label: 'Revenu annuel moyen net', value: fmt(p.liquidation.revenuAnnuelMoyenNet) },
    { icon: 'balance' as BusinessIconName, label: 'Fiscalité cumulée', value: fmt(p.liquidation.cumulFiscalite) },
  ];
  return {
    type: 'placement-detail',
    title: 'Phase Liquidation',
    subtitle: 'Revenus et fiscalité des retraits',
    produit1: {
      label: data.produit1.envelopeLabel,
      metrics: buildMetrics(data.produit1),
      params: buildLiquidationParams(data.produit1.config, data),
    },
    produit2: {
      label: data.produit2.envelopeLabel,
      metrics: buildMetrics(data.produit2),
      params: buildLiquidationParams(data.produit2.config, data),
    },
  };
}

function buildTransmissionDetail(data: PlacementData): PlacementDetailSlideSpec {
  const buildMetrics = (p: PlacementProductData): PlacementDetailSlideSpec['produit1']['metrics'] => [
    { icon: 'bank' as BusinessIconName, label: 'Régime fiscal', value: p.transmission.regime },
    { icon: 'calculator' as BusinessIconName, label: 'Droits / taxe', value: fmt(p.transmission.taxe) },
    { icon: 'buildings' as BusinessIconName, label: 'Capital transmis net', value: fmt(p.transmission.capitalTransmisNet) },
  ];
  const transmissionParams = buildTransmissionParams(data);
  return {
    type: 'placement-detail',
    title: 'Phase Transmission',
    subtitle: 'Capital transmis au décès',
    produit1: {
      label: data.produit1.envelopeLabel,
      metrics: buildMetrics(data.produit1),
      params: transmissionParams,
    },
    produit2: {
      label: data.produit2.envelopeLabel,
      metrics: buildMetrics(data.produit2),
      params: transmissionParams,
    },
  };
}

function buildHypothesesSlide(): PlacementHypothesesSlideSpec {
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

function buildEpargneProjectionSlides(
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

function buildLiquidationProjectionSlides(
  rows: LiquidationRowForPptx[],
  productLabel: string,
  productIndex: 1 | 2,
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
  }));
}

// ============================================================================
// MAIN ENTRY
// ============================================================================

export function buildPlacementStudyDeck(
  data: PlacementData,
  _uiSettings: UiSettingsForPptx,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
): StudyDeckSpec {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const clientSubtitle = data.clientName || 'NOM Prénom';

  if (DEBUG_PPTX) {
    // eslint-disable-next-line no-console
    console.debug('[PPTX Placement] Building deck:', {
      produit1: data.produit1.envelopeLabel,
      produit2: data.produit2.envelopeLabel,
    });
  }

  // Projection slides (paginated)
  const projectionSlides: PlacementProjectionSlideSpec[] = [
    ...buildEpargneProjectionSlides(data.produit1.epargneRows, data.produit1.envelopeLabel, 1),
    ...buildEpargneProjectionSlides(data.produit2.epargneRows, data.produit2.envelopeLabel, 2),
    ...buildLiquidationProjectionSlides(data.produit1.liquidationRows, data.produit1.envelopeLabel, 1),
    ...buildLiquidationProjectionSlides(data.produit2.liquidationRows, data.produit2.envelopeLabel, 2),
  ];

  const slides: Array<
    | ChapterSlideSpec
    | PlacementSynthesisSlideSpec
    | PlacementDetailSlideSpec
    | PlacementHypothesesSlideSpec
    | PlacementProjectionSlideSpec
  > = [
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Comparaison de deux stratégies de placement',
      body: 'Vous souhaitez comparer deux enveloppes d\'épargne sur les trois phases : constitution, liquidation et transmission.',
      chapterImageIndex: pickChapterImage('placement', 0),
    },
    buildSynthesisSpec(data),
    buildEpargneDetail(data),
    buildLiquidationDetail(data),
    buildTransmissionDetail(data),
    {
      type: 'chapter',
      title: 'Hypothèses et limites',
      subtitle: 'Cadre de la simulation',
      body: 'Les résultats ci-dessus reposent sur les hypothèses détaillées ci-après.',
      chapterImageIndex: pickChapterImage('placement', 1),
    },
    buildHypothesesSlide(),
    ...projectionSlides,
  ];

  return {
    cover: {
      type: 'cover',
      title: 'Simulation Placement',
      subtitle: clientSubtitle,
      logoUrl,
      logoPlacement,
      leftMeta: dateStr,
    },
    slides,
    end: {
      type: 'end',
      legalText: LEGAL_TEXT,
    },
  };
}

export default buildPlacementStudyDeck;
