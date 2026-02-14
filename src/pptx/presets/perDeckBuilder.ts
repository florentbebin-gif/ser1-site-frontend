/**
 * PER Deck Builder (P1-03)
 *
 * Generates a StudyDeckSpec for PER simulation results.
 * Structure: Cover → Chapter → Synthesis → Chapter → Content (hypothèses) → End
 */

import type {
  StudyDeckSpec,
  ChapterSlideSpec,
  ContentSlideSpec,
  PerSynthesisSlideSpec,
  LogoPlacement,
} from '../theme/types';
import { isDebugEnabled } from '../../utils/debugFlags';

const DEBUG_PPTX = isDebugEnabled('pptx');

export interface PerData {
  versementAnnuel: number;
  dureeAnnees: number;
  tmi: number;
  capitalTerme: number;
  economieImpotTotale: number;
  renteAnnuelleEstimee: number;
  renteMensuelleEstimee: number;
  capitalNetSortie: number;
  tauxRendementInterne: number;
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

export function buildPerStudyDeck(
  data: PerData,
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
    console.debug('[PPTX PER] Building deck:', {
      versement: data.versementAnnuel,
      duree: data.dureeAnnees,
      capital: data.capitalTerme,
    });
  }

  const slides: Array<ChapterSlideSpec | PerSynthesisSlideSpec | ContentSlideSpec> = [
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Simulation Plan d\'Épargne Retraite',
      body: 'Vous souhaitez estimer le rendement et l\'avantage fiscal de versements sur un PER individuel.',
      chapterImageIndex: 2,
    },
    {
      type: 'per-synthesis',
      versementAnnuel: data.versementAnnuel,
      dureeAnnees: data.dureeAnnees,
      tmi: data.tmi,
      capitalTerme: data.capitalTerme,
      economieImpotTotale: data.economieImpotTotale,
      renteAnnuelleEstimee: data.renteAnnuelleEstimee,
      renteMensuelleEstimee: data.renteMensuelleEstimee,
      capitalNetSortie: data.capitalNetSortie,
      tauxRendementInterne: data.tauxRendementInterne,
    },
    {
      type: 'chapter',
      title: 'Hypothèses et limites',
      subtitle: 'Cadre de la simulation',
      body: 'Les résultats ci-dessus reposent sur les hypothèses détaillées ci-après.',
      chapterImageIndex: 4,
    },
    {
      type: 'content',
      title: 'Hypothèses retenues',
      subtitle: 'Barème 2024 — PER individuel',
      body: [
        '• Versements volontaires déductibles du revenu imposable (CGI Art. 163 quatervicies)',
        '• Plafond de déduction : 10% du PASS N-1 soit 35 194 € en 2024',
        '• Rendement et frais constants sur toute la durée',
        '• Taux de conversion rente : hypothèse simplifiée ~4% à 65 ans',
        '• Fiscalité sortie : IR barème pour le capital, abattement 10% pour la rente',
        '• Hors prélèvements sociaux (17,2%) sur les plus-values',
      ].join('\n'),
    },
  ];

  return {
    cover: {
      type: 'cover',
      title: 'Simulation PER',
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

export default buildPerStudyDeck;
