import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { SimModalShell } from '@/components/ui/sim';
import type {
  FamilyMember,
  SituationMatrimoniale,
  SuccessionAssetPocket,
  SuccessionAssetDetailEntry,
  SuccessionBeneficiaryRef,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from '../successionDraft';
import type { SuccessionTestamentBeneficiaryOption } from '../successionTestament';
import {
  buildSuccessionPreciputCandidates,
  createSuccessionPreciputSelection,
  getSuccessionPreciputEligiblePocket,
  syncSuccessionPreciputSelections,
} from '../successionPreciput';
import {
  createInterMassClaimId,
  type DispositionsDraftState,
} from '../successionSimulator.helpers';
import type { ScSelectOption } from './ScSelect';
import { DispositionsCommonSection } from './DispositionsCommonSection';
import { DispositionsTestamentSection } from './DispositionsTestamentSection';

function formatPreciputAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

interface DispositionsModalProps {
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  testamentSides: SuccessionPrimarySide[];
  testamentBeneficiaryOptionsBySide: Record<
    SuccessionPrimarySide,
    SuccessionTestamentBeneficiaryOption[]
  >;
  descendantBranchesBySide: Record<SuccessionPrimarySide, number>;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  assetEntries: SuccessionAssetDetailEntry[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  assetPocketOptions: { value: SuccessionAssetPocket; label: string }[];
  civilSituation: SituationMatrimoniale;
  showSharedTransmissionPct: boolean;
  isPacsIndivision: boolean;
  showDonationEntreEpoux: boolean;
  nbDescendantBranches: number;
  nbEnfantsNonCommuns: number;
  isCommunityRegime: boolean;
  isSocieteAcquetsRegime: boolean;
  isParticipationAcquetsRegime: boolean;
  isCommunauteUniverselleRegime: boolean;
  isCommunauteMeublesAcquetsRegime: boolean;
  updateDispositionsTestament: (
    side: SuccessionPrimarySide,
    updater: (current: SuccessionTestamentConfig) => SuccessionTestamentConfig,
  ) => void;
  getFirstTestamentBeneficiaryRef: (side: SuccessionPrimarySide) => SuccessionBeneficiaryRef | null;
  onAddParticularLegacy: (side: SuccessionPrimarySide) => void;
  onUpdateParticularLegacy: (
    side: SuccessionPrimarySide,
    legacyId: string,
    field: 'beneficiaryRef' | 'amount' | 'label',
    value: string | number | SuccessionBeneficiaryRef | null,
  ) => void;
  onRemoveParticularLegacy: (side: SuccessionPrimarySide, legacyId: string) => void;
  onClose: () => void;
  onValidate: () => void;
}

export default function DispositionsModal({
  dispositionsDraft,
  setDispositionsDraft,
  testamentSides,
  testamentBeneficiaryOptionsBySide,
  descendantBranchesBySide,
  enfantsContext,
  familyMembers,
  assetEntries,
  groupementFoncierEntries,
  assetPocketOptions,
  civilSituation,
  showSharedTransmissionPct,
  isPacsIndivision,
  showDonationEntreEpoux,
  nbDescendantBranches,
  nbEnfantsNonCommuns,
  isCommunityRegime,
  isSocieteAcquetsRegime,
  isParticipationAcquetsRegime,
  isCommunauteUniverselleRegime,
  isCommunauteMeublesAcquetsRegime,
  updateDispositionsTestament,
  getFirstTestamentBeneficiaryRef,
  onAddParticularLegacy,
  onUpdateParticularLegacy,
  onRemoveParticularLegacy,
  onClose,
  onValidate,
}: DispositionsModalProps) {
  const [pendingPreciputCandidateKey, setPendingPreciputCandidateKey] = useState('');

  const preciputEligiblePocket = useMemo(() => getSuccessionPreciputEligiblePocket({
    isCommunityRegime,
    isSocieteAcquetsRegime: isSocieteAcquetsRegime && dispositionsDraft.societeAcquets.active,
  }), [dispositionsDraft.societeAcquets.active, isCommunityRegime, isSocieteAcquetsRegime]);

  const preciputCandidates = useMemo(() => buildSuccessionPreciputCandidates({
    assetEntries,
    groupementFoncierEntries,
    allowedPocket: preciputEligiblePocket,
  }), [assetEntries, groupementFoncierEntries, preciputEligiblePocket]);

  const syncedPreciputSelections = useMemo(
    () => syncSuccessionPreciputSelections(dispositionsDraft.preciputSelections, preciputCandidates),
    [dispositionsDraft.preciputSelections, preciputCandidates],
  );

  const preciputCandidatesByKey = useMemo(
    () => new Map(preciputCandidates.map((candidate) => [candidate.key, candidate])),
    [preciputCandidates],
  );

  const selectedPreciputCandidateKeys = useMemo(
    () => new Set(syncedPreciputSelections.map((selection) => `${selection.sourceType}:${selection.sourceId}`)),
    [syncedPreciputSelections],
  );

  const preciputCandidateOptions = useMemo<ScSelectOption[]>(() => [
    { value: '', label: 'Choisir un bien...', disabled: true },
    ...preciputCandidates
      .filter((candidate) => !selectedPreciputCandidateKeys.has(candidate.key))
      .map((candidate) => ({
        value: candidate.key,
        label: candidate.label,
        description: `Disponible jusqu'à ${formatPreciputAmount(candidate.maxAmount)}`,
      })),
  ], [preciputCandidates, selectedPreciputCandidateKeys]);

  const preciputScopeLabel = preciputEligiblePocket === 'societe_acquets'
    ? "la société d'acquets"
    : 'la communauté';

  const updatePreciputSelections = (
    updater: (
      current: DispositionsDraftState['preciputSelections'],
    ) => DispositionsDraftState['preciputSelections'],
  ) => {
    setDispositionsDraft((prev) => ({
      ...prev,
      preciputSelections: updater(
        syncSuccessionPreciputSelections(prev.preciputSelections, preciputCandidates),
      ),
    }));
  };

  const addPreciputSelection = (candidateKey: string) => {
    const candidate = preciputCandidatesByKey.get(candidateKey);
    if (!candidate) return;

    updatePreciputSelections((current) => [
      ...current,
      createSuccessionPreciputSelection(candidate),
    ]);
    setPendingPreciputCandidateKey('');
  };

  const updatePreciputSelection = (
    selectionId: string,
    field: 'enabled' | 'amount',
    value: boolean | number,
  ) => {
    updatePreciputSelections((current) => current.map((selection) => {
      if (selection.id !== selectionId) return selection;
      if (field === 'enabled') {
        return {
          ...selection,
          enabled: Boolean(value),
        };
      }

      const candidate = preciputCandidatesByKey.get(`${selection.sourceType}:${selection.sourceId}`);
      const maxAmount = candidate?.maxAmount ?? 0;
      return {
        ...selection,
        amount: Math.min(maxAmount, Math.max(0, Number(value) || 0)),
      };
    }));
  };

  const removePreciputSelection = (selectionId: string) => {
    updatePreciputSelections((current) => current.filter((selection) => selection.id !== selectionId));
  };

  const addInterMassClaim = () => {
    const fromPocket = assetPocketOptions[0]?.value ?? 'epoux1';
    const toPocket = assetPocketOptions[1]?.value ?? assetPocketOptions[0]?.value ?? 'epoux2';

    setDispositionsDraft((prev) => ({
      ...prev,
      interMassClaims: [
        ...prev.interMassClaims,
        {
          id: createInterMassClaimId(),
          kind: 'recompense',
          fromPocket,
          toPocket,
          amount: 0,
          enabled: true,
          label: undefined,
        },
      ],
    }));
  };

  const updateInterMassClaim = (
    claimId: string,
    field: 'kind' | 'fromPocket' | 'toPocket' | 'amount' | 'enabled' | 'label',
    value: string | number | boolean,
  ) => {
    setDispositionsDraft((prev) => ({
      ...prev,
      interMassClaims: prev.interMassClaims.map((claim) => {
        if (claim.id !== claimId) return claim;
        if (field === 'amount') {
          return {
            ...claim,
            amount: Math.max(0, Number(value) || 0),
          };
        }
        if (field === 'enabled') {
          return {
            ...claim,
            enabled: Boolean(value),
          };
        }
        if (field === 'label') {
          return {
            ...claim,
            label: typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined,
          };
        }
        return {
          ...claim,
          [field]: value,
        };
      }),
    }));
  };

  const removeInterMassClaim = (claimId: string) => {
    setDispositionsDraft((prev) => ({
      ...prev,
      interMassClaims: prev.interMassClaims.filter((claim) => claim.id !== claimId),
    }));
  };

  return (
    <SimModalShell
      title="Dispositions particulières"
      onClose={onClose}
      closeLabel="Fermer"
      overlayClassName="sc-member-modal-overlay"
      modalClassName="sc-member-modal sc-dispositions-modal"
      headerClassName="sc-member-modal__header"
      titleClassName="sc-member-modal__title"
      bodyClassName="sc-member-modal__body sc-dispositions-modal__body"
      footerClassName="sc-member-modal__footer"
      closeClassName="sc-member-modal__close"
      footer={(
        <>
          <button
            type="button"
            className="sc-member-modal__btn sc-member-modal__btn--secondary"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="button"
            className="sc-member-modal__btn sc-member-modal__btn--primary"
            onClick={onValidate}
          >
            Valider
          </button>
        </>
      )}
    >
      <DispositionsCommonSection
        dispositionsDraft={dispositionsDraft}
        setDispositionsDraft={setDispositionsDraft}
        showSharedTransmissionPct={showSharedTransmissionPct}
        isPacsIndivision={isPacsIndivision}
        showDonationEntreEpoux={showDonationEntreEpoux}
        nbDescendantBranches={nbDescendantBranches}
        nbEnfantsNonCommuns={nbEnfantsNonCommuns}
        isCommunityRegime={isCommunityRegime}
        isSocieteAcquetsRegime={isSocieteAcquetsRegime}
        isParticipationAcquetsRegime={isParticipationAcquetsRegime}
        isCommunauteUniverselleRegime={isCommunauteUniverselleRegime}
        isCommunauteMeublesAcquetsRegime={isCommunauteMeublesAcquetsRegime}
        interMassClaimPocketOptions={assetPocketOptions}
        onAddInterMassClaim={addInterMassClaim}
        onUpdateInterMassClaim={updateInterMassClaim}
        onRemoveInterMassClaim={removeInterMassClaim}
        preciputConfiguratorProps={{
          dispositionsDraft,
          setDispositionsDraft,
          pendingPreciputCandidateKey,
          setPendingPreciputCandidateKey,
          preciputCandidateOptions,
          preciputCandidatesByKey,
          preciputScopeLabel,
          syncedPreciputSelections,
          onAddPreciputSelection: addPreciputSelection,
          onUpdatePreciputSelection: updatePreciputSelection,
          onRemovePreciputSelection: removePreciputSelection,
        }}
      />

      <DispositionsTestamentSection
        dispositionsDraft={dispositionsDraft}
        setDispositionsDraft={setDispositionsDraft}
        testamentSides={testamentSides}
        testamentBeneficiaryOptionsBySide={testamentBeneficiaryOptionsBySide}
        descendantBranchesBySide={descendantBranchesBySide}
        enfantsContext={enfantsContext}
        familyMembers={familyMembers}
        civilSituation={civilSituation}
        updateDispositionsTestament={updateDispositionsTestament}
        getFirstTestamentBeneficiaryRef={getFirstTestamentBeneficiaryRef}
        onAddParticularLegacy={onAddParticularLegacy}
        onUpdateParticularLegacy={onUpdateParticularLegacy}
        onRemoveParticularLegacy={onRemoveParticularLegacy}
      />
    </SimModalShell>
  );
}
