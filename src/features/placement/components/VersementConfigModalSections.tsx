import type { JSX } from 'react';
import {
  type CapitalisationConfig,
  type DeductionInitiale,
  type DistributionConfig,
  type VersementAnnuel,
  type VersementEntry,
  type VersementOption,
  type VersementPonctuel,
} from '@/engine/placement/versementConfig';
import { fmt } from '../utils/formatters';
import { InputEuro, InputNumber, InputPct } from './inputs';
import { AllocationSlider } from './tables';

interface VersementSectionShellProps {
  step: string;
  title: string;
  action?: JSX.Element | null;
  children: JSX.Element;
}

function VersementSectionShell({
  step,
  title,
  action,
  children,
}: VersementSectionShellProps) {
  return (
    <section className="vcm__section">
      <div className="vcm__section-header">
        <div className="vcm__section-icon">{step}</div>
        <h3 className="vcm__section-title">{title}</h3>
        {action || null}
      </div>
      {children}
    </section>
  );
}

interface VersementInitialSectionProps {
  initial: VersementEntry;
  capitalisation: CapitalisationConfig;
  distribution: DistributionConfig;
  isSCPI: boolean;
  isCTO: boolean;
  isPER: boolean;
  isExpert: boolean;
  showCapiBlock: boolean;
  showDistribBlock: boolean;
  onUpdateInitial: <K extends keyof VersementEntry>(field: K, value: VersementEntry[K]) => void;
  onUpdateInitialAlloc: (_capi: number, _distrib: number) => void;
  onUpdateCapitalisation: <K extends keyof CapitalisationConfig>(
    field: K,
    value: CapitalisationConfig[K],
  ) => void;
  onUpdateDistribution: <K extends keyof DistributionConfig>(
    field: K,
    value: DistributionConfig[K],
  ) => void;
  deductionInitiale: DeductionInitiale;
  onUpdateDeductionInitiale: (val: DeductionInitiale) => void;
}

