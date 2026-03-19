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
import { SessionGuardContext } from '../../App';
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
import { normalizeResidencePrincipaleAssetEntries } from './successionAssetValuation';
import { CLAUSE_CONJOINT_LABEL } from './successionSimulator.constants';
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
  const [assuranceVieDraft, setAssuranceVieDraft] = useState<SuccessionAssuranceVieEntry[]>(DEFAULT_SUCCESSION_ASSURANCE_VIE);
  const [perDraft, setPerDraft] = useState<SuccessionPerEntry[]>(DEFAULT_SUCCESSION_PER);
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
    assuranceVieDraft,
    perEntries,
    perDraft,
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
    openPerModal,
    closePerModal,
    validatePerModal,
    addAssuranceVieEntry,
    updateAssuranceVieEntry,
    removeAssuranceVieEntry,
    addPerEntry,
    updatePerEntry,
    removePerEntry,
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
    assetOwnerOptions: derived.assetOwnerOptions,
    assuranceVieEntries,
    assuranceVieDraft,
    perEntries,
    perDraft,
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
    setDevolutionContext,
    setPatrimonialContext,
    setDonationsContext,
    setEnfantsContext,
    setFamilyMembers,
    setShowAddMemberPanel,
    setShowDispositionsModal,
    setShowAssuranceVieModal,
    setShowPerModal,
    setAssuranceVieDraft,
    setPerDraft,
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

  // ── Effets de synchronisation état ────────────────────────────────────────

  // Reset enfant rattachement invalide lors d'un changement de situation matrimoniale
  useEffect(() => {
    const validValues = new Set(derived.enfantRattachementOptions.map((o) => o.value));
    const defaultValue = (derived.enfantRattachementOptions[0]?.value ?? 'epoux1') as 'commun' | 'epoux1' | 'epoux2';
    setEnfantsContext((prev) =>
      prev.map((e) =>
        validValues.has(e.rattachement) ? e : { ...e, rattachement: defaultValue },
      ),
    );
  }, [derived.enfantRattachementOptions]);

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
          setAssuranceVieDraft(parsed.assuranceVieEntries);
          setPerEntries(parsed.perEntries);
          setPerDraft(parsed.perEntries);
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

  // Auto-dériver les ascendants survivants par branche si des parents sont déclarés
  useEffect(() => {
    const hasParentsBySide = {
      epoux1: familyMembers.some((m) => m.type === 'parent' && (!m.branch || m.branch === 'epoux1')),
      epoux2: familyMembers.some((m) => m.type === 'parent' && m.branch === 'epoux2'),
    };
    setDevolutionContext((prev) => {
      if (
        prev.ascendantsSurvivantsBySide.epoux1 === hasParentsBySide.epoux1
        && prev.ascendantsSurvivantsBySide.epoux2 === hasParentsBySide.epoux2
      ) {
        return prev;
      }
      return {
        ...prev,
        ascendantsSurvivantsBySide: hasParentsBySide,
      };
    });
  }, [familyMembers]);

  // Synchroniser liquidationContext depuis les actifs nets calculés
  useEffect(() => {
    setLiquidationContext((prev) => {
      const next = {
        actifEpoux1: derived.assetNetTotals.epoux1,
        actifEpoux2: derived.assetNetTotals.epoux2,
        actifCommun: derived.assetNetTotals.commun,
        nbEnfants: derived.nbEnfants,
      };
      if (
        prev.actifEpoux1 === next.actifEpoux1
        && prev.actifEpoux2 === next.actifEpoux2
        && prev.actifCommun === next.actifCommun
        && prev.nbEnfants === next.nbEnfants
      ) {
        return prev;
      }
      return next;
    });
  }, [derived.assetNetTotals.commun, derived.assetNetTotals.epoux1, derived.assetNetTotals.epoux2, derived.nbEnfants]);

  // Reset propriétaires d'actifs invalides lors d'un changement de situation
  useEffect(() => {
    const validOwners = new Set(derived.assetOwnerOptions.map((option) => option.value));
    const fallbackOwner = derived.assetOwnerOptions[0]?.value ?? 'epoux1';
    setAssetEntries((prev) => {
      let changed = false;
      const mapped = prev.map((entry) => {
        if (validOwners.has(entry.owner)) return entry;
        changed = true;
        return { ...entry, owner: fallbackOwner };
      });
      const next = normalizeResidencePrincipaleAssetEntries(mapped);
      const residenceChanged = next.some((entry, index) => entry.subCategory !== mapped[index]?.subCategory);
      return changed || residenceChanged ? next : prev;
    });
  }, [derived.assetOwnerOptions]);

  // Reset assurés/souscripteurs d'AV invalides lors d'un changement de situation
  useEffect(() => {
    const validOwners = new Set(derived.assuranceViePartyOptions.map((option) => option.value));
    const fallbackOwner = derived.assuranceViePartyOptions[0]?.value ?? 'epoux1';
    setAssuranceVieEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const souscripteur = validOwners.has(entry.souscripteur) ? entry.souscripteur : fallbackOwner;
        const assure = validOwners.has(entry.assure) ? entry.assure : fallbackOwner;
        if (souscripteur === entry.souscripteur && assure === entry.assure) return entry;
        changed = true;
        return {
          ...entry,
          souscripteur,
          assure,
        };
      });
      return changed ? next : prev;
    });
  }, [derived.assuranceViePartyOptions]);

  useEffect(() => {
    const validOwners = new Set(derived.assuranceViePartyOptions.map((option) => option.value));
    const fallbackOwner = derived.assuranceViePartyOptions[0]?.value ?? 'epoux1';
    setPerEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const assure = validOwners.has(entry.assure) ? entry.assure : fallbackOwner;
        if (assure === entry.assure) return entry;
        changed = true;
        return {
          ...entry,
          assure,
        };
      });
      return changed ? next : prev;
    });
  }, [derived.assuranceViePartyOptions]);

  useEffect(() => {
    const validOwners = new Set(derived.assetOwnerOptions.map((option) => option.value));
    const fallbackOwner = derived.assetOwnerOptions[0]?.value ?? 'epoux1';
    setGroupementFoncierEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const owner = validOwners.has(entry.owner) ? entry.owner : fallbackOwner;
        if (owner === entry.owner) return entry;
        changed = true;
        return { ...entry, owner };
      });
      return changed ? next : prev;
    });
  }, [derived.assetOwnerOptions]);

  useEffect(() => {
    const validOwners = new Set(derived.assuranceViePartyOptions.map((option) => option.value));
    const fallbackOwner = derived.assuranceViePartyOptions[0]?.value ?? 'epoux1';
    setPrevoyanceDecesEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const souscripteur = validOwners.has(entry.souscripteur) ? entry.souscripteur : fallbackOwner;
        const assure = validOwners.has(entry.assure) ? entry.assure : fallbackOwner;
        if (souscripteur === entry.souscripteur && assure === entry.assure) return entry;
        changed = true;
        return { ...entry, souscripteur, assure };
      });
      return changed ? next : prev;
    });
  }, [derived.assuranceViePartyOptions]);

  // Synchroniser patrimonialContext depuis les totaux donations
  useEffect(() => {
    setPatrimonialContext((prev) => {
      if (
        prev.donationsRapportables === derived.donationTotals.rapportable
        && prev.donationsHorsPart === derived.donationTotals.horsPart
        && prev.legsParticuliers === derived.donationTotals.legsParticuliers
      ) {
        return prev;
      }
      return {
        ...prev,
        donationsRapportables: derived.donationTotals.rapportable,
        donationsHorsPart: derived.donationTotals.horsPart,
        legsParticuliers: derived.donationTotals.legsParticuliers,
      };
    });
  }, [derived.donationTotals.horsPart, derived.donationTotals.legsParticuliers, derived.donationTotals.rapportable]);

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
        onOpenPerModal={openPerModal}
        groupementFoncierEntries={groupementFoncierEntries}
        onAddGroupementFoncierEntry={() => setGroupementFoncierEntries((prev) => [...prev, { id: crypto.randomUUID(), type: 'GFA', valeurTotale: 0, owner: 'epoux1' }])}
        onUpdateGroupementFoncierEntry={(id, field, value) => setGroupementFoncierEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))}
        onRemoveGroupementFoncierEntry={(id) => setGroupementFoncierEntries((prev) => prev.filter((e) => e.id !== id))}
        prevoyanceDecesEntries={prevoyanceDecesEntries}
        onAddPrevoyanceDecesEntry={() => setPrevoyanceDecesEntries((prev) => [...prev, { id: crypto.randomUUID(), souscripteur: 'epoux1', assure: 'epoux1', capitalDeces: 0, dernierePrime: 0, clauseBeneficiaire: CLAUSE_CONJOINT_LABEL }])}
        onUpdatePrevoyanceDecesEntry={(id, field, value) => setPrevoyanceDecesEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))}
        onRemovePrevoyanceDecesEntry={(id) => setPrevoyanceDecesEntries((prev) => prev.filter((e) => e.id !== id))}
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
        onAddAssuranceVieContract={addAssuranceVieEntry}
        onRemoveAssuranceVieContract={removeAssuranceVieEntry}
        onUpdateAssuranceVieContract={updateAssuranceVieEntry}
        onClosePer={closePerModal}
        onValidatePer={validatePerModal}
        onAddPerContract={addPerEntry}
        onRemovePerContract={removePerEntry}
        onUpdatePerContract={updatePerEntry}
        onCloseAddMemberPanel={() => setShowAddMemberPanel(false)}
        onValidateAddMember={addFamilyMember}
      />

    </div>
  );
}
