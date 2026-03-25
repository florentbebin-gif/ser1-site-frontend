/**
 * SuccessionSimulator — Simulateur Succession
 *
 * PR1-PR3 scope:
 * - Alignement UI sur la norme /sim/*
 * - Saisie guidée civile / patrimoniale
 * - Actifs détaillés expert + assurance-vie informative
 *
 * Décomposition (PR-P1-07-03) :
 * - Valeurs dérivées  → useSuccessionDerivedValues
 * - Handlers export   → useSuccessionExportHandlers
 */

import { useContext, useEffect, useMemo, useState } from 'react';
import { useSuccessionCalc } from './useSuccessionCalc';
import { useTheme } from '../../settings/ThemeProvider';
import { useUserMode } from '../../settings/userMode';
import { SessionGuardContext } from '../../session/sessionGuardContext';
import { useFiscalContext } from '../../hooks/useFiscalContext';
import { ExportMenu } from '../../components/ExportMenu';
import { ModeToggle } from '../../components/ModeToggle';
import { onResetEvent, storageKeyFor } from '../../utils/reset';
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_DONATIONS,
  DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  DEFAULT_SUCCESSION_FAMILY_MEMBERS,
  DEFAULT_SUCCESSION_ASSET_DETAILS,
  DEFAULT_SUCCESSION_ASSURANCE_VIE,
  DEFAULT_SUCCESSION_PER,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
  resolveSuccessionAssetLocation,
  type SuccessionAssetDetailEntry,
  type SuccessionAssuranceVieEntry,
  type FamilyMember,
  type SuccessionDonationEntry,
  type SuccessionEnfant,
  type SuccessionGroupementFoncierEntry,
  type SuccessionPerEntry,
  type SuccessionPrevoyanceDecesEntry,
} from './successionDraft';
import { buildSuccessionFiscalSnapshot } from './successionFiscalContext';
import { type SuccessionChainOrder } from './successionChainage';
import { useSuccessionSyncEffects } from './useSuccessionSyncEffects';
import {
  buildInitialDispositionsDraft,
  EMPTY_ADD_FAMILY_MEMBER_FORM,
  type AddFamilyMemberFormState,
  type DispositionsDraftState,
} from './successionSimulator.helpers';
import { useSuccessionDerivedValues } from './useSuccessionDerivedValues';
import { useSuccessionExportHandlers } from './useSuccessionExportHandlers';
import { useSuccessionSimulatorHandlers } from './useSuccessionSimulatorHandlers';
import {
  SuccessionHypotheses,
  SuccessionModals,
  SuccessionPageGrid,
} from './components/SuccessionPageSections';
import '../../components/simulator/SimulatorShell.css';
import '../../styles/premium-shared.css';
import './Succession.css';

const STORE_KEY = storageKeyFor('succession');

