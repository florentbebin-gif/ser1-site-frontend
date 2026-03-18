import type { Dispatch, SetStateAction } from 'react';
import ScAssetsPassifsCard from './ScAssetsPassifsCard';
import ScDeathTimelinePanel from './ScDeathTimelinePanel';
import ScDonationsCard from './ScDonationsCard';
import ScFamilyContextCard from './ScFamilyContextCard';
import ScSuccessionSummaryPanel from './ScSuccessionSummaryPanel';
import AddFamilyMemberModal from './AddFamilyMemberModal';
import AssuranceVieModal from './AssuranceVieModal';
import DispositionsModal from './DispositionsModal';
import PerModal from './PerModal';
import { FiliationOrgchart } from './FiliationOrgchart';
import type { useSuccessionDerivedValues } from '../useSuccessionDerivedValues';
import type { SuccessionFiscalSnapshot } from '../successionFiscalContext';
import type {
  SituationMatrimoniale,
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
  SuccessionAssetOwner,
  SuccessionBeneficiaryRef,
  SuccessionDonationEntry,
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from '../successionDraft';
import type { DEFAULT_SUCCESSION_CIVIL_CONTEXT } from '../successionDraft';
import type {
  AddFamilyMemberFormState,
  DispositionsDraftState,
} from '../successionSimulator.helpers';

type SuccessionDerivedValues = ReturnType<typeof useSuccessionDerivedValues>;

interface SuccessionPageGridProps {
  derived: SuccessionDerivedValues;
  isExpert: boolean;
  civilContext: typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  donationsContext: SuccessionDonationEntry[];
  chainOrder: 'epoux1' | 'epoux2';
  onToggleChainOrder: () => void;
  onSituationChange: (_value: SituationMatrimoniale) => void;
  setCivilContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT>>;
  onOpenDispositions: () => void;
  onAddEnfant: () => void;
  onToggleAddMemberPanel: () => void;
  onUpdateEnfantRattachement: (_id: string, _value: 'commun' | 'epoux1' | 'epoux2') => void;
  onToggleEnfantDeceased: (_id: string, _deceased: boolean) => void;
  onRemoveEnfant: (_id: string) => void;
  onRemoveFamilyMember: (_memberId: string) => void;
  onAddAssetEntry: (_category: SuccessionAssetCategory) => void;
  onUpdateAssetEntry: (_entryId: string, _field: keyof SuccessionAssetDetailEntry, _value: string | number) => void;
  onRemoveAssetEntry: (_entryId: string) => void;
  onOpenAssuranceVieModal: () => void;
  onOpenPerModal: () => void;
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  onAddGroupementFoncierEntry: () => void;
  onUpdateGroupementFoncierEntry: (_id: string, _field: string, _value: string | number) => void;
  onRemoveGroupementFoncierEntry: (_id: string) => void;
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  onAddPrevoyanceDecesEntry: () => void;
  onUpdatePrevoyanceDecesEntry: (_id: string, _field: string, _value: string | number) => void;
  onRemovePrevoyanceDecesEntry: (_id: string) => void;
  onSetSimplifiedBalanceField: (_type: 'actifs' | 'passifs', _owner: SuccessionAssetOwner, _value: number) => void;
  onAddDonationEntry: () => void;
  onUpdateDonationEntry: (_entryId: string, _field: keyof SuccessionDonationEntry, _value: string | number | boolean) => void;
  onRemoveDonationEntry: (_entryId: string) => void;
  forfaitMobilierMode: 'auto' | 'pct' | 'montant';
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  abattementResidencePrincipale: boolean;
  decesDansXAns: 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50;
  onUpdatePatrimonialField: <K extends string>(_field: K, _value: unknown) => void;
}

interface SuccessionHypothesesProps {
  hypothesesOpen: boolean;
  attentions: string[];
  fiscalSnapshot: SuccessionFiscalSnapshot;
  onToggle: () => void;
}

interface SuccessionModalsProps {
  derived: SuccessionDerivedValues;
  civilSituation: SituationMatrimoniale;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  showDispositionsModal: boolean;
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  showAssuranceVieModal: boolean;
  assuranceVieDraft: SuccessionAssuranceVieEntry[];
  showPerModal: boolean;
  perDraft: SuccessionPerEntry[];
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
  onAddAssuranceVieContract: () => void;
  onRemoveAssuranceVieContract: (_contractId: string) => void;
  onUpdateAssuranceVieContract: (
    _contractId: string,
    _field: keyof SuccessionAssuranceVieEntry,
    _value: string | number | undefined,
  ) => void;
  onClosePer: () => void;
  onValidatePer: () => void;
  onAddPerContract: () => void;
  onRemovePerContract: (_contractId: string) => void;
  onUpdatePerContract: (
    _contractId: string,
    _field: keyof SuccessionPerEntry,
    _value: string | number | undefined,
  ) => void;
  onCloseAddMemberPanel: () => void;
  onValidateAddMember: () => void;
}

export function SuccessionPageGrid({
  derived,
  isExpert,
  civilContext,
  enfantsContext,
  familyMembers,
  assuranceVieEntries,
  perEntries,
  donationsContext,
  chainOrder,
  onToggleChainOrder,
  onSituationChange,
  setCivilContext,
  onOpenDispositions,
  onAddEnfant,
  onToggleAddMemberPanel,
  onUpdateEnfantRattachement,
  onToggleEnfantDeceased,
  onRemoveEnfant,
  onRemoveFamilyMember,
  onAddAssetEntry,
  onUpdateAssetEntry,
  onRemoveAssetEntry,
  onOpenAssuranceVieModal,
  onOpenPerModal,
  groupementFoncierEntries,
  onAddGroupementFoncierEntry,
  onUpdateGroupementFoncierEntry,
  onRemoveGroupementFoncierEntry,
  prevoyanceDecesEntries,
  onAddPrevoyanceDecesEntry,
  onUpdatePrevoyanceDecesEntry,
  onRemovePrevoyanceDecesEntry,
  onSetSimplifiedBalanceField,
  onAddDonationEntry,
  onUpdateDonationEntry,
  onRemoveDonationEntry,
  forfaitMobilierMode,
  forfaitMobilierPct,
  forfaitMobilierMontant,
  abattementResidencePrincipale,
  decesDansXAns,
  onUpdatePatrimonialField,
}: SuccessionPageGridProps) {
  return (
    <div className="sc-grid">
      <div className="sc-left">
        <ScFamilyContextCard
          civilContext={civilContext}
          birthDateLabels={derived.birthDateLabels}
          showSecondBirthDate={derived.showSecondBirthDate}
          canOpenDispositionsModal={derived.canOpenDispositionsModal}
          enfantRattachementOptions={derived.enfantRattachementOptions}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
          onSituationChange={onSituationChange}
          setCivilContext={setCivilContext}
          onOpenDispositions={onOpenDispositions}
          onAddEnfant={onAddEnfant}
          onToggleAddMemberPanel={onToggleAddMemberPanel}
          onUpdateEnfantRattachement={onUpdateEnfantRattachement}
          onToggleEnfantDeceased={onToggleEnfantDeceased}
          onRemoveEnfant={onRemoveEnfant}
          onRemoveFamilyMember={onRemoveFamilyMember}
        />

        <ScAssetsPassifsCard
          isExpert={isExpert}
          isMarried={derived.isMarried}
          isPacsed={derived.isPacsed}
          isConcubinage={derived.isConcubinage}
          assetEntriesByCategory={derived.assetEntriesByCategory}
          assetOwnerOptions={derived.assetOwnerOptions}
          assetBreakdown={derived.assetBreakdown}
          assetNetTotals={derived.assetNetTotals}
          forfaitMobilierComputed={derived.forfaitMobilierComputed}
          residencePrincipaleEntryId={derived.residencePrincipaleEntryId}
          assuranceVieEntries={assuranceVieEntries}
          perEntries={perEntries}
          assuranceViePartyOptions={derived.assuranceViePartyOptions}
          onAddAssetEntry={onAddAssetEntry}
          onUpdateAssetEntry={onUpdateAssetEntry}
          onRemoveAssetEntry={onRemoveAssetEntry}
          onOpenAssuranceVieModal={onOpenAssuranceVieModal}
          onOpenPerModal={onOpenPerModal}
          groupementFoncierEntries={groupementFoncierEntries}
          onAddGroupementFoncierEntry={onAddGroupementFoncierEntry}
          onUpdateGroupementFoncierEntry={onUpdateGroupementFoncierEntry}
          onRemoveGroupementFoncierEntry={onRemoveGroupementFoncierEntry}
          prevoyanceDecesEntries={prevoyanceDecesEntries}
          prevoyanceClauseOptions={derived.prevoyanceClauseOptions}
          onAddPrevoyanceDecesEntry={onAddPrevoyanceDecesEntry}
          onUpdatePrevoyanceDecesEntry={onUpdatePrevoyanceDecesEntry}
          onRemovePrevoyanceDecesEntry={onRemovePrevoyanceDecesEntry}
          onSetSimplifiedBalanceField={onSetSimplifiedBalanceField}
          forfaitMobilierMode={forfaitMobilierMode}
          forfaitMobilierPct={forfaitMobilierPct}
          forfaitMobilierMontant={forfaitMobilierMontant}
          abattementResidencePrincipale={abattementResidencePrincipale}
          onUpdatePatrimonialField={onUpdatePatrimonialField}
        />

        {isExpert && (
          <ScDonationsCard
            donationsContext={donationsContext}
            donationTotals={derived.donationTotals}
            donateurOptions={derived.donateurOptions}
            donatairesOptions={derived.donatairesOptions}
            onAddDonationEntry={onAddDonationEntry}
            onUpdateDonationEntry={onUpdateDonationEntry}
            onRemoveDonationEntry={onRemoveDonationEntry}
          />
        )}
      </div>

      <div className="sc-right">
        <FiliationOrgchart
          civilContext={civilContext}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
        />

        <ScSuccessionSummaryPanel
          displayUsesChainage={derived.displayUsesChainage}
          derivedTotalDroits={derived.derivedTotalDroits}
          synthDonutTransmis={derived.synthDonutTransmis}
          derivedMasseTransmise={derived.derivedMasseTransmise}
          transmissionRows={derived.transmissionRows}
          synthHypothese={derived.synthHypothese}
          isPacsed={derived.isPacsed}
          chainageAnalysis={{
            order: derived.chainageAnalysis.order,
            step1: derived.chainageAnalysis.step1
              ? { droitsEnfants: derived.chainageAnalysis.step1.droitsEnfants }
              : null,
            step2: derived.chainageAnalysis.step2
              ? { droitsEnfants: derived.chainageAnalysis.step2.droitsEnfants }
              : null,
          }}
          avFiscalByAssure={derived.avFiscalAnalysis.byAssure}
          perFiscalByAssure={derived.perFiscalAnalysis.byAssure}
          prevoyanceFiscalByAssure={derived.prevoyanceFiscalAnalysis.byAssure}
          prevoyanceBeneficiaryLines={derived.displayUsesChainage
            ? derived.prevoyanceFiscalAnalysis.lines
            : derived.prevoyanceFiscalAnalysis.byAssure[derived.directDisplayAnalysis.simulatedDeceased].lines}
          directDisplay={{
            simulatedDeceased: derived.directDisplayAnalysis.simulatedDeceased,
            result: derived.directDisplayAnalysis.result
              ? { totalDroits: derived.directDisplayAnalysis.result.totalDroits }
              : null,
          }}
        />

        <ScDeathTimelinePanel
          chainOrder={chainOrder}
          onToggleOrder={onToggleChainOrder}
          displayUsesChainage={derived.displayUsesChainage}
          derivedMasseTransmise={derived.derivedMasseTransmise}
          derivedTotalDroits={derived.derivedTotalDroits}
          isPacsed={derived.isPacsed}
          showDeathHorizonControl={isExpert}
          decesDansXAns={decesDansXAns}
          onChangeDecesDansXAns={(value) => onUpdatePatrimonialField('decesDansXAns', value)}
          chainageAnalysis={{
            order: derived.chainageAnalysis.order,
            firstDecedeLabel: derived.chainageAnalysis.firstDecedeLabel,
            secondDecedeLabel: derived.chainageAnalysis.secondDecedeLabel,
            step1: derived.chainageAnalysis.step1
              ? {
                actifTransmis: derived.chainageAnalysis.step1.actifTransmis,
                droitsEnfants: derived.chainageAnalysis.step1.droitsEnfants,
              }
              : null,
            step2: derived.chainageAnalysis.step2
              ? {
                actifTransmis: derived.chainageAnalysis.step2.actifTransmis,
                droitsEnfants: derived.chainageAnalysis.step2.droitsEnfants,
              }
              : null,
          }}
          assuranceVieByAssure={derived.assuranceVieByAssure}
          avFiscalByAssure={derived.avFiscalAnalysis.byAssure}
          perByAssure={derived.perByAssure}
          perFiscalByAssure={derived.perFiscalAnalysis.byAssure}
          prevoyanceByAssure={derived.prevoyanceByAssure}
          prevoyanceFiscalByAssure={derived.prevoyanceFiscalAnalysis.byAssure}
          directDisplay={{
            simulatedDeceased: derived.directDisplayAnalysis.simulatedDeceased,
            result: derived.directDisplayAnalysis.result
              ? { totalDroits: derived.directDisplayAnalysis.result.totalDroits }
              : null,
          }}
        />
      </div>
    </div>
  );
}

export function SuccessionHypotheses({
  hypothesesOpen,
  attentions,
  fiscalSnapshot,
  onToggle,
}: SuccessionHypothesesProps) {
  return (
    <div className="sc-hypotheses">
      <button
        type="button"
        className="sc-hypotheses__toggle"
        onClick={onToggle}
        aria-expanded={hypothesesOpen}
        data-testid="succession-hypotheses-toggle"
      >
        <span className="sc-hypotheses__title">Hypothèses et limites</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`sc-hypotheses__chevron${hypothesesOpen ? ' is-open' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {hypothesesOpen && (
        <ul>
          {attentions.map((warning, index) => (
            <li key={`att-${index}`}>{warning}</li>
          ))}
          <li>Barèmes DMTG et abattements appliqués depuis les paramètres de l&apos;application.</li>
          <li>
            Paramètres transmis au module:
            rappel fiscal donations {fiscalSnapshot.donation.rappelFiscalAnnees} ans,
            AV décès 990 I {fiscalSnapshot.avDeces.primesApres1998.allowancePerBeneficiary} / bénéficiaire,
            AV décès après {fiscalSnapshot.avDeces.agePivotPrimes} ans {fiscalSnapshot.avDeces.apres70ans.globalAllowance} (global).
          </li>
          <li>La lecture civile repose sur le contexte familial, les masses patrimoniales saisies et les dispositions déclarées.</li>
          <li>Les capitaux décès d&apos;assurance-vie et de PER assurance sont ventilés par bénéficiaire à partir des clauses saisies, avec une lecture simplifiée des régimes 990 I / 757 B.</li>
          <li>L&apos;horizon de décès simulé s&apos;applique aux valorisations dépendant de la date du décès, sans décalage calendaire distinct entre le 1er et le 2e décès.</li>
          <li>La chronologie 2 décès repose sur un chaînage simplifié avec warnings sur les cas non couverts.</li>
          <li>La dévolution légale est présentée en lecture civile simplifiée, sans gestion exhaustive des ordres successoraux.</li>
          <li>Les libéralités et avantages matrimoniaux sont qualifiés de façon indicative, sans recalcul automatique des droits dans ce module.</li>
          <li>L&apos;intégration chiffrée fine (rapport civil détaillé, réduction, liquidation notariale) n&apos;est pas encore modélisée.</li>
          <li>Résultat indicatif, à confirmer par une analyse patrimoniale et notariale.</li>
        </ul>
      )}
    </div>
  );
}

export function SuccessionModals({
  derived,
  civilSituation,
  enfantsContext,
  familyMembers,
  showDispositionsModal,
  dispositionsDraft,
  setDispositionsDraft,
  showAssuranceVieModal,
  assuranceVieDraft,
  showPerModal,
  perDraft,
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
  onAddAssuranceVieContract,
  onRemoveAssuranceVieContract,
  onUpdateAssuranceVieContract,
  onClosePer,
  onValidatePer,
  onAddPerContract,
  onRemovePerContract,
  onUpdatePerContract,
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
          civilSituation={civilSituation}
          showSharedTransmissionPct={derived.showSharedTransmissionPct}
          isPacsIndivision={derived.isPacsIndivision}
          showDonationEntreEpoux={derived.showDonationEntreEpoux}
          nbDescendantBranches={derived.nbDescendantBranches}
          nbEnfantsNonCommuns={derived.nbEnfantsNonCommuns}
          isCommunityRegime={derived.isCommunityRegime}
          updateDispositionsTestament={onUpdateDispositionsTestament}
          getFirstTestamentBeneficiaryRef={onGetFirstTestamentBeneficiaryRef}
          onAddParticularLegacy={onAddParticularLegacy}
          onUpdateParticularLegacy={onUpdateParticularLegacy}
          onRemoveParticularLegacy={onRemoveParticularLegacy}
          onClose={onCloseDispositions}
          onValidate={onValidateDispositions}
        />
      )}

      {showAssuranceVieModal && (
        <AssuranceVieModal
          assuranceVieDraft={assuranceVieDraft}
          assuranceVieDraftTotals={derived.assuranceVieDraftTotals}
          assuranceViePartyOptions={derived.assuranceViePartyOptions}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
          isMarried={derived.isMarried}
          isPacsed={derived.isPacsed}
          onClose={onCloseAssuranceVie}
          onValidate={onValidateAssuranceVie}
          onAddContract={onAddAssuranceVieContract}
          onRemoveContract={onRemoveAssuranceVieContract}
          onUpdateContract={onUpdateAssuranceVieContract}
        />
      )}

      {showPerModal && (
        <PerModal
          perDraft={perDraft}
          perDraftTotals={derived.perDraftTotals}
          assuranceViePartyOptions={derived.assuranceViePartyOptions}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
          isMarried={derived.isMarried}
          isPacsed={derived.isPacsed}
          onClose={onClosePer}
          onValidate={onValidatePer}
          onAddContract={onAddPerContract}
          onRemoveContract={onRemovePerContract}
          onUpdateContract={onUpdatePerContract}
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
