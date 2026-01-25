/**
 * PlacementV2.jsx - Simulateur de placement refondu
 * 
 * Architecture :
 * - Moteur de calcul découplé (placementEngine.js)
 * - Settings-driven (hook usePlacementSettings)
 * - 3 phases : Épargne → Liquidation → Transmission
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlacementSettings } from '../hooks/usePlacementSettings.js';
import {
  ENVELOPES,
  ENVELOPE_LABELS,
  simulateComplete,
  compareProducts,
} from '../engine/placementEngine.js';
import './Placement.css';
import { DEFAULT_VERSEMENT_CONFIG, normalizeVersementConfig } from '../utils/versementConfig.js';
import { onResetEvent, storageKeyFor } from '../utils/reset.js';
import { PLACEMENT_SAVE_EVENT, PLACEMENT_LOAD_EVENT } from '../utils/placementEvents.js';
import { buildWorksheetXml, buildWorksheetXmlVertical, downloadExcel } from '../utils/exportExcel.js';
import { savePlacementState, loadPlacementStateFromFile } from '../utils/placementPersistence.js';
import { TimelineBar } from '../components/TimelineBar.jsx';
import { computeDmtgConsumptionRatio, shouldShowDmtgDisclaimer } from '../utils/transmissionDisclaimer.js';

// ============================================================================
// HELPERS
// ============================================================================

const fmt = (n) => Math.round(n).toLocaleString('fr-FR');
const euro = (n) => `${fmt(n)} €`;
const pct = (n) => `${(n * 100).toFixed(1).replace('.', ',')} %`;
const EPSILON = 1e-6;
const formatPercentValue = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1).replace('.', ',')} %`;
};

const formatPsApplicability = (ps) => (ps?.applicable ? 'Oui' : 'Non');
const formatPsAssiette = (ps, formatter) => (ps?.applicable ? formatter(ps.assiette || 0) : '—');
const formatPsTaux = (ps) => (ps?.applicable && typeof ps?.taux === 'number' ? formatPercentValue(ps.taux) : '—');
const formatPsMontant = (ps, formatter) => (ps?.applicable ? formatter(ps.montant || 0) : '—');
const formatPsNote = (ps) => ps?.note || '—';
const getPsAssietteNumeric = (ps) => (ps?.applicable ? ps.assiette || 0 : 0);
const getPsTauxNumeric = (ps) => (ps?.applicable && typeof ps?.taux === 'number' ? ps.taux : 0);
const getPsMontantNumeric = (ps) => (ps?.applicable ? ps.montant || 0 : 0);

const shortEuro = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M€`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k€`;
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
};

function withReinvestCumul(rows = []) {
  let cumul = 0;
  return rows.map((row) => {
    const montant = row.reinvestissementDistribNetAnnee ?? 0;
    cumul += montant;
    return { ...row, cumulReinvestissement: cumul };
  });
}

const DEFAULT_PRODUCT = {
  envelope: 'AV',
  dureeEpargne: 20,
  perBancaire: false,
  optionBaremeIR: false,
  fraisGestion: 0.01,
  rendementLiquidationOverride: null,
  versementConfig: normalizeVersementConfig(DEFAULT_VERSEMENT_CONFIG),
};

function normalizeProduct(product = {}) {
  return {
    ...DEFAULT_PRODUCT,
    ...product,
    versementConfig: normalizeVersementConfig(
      product.versementConfig || DEFAULT_VERSEMENT_CONFIG
    ),
  };
}

function sanitizeStep(step) {
  const allowed = new Set(['epargne', 'liquidation', 'transmission', 'synthese']);
  return allowed.has(step) ? step : 'epargne';
}

function normalizeLoadedState(payload = {}) {
  const products = Array.isArray(payload.products) ? payload.products : [];
  const product1 = normalizeProduct(products[0]);
  const product2 = normalizeProduct(products[1]);

  return {
    step: sanitizeStep(payload.step),
    client: { ...DEFAULT_CLIENT, ...(payload.client || {}) },
    products: [product1, product2],
    liquidation: { ...DEFAULT_LIQUIDATION, ...(payload.liquidation || {}) },
    transmission: { ...DEFAULT_TRANSMISSION, ...(payload.transmission || {}) },
  };
}

function buildPersistedState(state) {
  return {
    step: state.step,
    client: state.client,
    products: state.products,
    liquidation: state.liquidation,
    transmission: state.transmission,
  };
}

function getRendementLiquidation(product) {
  if (!product || product.envelope === 'SCPI') return null;
  const override = product.rendementLiquidationOverride;
  if (typeof override === 'number') return override;
  return product.versementConfig?.capitalisation?.rendementAnnuel ?? 0.03;
}

const STRATEGIE_COMPTE_ESPECE_OPTIONS = {
  apprehender: 'Appréhender chaque année',
  stocker: 'Stocker',
  reinvestir: 'Réinvestir chaque année',
};

const ALLOCATION_OPTIONS = {
  capitalisation: 'Capitalisation',
  distribution: 'Distribution',
};

const DEFAULT_CLIENT = {
  ageActuel: 45,
  tmiEpargne: 0.30,
  tmiRetraite: 0.11,
  situation: 'single',
};

const DEFAULT_LIQUIDATION = {
  mode: 'epuiser',
  duree: 25,
  mensualiteCible: 500,
  montantUnique: 50000,
  optionBaremeIR: false,
};

const DEFAULT_DMTG_RATE = 0.20;

function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  const percent = value * 100;
  const decimals = Number.isInteger(percent) ? 0 : 2;
  return `${percent.toFixed(decimals)} %`;
}

function formatDmtgRange(from, to) {
  const formatEuro = (val, fallback = 0) => {
    const numeric = typeof val === 'number' ? val : fallback;
    return `${numeric.toLocaleString('fr-FR')} €`;
  };
  const fromText = formatEuro(from, 0);
  const toText = typeof to === 'number' ? formatEuro(to, 0) : '∞';
  return `${fromText} → ${toText}`;
}

function buildDmtgOptions(scale) {
  if (!Array.isArray(scale) || !scale.length) {
    return [
      {
        value: DEFAULT_DMTG_RATE,
        label: `${formatPercent(DEFAULT_DMTG_RATE)} (par défaut)`,
        rangeFrom: 0,
        rangeTo: null,
        key: 'dmtg-default',
      },
    ];
  }

  return [...scale]
    .sort((a, b) => (a?.rate ?? 0) - (b?.rate ?? 0))
    .map((tranche, idx) => {
      const rateValue = (tranche?.rate ?? 0) / 100;
      return {
        value: rateValue,
        label: `${formatPercent(rateValue)} (${formatDmtgRange(tranche?.from, tranche?.to)})`,
        rangeFrom: typeof tranche?.from === 'number' ? tranche.from : 0,
        rangeTo: typeof tranche?.to === 'number' ? tranche.to : null,
        key: `dmtg-${idx}-${rateValue}`,
      };
    });
}

function buildCustomDmtgOption(value) {
  return {
    value,
    label: `Personnalisé (${formatPercent(value)})`,
    rangeFrom: 0,
    rangeTo: null,
    key: 'dmtg-custom',
  };
}

const DEFAULT_TRANSMISSION = {
  ageAuDeces: 85,
  nbBeneficiaires: 2,
  dmtgTaux: null,
  beneficiaryType: 'enfants',
};

const BENEFICIARY_OPTIONS = [
  { value: 'conjoint', label: 'Conjoint / partenaire PACS' },
  { value: 'enfants', label: 'Enfant(s)' },
];

const DEFAULT_STATE = {
  step: 'epargne',
  client: DEFAULT_CLIENT,
  products: [
    normalizeProduct({ envelope: 'AV' }),
    normalizeProduct({ envelope: 'PER' }),
  ],
  liquidation: DEFAULT_LIQUIDATION,
  transmission: DEFAULT_TRANSMISSION,
};

// ============================================================================
// COMPONENTS
// ============================================================================

function InputEuro({ value, onChange, label, disabled }) {
  return (
    <div className="pl-field">
      {label && <label>{label}</label>}
      <div className="pl-input">
        <input
          type="text"
          className="pl-input__field"
          value={fmt(value)}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
            onChange(clean === '' ? 0 : Number(clean));
          }}
          disabled={disabled}
        />
        <span className="pl-input__unit">€</span>
      </div>
    </div>
  );
}

function formatPctInput(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '';
  return numeric.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

function parsePctInput(input) {
  const trimmed = input.trim();
  if (trimmed === '') return { numeric: null };
  const normalized = trimmed.replace(',', '.').replace(/[^\d.-]/g, '');
  if (normalized === '' || normalized === '-' || normalized === '.') {
    return { numeric: null };
  }
  const num = parseFloat(normalized);
  if (Number.isNaN(num)) return { numeric: null };
  return { numeric: num };
}

function InputPct({ value, onChange, label, disabled }) {
  const [local, setLocal] = useState(() => formatPctInput(value * 100));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocal(formatPctInput(value * 100));
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    // IMPORTANT: ne pas pousser dans le state parent pendant la frappe.
    // Sinon, une re-normalisation / re-render peut écraser la saisie.
    setLocal(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);

    const parsed = parsePctInput(local);
    const numeric = parsed.numeric;
    const clamped = numeric === null ? 0 : Math.min(100, Math.max(0, numeric));
    onChange(clamped / 100);
    setLocal(formatPctInput(clamped));
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className="pl-field">
      {label && <label>{label}</label>}
      <div className="pl-input">
        <input
          type="text"
          inputMode="decimal"
          className="pl-input__field"
          value={local}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <span className="pl-input__unit">%</span>
      </div>
    </div>
  );
}

function InputNumber({ value, onChange, label, unit, min = 0, max = 999, inline = false }) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    // Permettre la saisie libre de chiffres
    if (/^\d*$/.test(raw)) {
      setLocalValue(raw);
    }
  };

  const handleBlur = () => {
    const num = localValue === '' ? min : Number(localValue);
    const clamped = Math.min(max, Math.max(min, num));
    setLocalValue(String(clamped));
    onChange(clamped);
  };

  const inputEl = (
    <input
      type="text"
      inputMode="numeric"
      className="pl-input__field"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      style={{ width: inline ? 70 : '100%' }}
    />
  );

  if (inline) {
    return (
      <div className="pl-input">
        {inputEl}
        {unit && <span className="pl-input__unit">{unit}</span>}
      </div>
    );
  }
  return (
    <div className="pl-field">
      {label && <label>{label}</label>}
      <div className="pl-input">
        {inputEl}
        {unit && <span className="pl-input__unit">{unit}</span>}
      </div>
    </div>
  );
}

function Select({ value, onChange, options, label }) {
  return (
    <div className="pl-field">
      {label && <label>{label}</label>}
      <select className="pl-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="pl-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="pl-toggle__label">{label}</span>
    </label>
  );
}

function KpiCard({ title, value, subtitle, highlight }) {
  return (
    <div className={`pl-kpi ${highlight ? 'pl-kpi--highlight' : ''}`}>
      <div className="pl-kpi__title">{title}</div>
      <div className="pl-kpi__value">{value}</div>
      {subtitle && <div className="pl-kpi__subtitle">{subtitle}</div>}
    </div>
  );
}

function CollapsibleTable({ title, rows, columns, renderRow }) {
  const [open, setOpen] = useState(false);
  if (!rows || rows.length === 0) return null;
  return (
    <div className="pl-collapsible">
      <button className="pl-collapsible__toggle" onClick={() => setOpen(!open)}>
        {open ? '▼' : '▶'} {title} ({rows.length} années)
      </button>
      {open && (
        <table className="ir-table pl-detail-table">
          <thead>
            <tr>
              {columns.map((c, i) => <th key={i}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => renderRow(r, i))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DeltaIndicator({ value, inverse = false }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNegative = inverse ? value > 0 : value < 0;
  return (
    <span className={`pl-delta ${isPositive ? 'pl-delta--positive' : ''} ${isNegative ? 'pl-delta--negative' : ''}`}>
      {value > 0 ? '+' : ''}{shortEuro(value)}
    </span>
  );
}

// ============================================================================
// Allocation Slider Component
function AllocationSlider({ pctCapi, pctDistrib, onChange, disabled, isSCPI }) {
  const handleCapiChange = (pctCapi) => {
    onChange(pctCapi, 100 - pctCapi);
  };

  if (isSCPI) {
    return (
      <div className="pl-alloc-fixed">
        <span className="pl-alloc-badge pl-alloc-badge--distrib">100% Distribution</span>
        <span className="pl-alloc-hint">SCPI : distribution uniquement</span>
      </div>
    );
  }

  return (
    <div className="pl-alloc-slider">
      <div className="pl-alloc-labels">
        <span className="pl-alloc-label">Capitalisation</span>
        <span className="pl-alloc-label">Distribution</span>
      </div>
      <div className="pl-alloc-track">
        <input
          type="range"
          min="0"
          max="100"
          value={pctCapi}
          onChange={(e) => handleCapiChange(Number(e.target.value))}
          className="pl-alloc-range"
          disabled={disabled}
        />
        <div className="pl-alloc-fill" style={{ width: `${pctCapi}%` }} />
      </div>
      <div className="pl-alloc-values">
        <div className="pl-alloc-value">
          <input
            type="number"
            min="0"
            max="100"
            value={pctCapi}
            onChange={(e) => handleCapiChange(Number(e.target.value))}
            className="pl-alloc-input"
            disabled={disabled}
          />
          <span>%</span>
        </div>
        <div className="pl-alloc-value">
          <input
            type="number"
            min="0"
            max="100"
            value={pctDistrib}
            onChange={(e) => handleCapiChange(100 - Number(e.target.value))}
            className="pl-alloc-input"
            disabled={disabled}
          />
          <span>%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper function for updating product options (moved inside component)

function VersementConfigModal({ envelope, config, dureeEpargne, onSave, onClose }) {
  const [draft, setDraft] = useState(() => normalizeVersementConfig(config));
  
  const isSCPI = envelope === 'SCPI';
  const isPER = envelope === 'PER';
  const isPEA = envelope === 'PEA';
  const isCTO = envelope === 'CTO';
  const isAV = envelope === 'AV';
  
  // SCPI forcé en 100% distribution
  useEffect(() => {
    if (isSCPI) {
      setDraft(d => ({
        ...d,
        initial: { ...d.initial, pctCapitalisation: 0, pctDistribution: 100 },
        annuel: { ...d.annuel, pctCapitalisation: 0, pctDistribution: 100 },
        ponctuels: (d.ponctuels || []).map((p) => ({
          ...p,
          pctCapitalisation: 0,
          pctDistribution: 100,
        })),
      }));
    }
  }, [isSCPI]);

  const updateInitial = (field, value) => {
    setDraft(d => ({ ...d, initial: { ...d.initial, [field]: value } }));
  };

  const updateInitialAlloc = (capi, distrib) => {
    setDraft(d => ({ ...d, initial: { ...d.initial, pctCapitalisation: capi, pctDistribution: distrib } }));
  };

  const updateAnnuel = (field, value) => {
    setDraft(d => ({ ...d, annuel: { ...d.annuel, [field]: value } }));
  };

  const updateAnnuelAlloc = (capi, distrib) => {
    setDraft(d => ({ ...d, annuel: { ...d.annuel, pctCapitalisation: capi, pctDistribution: distrib } }));
  };

  const updateAnnuelOption = (optionName, field, value) => {
    setDraft(d => ({
      ...d,
      annuel: { ...d.annuel, [optionName]: { ...d.annuel[optionName], [field]: value } }
    }));
  };

  const updateCapitalisation = (field, value) => {
    setDraft(d => ({ ...d, capitalisation: { ...d.capitalisation, [field]: value } }));
  };

  const updateDistribution = (field, value) => {
    setDraft(d => ({ ...d, distribution: { ...d.distribution, [field]: value } }));
  };

  const addPonctuel = () => {
    setDraft(d => ({
      ...d,
      ponctuels: [...d.ponctuels, {
        annee: Math.min(5, dureeEpargne),
        montant: 5000,
        fraisEntree: draft.initial.fraisEntree,
        pctCapitalisation: isSCPI ? 0 : draft.initial.pctCapitalisation,
        pctDistribution: isSCPI ? 100 : draft.initial.pctDistribution,
      }]
    }));
  };

  const updatePonctuel = (index, field, value) => {
    setDraft(d => ({
      ...d,
      ponctuels: d.ponctuels.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const updatePonctuelAlloc = (index, capi, distrib) => {
    setDraft(d => ({
      ...d,
      ponctuels: d.ponctuels.map((p, i) => i === index 
        ? { ...p, pctCapitalisation: capi, pctDistribution: distrib } 
        : p)
    }));
  };

  const removePonctuel = (index) => {
    setDraft(d => ({ ...d, ponctuels: d.ponctuels.filter((_, i) => i !== index) }));
  };

  // Helpers
  const hasDistribution = (obj) => (obj.pctDistribution || 0) > 0;
  const hasCapitalisation = (obj) => (obj.pctCapitalisation || 0) > 0;
  const showCapiBlock = !isSCPI && (hasCapitalisation(draft.initial) || hasCapitalisation(draft.annuel) || draft.distribution.strategie === 'reinvestir_capi');
  const showDistribBlock = hasDistribution(draft.initial) || hasDistribution(draft.annuel);

  return (
    <div className="vcm-overlay" onClick={onClose}>
      <div className="vcm" onClick={e => e.stopPropagation()}>
        {/* Header Premium */}
        <div className="vcm__header">
          <div className="vcm__header-content">
            <div className="vcm__icon">💰</div>
            <div>
              <h2 className="vcm__title">Paramétrage des versements</h2>
              <p className="vcm__subtitle">{ENVELOPE_LABELS[envelope]}</p>
            </div>
          </div>
          <button className="vcm__close" onClick={onClose}>×</button>
        </div>
        
        <div className="vcm__body">
          {isAV && (
            <div className="vcm__hint" style={{ marginBottom: 12 }}>
              Hypothèse : investissement 100 % unités de compte – prélèvements sociaux dus au rachat.
            </div>
          )}
          {/* VERSEMENT INITIAL */}
          <section className="vcm__section">
            <div className="vcm__section-header">
              <div className="vcm__section-icon">1</div>
              <h3 className="vcm__section-title">Versement initial</h3>
            </div>
            
            <div className="vcm__card">
              <div className="vcm__row">
                <InputEuro label="Montant" value={draft.initial.montant} onChange={(v) => updateInitial('montant', v)} />
                <InputPct label="Frais d'entrée" value={draft.initial.fraisEntree} onChange={(v) => updateInitial('fraisEntree', v)} />
              </div>
              
              <div className="vcm__field">
                <label className="vcm__label">Allocation</label>
                <AllocationSlider
                  pctCapi={draft.initial.pctCapitalisation}
                  pctDistrib={draft.initial.pctDistribution}
                  onChange={updateInitialAlloc}
                  isSCPI={isSCPI}
                />
              </div>

              {/* Options Capitalisation (unifié) */}
              {showCapiBlock && (
                <div className="vcm__suboption vcm__suboption--capi">
                  <div className="vcm__suboption-header">
                    <span className="vcm__badge vcm__badge--capi">Capitalisation</span>
                  </div>
                  <InputPct 
                    label="Rendement annuel net de FG" 
                    value={draft.capitalisation.rendementAnnuel} 
                    onChange={(v) => updateCapitalisation('rendementAnnuel', v)} 
                  />
                </div>
              )}

              {/* Options Distribution (unifié) */}
              {showDistribBlock && (
                <div className="vcm__suboption vcm__suboption--distrib">
                  <div className="vcm__suboption-header">
                    <span className="vcm__badge vcm__badge--distrib">Distribution</span>
                  </div>
                  
                  <div className="vcm__row">
                    <InputPct 
                      label="Rendement annuel net de FG" 
                      value={draft.distribution.rendementAnnuel} 
                      onChange={(v) => updateDistribution('rendementAnnuel', v)} 
                    />
                    <InputPct 
                      label={isSCPI ? "Taux de loyers net de FG" : "Taux de distribution net de FG"} 
                      value={draft.distribution.tauxDistribution} 
                      onChange={(v) => updateDistribution('tauxDistribution', v)} 
                    />
                  </div>
                  
                  <div className="vcm__row">
                    {!isSCPI && (
                      <InputNumber 
                        label="Durée du produit" 
                        value={draft.distribution.dureeProduit || ''} 
                        onChange={(v) => updateDistribution('dureeProduit', v || null)} 
                        unit="ans" min={1} max={100} 
                      />
                    )}
                    <InputNumber 
                      label="Délai de jouissance" 
                      value={draft.distribution.delaiJouissance} 
                      onChange={(v) => updateDistribution('delaiJouissance', v)} 
                      unit="mois" min={0} max={12} 
                    />
                  </div>

                  <div className="vcm__field">
                    <label className="vcm__label">Stratégie</label>
                    <select className="vcm__select" value={draft.distribution.strategie} onChange={(e) => updateDistribution('strategie', e.target.value)}>
                      {!isSCPI && <option value="stocker">Stocker les distributions à 0%</option>}
                      {(isSCPI || isCTO) && (
                        <option value="apprehender">
                          {isSCPI ? 'Appréhender les distributions chaque année' : 'Appréhender les distributions chaque année'}
                        </option>
                      )}
                      <option value="reinvestir_capi">
                        {isSCPI
                          ? 'Réinvestir les distributions nettes de fiscalité chaque année'
                          : 'Réinvestir les distributions chaque année vers la capitalisation'}
                      </option>
                    </select>
                  </div>

                  {/* Au terme du produit, réinvestir vers - visible si durée renseignée */}
                  {!isSCPI && draft.distribution.dureeProduit && (
                    <div className="vcm__field">
                      <label className="vcm__label">Au terme du produit, réinvestir vers</label>
                      <select className="vcm__select" value={draft.distribution.reinvestirVersAuTerme} onChange={(e) => updateDistribution('reinvestirVersAuTerme', e.target.value)}>
                        <option value="capitalisation">Capitalisation</option>
                        <option value="distribution">Distribution</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* VERSEMENT ANNUEL */}
          <section className="vcm__section">
            <div className="vcm__section-header">
              <div className="vcm__section-icon">2</div>
              <h3 className="vcm__section-title">Versement annuel</h3>
            </div>
            
            <div className="vcm__card">
              <div className="vcm__row">
                <InputEuro label="Montant" value={draft.annuel.montant} onChange={(v) => updateAnnuel('montant', v)} />
                <InputPct label="Frais d'entrée" value={draft.annuel.fraisEntree} onChange={(v) => updateAnnuel('fraisEntree', v)} />
              </div>

              <div className="vcm__field">
                <label className="vcm__label">Allocation</label>
                <AllocationSlider
                  pctCapi={draft.annuel.pctCapitalisation}
                  pctDistrib={draft.annuel.pctDistribution}
                  onChange={updateAnnuelAlloc}
                  isSCPI={isSCPI}
                />
              </div>

              {/* Options PER */}
              {isPER && (
                <div className="vcm__per-options">
                  <div className="vcm__per-option">
                    <label className="vcm__checkbox">
                      <input type="checkbox" checked={draft.annuel.garantieBonneFin.active} onChange={(e) => updateAnnuelOption('garantieBonneFin', 'active', e.target.checked)} />
                      <span>Garantie de bonne fin</span>
                    </label>
                    {draft.annuel.garantieBonneFin.active && (
                      <InputPct label="Coût annuel" value={draft.annuel.garantieBonneFin.cout} onChange={(v) => updateAnnuelOption('garantieBonneFin', 'cout', v)} />
                    )}
                    <p className="vcm__hint">Capital décès = durée restante × versement annuel</p>
                  </div>
                  
                  <div className="vcm__per-option">
                    <label className="vcm__checkbox">
                      <input type="checkbox" checked={draft.annuel.exonerationCotisations.active} onChange={(e) => updateAnnuelOption('exonerationCotisations', 'active', e.target.checked)} />
                      <span>Exonération des cotisations</span>
                    </label>
                    {draft.annuel.exonerationCotisations.active && (
                      <InputPct label="Coût annuel" value={draft.annuel.exonerationCotisations.cout} onChange={(v) => updateAnnuelOption('exonerationCotisations', 'cout', v)} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* VERSEMENTS PONCTUELS */}
          <section className="vcm__section">
            <div className="vcm__section-header">
              <div className="vcm__section-icon">3</div>
              <h3 className="vcm__section-title">Versements ponctuels</h3>
              <button className="vcm__add-btn" onClick={addPonctuel}>+ Ajouter</button>
            </div>
            
            {draft.ponctuels.length === 0 ? (
              <div className="vcm__empty">
                <p>Aucun versement ponctuel configuré</p>
                <button className="vcm__add-btn vcm__add-btn--large" onClick={addPonctuel}>+ Ajouter un versement</button>
              </div>
            ) : (
              <div className="vcm__ponctuels">
                {/* En-têtes colonnes */}
                <div className="vcm__ponctuel-headers">
                  <span>Année</span>
                  <span>Montant</span>
                  <span>Frais</span>
                  <span>Allocation Capi/Distrib</span>
                  <span></span>
                </div>
                {draft.ponctuels.map((p, i) => (
                  <div key={i} className="vcm__ponctuel-row">
                    <div className="vcm__ponctuel-cell">
                      <input
                        type="number"
                        min={1}
                        max={dureeEpargne}
                        value={p.annee}
                        onChange={(e) => updatePonctuel(i, 'annee', Number(e.target.value))}
                        className="vcm__mini-input"
                      />
                    </div>
                    <div className="vcm__ponctuel-cell">
                      <input
                        type="number"
                        value={p.montant}
                        onChange={(e) => updatePonctuel(i, 'montant', Number(e.target.value))}
                        className="vcm__mini-input"
                      />
                      <span className="vcm__unit">€</span>
                    </div>
                    <div className="vcm__ponctuel-cell">
                      <input
                        type="number"
                        step="0.1"
                        value={(p.fraisEntree * 100).toFixed(1)}
                        onChange={(e) => updatePonctuel(i, 'fraisEntree', Number(e.target.value) / 100)}
                        className="vcm__mini-input vcm__mini-input--small"
                      />
                      <span className="vcm__unit">%</span>
                    </div>
                    <div className="vcm__ponctuel-cell vcm__ponctuel-cell--alloc">
                      {isSCPI ? (
                        <span className="vcm__alloc-fixed">100% D</span>
                      ) : (
                        <div className="vcm__alloc-mini">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={p.pctCapitalisation}
                            onChange={(e) => updatePonctuelAlloc(i, Number(e.target.value), 100 - Number(e.target.value))}
                            className="vcm__mini-input vcm__mini-input--tiny"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={p.pctDistribution}
                            onChange={(e) => updatePonctuelAlloc(i, 100 - Number(e.target.value), Number(e.target.value))}
                            className="vcm__mini-input vcm__mini-input--tiny"
                          />
                        </div>
                      )}
                    </div>
                    <div className="vcm__ponctuel-cell">
                      <button className="vcm__remove-btn" onClick={() => removePonctuel(i)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="vcm__footer">
          <button className="vcm__btn vcm__btn--secondary" onClick={onClose}>Annuler</button>
          <button 
            className="vcm__btn vcm__btn--primary" 
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [exportOpen, setExportOpen] = useState(false);

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

  const handleVersementSave = useCallback(async (productIndex, config) => {
    try {
      setVersementConfig(productIndex, config);
    } catch (error) {
      console.error('[PlacementV2] Failed to save versement config', error);
      throw error;
    }
  }, []);

  // Export Excel
  const exportExcel = useCallback(async () => {
    try {
      console.info("[ExcelExport] Starting export");
      
      // Vérifier qu'on a des résultats à exporter
      if (!results || !results.produit1) {
        console.warn("[ExcelExport] No results available", { results, produit1: results?.produit1 });
        alert('Veuillez lancer une simulation avant d\'exporter.');
        return;
      }

      console.info("[ExcelExport] Results validated", { 
        hasProduit1: !!results.produit1,
        hasProduit2: !!results.produit2,
        epargneRows: results.produit1?.epargne?.rows?.length,
        liquidationRows: results.produit1?.liquidation?.rows?.length
      });

      // 0) Paramètres : hypothèses et configuration
      const headerParams = ['Champ', 'Valeur'];
      const rowsParams = [];

      // Client
      rowsParams.push(['Âge actuel', `${state.client.ageActuel} ans`]);
      rowsParams.push(['TMI épargne', `${(state.client.tmiEpargne * 100).toFixed(1).replace('.', ',')} %`]);
      rowsParams.push(['TMI retraite', `${(state.client.tmiRetraite * 100).toFixed(1).replace('.', ',')} %`]);
      rowsParams.push(['Situation', state.client.situation === 'single' ? 'Célibataire' : 'Couple']);

      // Transmission
      rowsParams.push(['Âge au décès', `${state.transmission.ageAuDeces} ans`]);
      rowsParams.push(['Nombre de bénéficiaires', state.transmission.nbBeneficiaires]);
      rowsParams.push(['Taux DMTG', `${(state.transmission.dmtgTaux * 100).toFixed(1).replace('.', ',')} %`]);

      // Produits
      state.products.forEach((product, idx) => {
        const prefix = `Produit ${idx + 1}`;
        rowsParams.push([`${prefix} - Enveloppe`, ENVELOPE_LABELS[product.envelope] || product.envelope]);
        rowsParams.push([`${prefix} - Durée épargne`, `${product.dureeEpargne} ans`]);
        rowsParams.push([`${prefix} - Frais de gestion`, `${(product.fraisGestion * 100).toFixed(2).replace('.', ',')} %`]);
        rowsParams.push([`${prefix} - Option barème IR`, product.optionBaremeIR ? 'Oui' : 'Non']);
        rowsParams.push([`${prefix} - PER bancaire`, product.perBancaire ? 'Oui' : 'Non']);
        
        const versementConfig = product.versementConfig;
        if (versementConfig) {
          rowsParams.push([`${prefix} - Versement initial`, `${versementConfig.initial?.montant || 0} €`]);
          rowsParams.push([`${prefix} - Versements annuels`, `${versementConfig.annuel?.montant || 0} €`]);
          rowsParams.push([`${prefix} - Allocation capitalisation`, `${versementConfig.initial?.pctCapitalisation || 0} %`]);
          rowsParams.push([`${prefix} - Allocation distribution`, `${versementConfig.initial?.pctDistribution || 0} %`]);
        }
      });

      // Récupérer les résultats calculés
      const { produit1, produit2 } = results;

      // 1) Tables épargne (vertical)
      const buildEpargneSheet = (produit, suffix = '') => {
        if (!produit?.epargne?.rows?.length) return null;

        const header = ['Indicateur'];
        produit.epargne.rows.forEach((row, idx) => {
          header.push(`Année ${idx}`);
        });

        const series = [
          { key: 'capitalDebut', label: 'Capital début' },
          { key: 'versements', label: 'Versements' },
          { key: 'capitalCapi', label: 'Capital (capi)' },
          { key: 'capitalDistrib', label: 'Capital (distrib)' },
          { key: 'compteEspece', label: 'Compte espèces' },
          { key: 'gainsAnnee', label: 'Gains annuels' },
          { key: 'revenusNetAnnee', label: 'Revenus nets' },
          { key: 'capitalFin', label: 'Capital fin' },
          { key: 'capitalDecesTheorique', label: 'Capital décès théorique' },
        ];

        const rows = series.map(({ key, label }) => {
          const row = [label];
          produit.epargne.rows.forEach((r) => {
            row.push(r[key] ?? 0);
          });
          return row;
        });

        return { header, rows, name: `Épargne ${suffix}`.trim() };
      };

      const sheetEpargneProduit1 = buildEpargneSheet(produit1, 'Produit 1');
      const sheetEpargneProduit2 = buildEpargneSheet(produit2, 'Produit 2');

      // 2) Tables liquidation (vertical)
      const buildLiquidationSheet = (produit, suffix = '') => {
        if (!produit?.liquidation?.rows?.length) return null;

        const header = ['Indicateur'];
        produit.liquidation.rows.forEach((row, idx) => {
          header.push(`Âge ${row.age ?? idx}`);
        });

        const series = [
          { key: 'capitalDebut', label: 'Capital début' },
          { key: 'retraitBrut', label: 'Retrait brut' },
          { key: 'fiscalite', label: 'Fiscalité' },
          { key: 'retraitNet', label: 'Retrait net' },
          { key: 'capitalFin', label: 'Capital fin' },
          { key: 'pvLatenteDebut', label: 'PV latente début' },
          { key: 'pvLatenteFin', label: 'PV latente fin' },
        ];

        const rows = series.map(({ key, label }) => {
          const row = [label];
          produit.liquidation.rows.forEach((r) => {
            row.push(r[key] ?? 0);
          });
          return row;
        });

        return { header, rows, name: `Liquidation ${suffix}`.trim() };
      };

      const sheetLiquidationProduit1 = buildLiquidationSheet(produit1, 'Produit 1');
      const sheetLiquidationProduit2 = buildLiquidationSheet(produit2, 'Produit 2');

      // 3) Transmission
      const headerTransmission = ['Indicateur', 'Produit 1', 'Produit 2'];
      const psRowApplic = [
        'PS décès - applicables ?',
        formatPsApplicability(produit1?.transmission?.psDeces),
        formatPsApplicability(produit2?.transmission?.psDeces),
      ];
      const psRowAssiette = [
        'PS décès - assiette',
        getPsAssietteNumeric(produit1?.transmission?.psDeces),
        getPsAssietteNumeric(produit2?.transmission?.psDeces),
      ];
      const psRowTaux = [
        'PS décès - taux',
        getPsTauxNumeric(produit1?.transmission?.psDeces),
        getPsTauxNumeric(produit2?.transmission?.psDeces),
      ];
      const psRowMontant = [
        'PS décès - montant',
        getPsMontantNumeric(produit1?.transmission?.psDeces),
        getPsMontantNumeric(produit2?.transmission?.psDeces),
      ];
      const psRowNote = [
        'PS décès - commentaire',
        formatPsNote(produit1?.transmission?.psDeces),
        formatPsNote(produit2?.transmission?.psDeces),
      ];

      const rowsTransmission = [
        ['Capital transmis', produit1?.transmission?.capitalTransmis || 0, produit2?.transmission?.capitalTransmis || 0],
        ['Abattement', produit1?.transmission?.abattement || 0, produit2?.transmission?.abattement || 0],
        ['Assiette fiscale', produit1?.transmission?.assiette || 0, produit2?.transmission?.assiette || 0],
        psRowApplic,
        psRowAssiette,
        psRowTaux,
        psRowMontant,
        psRowNote,
        ['Fiscalité forfaitaire (990 I / 757 B)', produit1?.transmission?.taxeForfaitaire || 0, produit2?.transmission?.taxeForfaitaire || 0],
        ['Fiscalité DMTG', produit1?.transmission?.taxeDmtg || 0, produit2?.transmission?.taxeDmtg || 0],
        ['Fiscalité totale', produit1?.transmission?.taxe || 0, produit2?.transmission?.taxe || 0],
        ['Net transmis', produit1?.transmission?.capitalTransmisNet || 0, produit2?.transmission?.capitalTransmisNet || 0],
      ];

      // 4) Synthèse comparative
      const headerSynthese = ['Indicateur', 'Produit 1', 'Produit 2'];
      const rowsSynthese = [
        ['Enveloppe', ENVELOPE_LABELS[produit1?.envelope] || '', ENVELOPE_LABELS[produit2?.envelope] || ''],
        ['Capital acquis épargne', produit1?.epargne?.capitalFin || 0, produit2?.epargne?.capitalFin || 0],
        ['Total retraits liquidation', produit1?.liquidation?.totalRetraits || 0, produit2?.liquidation?.totalRetraits || 0],
        ['Fiscalité totale', (produit1?.liquidation?.totalFiscalite || 0) + (produit1?.transmission?.taxe || 0), (produit2?.liquidation?.totalFiscalite || 0) + (produit2?.transmission?.taxe || 0)],
        ['Net global', (produit1?.liquidation?.totalRetraits || 0) + (produit1?.transmission?.capitalTransmisNet || 0), (produit2?.liquidation?.totalRetraits || 0) + (produit2?.transmission?.capitalTransmisNet || 0)],
      ];

      console.info("[ExcelExport] Data preparation", {
        headerParamsLength: headerParams.length,
        rowsParamsLength: rowsParams.length,
        hasEpargneP1: !!sheetEpargneProduit1,
        hasEpargneP2: !!sheetEpargneProduit2,
        hasLiquidationP1: !!sheetLiquidationProduit1,
        hasLiquidationP2: !!sheetLiquidationProduit2,
      });

      // Construction XML
      console.info("[ExcelExport] Building XML");
      const xml = `<?xml version="1.0"?>
        <?mso-application progid="Excel.Sheet"?>
        <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
          ${buildWorksheetXmlVertical('Paramètres', headerParams, rowsParams)}
          ${sheetEpargneProduit1 ? buildWorksheetXmlVertical(sheetEpargneProduit1.name, sheetEpargneProduit1.header, sheetEpargneProduit1.rows) : ''}
          ${sheetEpargneProduit2 ? buildWorksheetXmlVertical(sheetEpargneProduit2.name, sheetEpargneProduit2.header, sheetEpargneProduit2.rows) : ''}
          ${sheetLiquidationProduit1 ? buildWorksheetXmlVertical(sheetLiquidationProduit1.name, sheetLiquidationProduit1.header, sheetLiquidationProduit1.rows) : ''}
          ${sheetLiquidationProduit2 ? buildWorksheetXmlVertical(sheetLiquidationProduit2.name, sheetLiquidationProduit2.header, sheetLiquidationProduit2.rows) : ''}
          ${buildWorksheetXmlVertical('Transmission', headerTransmission, rowsTransmission)}
          ${buildWorksheetXmlVertical('Synthèse', headerSynthese, rowsSynthese)}
        </Workbook>`;

      console.info("[ExcelExport] XML built", { xmlLength: xml.length });

      try {
        console.info("[ExcelExport] Starting download");
        await downloadExcel(xml, `SER1_Placement_${new Date().toISOString().slice(0, 10)}.xls`);
        console.info("[ExcelExport] Download completed successfully");
        setExportOpen(false);
      } catch (downloadErr) {
        console.error("[ExcelExport] Download failed", { 
          err: downloadErr, 
          message: downloadErr?.message, 
          stack: downloadErr?.stack 
        });
        alert('Erreur lors du téléchargement du fichier Excel.');
      }
    } catch (e) {
      console.error("[ExcelExport] Export failed", { 
        err: e, 
        message: e?.message, 
        stack: e?.stack 
      });
      alert('Impossible de générer le fichier Excel.');
    }
  }, [state, results]);

  const { produit1, produit2, deltas } = results || { produit1: null, produit2: null, deltas: {} };
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

  // Fonction pour filtrer les colonnes pertinentes (valeurs > 0)
  const structuralEpargneColumns = ['Âge', 'Capital début', 'Versement net', 'Gains année', 'Revenus nets appréhendés', 'Capital fin'];

  const columnResolvers = {
    'Âge': (row) => row.age,
    'Capital début': (row) => row.capitalDebut,
    'Versement net': (row) => row.versementNet,
    'Poche capi (fin)': (row) => row.capitalCapi,
    'Poche distrib (fin)': (row) => row.capitalDistrib,
    'Poche 0% / espèces': (row) => row.compteEspece0pct ?? row.compteEspece,
    'Gains année': (row) => row.gainsAnnee ?? (row.gains || 0) + (row.revaloDistrib || 0),
    'Revenus nets appréhendés': (row) => row.revenusNetsPercusAnnee ?? 0,
    'Revenus nets réinvestis': (row) => row.reinvestissement ?? row.reinvestissementDistribNetAnnee,
    'Capital décès dégressif': (row) => row.capitalDecesDegressif,
    'Capital fin': (row) => row.capitalFin,
  };

  const isColumnRelevant = (rows, column) => {
    if (structuralEpargneColumns.includes(column)) return true;
    const resolver = columnResolvers[column];
    if (!resolver) return false;
    return rows.some((row) => {
      const raw = resolver(row);
      if (raw === undefined || raw === null) return false;
      const value = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isNaN(value)) return !!raw;
      return Math.abs(value) > EPSILON;
    });
  };

  const getRelevantColumnsEpargne = (rows, baseColumns) => {
    if (showAllColumns || !rows || rows.length === 0) return baseColumns;
    return baseColumns.filter((col) => isColumnRelevant(rows, col));
  };

  // Vérifier si au moins un produit PER a la garantie de bonne fin active
  const hasGarantieBonneFin = (produit1?.envelope === 'PER' && produit1?.versementConfig?.annuel?.garantieBonneFin?.active) ||
                              (produit2?.envelope === 'PER' && produit2?.versementConfig?.annuel?.garantieBonneFin?.active);

  // Fonction pour construire les colonnes du tableau
  const buildColumns = (produit) => {
    const baseColumns = produit.envelope === 'SCPI'
      ? ['Âge', 'Capital', 'Loyers bruts', 'Fiscalité', 'Loyers nets', 'Capital fin']
      : ['CTO', 'PEA'].includes(produit.envelope)
        ? ['Âge', 'Capital', 'Cession brute', 'PV latente (début)', 'Fiscalité', 'Cession nette', 'PV latente (fin)', 'Capital fin']
        : ['Âge', 'Capital début', 'Retrait brut', 'Part intérêts', 'Part capital', 'Fiscalité', 'Retrait net', 'Capital fin'];
    
    // Ajouter la colonne "Capital décès théorique" pour les PER avec garantie active
    if (produit.envelope === 'PER' && produit?.versementConfig?.annuel?.garantieBonneFin?.active) {
      baseColumns.splice(baseColumns.length - 1, 0, 'Capital décès théorique');
    }
    
    return baseColumns;
  };

  const detailRows1 = produit1 ? withReinvestCumul(produit1.epargne.rows) : [];
  const detailRows2 = produit2 ? withReinvestCumul(produit2.epargne.rows) : [];

  const baseEpargneColumns = [
    'Âge',
    'Capital début',
    'Versement net',
    'Poche capi (fin)',
    'Poche distrib (fin)',
    'Poche 0% / espèces',
    'Gains année',
    'Revenus nets appréhendés',
    'Revenus nets réinvestis',
    'Capital décès dégressif',
    'Capital fin',
  ];

  const hasDegressifData = (produit) =>
    produit?.epargne?.rows?.some((row) => Math.abs(row.capitalDecesDegressif || 0) > EPSILON);

  const shouldShowDegressifColumn = (produit) =>
    produit?.envelope === 'PER' &&
    produit?.versementConfig?.annuel?.garantieBonneFin?.active;

  const getBaseColumnsForProduct = (produit) => {
    if (!produit) return baseEpargneColumns;
    if (shouldShowDegressifColumn(produit) || hasDegressifData(produit)) return baseEpargneColumns;
    return baseEpargneColumns.filter((col) => col !== 'Capital décès dégressif');
  };

  const renderEpargneCell = (column, row, produit) => {
    switch (column) {
      case 'Âge':
        return `${row.age} ans`;
      case 'Capital début':
        return euro(row.capitalDebut);
      case 'Versement net':
        return (
          <>
            {euro(row.versementNet)}
            <div className="pl-detail-cumul">Cumul : {euro(row.cumulVersementsNets)}</div>
          </>
        );
      case 'Poche capi (fin)':
        return euro(row.capitalCapi || 0);
      case 'Poche distrib (fin)':
        return (
          <>
            {euro(row.capitalDistrib || 0)}
            {(row.revaloDistrib || 0) !== 0 && (
              <div className="pl-detail-cumul">Revalo : {euro(row.revaloDistrib)}</div>
            )}
          </>
        );
      case 'Poche 0% / espèces':
        return euro(row.compteEspece0pct ?? row.compteEspece ?? 0);
      case 'Gains année': {
        const gainsValue = row.gainsAnnee ?? (row.gains || 0) + (row.revaloDistrib || 0);
        return (
          <>
            {euro(gainsValue)}
            <div className="pl-detail-cumul">Cumul : {euro(row.cumulGains ?? row.cumulInterets ?? 0)}</div>
          </>
        );
      }
      case 'Revenus nets appréhendés':
        return euro(row.revenusNetsPercusAnnee ?? 0);
      case 'Revenus nets réinvestis':
        return (
          <>
            {euro(row.reinvestissement ?? 0)}
            <div className="pl-detail-cumul">
              {produit.envelope === 'SCPI' ? 'Loyer net N (réinvesti N+1)' : 'Coupon net N (réinvesti N+1)'} :{' '}
              {euro(row.reinvestissementDistribNetAnnee ?? 0)}
            </div>
          </>
        );
      case 'Capital décès dégressif':
        return euro(row.capitalDecesDegressif || 0);
      case 'Capital fin':
        return euro(row.capitalFin);
      default:
        return null;
    }
  };

  const renderEpargneRow = (produit, columns) => (row, index) => (
    <tr key={index} className={row.cessionProduit ? 'pl-row-cession' : ''}>
      {columns.map((col) => (
        <td key={`${index}-${col}`}>{renderEpargneCell(col, row, produit)}</td>
      ))}
    </tr>
  );

  const columnsProduit1 = getRelevantColumnsEpargne(detailRows1, getBaseColumnsForProduct(produit1));
  const columnsProduit2 = getRelevantColumnsEpargne(detailRows2, getBaseColumnsForProduct(produit2));

  // Fonction pour filtrer les colonnes pertinentes (valeurs > 0)
  const getRelevantColumns = (rows, baseColumns) => {
    if (showAllColumns || !rows || rows.length === 0) return baseColumns;

    const guaranteedColumns = baseColumns.slice(0, Math.min(3, baseColumns.length));
    guaranteedColumns.push('Capital fin');

    const relevantColumns = new Set(guaranteedColumns);

    baseColumns.forEach((col) => {
      const hasNonZeroValue = rows.some((row) => {
        const valueMap = {
          'Capital': row.capitalDebut ?? row.capital ?? 0,
          'Capital début': row.capitalDebut,
          'Capital fin': row.capitalFin,
          'Fiscalité': row.fiscaliteTotal,
          'Loyers bruts': row.retraitBrut,
          'Loyers nets': row.retraitNet,
          'Cession brute': row.retraitBrut,
          'PV latente (début)': row.pvLatenteDebut,
          'Cession nette': row.retraitNet,
          'PV latente (fin)': row.pvLatenteFin,
          'Retrait brut': row.retraitBrut,
          'Part intérêts': row.partGains,
          'Part capital': row.partCapital,
          'Retrait net': row.retraitNet,
          'Capital décès théorique': row.capitalDecesTheorique,
        };

        const value = valueMap[col];
        return value !== undefined && value !== null && Math.abs(value) > EPSILON;
      });

      if (hasNonZeroValue) {
        relevantColumns.add(col);
      }
    });

    return baseColumns.filter((col) => relevantColumns.has(col));
  };

  // Loading / Error (placés après les hooks pour respecter les Rules of Hooks)
  if (loading) {
    return (
      <div className="ir-panel placement-page">
        <div className="ir-header">
          <div className="ir-title">Chargement des paramètres fiscaux...</div>
        </div>
      </div>
    );
  }

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

  // Déterminer le label pour le solde du compte espèce selon la stratégie
  const getSoldeLabel = (product) => {
    if (!product || !['CTO', 'PEA'].includes(product.envelope)) return 'Cumul';
    const strategie = state.products.find(p => p.envelope === product.envelope)?.strategieCompteEspece;
    if (strategie === 'apprehender') return 'Solde (toujours 0)';
    if (strategie === 'stocker') return 'Solde';
    if (strategie === 'reinvestir') return 'Solde (net année)';
    return 'Solde';
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
          <div className="pl-export-dropdown" style={{ position: 'relative' }}>
            <button
              className="chip premium-btn"
              onClick={() => setExportOpen(!exportOpen)}
              title="Exporter les résultats"
            >
              Exporter ▾
            </button>
            {exportOpen && (
              <div className="pl-export-menu" style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--color-c7)', border: '1px solid var(--color-c8)', borderRadius: '4px', marginTop: '4px', minWidth: '120px', zIndex: 1000 }}>
                <button
                  className="chip premium-btn"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { setExportOpen(false); exportExcel(); }}
                  disabled={!results || !results.produit1}
                >
                  Excel
                </button>
              </div>
            )}
          </div>
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
                    <th className="pl-colhead">
                      <div className="pl-colname">Produit 1</div>
                      <div className="pl-colbadge-wrapper">
                        <div className="pl-collabel pl-collabel--product1">{ENVELOPE_LABELS[state.products[0].envelope]}</div>
                      </div>
                    </th>
                    <th className="pl-colhead">
                      <div className="pl-colname">Produit 2</div>
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
                    columns={getRelevantColumns(produit1.liquidation.rows, buildColumns(produit1))}
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
                    columns={getRelevantColumns(produit2.liquidation.rows, buildColumns(produit2))}
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
            {produit1 && produit2 && (
              <div className="ir-synthesis-card premium-card">
                <div className="pl-card-title premium-section-title">Synthèse comparative</div>
                
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
              </div>
            )}
          </div>
      </div>

      {/* Modal de configuration des versements */}
      {modalOpen !== null && (
        <VersementConfigModal
          envelope={state.products[modalOpen].envelope}
          config={state.products[modalOpen].versementConfig}
          dureeEpargne={state.products[modalOpen].dureeEpargne}
          onSave={(config) => {
            console.log('[PlacementV2] onSave called with config:', config);
            console.log('[PlacementV2] modalOpen:', modalOpen);
            try {
              setVersementConfig(modalOpen, config);
              console.log('[PlacementV2] setVersementConfig called');
              setModalOpen(null);
              console.log('[PlacementV2] setModalOpen(null) called');
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
