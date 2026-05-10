/**
 * tresoreriePptxWrapper.ts — Assemblage deck PPTX Trésorerie Société IS
 *
 * Structure : Couverture → Organigramme société → Projection paginée → Hypothèses → Fin
 *
 * Règle GOUVERNANCE_EXPORTS.md:62 :
 * - Aucun recalcul métier ici — on consomme TresoProjectionRow[] tel quel.
 * - Seuls les calculs dérivés de présentation (formatage, pagination) sont autorisés.
 * - Aucun vocabulaire source interdit dans les slides client.
 */

import type { LogoPlacement, StudyDeckSpec } from '@/pptx/theme/types';
import type {
  AssociateInput,
  AssociateRevenuePhaseInput,
  TresoInputsRuntime,
  TresoProjectionRow,
} from '@/engine/tresorerie/types';
import { paginateTresoYears } from '@/pptx/slides/buildTresorerieProjection';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import {
  getCapitalPct,
  getCompanyKindCode,
  getCompanyKindLabel,
  getEconomicPct,
  getSelectedAssociate,
} from '../utils/tresorerieSocieteModel';
import {
  computeComplement,
  getPhaseEndYear,
  sortPhases,
} from '../utils/revenuePhases';
import { getRevenuePhaseSourceLabel } from '../utils/revenuePhaseLabels';

// ─── Libellés UI premium (jamais les labels Excel bruts) ───────────────────────

