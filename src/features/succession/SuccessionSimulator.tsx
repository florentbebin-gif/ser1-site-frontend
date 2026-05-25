/**
 * SuccessionSimulator — Simulateur Succession
 *
 * Périmètre :
 * - Alignement UI sur la norme /sim/*
 * - Saisie guidée civile / patrimoniale
 * - Actifs détaillés expert + assurance-vie informative
 *
 * Décomposition :
 * - Valeurs dérivées  → useSuccessionDerivedValues
 * - Handlers export   → useSuccessionExportHandlers
 */

import { useContext, useEffect, useMemo } from 'react';
import { useSuccessionCalc } from './hooks/useSuccessionCalc';
import { useTheme } from '../../settings/ThemeProvider';
import { useUserMode } from '../../settings/userMode';
import { resolveEffectiveUserMode } from '../../settings/userModeDisplay';
import { SessionGuardContext } from '../../auth';
import { useFiscalContext } from '../../hooks/useFiscalContext';
import { ExportMenu } from '../../components/ExportMenu';
import { ModeToggle } from '../../components/ModeToggle';
import { SimPageShell } from '@/components/ui/sim';
import { storageKeyFor } from '../../utils/reset';
import { resolveSuccessionAssetLocation } from './successionDraft';
import { buildSuccessionFiscalSnapshot } from './successionFiscalContext';
import { useSuccessionDraftPersistence } from './hooks/useSuccessionDraftPersistence';
import { useSuccessionSyncEffects } from './hooks/useSuccessionSyncEffects';
import { useSuccessionDraftState } from './hooks/useSuccessionDraftState';
import { useSuccessionDerivedValues } from './hooks/useSuccessionDerivedValues';
import { useSuccessionDonationPartageHandlers } from './hooks/useSuccessionDonationPartageHandlers';
import { useSuccessionExportHandlers } from './hooks/useSuccessionExportHandlers';
import { useSuccessionSimulatorHandlers } from './hooks/useSuccessionSimulatorHandlers';
import { importPrevoyanceEntriesFromStorage } from './prevoyanceImport';
import {
  SuccessionFamilyOverview,
  SuccessionHypotheses,
  SuccessionModals,
  SuccessionPageContent,
  SuccessionPageSidebar,
} from './components/SuccessionPageSections';
import '@/styles/sim/index.css';
import './styles/index.css';

const STORE_KEY = storageKeyFor('succession');

