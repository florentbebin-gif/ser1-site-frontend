import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  SuccessionBeneficiaryRef,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from '../successionDraft';
import type { buildTestamentBeneficiaryOptions } from '../successionTestament';
import {
  cloneSuccessionTestamentsBySide,
  createSuccessionParticularLegacyEntry,
} from '../successionTestament';
import {
  cloneAscendantsSurvivantsBySide,
  cloneSuccessionInterMassClaims,
  cloneSuccessionParticipationAcquetsConfig,
  cloneSuccessionPreciputSelections,
  cloneSuccessionSocieteAcquetsConfig,
  updateDraftTestament,
  type DispositionsDraftState,
} from '../successionSimulator.helpers';

interface UseSuccessionDispositionsHandlersArgs {
  testamentBeneficiaryOptionsBySide: Record<
    SuccessionPrimarySide,
    ReturnType<typeof buildTestamentBeneficiaryOptions>
  >;
  isSocieteAcquetsRegime: boolean;
  canOpenDispositionsModal: boolean;
  devolutionContext: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT;
  patrimonialContext: typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT;
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  setShowDispositionsModal: Dispatch<SetStateAction<boolean>>;
  setPatrimonialContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT>>;
  setDevolutionContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT>>;
}

export function useSuccessionDispositionsHandlers({
  testamentBeneficiaryOptionsBySide,
  isSocieteAcquetsRegime,
  canOpenDispositionsModal,
  devolutionContext,
  patrimonialContext,
  dispositionsDraft,
  setDispositionsDraft,
  setShowDispositionsModal,
  setPatrimonialContext,
  setDevolutionContext,
}: UseSuccessionDispositionsHandlersArgs) {
  const getFirstTestamentBeneficiaryRef = useCallback(
    (side: SuccessionPrimarySide): SuccessionBeneficiaryRef | null =>
      testamentBeneficiaryOptionsBySide[side][0]?.value ?? null,
    [testamentBeneficiaryOptionsBySide],
  );

  const updateDispositionsTestament = useCallback((
    side: SuccessionPrimarySide,
    updater: (_current: SuccessionTestamentConfig) => SuccessionTestamentConfig,
  ) => {
    setDispositionsDraft((prev) => updateDraftTestament(prev, side, updater));
  }, [setDispositionsDraft]);

  const addDispositionsParticularLegacy = useCallback((side: SuccessionPrimarySide) => {
    const defaultBeneficiaryRef = getFirstTestamentBeneficiaryRef(side);
    setDispositionsDraft((prev) => updateDraftTestament(prev, side, (current) => ({
      ...current,
      particularLegacies: [
        ...current.particularLegacies,
        createSuccessionParticularLegacyEntry(defaultBeneficiaryRef),
      ],
    })));
  }, [getFirstTestamentBeneficiaryRef, setDispositionsDraft]);

  const updateDispositionsParticularLegacy = useCallback((
    side: SuccessionPrimarySide,
    legacyId: string,
    field: 'beneficiaryRef' | 'amount' | 'label',
    value: string | number | SuccessionBeneficiaryRef | null,
  ) => {
    setDispositionsDraft((prev) => updateDraftTestament(prev, side, (current) => ({
      ...current,
      particularLegacies: current.particularLegacies.map((entry) => {
        if (entry.id !== legacyId) return entry;
        if (field === 'beneficiaryRef') {
          return {
            ...entry,
            beneficiaryRef: typeof value === 'string' && value.length > 0 ? value as SuccessionBeneficiaryRef : null,
          };
        }
        if (field === 'amount') {
          return {
            ...entry,
            amount: Math.max(0, Number(value) || 0),
          };
        }
        return {
          ...entry,
          label: typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined,
        };
      }),
    })));
  }, [setDispositionsDraft]);

  const removeDispositionsParticularLegacy = useCallback((side: SuccessionPrimarySide, legacyId: string) => {
    setDispositionsDraft((prev) => updateDraftTestament(prev, side, (current) => ({
      ...current,
      particularLegacies: current.particularLegacies.filter((entry) => entry.id !== legacyId),
    })));
  }, [setDispositionsDraft]);

  const openDispositionsModal = useCallback(() => {
    if (!canOpenDispositionsModal) return;
    setDispositionsDraft({
      attributionBiensCommunsPct: patrimonialContext.attributionBiensCommunsPct,
      donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
      donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
      stipulationContraireCU: patrimonialContext.stipulationContraireCU,
      societeAcquets: cloneSuccessionSocieteAcquetsConfig(patrimonialContext.societeAcquets),
      participationAcquets: cloneSuccessionParticipationAcquetsConfig(patrimonialContext.participationAcquets),
      preciputMode: patrimonialContext.preciputMode,
      preciputSelections: cloneSuccessionPreciputSelections(patrimonialContext.preciputSelections),
      interMassClaims: cloneSuccessionInterMassClaims(patrimonialContext.interMassClaims),
      preciputMontant: patrimonialContext.preciputMontant,
      attributionIntegrale: patrimonialContext.attributionIntegrale,
      choixLegalConjointSansDDV: devolutionContext.choixLegalConjointSansDDV,
      testamentsBySide: cloneSuccessionTestamentsBySide(devolutionContext.testamentsBySide),
      ascendantsSurvivantsBySide: cloneAscendantsSurvivantsBySide(devolutionContext.ascendantsSurvivantsBySide),
    });
    setShowDispositionsModal(true);
  }, [
    canOpenDispositionsModal,
    devolutionContext,
    patrimonialContext,
    setDispositionsDraft,
    setShowDispositionsModal,
  ]);

  const validateDispositionsModal = useCallback(() => {
    setPatrimonialContext((prev) => ({
      ...prev,
      attributionBiensCommunsPct: dispositionsDraft.attributionBiensCommunsPct,
      donationEntreEpouxActive: dispositionsDraft.donationEntreEpouxActive,
      donationEntreEpouxOption: dispositionsDraft.donationEntreEpouxOption,
      stipulationContraireCU: dispositionsDraft.stipulationContraireCU,
      societeAcquets: cloneSuccessionSocieteAcquetsConfig(dispositionsDraft.societeAcquets),
      participationAcquets: cloneSuccessionParticipationAcquetsConfig(dispositionsDraft.participationAcquets),
      preciputMode: dispositionsDraft.preciputMode,
      preciputSelections: cloneSuccessionPreciputSelections(dispositionsDraft.preciputSelections),
      interMassClaims: cloneSuccessionInterMassClaims(dispositionsDraft.interMassClaims),
      preciputMontant: dispositionsDraft.preciputMontant,
      attributionIntegrale: isSocieteAcquetsRegime
        ? dispositionsDraft.attributionIntegrale
        : dispositionsDraft.attributionBiensCommunsPct === 100,
    }));
    setDevolutionContext((prev) => ({
      ...prev,
      choixLegalConjointSansDDV: dispositionsDraft.choixLegalConjointSansDDV,
      testamentsBySide: cloneSuccessionTestamentsBySide(dispositionsDraft.testamentsBySide),
      ascendantsSurvivantsBySide: cloneAscendantsSurvivantsBySide(dispositionsDraft.ascendantsSurvivantsBySide),
    }));
    setShowDispositionsModal(false);
  }, [
    dispositionsDraft,
    isSocieteAcquetsRegime,
    setDevolutionContext,
    setPatrimonialContext,
    setShowDispositionsModal,
  ]);

  return {
    getFirstTestamentBeneficiaryRef,
    updateDispositionsTestament,
    addDispositionsParticularLegacy,
    updateDispositionsParticularLegacy,
    removeDispositionsParticularLegacy,
    openDispositionsModal,
    validateDispositionsModal,
  };
}
