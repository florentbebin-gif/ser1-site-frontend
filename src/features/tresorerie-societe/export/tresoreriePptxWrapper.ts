/**
 * tresoreriePptxWrapper.ts — Assemblage deck PPTX Trésorerie Société IS
 *
 * Structure : Couverture → Schéma 3 phases → Projection paginée → Hypothèses → Fin
 *
 * Règle GOUVERNANCE_EXPORTS.md:62 :
 * - Aucun recalcul métier ici — on consomme TresoProjectionRow[] tel quel.
 * - Seuls les calculs dérivés de présentation (formatage, pagination) sont autorisés.
 * - Jamais "FCB" dans les slides client.
 */

import type { LogoPlacement, StudyDeckSpec } from '@/pptx/theme/types';
import type { TresoInputs, TresoProjectionRow } from '@/engine/tresorerie/types';
import { paginateTresoYears } from '@/pptx/slides/buildTresorerieProjection';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';

// ─── Libellés UI premium (jamais les labels Excel bruts) ───────────────────────

const PROJECTION_ROWS_RESUME = [
  { key: 'apportCCA' as const, label: "Apports en compte courant d'associé" },
  { key: 'revenuDistrib' as const, label: 'Revenus — poche de distribution' },
  { key: 'is' as const, label: 'Impôt sur les sociétés' },
  { key: 'revenusNets' as const, label: 'Total revenus nets annuels' },
  { key: 'deltaBesoin' as const, label: 'Écart annuel avec le besoin de revenus' },
  { key: 'tresorerieFin' as const, label: "Trésorerie fin d'année" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtAns(n: number | null): string {
  if (n == null) return '—';
  return n === 1 ? '1 an' : `${n} ans`;
}

// ─── Construction du StudyDeckSpec ────────────────────────────────────────────

export interface TresorerieDeckData {
  rows: TresoProjectionRow[];
  kpis: TresoKPIs;
  inputs: TresoInputs;
  clientName?: string;
}

export function buildTresorerieStudyDeck(
  data: TresorerieDeckData,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
): StudyDeckSpec {
  const { rows, kpis, inputs } = data;

  const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  const typeLabel = inputs.typeCreation === 'existante' ? 'Société existante' : 'Société à créer (NEWCO)';

  // ── Projection paginée ──────────────────────────────────────────────────────
  const totalYears = rows.length;
  const pages = totalYears > 0 ? paginateTresoYears(totalYears, 10) : [];

  const projectionSlides = pages.map((yearsForPage, pageIdx) => ({
    type: 'treso-projection' as const,
    title: 'Projection comptable annuelle',
    subtitle: 'Trésorerie société IS — données issues de la simulation',
    yearsForPage,
    rows: PROJECTION_ROWS_RESUME.map(({ key, label }) => ({
      label,
      values: rows.map(r => r[key] as number),
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
    'PFU dividendes : convention Option A (brut unique sans double comptage).',
    'IS latent capitalisation : affiché pour information, non décaissé avant la sortie.',
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
      // Schéma 3 phases + KPIs
      {
        type: 'treso-schema',
        title: 'Schéma patrimonial — Société IS',
        subtitle: 'Constitution · Exploitation · Retraite & Transmission',
        typeCreation: inputs.typeCreation,
        hasHolding: !!inputs.holding?.actif,
        hasDistribution: !!inputs.distribution,
        hasCapitalisation: !!inputs.capitalisation,
        hasCreditIR: !!(inputs.creditIR?.actif),
        hasCreditIS: !!(inputs.creditIS?.actif),
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
