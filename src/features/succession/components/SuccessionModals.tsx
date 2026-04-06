import { type Dispatch, type SetStateAction } from 'react';
import AddFamilyMemberModal from './AddFamilyMemberModal';
import AssuranceVieModal from './AssuranceVieModal';
import DispositionsModal from './DispositionsModal';
import PerModal from './PerModal';
import PrevoyanceModal from './PrevoyanceModal';
import type { useSuccessionDerivedValues } from '../hooks/useSuccessionDerivedValues';
import type {
  FamilyMember,
  SituationMatrimoniale,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionBeneficiaryRef,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from '../successionDraft';
import type {
  AddFamilyMemberFormState,
  DispositionsDraftState,
} from '../successionSimulator.helpers';

type SuccessionDerivedValues = ReturnType<typeof useSuccessionDerivedValues>;

interface SuccessionModalsProps {
  derived: SuccessionDerivedValues;
  civilSituation: SituationMatrimoniale;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  assetEntries: SuccessionAssetDetailEntry[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  showDispositionsModal: boolean;
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  showAssuranceVieModal: boolean;
  assuranceVieDraft: SuccessionAssuranceVieEntry | null;
  showPerModal: boolean;
  perDraft: SuccessionPerEntry | null;
  showPrevoyanceModal: boolean;
  prevoyanceDraft: SuccessionPrevoyanceDecesEntry | null;
  showAddMemberPanel: boolean;
  addMemberForm: AddFamilyMemberFormState;
  setAddMemberForm: Dispatch<SetStateAction<AddFamilyMemberFormState>>;
  onUpdateDispositionsTestament: (
    _side: SuccessionPrimarySide,
    _updater: (_current: SuccessionTestamentConfig) => SuccessionTestamentConfig,
  ) => void;
  onGetFirstTestamentBeneficiaryRef: (_side: SuccessionPrimarySide) => SuccessionBeneficiaryRef | null;
  onAddParticularLegacy: (_side: SuccessionPrimarySide) => void;
  onUpdateParticularLegacy: (
    _side: SuccessionPrimarySide,
    _legacyId: string,
    _field: 'beneficiaryRef' | 'amount' | 'label',
    _value: string | number | SuccessionBeneficiaryRef | null,
  ) => void;
  onRemoveParticularLegacy: (_side: SuccessionPrimarySide, _legacyId: string) => void;
  onCloseDispositions: () => void;
  onValidateDispositions: () => void;
  onCloseAssuranceVie: () => void;
  onValidateAssuranceVie: () => void;
  onUpdateAssuranceVieContract: (
    _field: keyof SuccessionAssuranceVieEntry,
    _value: string | number | undefined,
  ) => void;
  onClosePer: () => void;
  onValidatePer: () => void;
  onUpdatePerContract: (
    _field: keyof SuccessionPerEntry,
    _value: string | number | undefined,
  ) => void;
  onClosePrevoyance: () => void;
  onValidatePrevoyance: () => void;
  onUpdatePrevoyanceContract: (_field: keyof SuccessionPrevoyanceDecesEntry, _value: string | number) => void;
  onCloseAddMemberPanel: () => void;
  onValidateAddMember: () => void;
}

export function SuccessionModals({
  derived,
  civilSituation,
  enfantsContext,
  familyMembers,
  assetEntries,
  groupementFoncierEntries,
  showDispositionsModal,
  dispositionsDraft,
  setDispositionsDraft,
  showAssuranceVieModal,
  assuranceVieDraft,
  showPerModal,
  perDraft,
  showPrevoyanceModal,
  prevoyanceDraft,
  showAddMemberPanel,
  addMemberForm,
  setAddMemberForm,
  onUpdateDispositionsTestament,
  onGetFirstTestamentBeneficiaryRef,
  onAddParticularLegacy,
  onUpdateParticularLegacy,
  onRemoveParticularLegacy,
  onCloseDispositions,
  onValidateDispositions,
  onCloseAssuranceVie,
  onValidateAssuranceVie,
  onUpdateAssuranceVieContract,
  onClosePer,
  onValidatePer,
  onUpdatePerContract,
  onClosePrevoyance,
  onValidatePrevoyance,
  onUpdatePrevoyanceContract,
  onCloseAddMemberPanel,
  onValidateAddMember,
}: SuccessionModalsProps) {
  return (
    <>
      {showDispositionsModal && (
        <DispositionsModal
          dispositionsDraft={dispositionsDraft}
          setDispositionsDraft={setDispositionsDraft}
          testamentSides={derived.testamentSides}
          testamentBeneficiaryOptionsBySide={derived.testamentBeneficiaryOptionsBySide}
          descendantBranchesBySide={derived.descendantBranchesBySide}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
          assetEntries={assetEntries}
          groupementFoncierEntries={groupementFoncierEntries}
          assetPocketOptions={derived.assetPocketOptions}
          civilSituation={civilSituation}
          showSharedTransmissionPct={derived.showSharedTransmissionPct}
          isPacsIndivision={derived.isPacsIndivision}
          showDonationEntreEpoux={derived.showDonationEntreEpoux}
          nbDescendantBranches={derived.nbDescendantBranches}
          nbEnfantsNonCommuns={derived.nbEnfantsNonCommuns}
          isCommunityRegime={derived.isCommunityRegime}
          isSocieteAcquetsRegime={derived.isSocieteAcquetsRegime}
          isParticipationAcquetsRegime={derived.isParticipationAcquetsRegime}
          isCommunauteUniverselleRegime={derived.isCommunauteUniverselleRegime}
          isCommunauteMeublesAcquetsRegime={derived.isCommunauteMeublesAcquetsRegime}
          updateDispositionsTestament={onUpdateDispositionsTestament}
          getFirstTestamentBeneficiaryRef={onGetFirstTestamentBeneficiaryRef}
          onAddParticularLegacy={onAddParticularLegacy}
          onUpdateParticularLegacy={onUpdateParticularLegacy}
          onRemoveParticularLegacy={onRemoveParticularLegacy}
          onClose={onCloseDispositions}
          onValidate={onValidateDispositions}
        />
      )}

      {showAssuranceVieModal && assuranceVieDraft && (
        <AssuranceVieModal
          entry={assuranceVieDraft}
          assuranceViePartyOptions={derived.assuranceViePartyOptions}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
          isMarried={derived.isMarried}
          isPacsed={derived.isPacsed}
          onClose={onCloseAssuranceVie}
          onValidate={onValidateAssuranceVie}
          onUpdate={onUpdateAssuranceVieContract}
        />
      )}

      {showPerModal && perDraft && (
        <PerModal
          entry={perDraft}
          assuranceViePartyOptions={derived.assuranceViePartyOptions}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
          isMarried={derived.isMarried}
          isPacsed={derived.isPacsed}
          onClose={onClosePer}
          onValidate={onValidatePer}
          onUpdate={onUpdatePerContract}
        />
      )}

      {showPrevoyanceModal && prevoyanceDraft && (
        <PrevoyanceModal
          entry={prevoyanceDraft}
          partyOptions={derived.assuranceViePartyOptions}
          clauseOptions={derived.prevoyanceClauseOptions}
          regimeLabel={derived.prevoyanceRegimeByEntry[prevoyanceDraft.id]?.regimeLabel ?? '—'}
          regimeWarning={derived.prevoyanceRegimeByEntry[prevoyanceDraft.id]?.warning}
          onClose={onClosePrevoyance}
          onValidate={onValidatePrevoyance}
          onUpdate={onUpdatePrevoyanceContract}
        />
      )}

      {showAddMemberPanel && (
        <AddFamilyMemberModal
          form={addMemberForm}
          setForm={setAddMemberForm}
          branchOptions={derived.branchOptions}
          enfantsContext={enfantsContext}
          onClose={onCloseAddMemberPanel}
          onValidate={onValidateAddMember}
        />
      )}
    </>
  );
}
