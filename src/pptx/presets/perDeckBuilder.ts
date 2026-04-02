import type {
  StudyDeckSpec,
  ChapterSlideSpec,
  ContentSlideSpec,
  LogoPlacement,
} from '../theme/types';
import { pickChapterImage } from '../designSystem/serenity';
import type { PerPotentielResult } from '../../engine/per';

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

const LEGAL_TEXT = `Document etabli a titre strictement indicatif et depourvu de valeur contractuelle. Il a ete elabore sur la base des dispositions legales et reglementaires en vigueur a la date de sa remise, lesquelles sont susceptibles d evoluer.

Les informations qu il contient sont strictement confidentielles et destinees exclusivement aux personnes expressement autorisees.

Toute reproduction, representation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procede que ce soit, ainsi que toute vente, revente, retransmission ou mise a disposition de tiers, est strictement encadree. Le non-respect de ces dispositions est susceptible de constituer une contrefacon engageant la responsabilite civile et penale de son auteur, conformement aux articles L335-1 a L335-10 du Code de la propriete intellectuelle.`;

function euro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)} %`;
}

function yesNo(value: boolean): string {
  return value ? 'Oui' : 'Non';
}

function basisLabel(basis: PerDeckData['historicalBasis']): string {
  if (basis === 'current-avis') return 'Avis IR courant déjà disponible';
  if (basis === 'previous-avis-plus-n1') return 'Avis IR précédent + reconstitution N-1';
  return 'Base documentaire à confirmer';
}

function modeTitle(mode: PerDeckData['mode']): string {
  return mode === 'declaration-n1'
    ? 'Declaration 2042 epargne retraite'
    : 'Controle du potentiel epargne retraite';
}

function buildObjectifsBody(data: PerDeckData): string {
  return [
    `- Parcours retenu : ${modeTitle(data.mode)}.`,
    `- Base documentaire : ${basisLabel(data.historicalBasis)}.`,
    `- Projection N active : ${yesNo(data.needsCurrentYearEstimate)}.`,
    '- Le parcours reprend la logique pedagogique du classeur Excel 2025.',
    '- Les calculs d IR sont arbitres par le moteur fiscal du repo, pas par une simplification locale.',
    '- L export ci-dessous synthetise les plafonds personnels, la mutualisation et les cases 2042 utiles.',
  ].join('\n');
}

function buildSituationBody(data: PerDeckData): string {
  const sf = data.result.situationFiscale;
  const lines = [
    `- Situation familiale : ${data.situationFamiliale === 'marie' ? 'Marie / Pacse' : 'Celibataire / Veuf / Divorce'}.`,
    `- Nombre de parts retenu : ${data.nombreParts}.`,
    `- Parent isole : ${yesNo(data.isole)}.`,
    `- Revenu imposable declarant 1 : ${euro(sf.revenuImposableD1)}.`,
  ];

  if (sf.revenuImposableD2 > 0) {
    lines.push(`- Revenu imposable declarant 2 : ${euro(sf.revenuImposableD2)}.`);
  }

  lines.push(`- Revenu fiscal de reference estime : ${euro(sf.revenuFiscalRef)}.`);
  lines.push(`- TMI : ${pct(sf.tmi)}.`);
  lines.push(`- IR estime : ${euro(sf.irEstime)}.`);

  if (sf.decote > 0) {
    lines.push(`- Decote : ${euro(sf.decote)}.`);
  }
  if (sf.cehr > 0) {
    lines.push(`- CEHR : ${euro(sf.cehr)}.`);
  }
  if (sf.montantDansLaTMI > 0) {
    lines.push(`- Marge restante dans la TMI : ${euro(sf.montantDansLaTMI)}.`);
  }

  return lines.join('\n');
}

function buildPlafond163QBody(data: PerDeckData): string {
  const d1 = data.result.plafond163Q.declarant1;
  const d2 = data.result.plafond163Q.declarant2;
  const lines = [
    `- Declarant 1 : plafond calcule ${euro(d1.plafondCalculeN)}, reports ${euro(d1.nonUtiliseN3)} / ${euro(d1.nonUtiliseN2)} / ${euro(d1.nonUtiliseN1)}, disponible restant ${euro(d1.disponibleRestant)}.`,
  ];

  if (d2) {
    lines.push(`- Declarant 2 : plafond calcule ${euro(d2.plafondCalculeN)}, reports ${euro(d2.nonUtiliseN3)} / ${euro(d2.nonUtiliseN2)} / ${euro(d2.nonUtiliseN1)}, disponible restant ${euro(d2.disponibleRestant)}.`);
    lines.push(`- Mutualisation des plafonds (6QR) : ${yesNo(data.mutualisationConjoints)}.`);
  }

  if (data.result.warnings.length > 0) {
    lines.push(`- Alertes moteur : ${data.result.warnings.map((warning) => warning.message).join(' | ')}.`);
  }

  return lines.join('\n');
}

function buildMadelinBody(data: PerDeckData): string {
  const d1 = data.result.plafondMadelin?.declarant1;
  const d2 = data.result.plafondMadelin?.declarant2;
  if (!d1) {
    return '- Aucun plafond Madelin a restituer.';
  }

  const lines = [
    `- Declarant 1 : assiette ${euro(d1.assiette)}, enveloppe 15 % ${euro(d1.enveloppe15)}, enveloppe 10 % ${euro(d1.enveloppe10)}, disponible restant ${euro(d1.disponibleRestant)}.`,
  ];

  if (d2) {
    lines.push(`- Declarant 2 : assiette ${euro(d2.assiette)}, enveloppe 15 % ${euro(d2.enveloppe15)}, enveloppe 10 % ${euro(d2.enveloppe10)}, disponible restant ${euro(d2.disponibleRestant)}.`);
  }

  return lines.join('\n');
}

function buildDeclarationBody(data: PerDeckData): string {
  const boxes = data.result.declaration2042;
  const lines = [
    `- 6NS : ${euro(boxes.case6NS)}.`,
    `- 6RS : ${euro(boxes.case6RS)}.`,
    `- 6QS : ${euro(boxes.case6QS)}.`,
    `- 6OS : ${euro(boxes.case6OS)}.`,
  ];

  if (typeof boxes.case6NT === 'number') {
    lines.push(`- 6NT : ${euro(boxes.case6NT)}.`);
  }
  if (typeof boxes.case6RT === 'number') {
    lines.push(`- 6RT : ${euro(boxes.case6RT)}.`);
  }
  if (typeof boxes.case6QT === 'number') {
    lines.push(`- 6QT : ${euro(boxes.case6QT)}.`);
  }
  if (typeof boxes.case6OT === 'number') {
    lines.push(`- 6OT : ${euro(boxes.case6OT)}.`);
  }

  lines.push(`- 6QR : ${yesNo(boxes.case6QR)}.`);
  return lines.join('\n');
}

function buildSimulationBody(data: PerDeckData): string {
  if (!data.result.simulation) {
    return '- Aucun versement simule dans cette exportation.';
  }

  return [
    `- Versement envisage : ${euro(data.result.simulation.versementEnvisage)}.`,
    `- Versement deductible retenu : ${euro(data.result.simulation.versementDeductible)}.`,
    `- Economie IR annuelle estimee : ${euro(data.result.simulation.economieIRAnnuelle)}.`,
    `- Cout net apres fiscalite : ${euro(data.result.simulation.coutNetApresFiscalite)}.`,
    `- Plafond restant apres versement : ${euro(data.result.simulation.plafondRestantApres)}.`,
  ].join('\n');
}

export function buildPerStudyDeck(
  data: PerDeckData,
  _uiSettings: PerUiSettingsForPptx,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
  advisor?: PerAdvisorInfo,
): StudyDeckSpec {
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const slides: Array<ChapterSlideSpec | ContentSlideSpec> = [
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: modeTitle(data.mode),
      body: buildObjectifsBody(data),
      chapterImageIndex: pickChapterImage('per', 0),
    },
    {
      type: 'content',
      title: 'Situation fiscale',
      subtitle: 'Lecture du foyer retenu',
      body: buildSituationBody(data),
    },
    {
      type: 'content',
      title: 'Plafonds disponibles',
      subtitle: '163 quatervicies et mutualisation',
      body: buildPlafond163QBody(data),
    },
  ];

  if (data.result.estTNS && data.result.plafondMadelin) {
    slides.push({
      type: 'content',
      title: 'Plafond Madelin 154 bis',
      subtitle: 'Lecture TNS',
      body: buildMadelinBody(data),
    });
  }

  slides.push({
    type: 'chapter',
    title: 'Synthese declarative',
    subtitle: 'Cases 2042 et restitution',
    body: 'Cette partie reprend les cases 2042 simulees et la logique de mutualisation retenue dans le parcours.',
    chapterImageIndex: pickChapterImage('per', 1),
  });
  slides.push({
    type: 'content',
    title: 'Cases 2042 simulees',
    subtitle: 'Versements et mutualisation',
    body: buildDeclarationBody(data),
  });

  if (data.mode === 'versement-n' && data.result.simulation) {
    slides.push({
      type: 'content',
      title: 'Impact du versement',
      subtitle: 'Simulation fiscale immediate',
      body: buildSimulationBody(data),
    });
  }

  return {
    cover: {
      type: 'cover',
      title: 'Simulation PER - Potentiel',
      subtitle: data.clientName || modeTitle(data.mode),
      logoUrl,
      logoPlacement,
      leftMeta: dateStr,
      rightMeta: advisor?.name || 'SER1',
    },
    slides,
    end: {
      type: 'end',
      legalText: LEGAL_TEXT,
    },
  };
}
