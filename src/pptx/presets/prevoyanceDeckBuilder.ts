import type {
  ChapterSlideSpec,
  LogoPlacement,
  PrevoyanceContractsTableSlideSpec,
  PrevoyanceRoChartSlideSpec,
  StudyDeckSpec,
} from '../theme/types';
import { pickChapterImage } from '../designSystem/serenity';

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

interface PrevoyanceDeckData {
  situation: {
    kind: 'individuel' | 'collectif';
    kindLabel: string;
    regimeLabel: string;
    familyStatus: string;
    childrenCount: number;
    revenuImposable: number;
    salaireBrutAnnuel: number;
    referenceAnnual: number;
    ancienneteYears: number;
  };
  regimeStack: Array<{
    code: string;
    label: string;
    caisse: string;
  }>;
  contracts: Array<{
    name: string;
    indemnisationLabel: string;
    arretSummary: string;
    invaliditeSummary: string;
    decesSummary: string;
    fraisProSummary: string;
    cotisationSummary: string;
  }>;
  contractAggregationMode: 'compare' | 'cumulate';
  coverage: {
    arret: Array<{
      key: string;
      label: string;
      totalPct: number;
      segments: Array<{ kind: string; label: string; valuePct: number }>;
    }>;
    invalidite: Array<{
      key: string;
      label: string;
      totalPct: number;
      segments: Array<{ kind: string; label: string; valuePct: number }>;
    }>;
    decesTarget: number;
    decesRegimeCapital: number;
    decesCapital: number;
    fraisProCovered: number;
    fraisProEstimated: number;
  };
  assumptions: string[];
}

const LEGAL_TEXT =
  'Document non contractuel établi à titre indicatif à partir des informations saisies et des paramètres Prévoyance disponibles. Les garanties réelles dépendent des contrats, notices assureur, conventions collectives et régimes obligatoires applicables.';

const fmtMoney = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

function roRows(
  rows: PrevoyanceDeckData['coverage']['arret'],
): PrevoyanceRoChartSlideSpec['arretRows'] {
  return rows
    .filter((row) => row.key !== 'net-percu')
    .map((row) => {
      const segments = row.segments
        .filter((segment) => segment.kind === 'ro' || segment.kind === 'maintien')
        .map((segment) => ({ label: segment.label, valuePct: segment.valuePct }));
      return {
        label: row.label,
        segments,
        totalPct: Math.min(
          100,
          segments.reduce((sum, segment) => sum + segment.valuePct, 0),
        ),
      };
    });
}

function buildRoSlide(data: PrevoyanceDeckData): PrevoyanceRoChartSlideSpec {
  return {
    type: 'prevoyance-ro-chart',
    title: 'Régime obligatoire',
    subtitle: 'Couverture seule, hors contrats privés',
    regimeLabels: data.regimeStack.length
      ? data.regimeStack.map((regime) => regime.label)
      : [data.situation.regimeLabel],
    arretRows: roRows(data.coverage.arret),
    invaliditeRows: roRows(data.coverage.invalidite),
    decesCapitalLabel: fmtMoney(data.coverage.decesRegimeCapital),
  };
}

function buildContractsSlide(data: PrevoyanceDeckData): PrevoyanceContractsTableSlideSpec {
  const columns = data.contracts.slice(0, 3).map((contract) => contract.name);
  const rows = [
    {
      label: 'Cotisation annuelle',
      values: data.contracts.map((contract) => contract.cotisationSummary),
    },
    {
      label: 'Arrêt de travail',
      values: data.contracts.map((contract) => contract.arretSummary),
    },
    {
      label: 'Frais professionnels',
      values: data.contracts.map((contract) => contract.fraisProSummary),
    },
    {
      label: 'Invalidité',
      values: data.contracts.map((contract) => contract.invaliditeSummary),
    },
    {
      label: 'Capital décès',
      values: data.contracts.map((contract) => contract.decesSummary),
    },
    {
      label: 'Objectif décès',
      values: data.contracts.map(() => fmtMoney(data.coverage.decesTarget)),
    },
    {
      label: 'Couverture cumulée affichée',
      values: data.contracts.map(() => fmtMoney(data.coverage.decesCapital)),
    },
  ];

  return {
    type: 'prevoyance-contracts-table',
    title: 'Synthèse contrats',
    subtitle: 'Comparaison des garanties privées saisies',
    modeLabel:
      data.contractAggregationMode === 'cumulate'
        ? 'Mode cumul : indemnitaire après RO, forfaitaire en relais, décès cumulé.'
        : 'Mode comparaison : chaque contrat conserve sa logique propre.',
    columns,
    rows,
  };
}

export function buildPrevoyanceStudyDeck(
  data: PrevoyanceDeckData,
  _uiSettings: UiSettingsForPptx,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
): StudyDeckSpec {
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const chapter: ChapterSlideSpec = {
    type: 'chapter',
    title: 'Protection du revenu',
    subtitle: 'Arrêt de travail, invalidité, décès',
    body: 'Cette étude synthétise les garanties obligatoires et les contrats saisis dans le simulateur Prévoyance.',
    chapterImageIndex: pickChapterImage('prevoyance', 0),
  };

  return {
    cover: {
      type: 'cover',
      title: 'Simulation Prévoyance',
      subtitle: data.situation.regimeLabel,
      logoUrl,
      logoPlacement,
      leftMeta: dateStr,
      rightMeta: data.situation.kindLabel,
    },
    slides: [chapter, buildRoSlide(data), buildContractsSlide(data)],
    end: { type: 'end', legalText: LEGAL_TEXT },
  };
}

export default buildPrevoyanceStudyDeck;
