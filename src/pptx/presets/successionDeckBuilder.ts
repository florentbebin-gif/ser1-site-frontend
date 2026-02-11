/**
 * Succession Deck Builder (P1-02)
 *
 * Generates a StudyDeckSpec for succession simulation results.
 * Structure: Cover → Chapter → Synthesis → Chapter → Content (hypothèses) → End
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
