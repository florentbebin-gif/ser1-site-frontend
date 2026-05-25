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
import {
  SimActionButton,
  SimAmountInputEuro,
  SimAmountInputPercent,
  SimSelect,
} from '@/components/ui/sim';
import {
  PlacementEuroField,
  PlacementNumberField,
  PlacementPercentField,
} from './PlacementAmountControls';
import { AllocationSlider } from './PlacementTables';

interface VersementSectionShellProps {
  step: string;
  title: string;
  action?: JSX.Element | null;
  children: JSX.Element;
}

const VersementSectionShell = ({ step, title, action, children }: VersementSectionShellProps) => (
  <section className="vcm__section">
    <div className="vcm__section-header">
      <div className="vcm__section-icon">{step}</div>
      <h3 className="vcm__section-title">{title}</h3>
      {action || null}
    </div>
    {children}
  </section>
);

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
          <PlacementEuroField
            label="Montant"
            value={initial.montant}
            onChange={(value) => onUpdateInitial('montant', value)}
          />
          {!isSCPI && (
            <PlacementPercentField
              label="Frais d'entrée"
              value={initial.fraisEntree}
              onChange={(value) => onUpdateInitial('fraisEntree', value)}
            />
          )}
          {isExpert && isPER && (
            <>
              <div className="vcm__field vcm__field--compact">
                <div className="vcm__label">Déductibilité</div>
                <SimSelect
                  ariaLabel="Déductibilité"
                  value={deductionInitiale.mode}
                  onChange={(v) =>
                    onUpdateDeductionInitiale({
                      mode: v as 'tmi' | 'montant',
                      montant: v === 'tmi' ? 0 : deductionInitiale.montant,
                    })
                  }
                  options={[
                    { value: 'tmi', label: 'Déduction TMI' },
                    { value: 'montant', label: 'Montant fixe' },
                  ]}
                />
              </div>
              {deductionInitiale.mode === 'montant' && (
                <PlacementEuroField
                  label="Économie IR"
                  value={deductionInitiale.montant}
                  onChange={(val) => onUpdateDeductionInitiale({ mode: 'montant', montant: val })}
                />
              )}
            </>
          )}
        </div>

        <div className="vcm__field">
          <div className="vcm__label vcm__label--sentence">Allocation</div>
          <AllocationSlider
            pctCapi={initial.pctCapitalisation}
            pctDistrib={initial.pctDistribution}
            onChange={onUpdateInitialAlloc}
            isSCPI={isSCPI}
            disabled={!isExpert && !isSCPI}
            readOnly
          />
        </div>

        <div className={showCapiBlock && showDistribBlock ? 'vcm__suboptions-row' : ''}>
          {showCapiBlock ? (
            <div className="vcm__suboption vcm__suboption--capi">
              <div className="vcm__suboption-header">
                <span className="vcm__badge vcm__badge--capi">Capitalisation</span>
              </div>
              <PlacementPercentField
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
                  <PlacementPercentField
                    label="Rendement annuel net de FG"
                    value={distribution.rendementAnnuel}
                    onChange={(value) => onUpdateDistribution('rendementAnnuel', value)}
                  />
                )}
                <PlacementPercentField
                  label={isSCPI ? 'Taux de loyers net de FG' : 'Taux de distribution net de FG'}
                  value={distribution.tauxDistribution}
                  onChange={(value) => onUpdateDistribution('tauxDistribution', value)}
                />
              </div>

              {(isExpert || !isSCPI) && (
                <div className="vcm__row">
                  {!isSCPI ? (
                    <PlacementNumberField
                      label="Durée du produit"
                      value={distribution.dureeProduit || ''}
                      onChange={(value) => onUpdateDistribution('dureeProduit', value || null)}
                      unit="ans"
                      min={1}
                      max={100}
                    />
                  ) : (
                    <div />
                  )}
                  {/* Délai de jouissance — masqué pour SCPI en mode simplifié */}
                  <PlacementNumberField
                    label="Délai de jouissance"
                    value={distribution.delaiJouissance}
                    onChange={(value) => onUpdateDistribution('delaiJouissance', value ?? 0)}
                    unit="mois"
                    min={0}
                    max={12}
                  />
                </div>
              )}

              {/* Stratégie — masquée pour SCPI en mode simplifié */}
              {(isExpert || !isSCPI) && (
                <div className="vcm__field">
                  <div className="vcm__label">Stratégie</div>
                  <SimSelect
                    ariaLabel="Stratégie"
                    value={distribution.strategie}
                    onChange={(v) => onUpdateDistribution('strategie', v)}
                    options={[
                      ...(!isSCPI
                        ? [{ value: 'stocker', label: 'Stocker les distributions à 0%' }]
                        : []),
                      ...(isSCPI || isCTO
                        ? [
                            {
                              value: 'apprehender',
                              label: 'Appréhender les distributions chaque année',
                            },
                          ]
                        : []),
                      {
                        value: 'reinvestir_capi',
                        label: isSCPI
                          ? 'Réinvestir les distributions nettes de fiscalité chaque année'
                          : 'Réinvestir les distributions chaque année vers la capitalisation',
                      },
                    ]}
                  />
                </div>
              )}

              {!isSCPI && distribution.dureeProduit ? (
                <div className="vcm__field">
                  <div className="vcm__label">Au terme du produit, réinvestir vers</div>
                  <SimSelect
                    ariaLabel="Au terme du produit, réinvestir vers"
                    value={distribution.reinvestirVersAuTerme}
                    onChange={(v) => onUpdateDistribution('reinvestirVersAuTerme', v)}
                    options={[
                      { value: 'capitalisation', label: 'Capitalisation' },
                      { value: 'distribution', label: 'Distribution' },
                    ]}
                  />
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
  active: boolean;
  annuel: VersementAnnuel;
  isPER: boolean;
  isSCPI: boolean;
  isExpert: boolean;
  onAddAnnual: () => void;
  onRemoveAnnual: () => void;
  onUpdateAnnuel: <K extends keyof VersementAnnuel>(field: K, value: VersementAnnuel[K]) => void;
  onUpdateAnnuelAlloc: (_capi: number, _distrib: number) => void;
  onUpdateAnnuelOption: <K extends keyof VersementOption>(
    optionName: 'garantieBonneFin' | 'exonerationCotisations',
    field: K,
    value: VersementOption[K],
  ) => void;
}

export function VersementAnnualSection({
  active,
  annuel,
  isPER,
  isSCPI,
  isExpert,
  onAddAnnual,
  onRemoveAnnual,
  onUpdateAnnuel,
  onUpdateAnnuelAlloc,
  onUpdateAnnuelOption,
}: VersementAnnualSectionProps) {
  if (!active) {
    return (
      <VersementSectionShell
        step="2"
        title="Versement annuel"
        action={<SimActionButton variant="add" mode="text" label="Ajouter" onClick={onAddAnnual} />}
      >
        <div className="vcm__empty">
          <p>Aucun versement annuel configuré</p>
          <SimActionButton
            variant="add"
            mode="text"
            label="Ajouter un versement annuel"
            onClick={onAddAnnual}
          />
        </div>
      </VersementSectionShell>
    );
  }

  return (
    <VersementSectionShell
      step="2"
      title="Versement annuel"
      action={
        <SimActionButton
          variant="delete"
          mode="text"
          label="Supprimer"
          onClick={onRemoveAnnual}
          danger
        />
      }
    >
      <div className="vcm__card">
        <div className="vcm__row vcm__row--4cols">
          <PlacementEuroField
            label="Montant"
            value={annuel.montant}
            onChange={(value) => onUpdateAnnuel('montant', value)}
          />
          {!isSCPI && (
            <PlacementPercentField
              label="Frais d'entrée"
              value={annuel.fraisEntree}
              onChange={(value) => onUpdateAnnuel('fraisEntree', value)}
            />
          )}
          <div className={`vcm__field vcm__field--alloc${isSCPI ? '' : ''}`}>
            <div className="vcm__label vcm__label--sentence">Allocation</div>
            <AllocationSlider
              pctCapi={annuel.pctCapitalisation}
              pctDistrib={annuel.pctDistribution}
              onChange={onUpdateAnnuelAlloc}
              isSCPI={isSCPI}
              disabled={!isExpert && !isSCPI}
              readOnly
            />
          </div>
        </div>

        {isPER ? (
          <div className="vcm__per-options">
            <div className="vcm__per-option">
              <label className="vcm__checkbox">
                <input
                  type="checkbox"
                  checked={annuel.garantieBonneFin.active}
                  onChange={(event) =>
                    onUpdateAnnuelOption('garantieBonneFin', 'active', event.target.checked)
                  }
                />
                <span>Garantie de bonne fin</span>
              </label>
              {annuel.garantieBonneFin.active ? (
                <PlacementPercentField
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
                  onChange={(event) =>
                    onUpdateAnnuelOption('exonerationCotisations', 'active', event.target.checked)
                  }
                />
                <span>Exonération des cotisations</span>
              </label>
              {annuel.exonerationCotisations.active ? (
                <PlacementPercentField
                  label="Coût annuel"
                  value={annuel.exonerationCotisations.cout}
                  onChange={(value) =>
                    onUpdateAnnuelOption('exonerationCotisations', 'cout', value)
                  }
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
}

export function VersementPonctuelsSection({
  ponctuels,
  dureeEpargne,
  isSCPI,
  onAddPonctuel,
  onUpdatePonctuel,
  onUpdatePonctuelAlloc,
  onRemovePonctuel,
}: VersementPonctuelsSectionProps) {
  return (
    <VersementSectionShell
      step="3"
      title="Versements ponctuels"
      action={<SimActionButton variant="add" mode="text" label="Ajouter" onClick={onAddPonctuel} />}
    >
      {ponctuels.length === 0 ? (
        <div className="vcm__empty">
          <p>Aucun versement ponctuel configuré</p>
          <SimActionButton
            variant="add"
            mode="text"
            label="Ajouter un versement"
            onClick={onAddPonctuel}
          />
        </div>
      ) : (
        <div className={`vcm__ponctuels${isSCPI ? ' vcm__ponctuels--scpi' : ''}`}>
          <div className="vcm__ponctuel-headers">
            <span>Année</span>
            <span>Montant</span>
            {!isSCPI && <span>Frais d'entrée</span>}
            <span className="vcm__ponctuel-header--center">Allocation</span>
            <span />
          </div>

          {ponctuels.map((ponctuel, index) => (
            <div key={index} className="vcm__ponctuel-row">
              <div className="vcm__ponctuel-cell">
                <PlacementNumberField
                  value={ponctuel.annee}
                  onChange={(value) => onUpdatePonctuel(index, 'annee', value ?? 1)}
                  min={1}
                  max={dureeEpargne}
                  inline
                />
              </div>

              <div className="vcm__ponctuel-cell">
                <SimAmountInputEuro
                  value={ponctuel.montant}
                  ariaLabel="Montant"
                  className="vcm__mini-input"
                  fieldClassName="vcm__mini-field"
                  rowClassName="vcm__mini-input-wrap"
                  unitClassName="vcm__mini-unit"
                  onChange={(value) => onUpdatePonctuel(index, 'montant', value)}
                />
              </div>

              {!isSCPI && (
                <div className="vcm__ponctuel-cell">
                  <SimAmountInputPercent
                    value={ponctuel.fraisEntree * 100}
                    ariaLabel="Frais d'entrée (%)"
                    min={0}
                    max={100}
                    className="vcm__mini-input"
                    fieldClassName="vcm__mini-field"
                    rowClassName="vcm__mini-input-wrap"
                    unitClassName="vcm__mini-unit"
                    minimumFractionDigits={1}
                    maximumFractionDigits={1}
                    onChange={(value) => onUpdatePonctuel(index, 'fraisEntree', value / 100)}
                  />
                </div>
              )}

              <div className="vcm__ponctuel-cell vcm__ponctuel-cell--alloc">
                {isSCPI ? (
                  <span className="vcm__alloc-fixed">100% D</span>
                ) : (
                  <AllocationSlider
                    pctCapi={ponctuel.pctCapitalisation}
                    pctDistrib={ponctuel.pctDistribution}
                    onChange={(capi, distrib) => onUpdatePonctuelAlloc(index, capi, distrib)}
                    isSCPI={false}
                    readOnly
                  />
                )}
              </div>

              <div className="vcm__ponctuel-cell">
                <SimActionButton
                  variant="delete"
                  mode="icon"
                  label="Supprimer"
                  onClick={() => onRemovePonctuel(index)}
                  ariaLabel={`Supprimer le versement ponctuel ${index + 1}`}
                  danger
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </VersementSectionShell>
  );
}
