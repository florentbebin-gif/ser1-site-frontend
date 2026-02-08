/**
 * PlacementV2.jsx — Orchestrateur du simulateur de placement
 *
 * Architecture modulaire :
 * - Moteur de calcul        → engine/placementEngine.js
 * - Settings-driven         → hooks/usePlacementSettings.js
 * - Formatters              → placement/utils/formatters.js
 * - Normalizers & constants → placement/utils/normalizers.js
 * - Input components        → placement/components/inputs.jsx
 * - Table components        → placement/components/tables.jsx
 * - VersementConfigModal    → placement/components/VersementConfigModal.jsx
 * - Excel export            → placement/utils/placementExcelExport.js
 * - Table helpers           → placement/utils/tableHelpers.jsx
 *
 * 3 phases : Épargne → Liquidation → Transmission
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlacementSettings } from '../hooks/usePlacementSettings.js';
import {
  ENVELOPE_LABELS,
  simulateComplete,
  compareProducts,
} from '../engine/placementEngine.js';
import './Ir.css';
import './Placement.css';
import { normalizeVersementConfig } from '../utils/versementConfig.js';
import { onResetEvent, storageKeyFor } from '../utils/reset.js';
import { PLACEMENT_SAVE_EVENT, PLACEMENT_LOAD_EVENT } from '../utils/placementEvents.js';
import { savePlacementState, loadPlacementStateFromFile } from '../utils/placementPersistence.js';
import { TimelineBar } from '../components/TimelineBar.jsx';
import { computeDmtgConsumptionRatio, shouldShowDmtgDisclaimer } from '../utils/transmissionDisclaimer.js';
import { ExportMenu } from '../components/ExportMenu';
import { euro, shortEuro, formatPsMontant } from './placement/utils/formatters.js';
import {
  DEFAULT_STATE, DEFAULT_DMTG_RATE, BENEFICIARY_OPTIONS,
  normalizeLoadedState, buildPersistedState,
  getRendementLiquidation, buildDmtgOptions, buildCustomDmtgOption,
  withReinvestCumul,
} from './placement/utils/normalizers.js';

import { InputEuro, InputPct, InputNumber, Select, Toggle } from './placement/components/inputs.jsx';
import { CollapsibleTable } from './placement/components/tables.jsx';
import { VersementConfigModal } from './placement/components/VersementConfigModal.jsx';
import { exportPlacementExcel } from './placement/utils/placementExcelExport.js';
import {
  getRelevantColumnsEpargne, buildColumns, getBaseColumnsForProduct,
  getRelevantColumns, renderEpargneRow,
} from './placement/utils/tableHelpers.jsx';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Fonction de transformation versementConfig → format moteur
// Gère la ventilation % entre capitalisation et distribution
function buildEngineProduct(product) {
  const { versementConfig, envelope, dureeEpargne, perBancaire, optionBaremeIR, fraisGestion } = product;
  const normalizedConfig = normalizeVersementConfig(versementConfig);
  const { initial, annuel, ponctuels, capitalisation, distribution } = normalizedConfig;
  
  // Calcul du rendement moyen pondéré selon la ventilation
  const pctCapi = (initial.pctCapitalisation || 0) / 100;
  const pctDistrib = (initial.pctDistribution || 0) / 100;
  
  // Rendement = moyenne pondérée des deux allocations (utilise les paramètres globaux)
  const rendementCapi = capitalisation.rendementAnnuel || 0;
  const rendementDistrib = distribution.tauxDistribution || 0;
  const rendementMoyen = pctCapi * rendementCapi + pctDistrib * rendementDistrib;
  
  // Taux de revalorisation (uniquement si distribution)
  const tauxRevalo = pctDistrib > 0 ? distribution.rendementAnnuel || 0 : 0;
  
  return {
    envelope,
    dureeEpargne,
    perBancaire,
    optionBaremeIR,
    fraisGestion,
    // Versements
    versementInitial: initial.montant,
    versementAnnuel: annuel.montant,
    fraisEntree: initial.fraisEntree,
    // Rendement pondéré (pour compatibilité)
    rendement: rendementMoyen,
    tauxRevalorisation: tauxRevalo,
    // Options distribution (si part distribution > 0)
    delaiJouissance: pctDistrib > 0 ? (distribution.delaiJouissance || 0) : 0,
    dureeProduit: pctDistrib > 0 ? distribution.dureeProduit : null,
    strategieCompteEspece: pctDistrib > 0 ? distribution.strategie : 'reinvestir_capi',
    reinvestirVersAuTerme: distribution.reinvestirVersAuTerme || 'capitalisation',
    // Ventilation pour info
    pctCapitalisation: initial.pctCapitalisation,
    pctDistribution: initial.pctDistribution,
    // Configuration détaillée pour calculs futurs
    versementConfig,
    // Versements ponctuels
    versementsPonctuels: ponctuels,
    // Options PER
    garantieBonneFin: annuel.garantieBonneFin,
    exonerationCotisations: annuel.exonerationCotisations,
  };
}

export default function PlacementV2() {
  const STORE_KEY = storageKeyFor('placement');
  const { fiscalParams, loading, error, tmiOptions, taxSettings, psSettings } = usePlacementSettings();

  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(DEFAULT_STATE);
  const [modalOpen, setModalOpen] = useState(null); // null | 0 | 1
  const [actionInProgress, setActionInProgress] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const dmtgScale = taxSettings?.dmtg?.scale;
  const dmtgOptions = useMemo(() => buildDmtgOptions(dmtgScale), [dmtgScale]);
  const dmtgDefaultRate = dmtgOptions[0]?.value ?? DEFAULT_DMTG_RATE;

  const dmtgSelectOptions = useMemo(() => {
    const current = state.transmission.dmtgTaux;
    if (current == null) return dmtgOptions;
    const exists = dmtgOptions.some((option) => option.value === current);
    if (exists) return dmtgOptions;
    return [...dmtgOptions, buildCustomDmtgOption(current)];
  }, [dmtgOptions, state.transmission.dmtgTaux]);

  const selectedDmtgOption = useMemo(
    () => dmtgSelectOptions.find((opt) => opt.value === state.transmission.dmtgTaux),
    [dmtgSelectOptions, state.transmission.dmtgTaux],
  );

  const selectedDmtgTrancheWidth = useMemo(() => {
    if (!selectedDmtgOption) return null;
    const from = typeof selectedDmtgOption.rangeFrom === 'number' ? selectedDmtgOption.rangeFrom : 0;
    const to = typeof selectedDmtgOption.rangeTo === 'number' ? selectedDmtgOption.rangeTo : null;
    if (to == null) return null; // pas de borne supérieure => pas de ratio pertinent
    const width = to - from;
    return width > 0 ? width : null;
  }, [selectedDmtgOption]);

  // Hydratation depuis sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          setState({ ...DEFAULT_STATE, ...s });
        }
      }
    } catch {}
    setHydrated(true);
  }, [STORE_KEY]);

  // Persistance
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {}
  }, [hydrated, state, STORE_KEY]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof dmtgDefaultRate !== 'number') return;
    setState((prev) => {
      if (prev.transmission?.dmtgTaux == null) {
        return {
          ...prev,
          transmission: { ...prev.transmission, dmtgTaux: dmtgDefaultRate },
        };
      }
      return prev;
    });
  }, [hydrated, dmtgDefaultRate]);

  // Reset
  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      if (simId && simId !== 'placement') return;
      setState(DEFAULT_STATE);
      try { sessionStorage.removeItem(STORE_KEY); } catch {}
    });
    return off || (() => {});
  }, [STORE_KEY]);



  const handleSavePlacement = useCallback(async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      const result = await savePlacementState(buildPersistedState(state));
      if (result?.cancelled) return;
      if (result?.success) {
        window.alert(`Simulation enregistrée (${result.filename ?? 'fichier'}).`);
      } else {
        window.alert(result?.message || 'Impossible de sauvegarder la simulation.');
      }
    } finally {
      setActionInProgress(false);
    }
  }, [actionInProgress, state]);

  const handleLoadPlacement = useCallback(async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      const result = await loadPlacementStateFromFile();
      if (result?.cancelled) return;
      if (result?.success && result.data) {
        const nextState = normalizeLoadedState(result.data);
        setState(nextState);
        window.alert(`Simulation chargée (${result.filename ?? 'fichier'}).`);
      } else {
        window.alert(result?.message || 'Impossible de charger ce fichier.');
      }
    } finally {
      setActionInProgress(false);
    }
  }, [actionInProgress]);

  useEffect(() => {
    const saveListener = () => handleSavePlacement();
    const loadListener = () => handleLoadPlacement();
    window.addEventListener(PLACEMENT_SAVE_EVENT, saveListener);
    window.addEventListener(PLACEMENT_LOAD_EVENT, loadListener);
    return () => {
      window.removeEventListener(PLACEMENT_SAVE_EVENT, saveListener);
      window.removeEventListener(PLACEMENT_LOAD_EVENT, loadListener);
    };
  }, [handleSavePlacement, handleLoadPlacement]);

  // Calculs
  const results = useMemo(() => {
    if (!hydrated || loading || error) return null;

    // Ajouter le taux DMTG choisi aux fiscalParams
    const fpWithDmtg = { ...fiscalParams, dmtgTauxChoisi: state.transmission.dmtgTaux };

    // Transformer les produits vers le format moteur
    const engineProduct1 = buildEngineProduct(state.products[0]);
    const engineProduct2 = buildEngineProduct(state.products[1]);

    const liquidationParams1 = {
      ...state.liquidation,
      rendement: getRendementLiquidation(state.products[0]) ?? undefined,
    };
    const liquidationParams2 = {
      ...state.liquidation,
      rendement: getRendementLiquidation(state.products[1]) ?? undefined,
    };

    const result1 = simulateComplete(
      engineProduct1,
      state.client,
      liquidationParams1,
      { ...state.transmission, agePremierVersement: state.client.ageActuel },
      fpWithDmtg
    );

    const result2 = simulateComplete(
      engineProduct2,
      state.client,
      liquidationParams2,
      { ...state.transmission, agePremierVersement: state.client.ageActuel },
      fpWithDmtg
    );

    return compareProducts(result1, result2);
  }, [state, fiscalParams, loading, hydrated, error]);

  // Helpers pour mise à jour du state
  const setClient = (patch) => setState((s) => ({ ...s, client: { ...s.client, ...patch } }));
  const setProduct = (i, patch) => setState((s) => ({
    ...s,
    products: s.products.map((p, k) => (k === i ? { ...p, ...patch } : p)),
  }));
  const setLiquidation = (patch) => setState((s) => ({ ...s, liquidation: { ...s.liquidation, ...patch } }));
  const setTransmission = (patch) => setState((s) => ({ ...s, transmission: { ...s.transmission, ...patch } }));
  const setStep = (step) => setState((s) => ({ ...s, step }));

  const setVersementConfig = (productIndex, config) => {
    const normalized = normalizeVersementConfig(config);
    setState((s) => ({
      ...s,
      products: s.products.map((p, idx) =>
        idx === productIndex ? { ...p, versementConfig: normalized } : p
      ),
    }));
  };

  const updateProductOption = (productIndex, path, value) => {
    setState(prev => {
      const newState = { ...prev };
      const pathParts = path.split('.');
      let current = newState.products[productIndex];
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      
      current[pathParts[pathParts.length - 1]] = value;
      return newState;
    });
  };

  // Export Excel
  const exportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      await exportPlacementExcel(state, results);
    } catch (e) {
      console.error("[ExcelExport] Export failed", { 
        err: e, 
        message: e?.message, 
        stack: e?.stack 
      });
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [state, results]);

  const { produit1, produit2 } = results || { produit1: null, produit2: null, deltas: {} };
  const psDecesProduit1 = produit1?.transmission?.psDeces;
  const psDecesProduit2 = produit2?.transmission?.psDeces;
  const hasTransmissionData = Boolean(produit1 || produit2);

  const assietteDmtgProduit1 = (produit1?.transmission?.taxeDmtg || 0) > 0
    ? (produit1?.transmission?.assiette || 0)
    : 0;
  const assietteDmtgProduit2 = (produit2?.transmission?.taxeDmtg || 0) > 0
    ? (produit2?.transmission?.assiette || 0)
    : 0;

  const dmtgConsumptionRatioProduit1 = computeDmtgConsumptionRatio(
    assietteDmtgProduit1,
    selectedDmtgTrancheWidth,
  );
  const dmtgConsumptionRatioProduit2 = computeDmtgConsumptionRatio(
    assietteDmtgProduit2,
    selectedDmtgTrancheWidth,
  );

  const showDmtgDisclaimer =
    shouldShowDmtgDisclaimer(assietteDmtgProduit1, selectedDmtgTrancheWidth) ||
    shouldShowDmtgDisclaimer(assietteDmtgProduit2, selectedDmtgTrancheWidth);

  const dmtgConsumptionPercentProduit1 = Math.min(100, Math.round(dmtgConsumptionRatioProduit1 * 100));
  const dmtgConsumptionPercentProduit2 = Math.min(100, Math.round(dmtgConsumptionRatioProduit2 * 100));

  // État pour le toggle "Afficher toutes les colonnes"
  const [showAllColumns, setShowAllColumns] = useState(false);

  const detailRows1 = produit1 ? withReinvestCumul(produit1.epargne.rows) : [];
  const detailRows2 = produit2 ? withReinvestCumul(produit2.epargne.rows) : [];

  const columnsProduit1 = getRelevantColumnsEpargne(detailRows1, getBaseColumnsForProduct(produit1), showAllColumns);
  const columnsProduit2 = getRelevantColumnsEpargne(detailRows2, getBaseColumnsForProduct(produit2), showAllColumns);

  // Loading / Error (placés après les hooks pour respecter les Rules of Hooks)
  if (error) {
    return (
      <div className="ir-panel placement-page">
        <div className="ir-header">
          <div className="ir-title">Erreur</div>
          <div className="pl-error">{error}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="ir-panel placement-page premium-page">
      {/* Header */}
      <div className="ir-header pl-header premium-header">
        <div className="pl-header-main">
          <div className="ir-title premium-title">Comparer deux placements</div>
          <div className="pl-subtitle premium-subtitle">
            Épargne → Liquidation → Transmission
          </div>
        </div>

        <div className="pl-header-actions">
          <ExportMenu
            options={[
              { label: 'Excel', onClick: exportExcel, disabled: !results || !results.produit1 },
              { label: 'PowerPoint', onClick: () => {}, disabled: true, tooltip: 'bientôt' },
            ]}
            loading={exportLoading}
          />
        </div>
      </div>

      {/* Navigation par phases */}
      <div className="pl-phase-nav">
        {['epargne', 'liquidation', 'transmission'].map((s) => (
          <button
            key={s}
            className={`pl-phase-tab ${state.step === s ? 'is-active' : ''}`}
            onClick={() => setStep(s)}
          >
            {s === 'epargne' && 'Phase d\'épargne'}
            {s === 'liquidation' && 'Phase de liquidation'}
            {s === 'transmission' && 'Phase de transmission'}
          </button>
        ))}
      </div>

      <div className="ir-grid">
        {/* LEFT PANEL */}
        <div className="ir-left">
          {/* Paramètres client */}
          <div className="ir-table-wrapper premium-card premium-section">
            <div className="pl-section-title premium-section-title">Profil client</div>
            <div className="pl-topgrid premium-grid-4">
              <InputNumber
                label="Âge actuel"
                value={state.client.ageActuel}
                onChange={(v) => setClient({ ageActuel: v })}
                unit="ans"
                min={18}
                max={90}
              />
              <Select
                label="TMI actuel"
                value={state.client.tmiEpargne}
                onChange={(v) => setClient({ tmiEpargne: parseFloat(v) })}
                options={tmiOptions}
              />
              <Select
                label="TMI retraite"
                value={state.client.tmiRetraite}
                onChange={(v) => setClient({ tmiRetraite: parseFloat(v) })}
                options={tmiOptions}
              />
              <Select
                label="Situation"
                value={state.client.situation}
                onChange={(v) => setClient({ situation: v })}
                options={[
                  { value: 'single', label: 'Célibataire' },
                  { value: 'couple', label: 'Marié / Pacsé' },
                ]}
              />
            </div>
          </div>

          {/* Phase Épargne */}
          {state.step === 'epargne' && (
            <div className="ir-table-wrapper premium-card premium-section">
              <div className="pl-section-title premium-section-title">Phase d'épargne</div>
              <table className="ir-table pl-table premium-table">
                <thead>
                  <tr>
                    <th></th>
                    <th className="pl-colhead" aria-label="Produit 1">
                      <div className="pl-colbadge-wrapper">
                        <div className="pl-collabel pl-collabel--product1">{ENVELOPE_LABELS[state.products[0].envelope]}</div>
                      </div>
                    </th>
                    <th className="pl-colhead" aria-label="Produit 2">
                      <div className="pl-colbadge-wrapper">
                        <div className="pl-collabel pl-collabel--product2">{ENVELOPE_LABELS[state.products[1].envelope]}</div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Enveloppe</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <select
                          className="pl-select"
                          value={p.envelope}
                          onChange={(e) => setProduct(i, { envelope: e.target.value })}
                        >
                          {Object.entries(ENVELOPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Durée de la phase épargne</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <InputNumber
                          value={p.dureeEpargne}
                          onChange={(v) => setProduct(i, { dureeEpargne: v })}
                          unit="ans"
                          min={1}
                          max={50}
                        />
                      </td>
                    ))}
                  </tr>
                  {(state.products[0].envelope === 'PER' || state.products[1].envelope === 'PER') && (
                    <tr>
                      <td>PER bancaire (CTO)</td>
                      {state.products.map((p, i) => (
                        <td key={i} style={{ textAlign: 'center' }}>
                          {p.envelope === 'PER' ? (
                            <Toggle
                              checked={p.perBancaire}
                              onChange={(v) => setProduct(i, { perBancaire: v })}
                              label=""
                            />
                          ) : (
                            <span className="pl-muted">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                  {(state.products[0].envelope === 'CTO' || state.products[1].envelope === 'CTO') && (
                    <tr>
                      <td>Option dividendes au barème IR</td>
                      {state.products.map((p, i) => (
                        <td key={i} style={{ textAlign: 'center' }}>
                          {p.envelope === 'CTO' ? (
                            <Toggle
                              checked={p.optionBaremeIR}
                              onChange={(v) => setProduct(i, { optionBaremeIR: v })}
                              label=""
                            />
                          ) : (
                            <span className="pl-muted">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr>
                    <td>
                      Paramétrer les versements
                      <div className="pl-detail-cumul">Initial, annuel, allocation, frais</div>
                    </td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <button 
                          className="pl-btn pl-btn--config"
                          onClick={() => setModalOpen(i)}
                        >
                          <span className="pl-btn__icon">⚙</span>
                          <span className="pl-btn__summary">
                            {shortEuro(p.versementConfig.initial.montant)} + {shortEuro(p.versementConfig.annuel.montant)}/an
                          </span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* Détail année par année */}
              {produit1 && produit2 && (
                <div className="pl-details-section">
                  <div className="pl-details-toolbar">
                    <label className="pl-details-toggle">
                      <input 
                        type="checkbox" 
                        checked={showAllColumns} 
                        onChange={(e) => setShowAllColumns(e.target.checked)} 
                      />
                      Afficher toutes les colonnes
                    </label>
                  </div>
                  <div className="pl-details-scroll">
                    <CollapsibleTable
                      title={`Détail ${produit1.envelopeLabel}`}
                      rows={detailRows1}
                      columns={columnsProduit1}
                      renderRow={renderEpargneRow(produit1, columnsProduit1)}
                    />
                  </div>
                  <div className="pl-details-scroll">
                    <CollapsibleTable
                      title={`Détail ${produit2.envelopeLabel}`}
                      rows={detailRows2}
                      columns={columnsProduit2}
                      renderRow={renderEpargneRow(produit2, columnsProduit2)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase Liquidation */}
          {state.step === 'liquidation' && (
            <div className="ir-table-wrapper premium-card premium-section">
              <div className="pl-section-title premium-section-title">Phase de liquidation</div>
              <table className="ir-table pl-table premium-table">
                <tbody>
                  <tr>
                    <td>Stratégie de retraits</td>
                    <td colSpan={2}>
                      <select
                        className="pl-select"
                        value={state.liquidation.mode}
                        onChange={(e) => setLiquidation({ mode: e.target.value })}
                      >
                        <option value="epuiser">Épuiser sur N années</option>
                        <option value="mensualite">Mensualité cible</option>
                        <option value="unique">Retrait unique</option>
                      </select>
                    </td>
                  </tr>
                  {state.liquidation.mode === 'epuiser' && (
                    <tr>
                      <td>Durée de liquidation</td>
                      <td colSpan={2}>
                        <InputNumber
                          value={state.liquidation.duree}
                          onChange={(v) => setLiquidation({ duree: v })}
                          unit="ans"
                          min={1}
                          max={50}
                          inline
                        />
                      </td>
                    </tr>
                  )}

                  {(state.products[0].envelope !== 'SCPI' || state.products[1].envelope !== 'SCPI') && (
                    <tr>
                      <td>
                        Rendement capitalisation (liquidation)
                        <div className="pl-detail-cumul">Valeur par défaut : rendement capitalisation du modal</div>
                      </td>
                      {state.products.map((p, i) => (
                        <td key={i} style={{ opacity: p.envelope === 'SCPI' ? 0.55 : 0.85 }}>
                          {p.envelope === 'SCPI' ? (
                            '—'
                          ) : (
                            <InputPct
                              value={getRendementLiquidation(p) || 0}
                              onChange={(v) => setProduct(i, { rendementLiquidationOverride: v })}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                  {state.liquidation.mode === 'mensualite' && (
                    <tr>
                      <td>Mensualité cible</td>
                      <td colSpan={2}>
                        <InputEuro
                          value={state.liquidation.mensualiteCible}
                          onChange={(v) => setLiquidation({ mensualiteCible: v })}
                        />
                      </td>
                    </tr>
                  )}
                  {state.liquidation.mode === 'unique' && (
                    <tr>
                      <td>Montant du retrait</td>
                      <td colSpan={2}>
                        <InputEuro
                          value={state.liquidation.montantUnique}
                          onChange={(v) => setLiquidation({ montantUnique: v })}
                        />
                      </td>
                    </tr>
                  )}
                  {/* Option au barème IR - Une seule ligne avec checkboxes */}
                  {(produit1 && (produit1.envelope === 'CTO' || produit1.envelope === 'AV' || produit1.envelope === 'PEA')) ||
                   (produit2 && (produit2.envelope === 'CTO' || produit2.envelope === 'AV' || produit2.envelope === 'PEA')) ? (
                    <tr>
                      <td>Option au barème IR</td>
                      <td style={{ textAlign: 'center' }}>
                        {produit1 && (produit1.envelope === 'CTO' || produit1.envelope === 'AV' || produit1.envelope === 'PEA') ? (
                          <Toggle
                            checked={produit1.liquidation.optionBaremeIR}
                            onChange={(v) => updateProductOption(0, 'liquidation.optionBaremeIR', v)}
                            label=""
                          />
                        ) : (
                          <span className="pl-muted">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {produit2 && (produit2.envelope === 'CTO' || produit2.envelope === 'AV' || produit2.envelope === 'PEA') ? (
                          <Toggle
                            checked={produit2.liquidation.optionBaremeIR}
                            onChange={(v) => updateProductOption(1, 'liquidation.optionBaremeIR', v)}
                            label=""
                          />
                        ) : (
                          <span className="pl-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              {/* Détail année par année - masquer les lignes après le décès */}
              {produit1 && produit2 && (
                <div className="pl-details-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--color-c1)' }}>Détail année par année</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-c9)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={showAllColumns}
                        onChange={(e) => setShowAllColumns(e.target.checked)}
                        style={{ margin: 0 }}
                      />
                      Afficher toutes les colonnes
                    </label>
                  </div>
                  <CollapsibleTable
                    title={`Détail ${produit1.envelopeLabel}`}
                    rows={produit1.liquidation.rows.filter(r => r.age <= produit1.liquidation.ageAuDeces)}
                    columns={getRelevantColumns(produit1.liquidation.rows, buildColumns(produit1), showAllColumns)}
                    renderRow={(r, i) => (
                      <tr key={i} className={r.isAgeAuDeces ? 'pl-row-deces' : ''}>
                        <td>{r.age} ans {r.isAgeAuDeces && '†'}</td>
                        {produit1.envelope === 'SCPI' ? (
                          <>
                            <td>{euro(r.capitalDebut)}</td>
                            <td>{euro(r.retraitBrut)}</td>
                            <td>{euro(r.fiscaliteTotal)}</td>
                            <td>{euro(r.retraitNet)}</td>
                            <td>{euro(r.capitalFin)}</td>
                          </>
                        ) : ['CTO', 'PEA'].includes(produit1.envelope) ? (
                          <>
                            <td>{euro(r.capitalDebut)}</td>
                            <td>{euro(r.retraitBrut)}</td>
                            <td>{euro(r.pvLatenteDebut ?? 0)}</td>
                            <td>{euro(r.fiscaliteTotal)}</td>
                            <td>{euro(r.retraitNet)}</td>
                            <td>{euro(r.pvLatenteFin ?? r.totalInteretsRestants ?? 0)}</td>
                            <td>{euro(r.capitalFin)}</td>
                          </>
                        ) : (
                          <>
                            <td>
                              {euro(r.capitalDebut)}
                              <div className="pl-detail-cumul">+{euro(r.gainsAnnee)} intérêts</div>
                              {/* Afficher le cumul des revenus nets réinvestis */}
                              <div className="pl-detail-cumul">Cumul : {euro(r.cumulRevenusNetsPercus || 0)}</div>
                            </td>
                            <td>{euro(r.retraitBrut)}</td>
                            <td>
                              {euro(r.partGains)}
                              <div className="pl-detail-cumul">Reste : {euro(r.totalInteretsRestants)}</div>
                            </td>
                            <td>
                              {euro(r.partCapital)}
                              <div className="pl-detail-cumul">Reste : {euro(r.totalCapitalRestant)}</div>
                            </td>
                            <td>{euro(r.fiscaliteTotal)}</td>
                            <td>{euro(r.retraitNet)}</td>
                            {/* Ajouter la colonne "Capital décès théorique" pour les PER */}
                            {produit2.envelope === 'PER' && produit2?.versementConfig?.annuel?.garantieBonneFin?.active && (
                              <td>{euro(r.capitalDecesTheorique || 0)}</td>
                            )}
                            <td>{euro(r.capitalFin)}</td>
                          </>
                        )}
                      </tr>
                    )}
                  />
                  <CollapsibleTable
                    title={`Détail ${produit2.envelopeLabel}`}
                    rows={produit2.liquidation.rows.filter(r => r.age <= produit2.liquidation.ageAuDeces)}
                    columns={getRelevantColumns(produit2.liquidation.rows, buildColumns(produit2), showAllColumns)}
                    renderRow={(r, i) => (
                      <tr key={i} className={r.isAgeAuDeces ? 'pl-row-deces' : ''}>
                        <td>{r.age} ans {r.isAgeAuDeces && '†'}</td>
                        {produit2.envelope === 'SCPI' ? (
                          <>
                            <td>{euro(r.capitalDebut)}</td>
                            <td>{euro(r.retraitBrut)}</td>
                            <td>{euro(r.fiscaliteTotal)}</td>
                            <td>{euro(r.retraitNet)}</td>
                            <td>{euro(r.capitalFin)}</td>
                          </>
                        ) : ['CTO', 'PEA'].includes(produit2.envelope) ? (
                          <>
                            <td>{euro(r.capitalDebut)}</td>
                            <td>{euro(r.retraitBrut)}</td>
                            <td>{euro(r.pvLatenteDebut ?? 0)}</td>
                            <td>{euro(r.fiscaliteTotal)}</td>
                            <td>{euro(r.retraitNet)}</td>
                            <td>{euro(r.pvLatenteFin ?? r.totalInteretsRestants ?? 0)}</td>
                            <td>{euro(r.capitalFin)}</td>
                          </>
                        ) : (
                          <>
                            <td>
                              {euro(r.capitalDebut)}
                              <div className="pl-detail-cumul">+{euro(r.gainsAnnee)} intérêts</div>
                              {/* Afficher le cumul des revenus nets réinvestis */}
                              <div className="pl-detail-cumul">Cumul : {euro(r.cumulRevenusNetsPercus || 0)}</div>
                            </td>
                            <td>{euro(r.retraitBrut)}</td>
                            <td>
                              {euro(r.partGains)}
                              <div className="pl-detail-cumul">Reste : {euro(r.totalInteretsRestants)}</div>
                            </td>
                            <td>
                              {euro(r.partCapital)}
                              <div className="pl-detail-cumul">Reste : {euro(r.totalCapitalRestant)}</div>
                            </td>
                            <td>{euro(r.fiscaliteTotal)}</td>
                            <td>{euro(r.retraitNet)}</td>
                            {/* Ajouter la colonne "Capital décès théorique" pour les PER */}
                            {produit2.envelope === 'PER' && produit2?.versementConfig?.annuel?.garantieBonneFin?.active && (
                              <td>{euro(r.capitalDecesTheorique || 0)}</td>
                            )}
                            <td>{euro(r.capitalFin)}</td>
                          </>
                        )}
                      </tr>
                    )}
                  />
                </div>
              )}
              <div className="pl-hint">
                <a href="/settings/fiscalites-contrats" style={{ color: 'var(--color-c2)', fontSize: 11 }}>Consulter la fiscalité des contrats →</a>
              </div>
            </div>
          )}

          {/* Phase Transmission */}
          {state.step === 'transmission' && (
            <>
            <div className="ir-table-wrapper premium-card premium-section">
              <div className="pl-section-title premium-section-title">Transmission</div>
              <table className="ir-table pl-table premium-table">
                <tbody>
                  <tr>
                    <td>Âge au décès (simulation)</td>
                    <td colSpan={2}>
                      <div className="pl-field-container" style={{ alignItems: 'flex-end' }}>
                        <InputNumber
                          value={state.transmission.ageAuDeces}
                          onChange={(v) => setTransmission({ ageAuDeces: v })}
                          unit="ans"
                          min={state.client.ageActuel}
                          max={120}
                          inline
                        />
                        <div className="pl-field-help" style={{ textAlign: 'right', alignSelf: 'flex-end' }}>
                          Minimum : {state.client.ageActuel} ans (âge actuel)
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Choix du bénéficiaire</td>
                    <td colSpan={2}>
                      <select
                        className="pl-select"
                        value={state.transmission.beneficiaryType || 'enfants'}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'conjoint') {
                            setTransmission({ beneficiaryType: value, nbBeneficiaires: 1 });
                          } else {
                            setTransmission({ beneficiaryType: value });
                          }
                        }}
                      >
                        {BENEFICIARY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {state.transmission.beneficiaryType !== 'conjoint' && (
                    <tr>
                      <td>Nombre de bénéficiaires</td>
                      <td colSpan={2}>
                        <InputNumber
                          value={state.transmission.nbBeneficiaires}
                          onChange={(v) => setTransmission({ nbBeneficiaires: v })}
                          min={1}
                          max={10}
                          inline
                        />
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td>Tranche DMTG estimée</td>
                    <td colSpan={2}>
                      <select
                        className="pl-select"
                        value={state.transmission.dmtgTaux}
                        onChange={(e) => {
                          const nextValue = parseFloat(e.target.value);
                          if (Number.isNaN(nextValue)) return;
                          setTransmission({ dmtgTaux: nextValue });
                        }}
                      >
                        {dmtgSelectOptions.map((option) => (
                          <option key={option.key || option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {showDmtgDisclaimer && (
                    <tr>
                      <td colSpan={3}>
                        <div className="pl-alert pl-alert--warning">
                          ⚠️ Consommation estimée de la tranche DMTG (sur l’assiette réellement soumise aux DMTG) <sup>(1)</sup> :
                          <div style={{ marginTop: 6 }}>
                            <div>
                              Placement 1 : {dmtgConsumptionPercentProduit1}%
                            </div>
                            <div>
                              Placement 2 : {dmtgConsumptionPercentProduit2}%
                            </div>
                          </div>
                          <div style={{ marginTop: 6 }}>
                            Pensez à ajuster la tranche DMTG pour refléter l’ensemble du patrimoine.
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Tableau détaillé des droits de succession */}
              <div className="pl-section-title premium-section-title" style={{ marginTop: 24 }}>Détail des droits de succession</div>
              <table className="ir-table pl-table premium-table pl-table--transmission-compact">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Capital transmis</th>
                    <th>Abattement</th>
                    <th>Assiette</th>
                    <th>PS</th>
                    <th>Taxes (Forfaitaire + DMTG)</th>
                    <th>Net transmis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{produit1?.envelopeLabel || 'Produit 1'}</td>
                    <td>{euro(produit1?.transmission?.capitalTransmis || 0)}</td>
                    <td>{euro(produit1?.transmission?.abattement || 0)}</td>
                    <td>{euro(produit1?.transmission?.assiette || 0)}</td>
                    <td>{formatPsMontant(psDecesProduit1, euro)}</td>
                    <td>{euro((produit1?.transmission?.taxeForfaitaire || 0) + (produit1?.transmission?.taxeDmtg || 0))}</td>
                    <td><strong>{euro(produit1?.transmission?.capitalTransmisNet || 0)}</strong></td>
                  </tr>
                  <tr>
                    <td>{produit2?.envelopeLabel || 'Produit 2'}</td>
                    <td>{euro(produit2?.transmission?.capitalTransmis || 0)}</td>
                    <td>{euro(produit2?.transmission?.abattement || 0)}</td>
                    <td>{euro(produit2?.transmission?.assiette || 0)}</td>
                    <td>{formatPsMontant(psDecesProduit2, euro)}</td>
                    <td>{euro((produit2?.transmission?.taxeForfaitaire || 0) + (produit2?.transmission?.taxeDmtg || 0))}</td>
                    <td><strong>{euro(produit2?.transmission?.capitalTransmisNet || 0)}</strong></td>
                  </tr>
                  {!hasTransmissionData && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-c8)', fontStyle: 'italic' }}>
                        Aucune donnée à afficher - Configurez les paramètres de transmission ci-dessus
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pl-disclaimer pl-transmission-info-card">
              <strong>Régimes applicables :</strong>
              <ul>
                <li>AV : 990 I (versements avant 70 ans) ou 757 B (après 70 ans)</li>
                <li>PER assurance : 990 I (décès avant 70 ans) ou 757 B (décès ≥ 70 ans)</li>
                <li>PER bancaire / CTO / PEA / SCPI : intégration à l'actif successoral (DMTG)</li>
                <li>Conjoint / partenaire PACS : exonération du prélèvement 20 % et des DMTG</li>
              </ul>
              <p>
                <a href="/settings/impots" className="pl-transmission-info-card__link">Consulter le barème DMTG →</a>
              </p>
              <strong>Hypothèses PS décès :</strong>
              <p>
                Assurance-vie & PER simulés à 100 % en unités de compte (pas de fonds €). Les PS au décès sont appliqués au taux de {psSettings?.patrimony?.current?.totalRate ?? 17.2}% (<a href="/settings/prelevements" className="pl-transmission-info-card__link">paramétrable</a>), puis les montants nets alimentent les DMTG.
              </p>
              <p className="pl-transmission-info-card__note">
                La détermination de l’assiette taxable au prélèvement 990&nbsp;I s’effectue après imputation des PS dus sur les produits du contrat, prélevés par l’assureur au décès (BOI-TCAS-AUT-60).
              </p>
              <p className="pl-transmission-info-card__footnote"><sup>(1)</sup> Seuls les montants réellement soumis aux PS/DMTG sont utilisés pour les pourcentages affichés.</p>
            </div>
            </>
          )}
        </div>

        {/* RIGHT PANEL - Synthèse unifiée */}
        <div className="ir-right">
          <div className="ir-synthesis-card premium-card">
            <div className="pl-card-title premium-section-title">Synthèse comparative</div>

            {loading ? (
              <div className="pl-synthesis-placeholder">Chargement…</div>
            ) : !hydrated || !results ? (
              <div className="pl-synthesis-placeholder">Aucune simulation (recharger ou compléter Produit 1/2)</div>
            ) : !produit1 || !produit2 ? (
              <div className="pl-synthesis-placeholder">Sélectionne Produit 1 et Produit 2…</div>
            ) : (
              <>
                {/* Timeline visuelle du parcours */}
                <TimelineBar
                  ageActuel={state.client.ageActuel}
                  ageDebutLiquidation={state.client.ageActuel + state.products[0].dureeEpargne}
                  ageAuDeces={state.transmission.ageAuDeces}
                />

                {/* Trait séparateur avant ROI */}
                <div style={{ borderTop: '1px solid var(--color-c6)', margin: '12px 0' }} />

                {/* Calcul du ROI pour chaque produit */}
                {(() => {
                  const totalGains1 = produit1.totaux.revenusNetsLiquidation + produit1.totaux.capitalTransmisNet;
                  const totalGains2 = produit2.totaux.revenusNetsLiquidation + produit2.totaux.capitalTransmisNet;
                  const roi1 = produit1.totaux.effortReel > 0 ? totalGains1 / produit1.totaux.effortReel : 0;
                  const roi2 = produit2.totaux.effortReel > 0 ? totalGains2 / produit2.totaux.effortReel : 0;
                  const meilleurProduit = roi1 > roi2 ? 1 : 2;

                  return (
                    <>
                      {/* Comparaison ROI - 2 colonnes */}
                      <div className="pl-roi-compare">
                        <div className="pl-roi-compare__title">ROI</div>
                        <div className="pl-roi-compare__grid">
                          <div className={`pl-roi-compare__card ${meilleurProduit === 1 ? 'is-winner' : ''}`}>
                            <div className="pl-roi-compare__product-indicator" style={{ background: 'var(--color-c2)' }}></div>
                            <div className="pl-roi-compare__product">{produit1.envelopeLabel.replace('PER individuel déductible', 'PER individuel')}</div>
                            <div className="pl-roi-compare__ratio">× {roi1.toFixed(2)}</div>
                          </div>
                          <div className={`pl-roi-compare__card ${meilleurProduit === 2 ? 'is-winner' : ''}`}>
                            <div className="pl-roi-compare__product-indicator" style={{ background: 'var(--color-c4)' }}></div>
                            <div className="pl-roi-compare__product">{produit2.envelopeLabel.replace('PER individuel déductible', 'PER individuel')}</div>
                            <div className="pl-roi-compare__ratio">× {roi2.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Tableau comparatif */}
                      <div className="pl-kpi-compare">
                        <div className="pl-kpi-compare__header-empty"></div>
                        <div className="pl-kpi-compare__header">
                          <div className="pl-kpi-compare__indicator" style={{ background: 'var(--color-c2)' }}>1</div>
                        </div>
                        <div className="pl-kpi-compare__header">
                          <div className="pl-kpi-compare__indicator" style={{ background: 'var(--color-c4)' }}>2</div>
                        </div>

                        <div className="pl-kpi-compare__label">Effort total</div>
                        <div className="pl-kpi-compare__value">{shortEuro(produit1.totaux.effortReel)}</div>
                        <div className="pl-kpi-compare__value">{shortEuro(produit2.totaux.effortReel)}</div>

                        <div className="pl-kpi-compare__label">Capital acquis</div>
                        <div className="pl-kpi-compare__value">{shortEuro(produit1.epargne.capitalAcquis)}</div>
                        <div className="pl-kpi-compare__value">{shortEuro(produit2.epargne.capitalAcquis)}</div>

                        <div className="pl-kpi-compare__label">Revenus nets</div>
                        <div className="pl-kpi-compare__value">{shortEuro(produit1.totaux.revenusNetsLiquidation)}</div>
                        <div className="pl-kpi-compare__value">{shortEuro(produit2.totaux.revenusNetsLiquidation)}</div>

                        <div className="pl-kpi-compare__label">Transmis net</div>
                        <div className="pl-kpi-compare__value">{shortEuro(produit1.totaux.capitalTransmisNet)}</div>
                        <div className="pl-kpi-compare__value">{shortEuro(produit2.totaux.capitalTransmisNet)}</div>

                        <div className="pl-kpi-compare__separator"></div>
                        <div className="pl-kpi-compare__separator"></div>
                        <div className="pl-kpi-compare__separator"></div>

                        <div className="pl-kpi-compare__label pl-kpi-compare__label--total">Total récupéré</div>
                        <div className="pl-kpi-compare__value pl-kpi-compare__value--total">{shortEuro(totalGains1)}</div>
                        <div className="pl-kpi-compare__value pl-kpi-compare__value--total">{shortEuro(totalGains2)}</div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de configuration des versements */}
      {modalOpen !== null && (
        <VersementConfigModal
          envelope={state.products[modalOpen].envelope}
          config={state.products[modalOpen].versementConfig}
          dureeEpargne={state.products[modalOpen].dureeEpargne}
          onSave={(config) => {
            try {
              setVersementConfig(modalOpen, config);
              setModalOpen(null);
            } catch (error) {
              console.error('[PlacementV2] Error in onSave handler:', error);
            }
          }}
          onClose={() => setModalOpen(null)}
        />
      )}
    </div>
  );
}
