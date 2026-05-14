/**
 * Type PPTX du deck complet.
 */

import type { ChapterSlideSpec, ContentSlideSpec, CoverSlideSpec, EndSlideSpec } from './core';
import type { CreditAmortizationSlideSpec, CreditAnnexeSlideSpec, CreditGlobalSynthesisSlideSpec, CreditLoanSynthesisSlideSpec, CreditSynthesisSlideSpec } from './credit';
import type { IrAnnexeSlideSpec, IrSynthesisSlideSpec } from './ir';
import type { PerFiscalSnapshotSlideSpec, PerPlafond3ColSlideSpec, PerProjectionTableSlideSpec } from './per';
import type { PlacementDetailSlideSpec, PlacementHypothesesSlideSpec, PlacementProjectionSlideSpec, PlacementSynthesisSlideSpec } from './placement';
import type { SuccessionAnnexTableSlideSpec, SuccessionAssetAnnexSlideSpec, SuccessionChronologySlideSpec, SuccessionFamilyContextSlideSpec, SuccessionHypothesesSlideSpec, SuccessionSynthesisSlideSpec } from './succession';
import type {
  TresorerieAllocationCardsSlideSpec,
  TresorerieAllocationMatrixSlideSpec,
  TresorerieFlowMechanismSlideSpec,
  TresorerieHypothesesSlideSpec,
  TresorerieParametersAnnexSlideSpec,
  TresorerieProjectionSlideSpec,
  TresorerieSchemaSlideSpec,
  TresorerieSynthesisSlideSpec,
  TresorerieTimelineSlideSpec,
} from '../tresorerieTypes';

export type StudyDeckSpec = {
  cover: CoverSlideSpec;
  slides: Array<
    | ChapterSlideSpec
    | ContentSlideSpec
    | IrSynthesisSlideSpec
    | IrAnnexeSlideSpec
    | CreditSynthesisSlideSpec
    | CreditGlobalSynthesisSlideSpec
    | CreditLoanSynthesisSlideSpec
    | CreditAnnexeSlideSpec
    | CreditAmortizationSlideSpec
    | SuccessionFamilyContextSlideSpec
    | SuccessionSynthesisSlideSpec
    | SuccessionChronologySlideSpec
    | SuccessionAnnexTableSlideSpec
    | SuccessionAssetAnnexSlideSpec
    | SuccessionHypothesesSlideSpec
    | PlacementSynthesisSlideSpec
    | PlacementDetailSlideSpec
    | PlacementHypothesesSlideSpec
    | PlacementProjectionSlideSpec
    | PerFiscalSnapshotSlideSpec
    | PerPlafond3ColSlideSpec
    | PerProjectionTableSlideSpec
    | TresorerieSchemaSlideSpec
    | TresorerieTimelineSlideSpec
    | TresorerieFlowMechanismSlideSpec
    | TresorerieSynthesisSlideSpec
    | TresorerieAllocationMatrixSlideSpec
    | TresorerieAllocationCardsSlideSpec
    | TresorerieParametersAnnexSlideSpec
    | TresorerieHypothesesSlideSpec
    | TresorerieProjectionSlideSpec
  >;
  end: EndSlideSpec;
};
