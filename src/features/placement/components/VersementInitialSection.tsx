import {
  type CapitalisationConfig,
  type DeductionInitiale,
  type DistributionConfig,
  type VersementEntry,
} from '@/engine/placement/versementConfig';
import { SimSelect } from '@/components/ui/sim';
import {
  PlacementEuroField,
  PlacementNumberField,
  PlacementPercentField,
} from './PlacementAmountControls';
import { AllocationSlider } from './PlacementTables';
import { VersementSectionShell } from './VersementConfigModalSectionShell';

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
