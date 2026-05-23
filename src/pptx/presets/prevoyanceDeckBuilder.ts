import type {
  ChapterSlideSpec,
  ContentSlideSpec,
  LogoPlacement,
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
  contracts: Array<{
    name: string;
    indemnisationLabel: string;
    arretSummary: string;
    invaliditeSummary: string;
    decesSummary: string;
    cotisationSummary: string;
  }>;
  coverage: {
    arret: Array<{ label: string; totalPct: number }>;
    invalidite: Array<{ label: string; totalPct: number }>;
    decesTarget: number;
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

const fmtPct = (value: number): string =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)} %`;

function buildSituationBody(data: PrevoyanceDeckData): string {
  const s = data.situation;
  return [
    `Parcours : ${s.kindLabel}`,
    `Régime obligatoire : ${s.regimeLabel}`,
    `Situation familiale : ${s.familyStatus}, ${s.childrenCount} enfant(s)`,
    `Revenu cible : ${fmtMoney(s.referenceAnnual)}`,
    s.kind === 'collectif'
      ? `Salaire brut : ${fmtMoney(s.salaireBrutAnnuel)} ; ancienneté : ${s.ancienneteYears} an(s)`
      : `Revenu imposable à couvrir : ${fmtMoney(s.revenuImposable)}`,
  ].join('\n');
}

function buildContractsBody(data: PrevoyanceDeckData): string {
  if (data.contracts.length === 0) return 'Aucun contrat de prévoyance renseigné.';
  return data.contracts
    .map(
      (contract) =>
        `${contract.name} — ${contract.indemnisationLabel}\nArrêt : ${contract.arretSummary}\nInvalidité : ${contract.invaliditeSummary}\nDécès : ${contract.decesSummary}`,
    )
    .join('\n\n');
}

function buildCoverageBody(data: PrevoyanceDeckData): string {
  const arret = data.coverage.arret
    .map((bar) => `${bar.label} : ${fmtPct(bar.totalPct)} du revenu cible`)
    .join('\n');
  const invalidite = data.coverage.invalidite
    .map((bar) => `${bar.label} : ${fmtPct(bar.totalPct)} du revenu cible`)
    .join('\n');
  return [`Arrêt de travail`, arret, '', `Invalidité`, invalidite].join('\n');
}

function buildDecesBody(data: PrevoyanceDeckData): string {
  const frais =
    data.situation.kind === 'individuel'
      ? `Frais professionnels couverts : ${fmtMoney(data.coverage.fraisProCovered)} pour ${fmtMoney(data.coverage.fraisProEstimated)} estimés.`
      : 'Frais professionnels : non applicable au parcours salarié collectif.';
  return [
    `Objectif indicatif : ${fmtMoney(data.coverage.decesTarget)}`,
    `Capital décès couvert : ${fmtMoney(data.coverage.decesCapital)}`,
    frais,
    '',
    'Cotisations',
    ...data.contracts.map((contract) => `${contract.name} : ${contract.cotisationSummary}`),
  ].join('\n');
}

function content(title: string, subtitle: string, body: string): ContentSlideSpec {
  return { type: 'content', title, subtitle, body };
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
    slides: [
      chapter,
      content('Situation', 'Données retenues pour la simulation', buildSituationBody(data)),
      content('Contrats', 'Garanties saisies', buildContractsBody(data)),
      content('Couverture', 'Arrêt de travail et invalidité', buildCoverageBody(data)),
      content(
        'Décès et cotisations',
        'Capitaux, frais professionnels et coût',
        buildDecesBody(data),
      ),
      content('Hypothèses', 'Limites de lecture', data.assumptions.join('\n')),
    ],
    end: { type: 'end', legalText: LEGAL_TEXT },
  };
}

export default buildPrevoyanceStudyDeck;