export default function SuccessionSimulator() {
  // ── Paramètres fiscaux (strict : attend Supabase avant de rendre) ──────────
  const { loading: settingsLoading, fiscalContext } = useFiscalContext({ strict: true });
  const fiscalSnapshot = useMemo(
    () => buildSuccessionFiscalSnapshot(fiscalContext),
    [fiscalContext],
  );
  const {
    persistedForm, setActifNet, hydrateForm, reset,
  } = useSuccessionCalc({ dmtgSettings: fiscalSnapshot.dmtgSettings });

  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const { mode } = useUserMode();
  const { sessionExpired, canExport } = useContext(SessionGuardContext);

  // ── États locaux ───────────────────────────────────────────────────────────
  const [localMode, setLocalMode] = useState<null | 'expert' | 'simplifie'>(null);
  const isExpert = (localMode ?? mode) === 'expert';
  const [hypothesesOpen, setHypothesesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [civilContext, setCivilContext] = useState(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
  const [liquidationContext, setLiquidationContext] = useState(DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT);
  const [assetEntries, setAssetEntries] = useState<SuccessionAssetDetailEntry[]>(DEFAULT_SUCCESSION_ASSET_DETAILS);
  const [assuranceVieEntries, setAssuranceVieEntries] = useState<SuccessionAssuranceVieEntry[]>(DEFAULT_SUCCESSION_ASSURANCE_VIE);
  const [perEntries, setPerEntries] = useState<SuccessionPerEntry[]>(DEFAULT_SUCCESSION_PER);
  const [devolutionContext, setDevolutionContext] = useState(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
  const [patrimonialContext, setPatrimonialContext] = useState(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
  const [donationsContext, setDonationsContext] = useState<SuccessionDonationEntry[]>(DEFAULT_SUCCESSION_DONATIONS);
  const [enfantsContext, setEnfantsContext] = useState<SuccessionEnfant[]>(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(DEFAULT_SUCCESSION_FAMILY_MEMBERS);
  const [showAddMemberPanel, setShowAddMemberPanel] = useState(false);
  const [showDispositionsModal, setShowDispositionsModal] = useState(false);
  const [showAssuranceVieModal, setShowAssuranceVieModal] = useState(false);
  const [showPerModal, setShowPerModal] = useState(false);
  const [showPrevoyanceModal, setShowPrevoyanceModal] = useState(false);
  const [assuranceVieDraft, setAssuranceVieDraft] = useState<SuccessionAssuranceVieEntry | null>(null);
  const [perDraft, setPerDraft] = useState<SuccessionPerEntry | null>(null);
  const [prevoyanceDraft, setPrevoyanceDraft] = useState<SuccessionPrevoyanceDecesEntry | null>(null);
  const [groupementFoncierEntries, setGroupementFoncierEntries] = useState<SuccessionGroupementFoncierEntry[]>([]);
  const [prevoyanceDecesEntries, setPrevoyanceDecesEntries] = useState<SuccessionPrevoyanceDecesEntry[]>([]);
  const [dispositionsDraft, setDispositionsDraft] = useState<DispositionsDraftState>(buildInitialDispositionsDraft);
  const [addMemberForm, setAddMemberForm] = useState<AddFamilyMemberFormState>(EMPTY_ADD_FAMILY_MEMBER_FORM);
  const [chainOrder, setChainOrder] = useState<SuccessionChainOrder>('epoux1');

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
    displayUsesChainage: derived.displayUsesChainage,
    directDisplayResult: derived.directDisplayAnalysis.result,
    derivedMasseTransmise: derived.derivedMasseTransmise,
    synthDonutTransmis: derived.synthDonutTransmis,
    derivedTotalDroits: derived.derivedTotalDroits,
    exportHeirs: derived.exportHeirs,
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

  // Hydratation sessionStorage au montage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = parseSuccessionDraftPayload(raw);
        if (parsed) {
          hydrateForm(parsed.form);
          setCivilContext(parsed.civil);
          setLiquidationContext(parsed.liquidation);
          setAssetEntries(parsed.assetEntries);
          setAssuranceVieEntries(parsed.assuranceVieEntries);
          setPerEntries(parsed.perEntries);
          if (parsed.groupementFoncierEntries) setGroupementFoncierEntries(parsed.groupementFoncierEntries);
          if (parsed.prevoyanceDecesEntries) setPrevoyanceDecesEntries(parsed.prevoyanceDecesEntries);
          setDevolutionContext(parsed.devolution);
          setPatrimonialContext(parsed.patrimonial);
          setDonationsContext(parsed.donations);
          setEnfantsContext(parsed.enfants);
          setFamilyMembers(parsed.familyMembers);
          setChainOrder(parsed.ui.chainOrder);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [hydrateForm]);

  // Persistance sessionStorage à chaque changement
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        STORE_KEY,
        JSON.stringify(
          buildSuccessionDraftPayload(
            persistedForm,
            civilContext,
            liquidationContext,
            {
              ...devolutionContext,
              nbEnfantsNonCommuns: derived.nbEnfantsNonCommuns,
            },
            patrimonialContext,
            enfantsContext,
            familyMembers,
            donationsContext,
            assetEntries,
            assuranceVieEntries,
            perEntries,
            groupementFoncierEntries,
            prevoyanceDecesEntries,
            chainOrder,
          ),
        ),
      );
    } catch {
      // ignore
    }
  }, [hydrated, persistedForm, civilContext, liquidationContext, devolutionContext, patrimonialContext, derived.nbEnfantsNonCommuns, enfantsContext, familyMembers, donationsContext, assetEntries, assuranceVieEntries, perEntries, groupementFoncierEntries, prevoyanceDecesEntries, chainOrder]);

  // Écoute l'événement reset global
  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'succession') return;
      handleReset();
    });
    return off || (() => {});
  }, [handleReset]);

  // Synchroniser actifNet dans le moteur de calcul
  useEffect(() => {
    setActifNet(derived.displayActifNetSuccession);
  }, [derived.displayActifNetSuccession, setActifNet]);

  // ── Rendu ──────────────────────────────────────────────────────────────────

  if (settingsLoading) {
    return (
      <div className="sim-page sc-page" data-testid="succession-page">
        <div className="premium-header sc-header">
          <h1 className="premium-title">Simulateur succession</h1>
          <p className="premium-subtitle">Estimez les droits de mutation à titre gratuit.</p>
        </div>
        <div className="sc-settings-loading" data-testid="succession-settings-loading">
          Chargement des paramètres fiscaux…
        </div>
      </div>
    );
  }

  return (
    <div className="sim-page sc-page" data-testid="succession-page">
      <div className="premium-header sc-header">
        <h1 className="premium-title">Simulateur succession</h1>
        <div className="sc-header__subtitle-row">
          <p className="premium-subtitle">
            Estimez les impacts civils d&apos;une succession à partir du contexte familial, du patrimoine et des dispositions saisies.
          </p>
          <div className="sim-header__actions">
            <ModeToggle value={isExpert} onChange={() => setLocalMode(isExpert ? 'simplifie' : 'expert')} />
            <ExportMenu options={exportOptions} loading={exportLoading} />
          </div>
        </div>
      </div>

      {sessionExpired && (
        <p className="sc-session-msg">
          Session expirée — reconnectez-vous pour exporter.
        </p>
      )}

      <SuccessionPageGrid
        derived={derived}
        isExpert={isExpert}
        civilContext={civilContext}
        enfantsContext={enfantsContext}
        familyMembers={familyMembers}
        assuranceVieEntries={assuranceVieEntries}
        perEntries={perEntries}
        donationsContext={donationsContext}
        chainOrder={chainOrder}
        onToggleChainOrder={() => setChainOrder((prev) => (prev === 'epoux2' ? 'epoux1' : 'epoux2'))}
        onSituationChange={handleSituationChange}
        setCivilContext={setCivilContext}
        onOpenDispositions={openDispositionsModal}
        onAddEnfant={addEnfant}
        onToggleAddMemberPanel={() => setShowAddMemberPanel((prev) => !prev)}
        onUpdateEnfantRattachement={updateEnfantRattachement}
        onToggleEnfantDeceased={toggleEnfantDeceased}
        onRemoveEnfant={removeEnfant}
        onRemoveFamilyMember={removeFamilyMember}
        onAddAssetEntry={addAssetEntry}
        onUpdateAssetEntry={updateAssetEntry}
        onRemoveAssetEntry={removeAssetEntry}
        onOpenAssuranceVieModal={openAssuranceVieModal}
        onRemoveAssuranceVieEntry={removeAssuranceVieEntry}
        onOpenPerModal={openPerModal}
        onRemovePerEntry={removePerEntry}
        onOpenPrevoyanceModal={openPrevoyanceModal}
        onRemovePrevoyanceDecesEntry={removePrevoyanceDecesEntry}
        groupementFoncierEntries={groupementFoncierEntries}
        onUpdateGroupementFoncierEntry={(id, field, value) => setGroupementFoncierEntries((prev) => prev.map((entry) => {
          if (entry.id !== id) return entry;
          if (field === 'owner') {
            const location = resolveSuccessionAssetLocation({
              owner: value,
              situationMatrimoniale: civilContext.situationMatrimoniale,
              regimeMatrimonial: civilContext.regimeMatrimonial,
              pacsConvention: civilContext.pacsConvention,
            });
            return location ? { ...entry, ...location } : entry;
          }
          if (field === 'pocket') {
            const location = resolveSuccessionAssetLocation({
              pocket: value,
              situationMatrimoniale: civilContext.situationMatrimoniale,
              regimeMatrimonial: civilContext.regimeMatrimonial,
              pacsConvention: civilContext.pacsConvention,
            });
            return location ? { ...entry, ...location } : entry;
          }
          return { ...entry, [field]: value };
        }))}
        onRemoveGroupementFoncierEntry={(id) => setGroupementFoncierEntries((prev) => prev.filter((e) => e.id !== id))}
        prevoyanceDecesEntries={prevoyanceDecesEntries}
        onSetSimplifiedBalanceField={setSimplifiedBalanceField}
        onAddDonationEntry={addDonationEntry}
        onUpdateDonationEntry={updateDonationEntry}
        onRemoveDonationEntry={removeDonationEntry}
        forfaitMobilierMode={patrimonialContext.forfaitMobilierMode}
        forfaitMobilierPct={patrimonialContext.forfaitMobilierPct}
        forfaitMobilierMontant={patrimonialContext.forfaitMobilierMontant}
        abattementResidencePrincipale={patrimonialContext.abattementResidencePrincipale}
        decesDansXAns={patrimonialContext.decesDansXAns}
        onUpdatePatrimonialField={(field, value) => setPatrimonialContext((prev) => ({ ...prev, [field]: value }))}
      />

      <SuccessionHypotheses
        hypothesesOpen={hypothesesOpen}
        attentions={derived.attentions}
        fiscalSnapshot={fiscalSnapshot}
        onToggle={() => setHypothesesOpen((value) => !value)}
      />

      <SuccessionModals
        derived={derived}
        civilSituation={civilContext.situationMatrimoniale}
        enfantsContext={enfantsContext}
        familyMembers={familyMembers}
        showDispositionsModal={showDispositionsModal}
        dispositionsDraft={dispositionsDraft}
        setDispositionsDraft={setDispositionsDraft}
        showAssuranceVieModal={showAssuranceVieModal}
        assuranceVieDraft={assuranceVieDraft}
        showPerModal={showPerModal}
        perDraft={perDraft}
        showPrevoyanceModal={showPrevoyanceModal}
        prevoyanceDraft={prevoyanceDraft}
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
        onCloseAddMemberPanel={() => setShowAddMemberPanel(false)}
        onValidateAddMember={addFamilyMember}
      />

    </div>
  );
}
