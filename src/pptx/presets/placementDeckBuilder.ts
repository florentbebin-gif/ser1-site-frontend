/**
 * Placement Deck Builder
 *
 * Generates a StudyDeckSpec for placement simulation results.
 * Structure: Cover → Chapter (objectifs) → Synthesis (comparatif) →
 *            Content (épargne) → Content (liquidation) → Content (transmission) →
 *            Chapter (hypothèses) → Content (hypothèses) → End
 */

import type {
  StudyDeckSpec,
  ChapterSlideSpec,
  ContentSlideSpec,
  PlacementSynthesisSlideSpec,
  LogoPlacement,
} from '../theme/types';
import { isDebugEnabled } from '../../utils/debugFlags';
import { pickChapterImage } from '../designSystem/serenity';

const DEBUG_PPTX = isDebugEnabled('pptx');

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
}

export interface PlacementData {
  clientName?: string;
  produit1: PlacementProductData;
  produit2: PlacementProductData;
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

function buildEpargneBody(p1: PlacementProductData, p2: PlacementProductData): string {
  return [
    `${p1.envelopeLabel} :`,
    `- Capital acquis : ${fmt(p1.epargne.capitalAcquis)}`,
    `- Versements cumulés : ${fmt(p1.epargne.cumulVersements)}`,
    `- Effort réel : ${fmt(p1.epargne.cumulEffort)}`,
    `- Économie IR cumulée : ${fmt(p1.epargne.cumulEconomieIR)}`,
    '',
    `${p2.envelopeLabel} :`,
    `- Capital acquis : ${fmt(p2.epargne.capitalAcquis)}`,
    `- Versements cumulés : ${fmt(p2.epargne.cumulVersements)}`,
    `- Effort réel : ${fmt(p2.epargne.cumulEffort)}`,
    `- Économie IR cumulée : ${fmt(p2.epargne.cumulEconomieIR)}`,
  ].join('\n');
}

function buildLiquidationBody(p1: PlacementProductData, p2: PlacementProductData): string {
  return [
    `${p1.envelopeLabel} :`,
    `- Retraits nets cumulés : ${fmt(p1.liquidation.cumulRetraitsNets)}`,
    `- Revenu annuel moyen net : ${fmt(p1.liquidation.revenuAnnuelMoyenNet)}`,
    `- Fiscalité cumulée : ${fmt(p1.liquidation.cumulFiscalite)}`,
    '',
    `${p2.envelopeLabel} :`,
    `- Retraits nets cumulés : ${fmt(p2.liquidation.cumulRetraitsNets)}`,
    `- Revenu annuel moyen net : ${fmt(p2.liquidation.revenuAnnuelMoyenNet)}`,
    `- Fiscalité cumulée : ${fmt(p2.liquidation.cumulFiscalite)}`,
  ].join('\n');
}

function buildTransmissionBody(p1: PlacementProductData, p2: PlacementProductData): string {
  return [
    `${p1.envelopeLabel} :`,
    `- Régime fiscal : ${p1.transmission.regime}`,
    `- Droits / taxe : ${fmt(p1.transmission.taxe)}`,
    `- Capital transmis net : ${fmt(p1.transmission.capitalTransmisNet)}`,
    '',
    `${p2.envelopeLabel} :`,
    `- Régime fiscal : ${p2.transmission.regime}`,
    `- Droits / taxe : ${fmt(p2.transmission.taxe)}`,
    `- Capital transmis net : ${fmt(p2.transmission.capitalTransmisNet)}`,
  ].join('\n');
}

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

  const slides: Array<ChapterSlideSpec | PlacementSynthesisSlideSpec | ContentSlideSpec> = [
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Comparaison de deux stratégies de placement',
      body: 'Vous souhaitez comparer deux enveloppes d\'épargne sur les trois phases : constitution, liquidation et transmission.',
      chapterImageIndex: pickChapterImage('placement', 0),
    },
    {
      type: 'placement-synthesis',
      produit1: {
        envelopeLabel: data.produit1.envelopeLabel,
        capitalAcquis: data.produit1.epargne.capitalAcquis,
        effortReel: data.produit1.totaux.effortReel,
        revenusNetsLiquidation: data.produit1.totaux.revenusNetsLiquidation,
        fiscaliteTotale: data.produit1.totaux.fiscaliteTotale,
        capitalTransmisNet: data.produit1.transmission.capitalTransmisNet,
        revenusNetsTotal: data.produit1.totaux.revenusNetsTotal,
      },
      produit2: {
        envelopeLabel: data.produit2.envelopeLabel,
        capitalAcquis: data.produit2.epargne.capitalAcquis,
        effortReel: data.produit2.totaux.effortReel,
        revenusNetsLiquidation: data.produit2.totaux.revenusNetsLiquidation,
        fiscaliteTotale: data.produit2.totaux.fiscaliteTotale,
        capitalTransmisNet: data.produit2.transmission.capitalTransmisNet,
        revenusNetsTotal: data.produit2.totaux.revenusNetsTotal,
      },
    },
    {
      type: 'content',
      title: 'Phase Épargne',
      subtitle: 'Constitution du capital',
      body: buildEpargneBody(data.produit1, data.produit2),
    },
    {
      type: 'content',
      title: 'Phase Liquidation',
      subtitle: 'Revenus et fiscalité des retraits',
      body: buildLiquidationBody(data.produit1, data.produit2),
    },
    {
      type: 'content',
      title: 'Phase Transmission',
      subtitle: 'Capital transmis au décès',
      body: buildTransmissionBody(data.produit1, data.produit2),
    },
    {
      type: 'chapter',
      title: 'Hypothèses et limites',
      subtitle: 'Cadre de la simulation',
      body: 'Les résultats ci-dessus reposent sur les hypothèses détaillées ci-après.',
      chapterImageIndex: pickChapterImage('placement', 1),
    },
    {
      type: 'content',
      title: 'Hypothèses retenues',
      subtitle: 'Paramètres de la simulation',
      body: [
        '- Simulation basée sur les taux de rendement et paramètres saisis dans le simulateur',
        '- Fiscalité appliquée selon le régime de chaque enveloppe (PFU, barème IR, exonérations)',
        '- Les taux de rendement futurs sont hypothétiques et ne constituent pas une garantie',
        '- Prélèvements sociaux appliqués selon les taux en vigueur à la date de simulation',
        '- Transmission calculée selon le barème DMTG et les abattements légaux en vigueur',
        '- Les montants sont arrondis à l\'euro le plus proche',
      ].join('\n'),
    },
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
