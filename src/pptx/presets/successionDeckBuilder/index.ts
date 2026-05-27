import type {
  ChapterSlideSpec,
  StudyDeckSpec,
  SuccessionAnnexTableSlideSpec,
  SuccessionAssetAnnexSlideSpec,
  SuccessionChronologySlideSpec,
  SuccessionFamilyContextSlideSpec,
  SuccessionHypothesesSlideSpec,
  SuccessionSynthesisSlideSpec,
} from '@/pptx/theme/types';
import { pickChapterImage } from '@/pptx/designSystem/serenity';
import { isDebugEnabled } from '@/utils/debugFlags';

import { buildAnnexTableSlide, buildAssetAnnexSlide } from './annex';
import { buildChronologySlide } from './chronology';
import { LEGAL_TEXT } from './formatters';
import { buildHypothesesSlide } from './hypotheses';
import { buildFamilyContextSlide, buildSynthesisSlide } from './synthesis';
import type { AdvisorInfo, LogoPlacement, SuccessionData, UiSettingsForPptx } from './types';

const DEBUG_PPTX = isDebugEnabled('pptx');

export function buildSuccessionStudyDeck(
  data: SuccessionData,
  _uiSettings: UiSettingsForPptx,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
  advisor?: AdvisorInfo,
): StudyDeckSpec {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

  const slides: Array<
    | ChapterSlideSpec
    | SuccessionFamilyContextSlideSpec
    | SuccessionSynthesisSlideSpec
    | SuccessionChronologySlideSpec
    | SuccessionAnnexTableSlideSpec
    | SuccessionAssetAnnexSlideSpec
    | SuccessionHypothesesSlideSpec
  > = [
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Estimation des droits de succession',
      body: 'Vous souhaitez estimer les droits de mutation à titre gratuit applicables à votre situation patrimoniale.',
      chapterImageIndex: pickChapterImage('succession', 0),
    },
  ];

  const familyContextSlide = buildFamilyContextSlide(data.familyContext);
  if (familyContextSlide) slides.push(familyContextSlide);

  const assetAnnexSlide = buildAssetAnnexSlide(data.assetAnnex);

  slides.push(
    buildSynthesisSlide(data),
    buildChronologySlide(data),
    {
      type: 'chapter',
      title: 'Annexes',
      subtitle: 'Informations complémentaires',
      body: 'Retrouvez ci-après le détail des droits, les hypothèses retenues et la ventilation des actifs saisis.',
      chapterImageIndex: pickChapterImage('succession', 1),
    },
    buildAnnexTableSlide(data),
  );

  if (assetAnnexSlide) {
    slides.push(assetAnnexSlide);
  }

  slides.push(buildHypothesesSlide(data.assumptions, data.predecesChronologie));

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
