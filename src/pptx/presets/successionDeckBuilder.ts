/**
 * Succession Deck Builder (P1-02)
 *
 * Generates a StudyDeckSpec for succession simulation results.
 * Structure: Cover → Chapter → Synthesis → Chronologie → Chapter → Content (hypothèses) → End
 */

import type {
  StudyDeckSpec,
  ChapterSlideSpec,
  ContentSlideSpec,
  SuccessionSynthesisSlideSpec,
  LogoPlacement,
} from '../theme/types';
import { isDebugEnabled } from '../../utils/debugFlags';

const DEBUG_PPTX = isDebugEnabled('pptx');

export interface SuccessionData {
  actifNetSuccession: number;
  totalDroits: number;
  tauxMoyenGlobal: number;
  heritiers: Array<{
    lien: string;
    partBrute: number;
    abattement: number;
    baseImposable: number;
    droits: number;
    tauxMoyen: number;
  }>;
  predecesChronologie?: {
    applicable: boolean;
    order: 'epoux1' | 'epoux2';
    firstDecedeLabel: string;
    secondDecedeLabel: string;
    step1: {
      actifTransmis: number;
      partConjoint: number;
      partEnfants: number;
      droitsEnfants: number;
    } | null;
    step2: {
      actifTransmis: number;
      partConjoint: number;
      partEnfants: number;
      droitsEnfants: number;
    } | null;
    totalDroits: number;
    totalDroitsOrdreInverse?: number;
    warnings?: string[];
  };
  clientName?: string;
}

export interface AdvisorInfo {
  name?: string;
  title?: string;
  office?: string;
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

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

function orderLabel(order: 'epoux1' | 'epoux2'): string {
  return order === 'epoux1'
    ? 'Époux 1 puis Époux 2'
    : 'Époux 2 puis Époux 1';
}

function buildChronologieBody(data?: SuccessionData['predecesChronologie']): string {
  if (!data) {
    return [
      '• Chronologie non transmise dans cette exportation',
      '• Utiliser la page simulateur pour consulter les droits des 2 étapes',
    ].join('\n');
  }

  const lines: string[] = [
    `• Ordre simulé: ${orderLabel(data.order)}`,
    `• Chronologie applicable: ${data.applicable ? 'Oui' : 'Non'}`,
  ];

  if (data.applicable && data.step1 && data.step2) {
    lines.push(`• Étape 1 (${data.firstDecedeLabel}) - masse ${fmt(data.step1.actifTransmis)}, droits descendants ${fmt(data.step1.droitsEnfants)}`);
    lines.push(`• Étape 2 (${data.secondDecedeLabel}) - masse ${fmt(data.step2.actifTransmis)}, droits descendants ${fmt(data.step2.droitsEnfants)}`);
    lines.push(`• Total cumulé des droits (2 décès): ${fmt(data.totalDroits)}`);
    if (typeof data.totalDroitsOrdreInverse === 'number') {
      lines.push(`• Total ordre inverse: ${fmt(data.totalDroitsOrdreInverse)}`);
    }
  } else {
    lines.push('• Chronologie non applicable à la situation saisie (hors couple marié/pacsé ou données incomplètes)');
  }

  if (data.warnings && data.warnings.length > 0) {
    lines.push('');
    lines.push('Avertissements:');
    data.warnings.slice(0, 4).forEach((warning) => lines.push(`• ${warning}`));
  }

  return lines.join('\n');
}

export function buildSuccessionStudyDeck(
  data: SuccessionData,
  _uiSettings: UiSettingsForPptx,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
  advisor?: AdvisorInfo,
): StudyDeckSpec {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const clientSubtitle = data.clientName || 'NOM Prénom';
  const advisorMeta = advisor?.name || 'NOM Prénom';

  if (DEBUG_PPTX) {
    // eslint-disable-next-line no-console
    console.debug('[PPTX Succession] Building deck:', {
      actif: data.actifNetSuccession,
      droits: data.totalDroits,
      heritiers: data.heritiers.length,
    });
  }

  const slides: Array<ChapterSlideSpec | SuccessionSynthesisSlideSpec | ContentSlideSpec> = [
    // Chapter 1: Objectifs
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Estimation des droits de succession',
      body: 'Vous souhaitez estimer les droits de mutation à titre gratuit applicables à votre situation patrimoniale.',
      chapterImageIndex: 1,
    },
    // Slide 2: Synthèse succession (KPI + table héritiers)
    {
      type: 'succession-synthesis',
      actifNetSuccession: data.actifNetSuccession,
      totalDroits: data.totalDroits,
      tauxMoyenGlobal: data.tauxMoyenGlobal,
      heritiers: data.heritiers,
    },
    // Slide 3: Chronologie des décès (prédécès)
    {
      type: 'content',
      title: 'Chronologie des décès',
      subtitle: 'Simulation du 1er décès puis du 2e décès',
      body: buildChronologieBody(data.predecesChronologie),
    },
    // Chapter 2: Hypothèses
    {
      type: 'chapter',
      title: 'Hypothèses et limites',
      subtitle: 'Cadre de l\'estimation',
      body: 'Les résultats ci-dessus reposent sur les hypothèses détaillées ci-après.',
      chapterImageIndex: 3,
    },
    // Slide 4: Hypothèses détaillées
    {
      type: 'content',
      title: 'Hypothèses retenues',
      subtitle: 'Barème DMTG 2024',
      body: [
        '• Barème des droits de mutation à titre gratuit en vigueur (CGI Art. 777)',
        '• Abattement en ligne directe : 100 000 € par enfant (CGI Art. 779)',
        '• Exonération totale du conjoint survivant (CGI Art. 796-0 bis)',
        '• Estimation hors donations antérieures et hors assurance-vie',
        '• Les montants sont arrondis à l\'euro le plus proche',
      ].join('\n'),
    },
  ];

  return {
    cover: {
      type: 'cover',
      title: 'Simulation Succession',
      subtitle: clientSubtitle,
      logoUrl,
      logoPlacement,
      leftMeta: dateStr,
      rightMeta: advisorMeta,
    },
    slides,
    end: {
      type: 'end',
      legalText: LEGAL_TEXT,
    },
  };
}

export default buildSuccessionStudyDeck;