const PROJECTION_ROWS_RESUME = [
  { label: "Apports en compte courant d'associé", values: (rows: TresoProjectionRow[]) => rows.map(r => r.apportCCA) },
  { label: 'Capital placé — matrice distribution', values: (rows: TresoProjectionRow[]) => rows.map(r => r.capitalDistrib) },
  { label: 'Revenus — poche de distribution', values: (rows: TresoProjectionRow[]) => rows.map(r => r.revenuDistrib) },
  { label: 'Valeur — matrice capitalisation', values: (rows: TresoProjectionRow[]) => rows.map(r => r.valeurCapi) },
  { label: 'Revenus des filiales', values: (rows: TresoProjectionRow[]) => rows.map(r => r.dividendesFiliales) },
  { label: 'Charges sociales TNS estimées', values: (rows: TresoProjectionRow[]) => rows.map(r =>
    r.revenusParAssocie.reduce((sum, revenu) => sum + revenu.tnsSocialCharges, 0),
  ) },
  { label: 'Impôt sur les sociétés', values: (rows: TresoProjectionRow[]) => rows.map(r => r.is) },
  { label: 'Total revenus nets annuels', values: (rows: TresoProjectionRow[]) => rows.map(r => r.revenusNets) },
  { label: 'Écart annuel avec le besoin de revenus', values: (rows: TresoProjectionRow[]) => rows.map(r => r.deltaBesoin) },
  { label: "Trésorerie fin d'année", values: (rows: TresoProjectionRow[]) => rows.map(r => r.tresorerieFin) },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtAns(n: number | null): string {
  if (n == null) return '—';
  return n === 1 ? '1 an' : `${n} ans`;
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100) / 100} %`;
}

function getAssociateRevenuePhases(associate: AssociateInput | undefined): AssociateRevenuePhaseInput[] {
  const phases = (associate as { revenuePhases?: AssociateRevenuePhaseInput[] } | undefined)?.revenuePhases;
  return Array.isArray(phases) ? sortPhases(phases) : [];
}

function buildRevenuePhaseSummary(inputs: TresoInputsRuntime) {
  const associate = getSelectedAssociate(inputs);
  const phases = getAssociateRevenuePhases(associate);
  const horizonYear = (inputs.company.projectionStartYear ?? new Date().getFullYear()) + 14;
  return phases.slice(0, 3).map(phase => ({
    label: phase.label?.trim() || getRevenuePhaseSourceLabel(phase.source),
    periodLabel: `${phase.startYear}-${getPhaseEndYear(phase, phases, horizonYear)}`,
    sourceLabel: getRevenuePhaseSourceLabel(phase.source),
    annualNetIncomeNeed: phase.annualNetIncomeNeed,
    complement: computeComplement(phase),
    useCcaForCompletion: phase.useCcaForCompletion,
  }));
}

// ─── Construction du StudyDeckSpec ────────────────────────────────────────────

export interface TresorerieDeckData {
  rows: TresoProjectionRow[];
  kpis: TresoKPIs;
  inputs: TresoInputsRuntime;
  clientName?: string;
}

export function buildTresorerieStudyDeck(
  data: TresorerieDeckData,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
): StudyDeckSpec {
  const { rows, kpis, inputs } = data;

  const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  const typeLabel = inputs.company.creationType === 'existante'
    ? 'Société existante'
    : 'Société à créer (NEWCO)';
  const pockets = inputs.allocationMatrix.pockets;
  const hasAllocationMatrix = pockets.length > 0;
  const hasDistribution = pockets.some(pocket => pocket.kind === 'distribution');
  const hasCapitalisation = pockets.some(pocket => pocket.kind === 'capitalisation');
  const hasCreditIS = inputs.company.loans.length > 0;
  const hasHolding = inputs.company.subsidiaries.length > 0;
  const revenuePhases = buildRevenuePhaseSummary(inputs);

  // ── Projection paginée ──────────────────────────────────────────────────────
  const totalYears = rows.length;
  const pages = totalYears > 0 ? paginateTresoYears(totalYears, 10) : [];

  const projectionSlides = pages.map((yearsForPage, pageIdx) => ({
    type: 'treso-projection' as const,
    title: 'Projection comptable annuelle',
    subtitle: 'Trésorerie société IS — données issues de la simulation',
    yearsForPage,
    rows: PROJECTION_ROWS_RESUME.map(({ values, label }) => ({
      label,
      values: values(rows),
    })),
    pageIndex: pageIdx,
    totalPages: pages.length,
    retraiteYearIndex: kpis.anneeRetraiteIndex != null ? kpis.anneeRetraiteIndex + 1 : undefined,
  }));

  // ── Slide hypothèses (content existant) ────────────────────────────────────
  const hypothesesLines = [
    'Périmètre V1 : Société soumise à l\'IS uniquement. SARL de famille à l\'IR : hors scope.',
    'IS calculé sur la base fiscale (résultat avant IS clampé à 0) — pas de report de pertes.',
    'Réserve légale (5 % du bénéfice) non modélisée — capacité distribuable simplifiée.',
    'CCA : remboursement hors PFU — diminue le passif, pas les réserves.',
    'Intérêts CCA : déduction plafonnée au taux maximum déductible issu des paramètres fiscaux.',
    'PFU dividendes : convention Option A (brut unique sans double comptage).',
    'IS latent capitalisation : affiché pour information, non décaissé avant la sortie.',
    'BFR inclus dans le seuil de sécurité avant balayage de la trésorerie.',
    'Délai de jouissance : premier jour du mois ≥ date de début de jouissance.',
    'Régime mère-fille : conditions BOFiP (≥ 5 % détention, ≥ 2 ans) à vérifier.',
    'Taux fiscaux issus des paramètres admin — aucune valeur hardcodée.',
    'Document non contractuel — à titre indicatif uniquement.',
  ];

  return {
    cover: {
      type: 'cover',
      title: 'Trésorerie société',
      subtitle: `Simulation IS — ${typeLabel} · ${dateStr}`,
      logoUrl,
      logoPlacement,
    },
    slides: [
      // Organigramme société + KPIs
      {
        type: 'treso-schema',
        title: 'Schéma patrimonial — Société IS',
        subtitle: 'Détentions, filiales et compte bancaire pivot',
        typeCreation: inputs.company.creationType,
        orgchartCompany: inputs.company,
        companyKindLabel: getCompanyKindLabel(inputs.company),
        companyKindCode: getCompanyKindCode(inputs.company),
        associates: inputs.company.associates.map(associate => ({
          label: associate.label,
          kind: associate.kind ?? 'pp',
          capitalPct: fmtPct(getCapitalPct(associate)),
          economicRightsPct: fmtPct(getEconomicPct(associate)),
        })),
        subsidiaries: inputs.company.subsidiaries.map(subsidiary => ({
          label: subsidiary.label,
          parentEntityId: subsidiary.parentEntityId ?? 'societe',
          ownershipPct: fmtPct(subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct),
        })),
        revenuePhases,
        hasHolding,
        hasDistribution,
        hasCapitalisation,
        hasAllocationMatrix,
        hasCreditIR: false,
        hasCreditIS,
        ccaTotalConstitue: kpis.ccaTotalConstitue,
        isTotalDecaisse: kpis.isTotalDecaisse,
        isLatentCapi: kpis.isLatentCapi,
        revenusNetsRetraite: kpis.revenusNetsRetraite,
        valeurNetteSocieteRetraite: kpis.valeurNetteSocieteRetraite,
        dureeRemboursementCCA: kpis.dureeRemboursementCCA,
      },
      // Projection paginée
      ...projectionSlides,
      // Hypothèses
      {
        type: 'content',
        title: 'Hypothèses et périmètre',
        subtitle: `Durée remboursement CCA estimée : ${fmtAns(kpis.dureeRemboursementCCA)}`,
        body: hypothesesLines.map(l => `• ${l}`).join('\n'),
      },
    ],
    end: {
      type: 'end',
      legalText:
        'Document non contractuel établi en fonction des dispositions fiscales ou sociales en vigueur à la date des présentes. ' +
        'Les projections présentées sont indicatives et ne constituent pas un conseil en investissement ou fiscal.',
    },
  };
}
