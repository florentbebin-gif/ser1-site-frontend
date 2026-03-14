/**
 * VersementConfigModal - Modal de parametrage des versements
 */

import { useEffect, useState } from 'react';
import './VersementConfigModal.css';
import {
  normalizeVersementConfig,
  type CapitalisationConfig,
  type DistributionConfig,
  type VersementAnnuel,
  type VersementConfig,
  type VersementConfigInput,
  type VersementEntry,
  type VersementOption,
  type VersementPonctuel,
} from '@/engine/placement/versementConfig';
import { ENVELOPE_LABELS } from '@/engine/placement';
import { InputEuro, InputPct, InputNumber } from './inputs';
import { AllocationSlider } from './tables';

interface VersementConfigModalProps {
  envelope: string;
  config?: VersementConfig | VersementConfigInput | null;
  dureeEpargne: number;
  onSave: (_config: VersementConfig) => void;
  onClose: () => void;
}

type AnnualOptionName = 'garantieBonneFin' | 'exonerationCotisations';
type AllocationConfig = Pick<VersementEntry, 'pctCapitalisation' | 'pctDistribution'>;

const envelopeLabels = ENVELOPE_LABELS as Record<string, string>;

function LayersIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function VersementConfigModal({
  envelope,
  config,
  dureeEpargne,
  onSave,
  onClose,
}: VersementConfigModalProps) {
  const [draft, setDraft] = useState<VersementConfig>(() => normalizeVersementConfig(config ?? undefined));

  const isSCPI = envelope === 'SCPI';
  const isPER = envelope === 'PER';
  const isCTO = envelope === 'CTO';
  const isAV = envelope === 'AV';

  useEffect(() => {
    if (isSCPI) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        initial: { ...currentDraft.initial, pctCapitalisation: 0, pctDistribution: 100 },
        annuel: { ...currentDraft.annuel, pctCapitalisation: 0, pctDistribution: 100 },
        ponctuels: (currentDraft.ponctuels || []).map((ponctuel) => ({
          ...ponctuel,
          pctCapitalisation: 0,
          pctDistribution: 100,
        })),
      }));
    }
  }, [isSCPI]);

  const updateInitial = <K extends keyof VersementEntry>(field: K, value: VersementEntry[K]) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      initial: { ...currentDraft.initial, [field]: value },
    }));
  };

  const updateInitialAlloc = (capi: number, distrib: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      initial: {
        ...currentDraft.initial,
        pctCapitalisation: capi,
        pctDistribution: distrib,
      },
    }));
  };

  const updateAnnuel = <K extends keyof VersementAnnuel>(field: K, value: VersementAnnuel[K]) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      annuel: { ...currentDraft.annuel, [field]: value },
    }));
  };

  const updateAnnuelAlloc = (capi: number, distrib: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      annuel: {
        ...currentDraft.annuel,
        pctCapitalisation: capi,
        pctDistribution: distrib,
      },
    }));
  };

  const updateAnnuelOption = <K extends keyof VersementOption>(
    optionName: AnnualOptionName,
    field: K,
    value: VersementOption[K],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      annuel: {
        ...currentDraft.annuel,
        [optionName]: { ...currentDraft.annuel[optionName], [field]: value },
      },
    }));
  };

  const updateCapitalisation = <K extends keyof CapitalisationConfig>(
    field: K,
    value: CapitalisationConfig[K],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      capitalisation: { ...currentDraft.capitalisation, [field]: value },
    }));
  };

  const updateDistribution = <K extends keyof DistributionConfig>(
    field: K,
    value: DistributionConfig[K],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      distribution: { ...currentDraft.distribution, [field]: value },
    }));
  };

  const addPonctuel = () => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ponctuels: [
        ...currentDraft.ponctuels,
        {
          annee: Math.min(5, dureeEpargne),
          montant: 5000,
          fraisEntree: currentDraft.initial.fraisEntree,
          pctCapitalisation: isSCPI ? 0 : currentDraft.initial.pctCapitalisation,
          pctDistribution: isSCPI ? 100 : currentDraft.initial.pctDistribution,
        },
      ],
    }));
  };

  const updatePonctuel = <K extends keyof VersementPonctuel>(
    index: number,
    field: K,
    value: VersementPonctuel[K],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ponctuels: currentDraft.ponctuels.map((ponctuel, ponctuelIndex) => (
        ponctuelIndex === index ? { ...ponctuel, [field]: value } : ponctuel
      )),
    }));
  };

  const updatePonctuelAlloc = (index: number, capi: number, distrib: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ponctuels: currentDraft.ponctuels.map((ponctuel, ponctuelIndex) => (
        ponctuelIndex === index
          ? { ...ponctuel, pctCapitalisation: capi, pctDistribution: distrib }
          : ponctuel
      )),
    }));
  };

  const removePonctuel = (index: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ponctuels: currentDraft.ponctuels.filter((_, ponctuelIndex) => ponctuelIndex !== index),
    }));
  };

  const hasDistribution = (allocation: AllocationConfig) => (allocation.pctDistribution || 0) > 0;
  const hasCapitalisation = (allocation: AllocationConfig) => (allocation.pctCapitalisation || 0) > 0;
  const showCapiBlock = !isSCPI && (
    hasCapitalisation(draft.initial)
    || hasCapitalisation(draft.annuel)
    || draft.distribution.strategie === 'reinvestir_capi'
  );
  const showDistribBlock = hasDistribution(draft.initial) || hasDistribution(draft.annuel);

  return (
    <div className="vcm-overlay" onClick={onClose}>
      <div className="vcm" onClick={(event) => event.stopPropagation()}>
        <div className="vcm__header">
          <div className="vcm__header-content">
            <div className="vcm__icon" aria-hidden="true">
              <LayersIcon />
            </div>
            <div>
              <h2 className="vcm__title">Parametrage des versements</h2>
              <p className="vcm__subtitle">{envelopeLabels[envelope]}</p>
            </div>
          </div>

          <button type="button" className="vcm__close" onClick={onClose} aria-label="Fermer la modale">
            <XIcon />
          </button>
        </div>

        <div className="vcm__body">
          {isAV && (
            <div className="vcm__hint vcm__hint--spaced">
              Hypothèse : investissement 100 % unités de compte - prélèvements sociaux dus au rachat.
            </div>
          )}

          <section className="vcm__section">
            <div className="vcm__section-header">
              <div className="vcm__section-icon">1</div>
              <h3 className="vcm__section-title">Versement initial</h3>
            </div>

            <div className="vcm__card">
              <div className="vcm__row">
                <InputEuro label="Montant" value={draft.initial.montant} onChange={(value) => updateInitial('montant', value)} />
                <InputPct label="Frais d'entrée" value={draft.initial.fraisEntree} onChange={(value) => updateInitial('fraisEntree', value)} />
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

              {showCapiBlock && (
                <div className="vcm__suboption vcm__suboption--capi">
                  <div className="vcm__suboption-header">
                    <span className="vcm__badge vcm__badge--capi">Capitalisation</span>
                  </div>
                  <InputPct
                    label="Rendement annuel net de FG"
                    value={draft.capitalisation.rendementAnnuel}
                    onChange={(value) => updateCapitalisation('rendementAnnuel', value)}
                  />
                </div>
              )}

              {showDistribBlock && (
                <div className="vcm__suboption vcm__suboption--distrib">
                  <div className="vcm__suboption-header">
                    <span className="vcm__badge vcm__badge--distrib">Distribution</span>
                  </div>

                  <div className="vcm__row">
                    <InputPct
                      label="Rendement annuel net de FG"
                      value={draft.distribution.rendementAnnuel}
                      onChange={(value) => updateDistribution('rendementAnnuel', value)}
                    />
                    <InputPct
                      label={isSCPI ? 'Taux de loyers net de FG' : 'Taux de distribution net de FG'}
                      value={draft.distribution.tauxDistribution}
                      onChange={(value) => updateDistribution('tauxDistribution', value)}
                    />
                  </div>

                  <div className="vcm__row">
                    {!isSCPI && (
                      <InputNumber
                        label="Durée du produit"
                        value={draft.distribution.dureeProduit || ''}
                        onChange={(value) => updateDistribution('dureeProduit', value || null)}
                        unit="ans"
                        min={1}
                        max={100}
                      />
                    )}
                    <InputNumber
                      label="Délai de jouissance"
                      value={draft.distribution.delaiJouissance}
                      onChange={(value) => updateDistribution('delaiJouissance', value)}
                      unit="mois"
                      min={0}
                      max={12}
                    />
                  </div>

                  <div className="vcm__field">
                    <label className="vcm__label">Strategie</label>
                    
                    <select
                      className="vcm__select"
                      value={draft.distribution.strategie}
                      onChange={(event) => updateDistribution('strategie', event.target.value)}
                    >
                      {!isSCPI && <option value="stocker">Stocker les distributions à 0%</option>}
                      {(isSCPI || isCTO) && (
                        <option value="apprehender">Appréhender les distributions chaque année</option>
                      )}
                      <option value="reinvestir_capi">
                        {isSCPI
                          ? 'Réinvestir les distributions nettes de fiscalité chaque année'
                          : 'Réinvestir les distributions chaque année vers la capitalisation'}
                      </option>
                    </select>
                  </div>

                  {!isSCPI && draft.distribution.dureeProduit && (
                    <div className="vcm__field">
                      <label className="vcm__label">Au terme du produit, réinvestir vers</label>
                      <select
                        className="vcm__select"
                        value={draft.distribution.reinvestirVersAuTerme}
                        onChange={(event) => updateDistribution('reinvestirVersAuTerme', event.target.value)}
                      >
                        <option value="capitalisation">Capitalisation</option>
                        <option value="distribution">Distribution</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="vcm__section">
            <div className="vcm__section-header">
              <div className="vcm__section-icon">2</div>
              <h3 className="vcm__section-title">Versement annuel</h3>
            </div>

            <div className="vcm__card">
              <div className="vcm__row">
                <InputEuro label="Montant" value={draft.annuel.montant} onChange={(value) => updateAnnuel('montant', value)} />
                <InputPct label="Frais d'entrée" value={draft.annuel.fraisEntree} onChange={(value) => updateAnnuel('fraisEntree', value)} />
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

              {isPER && (
                <div className="vcm__per-options">
                  <div className="vcm__per-option">
                    <label className="vcm__checkbox">
                      <input
                        type="checkbox"
                        checked={draft.annuel.garantieBonneFin.active}
                        onChange={(event) => updateAnnuelOption('garantieBonneFin', 'active', event.target.checked)}
                      />
                      <span>Garantie de bonne fin</span>
                    </label>
                    {draft.annuel.garantieBonneFin.active && (
                      <InputPct
                        label="Coût annuel"
                        value={draft.annuel.garantieBonneFin.cout}
                        onChange={(value) => updateAnnuelOption('garantieBonneFin', 'cout', value)}
                      />
                    )}
                    <p className="vcm__hint">Capital décès = durée restante x versement annuel</p>
                  </div>

                  <div className="vcm__per-option">
                    <label className="vcm__checkbox">
                      <input
                        type="checkbox"
                        checked={draft.annuel.exonerationCotisations.active}
                        onChange={(event) => updateAnnuelOption('exonerationCotisations', 'active', event.target.checked)}
                      />
                      <span>Exonération des cotisations</span>
                    </label>
                    {draft.annuel.exonerationCotisations.active && (
                      <InputPct
                        label="Coût annuel"
                        value={draft.annuel.exonerationCotisations.cout}
                        onChange={(value) => updateAnnuelOption('exonerationCotisations', 'cout', value)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="vcm__section">
            <div className="vcm__section-header">
              <div className="vcm__section-icon">3</div>
              <h3 className="vcm__section-title">Versements ponctuels</h3>
              <button type="button" className="vcm__add-btn" onClick={addPonctuel}>+ Ajouter</button>
            </div>

            {draft.ponctuels.length === 0 ? (
              <div className="vcm__empty">
                <p>Aucun versement ponctuel configuré</p>
                <button type="button" className="vcm__add-btn vcm__add-btn--large" onClick={addPonctuel}>
                  + Ajouter un versement
                </button>
              </div>
            ) : (
              <div className="vcm__ponctuels">
                <div className="vcm__ponctuel-headers">
                  <span>Année</span>
                  <span>Montant</span>
                  <span>Frais</span>
                  <span>Allocation Capi/Distrib</span>
                  <span />
                </div>

                {draft.ponctuels.map((ponctuel, index) => (
                  <div key={index} className="vcm__ponctuel-row">
                    <div className="vcm__ponctuel-cell">
                      <input
                        type="number"
                        min={1}
                        max={dureeEpargne}
                        value={ponctuel.annee}
                        onChange={(event) => updatePonctuel(index, 'annee', Number(event.target.value))}
                        className="vcm__mini-input"
                      />
                    </div>

                    <div className="vcm__ponctuel-cell">
                      <input
                        type="number"
                        value={ponctuel.montant}
                        onChange={(event) => updatePonctuel(index, 'montant', Number(event.target.value))}
                        className="vcm__mini-input"
                      />
                      <span className="vcm__unit">EUR</span>
                      
                    </div>

                    <div className="vcm__ponctuel-cell">
                      <input
                        type="number"
                        step="0.1"
                        value={(ponctuel.fraisEntree * 100).toFixed(1)}
                        onChange={(event) => updatePonctuel(index, 'fraisEntree', Number(event.target.value) / 100)}
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
                            value={ponctuel.pctCapitalisation}
                            onChange={(event) => updatePonctuelAlloc(index, Number(event.target.value), 100 - Number(event.target.value))}
                            className="vcm__mini-input vcm__mini-input--tiny"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={ponctuel.pctDistribution}
                            onChange={(event) => updatePonctuelAlloc(index, 100 - Number(event.target.value), Number(event.target.value))}
                            className="vcm__mini-input vcm__mini-input--tiny"
                          />
                        </div>
                      )}
                    </div>

                    <div className="vcm__ponctuel-cell">
                      <button
                        type="button"
                        className="vcm__remove-btn"
                        onClick={() => removePonctuel(index)}
                        aria-label={`Supprimer le versement ponctuel ${index + 1}`}
                      >
                        <XIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="vcm__footer">
          <button type="button" className="vcm__btn vcm__btn--secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="vcm__btn vcm__btn--primary" onClick={() => onSave(draft)}>
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