export default function SuccessionSimulator() {
  // ── Paramètres fiscaux (strict : attend Supabase avant de rendre) ──────────
  const { loading: settingsLoading, fiscalContext } = useFiscalContext({ strict: true });
  const fiscalSnapshot = useMemo(
    () => buildSuccessionFiscalSnapshot(fiscalContext),
    [fiscalContext],
  );
  const { persistedForm, setActifNet, hydrateForm, reset } = useSuccessionCalc({
    dmtgSettings: fiscalSnapshot.dmtgSettings,
  });

  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const { mode } = useUserMode();
  const { sessionExpired, canExport } = useContext(SessionGuardContext);

  // ── États locaux ───────────────────────────────────────────────────────────
  const {
    localMode,
    setLocalMode,
    hypothesesOpen,
    setHypothesesOpen,
    hydrated,
    setHydrated,
    civilContext,
    setCivilContext,
    liquidationContext,
    setLiquidationContext,
    assetEntries,
    setAssetEntries,
    assuranceVieEntries,
    setAssuranceVieEntries,
    perEntries,
    setPerEntries,
    devolutionContext,
    setDevolutionContext,
    patrimonialContext,
    setPatrimonialContext,
    donationsContext,
    setDonationsContext,
    enfantsContext,
    setEnfantsContext,
    familyMembers,
    setFamilyMembers,
    showAddMemberPanel,
    setShowAddMemberPanel,
    showDispositionsModal,
    setShowDispositionsModal,
    showAssuranceVieModal,
    setShowAssuranceVieModal,
    showPerModal,
    setShowPerModal,
    showPrevoyanceModal,
    setShowPrevoyanceModal,
    assuranceVieDraft,
    setAssuranceVieDraft,
    perDraft,
    setPerDraft,
    prevoyanceDraft,
    setPrevoyanceDraft,
    groupementFoncierEntries,
    setGroupementFoncierEntries,
    prevoyanceDecesEntries,
    setPrevoyanceDecesEntries,
    dispositionsDraft,
    setDispositionsDraft,
    addMemberForm,
    setAddMemberForm,
    chainOrder,
    setChainOrder,
  } = useSuccessionDraftState();
  const effectiveMode = resolveEffectiveUserMode(mode, localMode);
  const isExpert = effectiveMode === 'expert';
  const {
    donationPartageActs,
    setDonationPartageActs,
    showDonationPartageModal,
    setShowDonationPartageModal,
    donationPartageDraft,
    setDonationPartageDraft,
    openDonationPartageAct,
    openDonationPartageFromEntry,
    closeDonationPartageModal,
    validateDonationPartageModal,
    removeDonationPartageAct,
  } = useSuccessionDonationPartageHandlers({
    donationsContext,
    enfantsContext,
    chainOrder,
    setDonationsContext,
  });

  // ── Valeurs dérivées (useMemo purs) ───────────────────────────────────────
  const derived = useSuccessionDerivedValues({
    civilContext,
    liquidationContext,
    assetEntries,
    groupementFoncierEntries,
    assuranceVieEntries,
    perEntries,
    prevoyanceDecesEntries,
    devolutionContext,
    patrimonialContext,
    donationsContext,
    donationPartageActs,
    enfantsContext,
    familyMembers,
    fiscalSnapshot,
    chainOrder,
    canExport,
  });

  // ── Handlers UI ────────────────────────────────────────────────────────────
  const {
    handleSituationChange,
    handleReset,
    setSimplifiedBalanceField,
    addEnfant,
    updateEnfantRattachement,
    toggleEnfantDeceased,
    removeEnfant,
    addFamilyMember,
    removeFamilyMember,
    addDonationEntry,
    updateDonationEntry,
    removeDonationEntry,
    addAssetEntry,
    updateAssetEntry,
    removeAssetEntry,
    openAssuranceVieModal,
    closeAssuranceVieModal,
    validateAssuranceVieModal,
    updateAssuranceVieDraft,
    removeAssuranceVieEntry,
    openPerModal,
    closePerModal,
    validatePerModal,
    updatePerDraft,
    removePerEntry,
    openPrevoyanceModal,
    closePrevoyanceModal,
    validatePrevoyanceModal,
    updatePrevoyanceDraft,
    removePrevoyanceDecesEntry,
    getFirstTestamentBeneficiaryRef,
    updateDispositionsTestament,
    addDispositionsParticularLegacy,
    updateDispositionsParticularLegacy,
    removeDispositionsParticularLegacy,
    openDispositionsModal,
    validateDispositionsModal,
  } = useSuccessionSimulatorHandlers({
    storeKey: STORE_KEY,
    reset,
    assetBreakdown: derived.assetBreakdown,
    enfantRattachementOptions: derived.enfantRattachementOptions,
    addMemberForm,
    assetPocketOptions: derived.assetPocketOptions,
    assetEntries,
    assuranceVieEntries,
    assuranceVieDraft,
    perEntries,
    perDraft,
    prevoyanceDecesEntries,
    prevoyanceDraft,
    assuranceViePartyOptions: derived.assuranceViePartyOptions,
    testamentBeneficiaryOptionsBySide: derived.testamentBeneficiaryOptionsBySide,
    canOpenDispositionsModal: derived.canOpenDispositionsModal,
    civilContext,
    devolutionContext,
    patrimonialContext,
    dispositionsDraft,
    setCivilContext,
    setLiquidationContext,
    setAssetEntries,
    setAssuranceVieEntries,
    setPerEntries,
    setGroupementFoncierEntries,
    setPrevoyanceDecesEntries,
    setDevolutionContext,
    setPatrimonialContext,
    setDonationsContext,
    setEnfantsContext,
    setFamilyMembers,
    setShowAddMemberPanel,
    setShowDispositionsModal,
    setShowAssuranceVieModal,
    setShowPerModal,
    setShowPrevoyanceModal,
    setAssuranceVieDraft,
    setPerDraft,
    setPrevoyanceDraft,
    setDispositionsDraft,
    setAddMemberForm,
    setChainOrder,
    setHypothesesOpen,
    setDonationPartageActs,
    setShowDonationPartageModal,
    setDonationPartageDraft,
  });

  // ── Handlers export ────────────────────────────────────────────────────────
  const { exportOptions, exportLoading } = useSuccessionExportHandlers({
    canExport,
    canExportSimplified: derived.canExportSimplified,
    canExportCurrentMode: derived.canExportCurrentMode,
    pptxColors,
    cabinetLogo,
    logoPlacement,
    chainageExportPayload: derived.chainageExportPayload,
    annexBeneficiarySteps: derived.annexBeneficiarySteps,
    familyContext: derived.familyContext,
    assetAnnex: derived.assetAnnex,
    displayUsesChainage: derived.displayUsesChainage,
    directDisplayResult: derived.directDisplayAnalysis.result,
    derivedMasseTransmise: derived.derivedMasseTransmise,
    synthDonutTransmis: derived.synthDonutTransmis,
    derivedTotalDroits: derived.derivedTotalDroits,
    exportHeirs: derived.exportHeirs,
    assumptions: derived.assumptions,
    fiscalSnapshot,
  });

  // ── Effets de synchronisation (normalization quand le contexte civil change) ─
  useSuccessionSyncEffects({
    enfantRattachementOptions: derived.enfantRattachementOptions,
    assetPocketOptions: derived.assetPocketOptions,
    assuranceViePartyOptions: derived.assuranceViePartyOptions,
    situationMatrimoniale: civilContext.situationMatrimoniale,
    regimeMatrimonial: civilContext.regimeMatrimonial,
    pacsConvention: civilContext.pacsConvention,
    assetNetTotals: derived.assetNetTotals,
    nbEnfants: derived.nbEnfants,
    donationTotals: derived.donationTotals,
    familyMembers,
    setEnfantsContext,
    setDevolutionContext,
    setLiquidationContext,
    setAssetEntries,
    setAssuranceVieEntries,
    setPerEntries,
    setGroupementFoncierEntries,
    setPrevoyanceDecesEntries,
    setPatrimonialContext,
  });

  useSuccessionDraftPersistence({
    storeKey: STORE_KEY,
    hydrated,
    setHydrated,
    persistedForm,
    hydrateForm,
    civilContext,
    setCivilContext,
    liquidationContext,
    setLiquidationContext,
    assetEntries,
    setAssetEntries,
    assuranceVieEntries,
    setAssuranceVieEntries,
    perEntries,
    setPerEntries,
    groupementFoncierEntries,
    setGroupementFoncierEntries,
    prevoyanceDecesEntries,
    setPrevoyanceDecesEntries,
    devolutionContext,
    setDevolutionContext,
    patrimonialContext,
    setPatrimonialContext,
    donationsContext,
    setDonationsContext,
    donationPartageActs,
    setDonationPartageActs,
    enfantsContext,
    setEnfantsContext,
    familyMembers,
    setFamilyMembers,
    chainOrder,
    setChainOrder,
    nbEnfantsNonCommuns: derived.nbEnfantsNonCommuns,
    handleReset,
  });

  // Synchroniser actifNet dans le moteur de calcul
  useEffect(() => {
    setActifNet(derived.displayActifNetSuccession);
  }, [derived.displayActifNetSuccession, setActifNet]);

  const importPrevoyanceFromSimulator = () => {
    const defaultParty = derived.assuranceViePartyOptions[0]?.value ?? 'epoux1';
    const result = importPrevoyanceEntriesFromStorage({
      existingEntries: prevoyanceDecesEntries,
      souscripteur: defaultParty,
      assure: defaultParty,
    });

    setPrevoyanceDecesEntries(result.entries);
    if (result.foundDraft) {
      setShowPrevoyanceModal(false);
      setPrevoyanceDraft(null);
    }
  };

  const successionPageSectionsProps = {
    derived,
    isExpert,
    civilContext,
    enfantsContext,
    familyMembers,
    assuranceVieEntries,
    perEntries,
    donationsContext,
    donationPartageActs,
    chainOrder,
    onToggleChainOrder: () => setChainOrder((prev) => (prev === 'epoux2' ? 'epoux1' : 'epoux2')),
    onSituationChange: handleSituationChange,
    setCivilContext,
    onOpenDispositions: openDispositionsModal,
    onAddEnfant: addEnfant,
    onToggleAddMemberPanel: () => setShowAddMemberPanel((prev) => !prev),
    onUpdateEnfantRattachement: updateEnfantRattachement,
    onToggleEnfantDeceased: toggleEnfantDeceased,
    onRemoveEnfant: removeEnfant,
    onRemoveFamilyMember: removeFamilyMember,
    onAddAssetEntry: addAssetEntry,
    onUpdateAssetEntry: updateAssetEntry,
    onRemoveAssetEntry: removeAssetEntry,
    onOpenAssuranceVieModal: openAssuranceVieModal,
    onRemoveAssuranceVieEntry: removeAssuranceVieEntry,
    onOpenPerModal: openPerModal,
    onRemovePerEntry: removePerEntry,
    onOpenPrevoyanceModal: openPrevoyanceModal,
    onRemovePrevoyanceDecesEntry: removePrevoyanceDecesEntry,
    groupementFoncierEntries,
    onUpdateGroupementFoncierEntry: (id: string, field: string, value: string | number) =>
      setGroupementFoncierEntries((prev) =>
        prev.map((entry) => {
          if (entry.id !== id) return entry;
          if (field === 'pocket') {
            const location = resolveSuccessionAssetLocation({
              pocket: value,
              situationMatrimoniale: civilContext.situationMatrimoniale,
              regimeMatrimonial: civilContext.regimeMatrimonial,
              pacsConvention: civilContext.pacsConvention,
            });
            return location ? { ...entry, pocket: location.pocket } : entry;
          }
          return { ...entry, [field]: value };
        }),
      ),
    onRemoveGroupementFoncierEntry: (id: string) =>
      setGroupementFoncierEntries((prev) => prev.filter((entry) => entry.id !== id)),
    prevoyanceDecesEntries,
    onSetSimplifiedBalanceField: setSimplifiedBalanceField,
    onAddDonationEntry: addDonationEntry,
    onOpenDonationPartageAct: openDonationPartageAct,
    onOpenDonationPartageFromEntry: openDonationPartageFromEntry,
    onRemoveDonationPartageAct: removeDonationPartageAct,
    onUpdateDonationEntry: updateDonationEntry,
    onRemoveDonationEntry: removeDonationEntry,
    forfaitMobilierMode: patrimonialContext.forfaitMobilierMode,
    forfaitMobilierPct: patrimonialContext.forfaitMobilierPct,
    forfaitMobilierMontant: patrimonialContext.forfaitMobilierMontant,
    abattementResidencePrincipale: patrimonialContext.abattementResidencePrincipale,
    decesDansXAns: patrimonialContext.decesDansXAns,
    onUpdatePatrimonialField: (field: string, value: unknown) =>
      setPatrimonialContext((prev) => ({ ...prev, [field]: value })),
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────

  if (settingsLoading) {
    return (
      <SimPageShell
        title="Succession"
        subtitle="Estimez les impacts civils d'une succession à partir du contexte familial, du patrimoine et des dispositions saisies."
        pageClassName="sc-page"
        pageTestId="succession-page"
        statusTestId="succession-settings-loading"
        loading
        loadingContent={
          <div className="sc-settings-loading">Chargement des paramètres fiscaux…</div>
        }
      />
    );
  }

  return (
    <>
      <SimPageShell
        title="Succession"
        subtitle="Estimez les impacts civils d'une succession à partir du contexte familial, du patrimoine et des dispositions saisies."
        pageClassName="sc-page"
        pageTestId="succession-page"
        actions={
          <>
            <ModeToggle
              value={isExpert}
              onChange={() => setLocalMode(isExpert ? 'simplifie' : 'expert')}
            />
            <ExportMenu options={exportOptions} loading={exportLoading} />
          </>
        }
        notice={
          <div className="sc-page-notice">
            {sessionExpired && (
              <p className="sc-session-msg">Session expirée — reconnectez-vous pour exporter.</p>
            )}
            <SuccessionFamilyOverview {...successionPageSectionsProps} />
          </div>
        }
      >
        {derived.shouldRenderSuccessionComputationSections && (
          <>
            <SimPageShell.Main className="sc-left">
              <SuccessionPageContent {...successionPageSectionsProps} />
            </SimPageShell.Main>

            <SimPageShell.Side className="sc-right">
              <SuccessionPageSidebar {...successionPageSectionsProps} />
            </SimPageShell.Side>
          </>
        )}

        <SimPageShell.Section>
          <SuccessionHypotheses
            hypothesesOpen={hypothesesOpen}
            assumptions={derived.assumptions}
            onToggle={() => setHypothesesOpen((value) => !value)}
          />
        </SimPageShell.Section>
      </SimPageShell>

      <SuccessionModals
        derived={derived}
        civilSituation={civilContext.situationMatrimoniale}
        enfantsContext={enfantsContext}
        familyMembers={familyMembers}
        assetEntries={assetEntries}
        groupementFoncierEntries={groupementFoncierEntries}
        showDispositionsModal={showDispositionsModal}
        dispositionsDraft={dispositionsDraft}
        setDispositionsDraft={setDispositionsDraft}
        showAssuranceVieModal={showAssuranceVieModal}
        assuranceVieDraft={assuranceVieDraft}
        showPerModal={showPerModal}
        perDraft={perDraft}
        showPrevoyanceModal={showPrevoyanceModal}
        prevoyanceDraft={prevoyanceDraft}
        showDonationPartageModal={showDonationPartageModal}
        donationPartageDraft={donationPartageDraft}
        showAddMemberPanel={showAddMemberPanel}
        addMemberForm={addMemberForm}
        setAddMemberForm={setAddMemberForm}
        onUpdateDispositionsTestament={updateDispositionsTestament}
        onGetFirstTestamentBeneficiaryRef={getFirstTestamentBeneficiaryRef}
        onAddParticularLegacy={addDispositionsParticularLegacy}
        onUpdateParticularLegacy={updateDispositionsParticularLegacy}
        onRemoveParticularLegacy={removeDispositionsParticularLegacy}
        onCloseDispositions={() => setShowDispositionsModal(false)}
        onValidateDispositions={validateDispositionsModal}
        onCloseAssuranceVie={closeAssuranceVieModal}
        onValidateAssuranceVie={validateAssuranceVieModal}
        onUpdateAssuranceVieContract={updateAssuranceVieDraft}
        onClosePer={closePerModal}
        onValidatePer={validatePerModal}
        onUpdatePerContract={updatePerDraft}
        onClosePrevoyance={closePrevoyanceModal}
        onValidatePrevoyance={validatePrevoyanceModal}
        onUpdatePrevoyanceContract={updatePrevoyanceDraft}
        onImportPrevoyanceFromSimulator={importPrevoyanceFromSimulator}
        onCloseDonationPartage={closeDonationPartageModal}
        onValidateDonationPartage={validateDonationPartageModal}
        onUpdateDonationPartageDraft={setDonationPartageDraft}
        onDeleteDonationPartage={
          donationPartageDraft ? () => removeDonationPartageAct(donationPartageDraft.id) : undefined
        }
        onCloseAddMemberPanel={() => setShowAddMemberPanel(false)}
        onValidateAddMember={addFamilyMember}
      />
    </>
  );
}
