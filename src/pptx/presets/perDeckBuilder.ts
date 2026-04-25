import type {
  ChapterSlideSpec,
  ContentSlideSpec,
  LogoPlacement,
  PerFiscalBracket,
  PerFiscalSnapshotSlideSpec,
  PerPlafond3ColSlideSpec,
  PerProjectionTableSlideSpec,
  StudyDeckSpec,
} from '../theme/types';
import { pickChapterImage } from '../designSystem/serenity';
import type { PerPotentielResult } from '../../engine/per';

type IrScaleRow = {
  from: number;
  to: number | null;
  rate: number;
};

export interface PerDeckData {
  mode: 'versement-n' | 'declaration-n1';
  historicalBasis: 'previous-avis-plus-n1' | 'current-avis' | null;
  needsCurrentYearEstimate: boolean;
  situationFamiliale: 'celibataire' | 'marie';
  nombreParts: number;
  isole: boolean;
  mutualisationConjoints: boolean;
  versementEnvisage: number;
  result: PerPotentielResult;
  clientName?: string;
  anneeRef?: number;
  passReference?: number;
  irScale?: IrScaleRow[];
  irScaleLabel?: string;
}

export interface PerUiSettingsForPptx {
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

export interface PerAdvisorInfo {
  name?: string;
}

const LEGAL_TEXT = `Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des dispositions légales et réglementaires en vigueur à la date de sa remise, lesquelles sont susceptibles d'évoluer.

Les informations qu'il contient sont strictement confidentielles et destinées exclusivement aux personnes expressément autorisées.

Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procédé que ce soit, ainsi que toute vente, revente, retransmission ou mise à disposition de tiers, est strictement encadrée. Le non-respect de ces dispositions est susceptible de constituer une contrefaçon engageant la responsabilité civile et pénale de son auteur, conformément aux articles L335-1 à L335-10 du Code de la propriété intellectuelle.`;

function euro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function basisLabel(basis: PerDeckData['historicalBasis']): string {
  if (basis === 'current-avis') return 'Avis IR courant disponible';
  if (basis === 'previous-avis-plus-n1') return 'Avis IR précédent et reconstitution';
  return 'Base documentaire à confirmer';
}

function modeTitle(mode: PerDeckData['mode']): string {
  return mode === 'declaration-n1'
    ? 'Déclaration 2042 épargne retraite'
    : 'Contrôle du potentiel épargne retraite';
}

function currentDateLong(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function advisorMeta(advisor?: PerAdvisorInfo): string {
  if (advisor?.name) {
    return `${advisor.name}\nConseiller en gestion de patrimoine`;
  }
  return 'Conseiller en gestion de patrimoine';
}

function buildObjectifsBody(data: PerDeckData): string {
  if (data.mode === 'declaration-n1') {
    return "Vous souhaitez préparer les cases 2042 « charges déductibles » à partir des versements d'épargne retraite réalisés et visualiser l'impact sur le prochain avis d'impôt.";
  }

  if (data.historicalBasis === 'current-avis') {
    return "Vous partez de l'avis IR disponible pour vérifier le potentiel d'épargne retraite mobilisable avant versement et, le cas échéant, projeter l'année en cours.";
  }

  return "Vous partez de l'avis IR précédent, reconstituez les revenus et versements de l'année, puis estimez le potentiel disponible pour arbitrer un versement.";
}

function buildFiscalBrackets(data: PerDeckData): {
  brackets: PerFiscalBracket[];
  activeThreshold: number | null;
} {
  const activeRate = Math.round((data.result.situationFiscale.tmi || 0) * 100);
  const brackets = (data.irScale ?? []).map((row) => ({
    label: `${row.rate.toLocaleString('fr-FR')} %`,
    rate: row.rate,
    threshold: row.from,
  }));
  const active = brackets.find((row) => Math.round(row.rate) === activeRate);

  return {
    brackets,
    activeThreshold: active?.threshold ?? null,
  };
}

function buildFiscalSnapshotSlide(data: PerDeckData): PerFiscalSnapshotSlideSpec {
  const { result } = data;
  const { brackets, activeThreshold } = buildFiscalBrackets(data);

  return {
    type: 'per-fiscal-snapshot',
    title: 'Estimation de la situation fiscale',
    subtitle: data.irScaleLabel || 'Barème IR issu des paramètres',
    tmiRate: result.situationFiscale.tmi,
    activeThreshold,
    irEstime: result.situationFiscale.irEstime,
    revenuImposableFoyer: result.situationFiscale.revenuFiscalRef,
    partsNb: data.nombreParts,
    montantDansLaTMI: result.situationFiscale.montantDansLaTMI,
    brackets,
  };
}

function passIntro(data: PerDeckData): string {
  if (!data.passReference || data.passReference <= 0) {
    return "Le potentiel personnel correspond au plafond 163 quatervicies disponible après prise en compte des versements et de la mutualisation éventuelle.";
  }

  return [
    'Le potentiel personnel correspond au plafond 163 quatervicies, calculé sur les revenus professionnels et les reliquats reportables.',
    `Pour l'année de référence, le PASS retenu est ${euro(data.passReference)}.`,
  ].join(' ');
}

function buildPlafond163QSlide(data: PerDeckData): PerPlafond3ColSlideSpec {
  const { result } = data;
  const flow1 = result.deductionFlow163Q.declarant1;
  const flow2 = result.deductionFlow163Q.declarant2;
  const year = data.anneeRef ? String(data.anneeRef) : 'N';

  return {
    type: 'per-plafond-3col',
    title: `Plafonds épargne retraite 163Q pour ${year}`,
    subtitle: 'Disponible, versements retenus et solde',
    variant: '163q',
    intro: passIntro(data),
    isCouple: !!flow2,
    columns: [
      {
        heading: 'Disponible après mutualisation',
        iconName: 'bank',
        values: {
          declarant1: flow1.plafondApresMutualisation,
          declarant2: flow2?.plafondApresMutualisation,
        },
      },
      {
        heading: 'Versements retenus pour l’IR',
        iconName: 'pen',
        values: {
          declarant1: flow1.cotisationsRetenuesIr,
          declarant2: flow2?.cotisationsRetenuesIr,
        },
      },
      {
        heading: 'Disponible restant',
        iconName: 'gauge',
        values: {
          declarant1: flow1.disponibleRestant,
          declarant2: flow2?.disponibleRestant,
        },
      },
    ],
    note: result.declaration2042.case6QR
      ? 'Mutualisation des plafonds activée : les disponibles du conjoint peuvent absorber un dépassement.'
      : undefined,
  };
}

function madelinAvailable(detail?: { enveloppe15Versement: number; enveloppe10: number }): number {
  return (detail?.enveloppe15Versement ?? 0) + (detail?.enveloppe10 ?? 0);
}

function buildMadelinSlide(data: PerDeckData): PerPlafond3ColSlideSpec | null {
  const madelin = data.result.plafondMadelin;
  if (!data.result.estTNS || !madelin) {
    return null;
  }

  const d1 = madelin.declarant1;
  const d2 = madelin.declarant2;
  const surplus = (d1?.surplusAReintegrer ?? 0) + (d2?.surplusAReintegrer ?? 0);
  const year = data.anneeRef ? String(data.anneeRef) : 'N';

  return {
    type: 'per-plafond-3col',
    title: `Plafonds Madelin 154 bis pour ${year}`,
    subtitle: 'Assiette, enveloppe et solde TNS',
    variant: 'madelin',
    intro: "Le potentiel Madelin 154 bis est réservé aux travailleurs non-salariés. Il distingue l'assiette de versement, l'enveloppe ouverte et le disponible restant après consommation.",
    isCouple: !!d2,
    columns: [
      {
        heading: 'Assiette de versement',
        iconName: 'calculator',
        values: {
          declarant1: d1.assietteVersement,
          declarant2: d2?.assietteVersement,
        },
      },
      {
        heading: 'Enveloppe disponible',
        iconName: 'bank',
        values: {
          declarant1: madelinAvailable(d1),
          declarant2: madelinAvailable(d2),
        },
        caption: '15 % + 10 % selon la situation TNS',
      },
      {
        heading: 'Disponible restant',
        iconName: 'gauge',
        values: {
          declarant1: d1.disponibleRestant,
          declarant2: d2?.disponibleRestant,
        },
      },
    ],
    note: surplus > 0 ? `Surplus à réintégrer en base imposable : ${euro(surplus)}.` : undefined,
  };
}

function buildProjectionSlide(data: PerDeckData): PerProjectionTableSlideSpec {
  const { declaration2042, projectionAvisSuivant, simulation } = data.result;
  const isCouple = !!projectionAvisSuivant.declarant2;
  const projection1 = projectionAvisSuivant.declarant1;
  const projection2 = projectionAvisSuivant.declarant2;

  return {
    type: 'per-projection-table',
    title: "Déclaration 2042 et prochain avis d'impôt",
    subtitle: 'Synthèse des reports et reliquats projetés',
    isCouple,
    declarationRows: [
      { label: '6NS / 6NT — PER 163 quatervicies', declarant1: declaration2042.case6NS, declarant2: declaration2042.case6NT },
      { label: '6RS / 6RT — PERP et assimilés', declarant1: declaration2042.case6RS, declarant2: declaration2042.case6RT },
      { label: '6OS / 6OT — PER 154 bis', declarant1: declaration2042.case6OS, declarant2: declaration2042.case6OT },
      { label: '6QS / 6QT — Madelin, PERCO, Art. 83', declarant1: declaration2042.case6QS, declarant2: declaration2042.case6QT },
      { label: '6QR — Mutualisation conjoint', declarant1: declaration2042.case6QR },
    ],
    avisRows: [
      { label: 'Reliquat N-2', declarant1: projection1.nonUtiliseN2, declarant2: projection2?.nonUtiliseN2 },
      { label: 'Reliquat N-1', declarant1: projection1.nonUtiliseN1, declarant2: projection2?.nonUtiliseN1 },
      { label: 'Reliquat N', declarant1: projection1.nonUtiliseN, declarant2: projection2?.nonUtiliseN },
      { label: 'Plafond calculé', declarant1: projection1.plafondCalculeN, declarant2: projection2?.plafondCalculeN },
      { label: 'Total projeté', declarant1: projection1.plafondTotal, declarant2: projection2?.plafondTotal },
    ],
    simulationRows: simulation
      ? [
        { label: 'Versement envisagé', value: simulation.versementEnvisage },
        { label: 'Versement déductible retenu', value: simulation.versementDeductible },
        { label: "Économie d'IR estimée", value: simulation.economieIRAnnuelle },
        { label: 'Coût net après fiscalité', value: simulation.coutNetApresFiscalite },
      ]
      : undefined,
  };
}

export function buildPerStudyDeck(
  data: PerDeckData,
  _uiSettings: PerUiSettingsForPptx,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
  advisor?: PerAdvisorInfo,
): StudyDeckSpec {
  const fiscalSlide = buildFiscalSnapshotSlide(data);
  const plafondSlide = buildPlafond163QSlide(data);
  const madelinSlide = buildMadelinSlide(data);
  const projectionSlide = buildProjectionSlide(data);

  const slides: Array<
    | ChapterSlideSpec
    | ContentSlideSpec
    | PerFiscalSnapshotSlideSpec
    | PerPlafond3ColSlideSpec
    | PerProjectionTableSlideSpec
  > = [
    {
      type: 'chapter',
      title: 'Objectifs & contexte',
      subtitle: `${modeTitle(data.mode)} — ${basisLabel(data.historicalBasis)}`,
      body: buildObjectifsBody(data),
      chapterImageIndex: pickChapterImage('per', 0),
    },
    fiscalSlide,
    plafondSlide,
  ];

  if (madelinSlide) {
    slides.push(madelinSlide);
  }

  slides.push(projectionSlide);

  return {
    cover: {
      type: 'cover',
      title: 'Étude — Potentiel épargne retraite',
      subtitle: data.clientName || modeTitle(data.mode),
      logoUrl,
      logoPlacement,
      leftMeta: currentDateLong(),
      rightMeta: advisorMeta(advisor),
    },
    slides,
    end: {
      type: 'end',
      legalText: LEGAL_TEXT,
    },
  };
}
