/**
 * Placement Deck Builder
 *
 * Generates a StudyDeckSpec for placement simulation results.
 * Structure: Cover → Chapter → Synthesis → Detail (×3) →
 *            Chapter → Hypotheses → Projection tables → End
 */

import type {
  StudyDeckSpec,
  ChapterSlideSpec,
  PlacementSynthesisSlideSpec,
  PlacementDetailSlideSpec,
  PlacementHypothesesSlideSpec,
  PlacementProjectionSlideSpec,
  LogoPlacement,
} from '../theme/types';
import { isDebugEnabled } from '../../utils/debugFlags';
import { pickChapterImage } from '../designSystem/serenity';
import type { PlacementData, UiSettingsForPptx } from './placementDeckBuilder.types';
import { LEGAL_TEXT } from './placementDeckBuilder.types';
import {
  buildSynthesisSpec,
  buildEpargneDetail,
  buildLiquidationDetail,
  buildTransmissionDetail,
  buildHypothesesSlide,
  buildEpargneProjectionSlides,
  buildLiquidationProjectionSlides,
} from './placementDeckBuilder.helpers';

export type {
  PlacementProductConfig,
  EpargneRowForPptx,
  LiquidationRowForPptx,
  PlacementProductData,
  PlacementData,
  UiSettingsForPptx,
} from './placementDeckBuilder.types';

const DEBUG_PPTX = isDebugEnabled('pptx');

// ============================================================================
// MAIN ENTRY
// ============================================================================

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

  // Marqueur "âge au décès" dans les tableaux liquidation (color9)
  // deathYearIndex : 1-based index de l'année de décès dans la phase liquidation
  const liquidationStart = data.ageActuel + data.dureeEpargne;
  const rawDeathYear = data.ageAuDeces - liquidationStart + 1;
  const maxLiquidationYears = Math.max(
    data.produit1.liquidationRows.length,
    data.produit2.liquidationRows.length,
  );
  const deathYearIndex = (maxLiquidationYears > 0 && rawDeathYear >= 1 && rawDeathYear <= maxLiquidationYears)
    ? rawDeathYear
    : undefined;

  // Projection slides (paginated)
  const projectionSlides: PlacementProjectionSlideSpec[] = [
    ...buildEpargneProjectionSlides(data.produit1.epargneRows, data.produit1.envelopeLabel, 1),
    ...buildEpargneProjectionSlides(data.produit2.epargneRows, data.produit2.envelopeLabel, 2),
    ...buildLiquidationProjectionSlides(data.produit1.liquidationRows, data.produit1.envelopeLabel, 1, deathYearIndex),
    ...buildLiquidationProjectionSlides(data.produit2.liquidationRows, data.produit2.envelopeLabel, 2, deathYearIndex),
  ];

  const slides: Array<
    | ChapterSlideSpec
    | PlacementSynthesisSlideSpec
    | PlacementDetailSlideSpec
    | PlacementHypothesesSlideSpec
    | PlacementProjectionSlideSpec
  > = [
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Comparaison de deux stratégies de placement',
      body: 'Vous souhaitez comparer deux enveloppes d\'épargne sur les trois phases : constitution, liquidation et transmission.',
      chapterImageIndex: pickChapterImage('placement', 0),
    },
    buildSynthesisSpec(data),
    buildEpargneDetail(data),
    buildLiquidationDetail(data),
    buildTransmissionDetail(data),
    {
      type: 'chapter',
      title: 'Hypothèses et limites',
      subtitle: 'Cadre de la simulation',
      body: 'Les résultats ci-dessus reposent sur les hypothèses détaillées ci-après.',
      chapterImageIndex: pickChapterImage('placement', 1),
    },
    buildHypothesesSlide(),
    ...projectionSlides,
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
