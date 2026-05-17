import { useMemo } from 'react';
import type {
  AssociateInputV6,
  AssociateRevenuePhaseInputV6,
  CompanyInputV6,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
import { sortPhases } from '../../utils/revenuePhases';
import { computeTimelineRange } from './timelineLayout';
import { TresoTimelineTrack } from './TresoTimelineTrack';

interface TresoTimelineMiniPreviewProps {
  phase: AssociateRevenuePhaseInputV6;
  phases: AssociateRevenuePhaseInputV6[];
  subsidiaries: SubsidiaryInput[];
  horizonYear: number;
}

export function TresoTimelineMiniPreview({
  phase,
  phases,
  subsidiaries,
  horizonYear,
}: TresoTimelineMiniPreviewProps) {
  const layout = useMemo(() => {
    const phasesWithDraft = sortPhases(phases.map((item) => (item.id === phase.id ? phase : item)));
    const currentIndex = phasesWithDraft.findIndex((item) => item.id === phase.id);
    const startIndex = Math.max(0, currentIndex - 1);
    const endIndex = Math.min(phasesWithDraft.length, currentIndex + 2);
    const previewPhases = phasesWithDraft.slice(startIndex, endIndex);
    const projectionStartYear = Math.min(...previewPhases.map((item) => item.startYear));
    const previewEndYear = Math.max(horizonYear, ...previewPhases.map((item) => item.endYear));
    const fallbackHorizonYears = Math.max(1, previewEndYear - projectionStartYear + 1);
    const associate: AssociateInputV6 = {
      id: 'preview-associe',
      label: 'Associé',
      kind: 'pp',
      profile: {
        currentAge: 0,
        retirementAge: 0,
        annualIncomeNeed: 0,
        projectionStartYear,
      },
      ownershipLots: [],
      roles: ['associe_sans_statut'],
      cca: {
        currentBalance: 0,
        remunerationRate: 0,
      },
      revenuePhases: previewPhases,
    };
    const company: CompanyInputV6 = {
      label: 'Société',
      projectionStartYear,
      creationType: 'newco',
      legalForm: 'sas',
      companyKind: 'holding_patrimoniale',
      shareCapital: 0,
      sharePremium: 0,
      reservesInitial: 0,
      legalReserveInitial: 0,
      treasuryInitial: 0,
      annualStructureCosts: 0,
      reducedCorporateTaxEligible: true,
      associates: [associate],
      loans: [],
      subsidiaries,
    };
    return computeTimelineRange(company, associate, fallbackHorizonYears);
  }, [horizonYear, phase, phases, subsidiaries]);

  return <TresoTimelineTrack layout={layout} onEditPhase={() => undefined} compact />;
}
