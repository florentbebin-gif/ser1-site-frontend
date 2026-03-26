import { type Dispatch, type SetStateAction } from 'react';
import ScAssetsPassifsCard from './ScAssetsPassifsCard';
import ScDeathTimelinePanel from './ScDeathTimelinePanel';
import ScDonationsCard from './ScDonationsCard';
import ScFamilyContextCard from './ScFamilyContextCard';
import ScSuccessionSummaryPanel from './ScSuccessionSummaryPanel';
import { FiliationOrgchart } from './FiliationOrgchart';
import type { useSuccessionDerivedValues } from '../useSuccessionDerivedValues';
import type {
  SituationMatrimoniale,
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
  SuccessionDonationEntry,
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
  SuccessionLegacyAssetOwner,
} from '../successionDraft';
import type { DEFAULT_SUCCESSION_CIVIL_CONTEXT } from '../successionDraft';

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
  onOpenAssuranceVieModal: (_id: string) => void;
  onRemoveAssuranceVieEntry: (_id: string) => void;
  onOpenPerModal: (_id: string) => void;
  onRemovePerEntry: (_id: string) => void;
  onOpenPrevoyanceModal: (_id: string) => void;
  onRemovePrevoyanceDecesEntry: (_id: string) => void;
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  onUpdateGroupementFoncierEntry: (_id: string, _field: string, _value: string | number) => void;
  onRemoveGroupementFoncierEntry: (_id: string) => void;
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  onSetSimplifiedBalanceField: (_type: 'actifs' | 'passifs', _owner: SuccessionLegacyAssetOwner, _value: number) => void;
  onAddDonationEntry: () => void;
  onUpdateDonationEntry: (_entryId: string, _field: keyof SuccessionDonationEntry, _value: string | number | boolean) => void;
  onRemoveDonationEntry: (_entryId: string) => void;
  forfaitMobilierMode: 'off' | 'auto' | 'pct' | 'montant';
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  abattementResidencePrincipale: boolean;
  decesDansXAns: 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50;
  onUpdatePatrimonialField: <K extends string>(_field: K, _value: unknown) => void;
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
  onRemoveAssuranceVieEntry,
  onOpenPerModal,
  onRemovePerEntry,
  onOpenPrevoyanceModal,
  onRemovePrevoyanceDecesEntry,
  groupementFoncierEntries,
  onUpdateGroupementFoncierEntry,
  onRemoveGroupementFoncierEntry,
  prevoyanceDecesEntries,
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
  const shouldRenderComputationSections = derived.shouldRenderSuccessionComputationSections;

  return (
    <>
      <div className="sc-top-row">
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

        <FiliationOrgchart
          civilContext={civilContext}
          enfantsContext={enfantsContext}
          familyMembers={familyMembers}
        />
      </div>

      {shouldRenderComputationSections && (
        <div className="sc-grid">
          <div className="sc-left">
            <ScAssetsPassifsCard
              isExpert={isExpert}
              isMarried={derived.isMarried}
              isPacsed={derived.isPacsed}
              isConcubinage={derived.isConcubinage}
              assetEntriesByCategory={derived.assetEntriesByCategory}
              assetOwnerOptions={derived.assetOwnerOptions}
              assetPocketOptions={derived.assetPocketOptions}
              assetBreakdown={derived.assetBreakdown}
              assetNetTotals={derived.assetNetTotals}
              forfaitMobilierComputed={derived.forfaitMobilierComputed}
              residencePrincipaleEntryId={derived.residencePrincipaleEntryId}
              hasBeneficiaryLevelGfAdjustment={derived.hasBeneficiaryLevelGfAdjustment}
              assuranceVieEntries={assuranceVieEntries}
              perEntries={perEntries}
              assuranceViePartyOptions={derived.assuranceViePartyOptions}
              onAddAssetEntry={onAddAssetEntry}
              onUpdateAssetEntry={onUpdateAssetEntry}
              onRemoveAssetEntry={onRemoveAssetEntry}
              onOpenAssuranceVieModal={onOpenAssuranceVieModal}
              onRemoveAssuranceVieEntry={onRemoveAssuranceVieEntry}
              onOpenPerModal={onOpenPerModal}
              onRemovePerEntry={onRemovePerEntry}
              groupementFoncierEntries={groupementFoncierEntries}
              onUpdateGroupementFoncierEntry={onUpdateGroupementFoncierEntry}
              onRemoveGroupementFoncierEntry={onRemoveGroupementFoncierEntry}
              prevoyanceDecesEntries={prevoyanceDecesEntries}
              onOpenPrevoyanceModal={onOpenPrevoyanceModal}
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
                societeAcquets: derived.chainageAnalysis.societeAcquets
                  ? {
                    totalValue: derived.chainageAnalysis.societeAcquets.totalValue,
                    firstEstateContribution: derived.chainageAnalysis.societeAcquets.firstEstateContribution,
                    survivorShare: derived.chainageAnalysis.societeAcquets.survivorShare,
                    preciputAmount: derived.chainageAnalysis.societeAcquets.preciputAmount,
                    survivorAttributionAmount: derived.chainageAnalysis.societeAcquets.survivorAttributionAmount,
                    liquidationMode: derived.chainageAnalysis.societeAcquets.liquidationMode,
                    deceasedQuotePct: derived.chainageAnalysis.societeAcquets.deceasedQuotePct,
                    survivorQuotePct: derived.chainageAnalysis.societeAcquets.survivorQuotePct,
                    attributionIntegrale: derived.chainageAnalysis.societeAcquets.attributionIntegrale,
                  }
                  : null,
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
              insurance990ILines={derived.insurance990ILines}
              insurance757BLines={derived.insurance757BLines}
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
              showOrderToggle={derived.isMarried || derived.isPacsed || derived.isConcubinage}
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
                societeAcquets: derived.chainageAnalysis.societeAcquets
                  ? {
                    totalValue: derived.chainageAnalysis.societeAcquets.totalValue,
                    firstEstateContribution: derived.chainageAnalysis.societeAcquets.firstEstateContribution,
                    survivorShare: derived.chainageAnalysis.societeAcquets.survivorShare,
                    preciputAmount: derived.chainageAnalysis.societeAcquets.preciputAmount,
                    survivorAttributionAmount: derived.chainageAnalysis.societeAcquets.survivorAttributionAmount,
                    liquidationMode: derived.chainageAnalysis.societeAcquets.liquidationMode,
                    deceasedQuotePct: derived.chainageAnalysis.societeAcquets.deceasedQuotePct,
                    survivorQuotePct: derived.chainageAnalysis.societeAcquets.survivorQuotePct,
                    attributionIntegrale: derived.chainageAnalysis.societeAcquets.attributionIntegrale,
                  }
                  : null,
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
      )}
    </>
  );
}

export { SuccessionHypotheses } from './SuccessionHypotheses';
export { SuccessionModals } from './SuccessionModals';
