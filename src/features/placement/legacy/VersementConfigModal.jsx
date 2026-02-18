/**
 * VersementConfigModal — Modal de paramétrage des versements (initial, annuel, ponctuels)
 */

import React, { useEffect, useState } from 'react';
import './VersementConfigModal.css';
import { normalizeVersementConfig } from '@/utils/versementConfig.js';
import { ENVELOPE_LABELS } from '@/engine/placementEngine.js';
import { InputEuro, InputPct, InputNumber } from './inputs.jsx';
import { AllocationSlider } from './tables.jsx';

export function VersementConfigModal({ envelope, config, dureeEpargne, onSave, onClose }) {
  const [draft, setDraft] = useState(() => normalizeVersementConfig(config));
  
  const isSCPI = envelope === 'SCPI';
  const isPER = envelope === 'PER';
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