export function VersementInitialSection({
  initial,
  capitalisation,
  distribution,
  isSCPI,
  isCTO,
  isPER,
  isExpert,
  showCapiBlock,
  showDistribBlock,
  onUpdateInitial,
  onUpdateInitialAlloc,
  onUpdateCapitalisation,
  onUpdateDistribution,
  deductionInitiale,
  onUpdateDeductionInitiale,
}: VersementInitialSectionProps) {
  return (
    <VersementSectionShell step="1" title="Versement initial">
      <div className="vcm__card">
        <div className="vcm__row">
          <InputEuro label="Montant" value={initial.montant} onChange={(value) => onUpdateInitial('montant', value)} />
          {!isSCPI && <InputPct label="Frais d'entrée" value={initial.fraisEntree} onChange={(value) => onUpdateInitial('fraisEntree', value)} />}
          {isExpert && isPER && (
            <>
              <div className="vcm__field vcm__field--compact">
                <label className="vcm__label">Déductibilité</label>
                <select
                  className="vcm__select vcm__select--small"
                  value={deductionInitiale.mode}
                  onChange={(e) => onUpdateDeductionInitiale({
                    mode: e.target.value as 'tmi' | 'montant',
                    montant: e.target.value === 'tmi' ? 0 : deductionInitiale.montant,
                  })}
                >
                  <option value="tmi">Déduction TMI</option>
                  <option value="montant">Montant fixe</option>
                </select>
              </div>
              {deductionInitiale.mode === 'montant' && (
                <InputEuro
                  label="Économie IR"
                  value={deductionInitiale.montant}
                  onChange={(val) => onUpdateDeductionInitiale({ mode: 'montant', montant: val })}
                />
              )}
            </>
          )}
        </div>

        <div className="vcm__field">
          <label className="vcm__label">Allocation</label>
          <AllocationSlider
            pctCapi={initial.pctCapitalisation}
            pctDistrib={initial.pctDistribution}
            onChange={onUpdateInitialAlloc}
            isSCPI={isSCPI}
            disabled={!isExpert && !isSCPI}
          />
        </div>

        <div className={showCapiBlock && showDistribBlock ? 'vcm__suboptions-row' : ''}>
        {showCapiBlock ? (
          <div className="vcm__suboption vcm__suboption--capi">
            <div className="vcm__suboption-header">
              <span className="vcm__badge vcm__badge--capi">Capitalisation</span>
            </div>
            <InputPct
              label="Rendement annuel net de FG"
              value={capitalisation.rendementAnnuel}
              onChange={(value) => onUpdateCapitalisation('rendementAnnuel', value)}
            />
          </div>
        ) : null}

        {showDistribBlock ? (
          <div className="vcm__suboption vcm__suboption--distrib">
            <div className="vcm__suboption-header">
              <span className="vcm__badge vcm__badge--distrib">Distribution</span>
            </div>

            <div className="vcm__row">
              {/* Rendement annuel net de FG — masqué pour SCPI en mode simplifié */}
              {(isExpert || !isSCPI) && (
                <InputPct
                  label="Rendement annuel net de FG"
                  value={distribution.rendementAnnuel}
                  onChange={(value) => onUpdateDistribution('rendementAnnuel', value)}
                />
              )}
              <InputPct
                label={isSCPI ? 'Taux de loyers net de FG' : 'Taux de distribution net de FG'}
                value={distribution.tauxDistribution}
                onChange={(value) => onUpdateDistribution('tauxDistribution', value)}
              />
            </div>

            {(isExpert || !isSCPI) && (
              <div className="vcm__row">
                {!isSCPI ? (
                  <InputNumber
                    label="Durée du produit"
                    value={distribution.dureeProduit || ''}
                    onChange={(value) => onUpdateDistribution('dureeProduit', value || null)}
                    unit="ans"
                    min={1}
                    max={100}
                  />
                ) : <div />}
                {/* Délai de jouissance — masqué pour SCPI en mode simplifié */}
                <InputNumber
                  label="Délai de jouissance"
                  value={distribution.delaiJouissance}
                  onChange={(value) => onUpdateDistribution('delaiJouissance', value)}
                  unit="mois"
                  min={0}
                  max={12}
                />
              </div>
            )}

            {/* Stratégie — masquée pour SCPI en mode simplifié */}
            {(isExpert || !isSCPI) && (
              <div className="vcm__field">
                <label className="vcm__label">Strategie</label>

                <select
                  className="vcm__select"
                  value={distribution.strategie}
                  onChange={(event) => onUpdateDistribution('strategie', event.target.value)}
                >
                  {!isSCPI ? <option value="stocker">Stocker les distributions à 0%</option> : null}
                  {(isSCPI || isCTO) ? (
                    <option value="apprehender">Appréhender les distributions chaque année</option>
                  ) : null}
                  <option value="reinvestir_capi">
                    {isSCPI
                      ? 'Réinvestir les distributions nettes de fiscalité chaque année'
                      : 'Réinvestir les distributions chaque année vers la capitalisation'}
                  </option>
                </select>
              </div>
            )}

            {!isSCPI && distribution.dureeProduit ? (
              <div className="vcm__field">
                <label className="vcm__label">Au terme du produit, réinvestir vers</label>
                <select
                  className="vcm__select"
                  value={distribution.reinvestirVersAuTerme}
                  onChange={(event) => onUpdateDistribution('reinvestirVersAuTerme', event.target.value)}
                >
                  <option value="capitalisation">Capitalisation</option>
                  <option value="distribution">Distribution</option>
                </select>
              </div>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>
    </VersementSectionShell>
  );
}

interface VersementAnnualSectionProps {
  annuel: VersementAnnuel;
  isPER: boolean;
  isSCPI: boolean;
  isExpert: boolean;
  onUpdateAnnuel: <K extends keyof VersementAnnuel>(field: K, value: VersementAnnuel[K]) => void;
  onUpdateAnnuelAlloc: (_capi: number, _distrib: number) => void;
  onUpdateAnnuelOption: <K extends keyof VersementOption>(
    optionName: 'garantieBonneFin' | 'exonerationCotisations',
    field: K,
    value: VersementOption[K],
  ) => void;
}

export function VersementAnnualSection({
  annuel,
  isPER,
  isSCPI,
  isExpert,
  onUpdateAnnuel,
  onUpdateAnnuelAlloc,
  onUpdateAnnuelOption,
}: VersementAnnualSectionProps) {
  return (
    <VersementSectionShell step="2" title="Versement annuel">
      <div className="vcm__card">
        <div className="vcm__row">
          <InputEuro label="Montant" value={annuel.montant} onChange={(value) => onUpdateAnnuel('montant', value)} />
          {!isSCPI && <InputPct label="Frais d'entrée" value={annuel.fraisEntree} onChange={(value) => onUpdateAnnuel('fraisEntree', value)} />}
        </div>

        <div className="vcm__field">
          <label className="vcm__label">Allocation</label>
          <AllocationSlider
            pctCapi={annuel.pctCapitalisation}
            pctDistrib={annuel.pctDistribution}
            onChange={onUpdateAnnuelAlloc}
            isSCPI={isSCPI}
            disabled={!isExpert && !isSCPI}
          />
        </div>

        {isPER ? (
          <div className="vcm__per-options">
            <div className="vcm__per-option">
              <label className="vcm__checkbox">
                <input
                  type="checkbox"
                  checked={annuel.garantieBonneFin.active}
                  onChange={(event) => onUpdateAnnuelOption('garantieBonneFin', 'active', event.target.checked)}
                />
                <span>Garantie de bonne fin</span>
              </label>
              {annuel.garantieBonneFin.active ? (
                <InputPct
                  label="Coût annuel"
                  value={annuel.garantieBonneFin.cout}
                  onChange={(value) => onUpdateAnnuelOption('garantieBonneFin', 'cout', value)}
                />
              ) : null}
              <p className="vcm__hint">Capital décès = durée restante x versement annuel</p>
            </div>

            <div className="vcm__per-option">
              <label className="vcm__checkbox">
                <input
                  type="checkbox"
                  checked={annuel.exonerationCotisations.active}
                  onChange={(event) => onUpdateAnnuelOption('exonerationCotisations', 'active', event.target.checked)}
                />
                <span>Exonération des cotisations</span>
              </label>
              {annuel.exonerationCotisations.active ? (
                <InputPct
                  label="Coût annuel"
                  value={annuel.exonerationCotisations.cout}
                  onChange={(value) => onUpdateAnnuelOption('exonerationCotisations', 'cout', value)}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </VersementSectionShell>
  );
}

interface VersementPonctuelsSectionProps {
  ponctuels: VersementPonctuel[];
  dureeEpargne: number;
  isSCPI: boolean;
  onAddPonctuel: () => void;
  onUpdatePonctuel: <K extends keyof VersementPonctuel>(
    index: number,
    field: K,
    value: VersementPonctuel[K],
  ) => void;
  onUpdatePonctuelAlloc: (_index: number, _capi: number, _distrib: number) => void;
  onRemovePonctuel: (_index: number) => void;
  RemoveIcon: () => JSX.Element;
}

export function VersementPonctuelsSection({
  ponctuels,
  dureeEpargne,
  isSCPI,
  onAddPonctuel,
  onUpdatePonctuel,
  onUpdatePonctuelAlloc,
  onRemovePonctuel,
  RemoveIcon,
}: VersementPonctuelsSectionProps) {
  return (
    <VersementSectionShell
      step="3"
      title="Versements ponctuels"
      action={(
        <button type="button" className="vcm__add-btn" onClick={onAddPonctuel}>
          + Ajouter
        </button>
      )}
    >
      {ponctuels.length === 0 ? (
        <div className="vcm__empty">
          <p>Aucun versement ponctuel configuré</p>
          <button type="button" className="vcm__add-btn vcm__add-btn--large" onClick={onAddPonctuel}>
            + Ajouter un versement
          </button>
        </div>
      ) : (
        <div className={`vcm__ponctuels${isSCPI ? ' vcm__ponctuels--scpi' : ''}`}>
          <div className="vcm__ponctuel-headers">
            <span>Année</span>
            <span>Montant</span>
            {!isSCPI && <span>Frais</span>}
            <span className="vcm__ponctuel-header--center">Alloc. Capi / Distrib (%)</span>
            <span />
          </div>

          {ponctuels.map((ponctuel, index) => (
            <div key={index} className="vcm__ponctuel-row">
              <div className="vcm__ponctuel-cell">
                <input
                  type="number"
                  min={1}
                  max={dureeEpargne}
                  value={ponctuel.annee}
                  onChange={(event) => onUpdatePonctuel(index, 'annee', Number(event.target.value))}
                  className="vcm__mini-input"
                />
              </div>

              <div className="vcm__ponctuel-cell">
                <div className="vcm__mini-input-wrap">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fmt(ponctuel.montant)}
                    onChange={(event) => {
                      const clean = event.target.value.replace(/\D/g, '').slice(0, 9);
                      onUpdatePonctuel(index, 'montant', clean === '' ? 0 : Number(clean));
                    }}
                    className="vcm__mini-input"
                  />
                  <span className="vcm__mini-unit">€</span>
                </div>
              </div>

              {!isSCPI && (
                <div className="vcm__ponctuel-cell">
                  <div className="vcm__mini-input-wrap">
                    <input
                      type="number"
                      step="0.1"
                      value={(ponctuel.fraisEntree * 100).toFixed(1)}
                      onChange={(event) => onUpdatePonctuel(index, 'fraisEntree', Number(event.target.value) / 100)}
                      className="vcm__mini-input"
                    />
                    <span className="vcm__mini-unit">%</span>
                  </div>
                </div>
              )}

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
                      onChange={(event) => onUpdatePonctuelAlloc(index, Number(event.target.value), 100 - Number(event.target.value))}
                      className="vcm__mini-input vcm__mini-input--tiny"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ponctuel.pctDistribution}
                      onChange={(event) => onUpdatePonctuelAlloc(index, 100 - Number(event.target.value), Number(event.target.value))}
                      className="vcm__mini-input vcm__mini-input--tiny"
                    />
                  </div>
                )}
              </div>

              <div className="vcm__ponctuel-cell">
                <button
                  type="button"
                  className="vcm__remove-btn"
                  onClick={() => onRemovePonctuel(index)}
                  aria-label={`Supprimer le versement ponctuel ${index + 1}`}
                >
                  <RemoveIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </VersementSectionShell>
  );
}
