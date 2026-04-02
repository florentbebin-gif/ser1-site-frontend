import type { Dispatch, SetStateAction } from 'react';
import type {
  SuccessionAssetPocket,
  SuccessionDonationEntreEpouxOption,
} from '../successionDraft';
import type { DispositionsDraftState } from '../successionSimulator.helpers';
import {
  CHOIX_LEGAL_CONJOINT_OPTIONS,
  DONATION_ENTRE_EPOUX_OPTIONS,
  OUI_NON_OPTIONS,
} from '../successionSimulator.constants';
import {
  DispositionsPreciputConfigurator,
  type DispositionsPreciputConfiguratorProps,
} from './DispositionsPreciputConfigurator';
import { DispositionsInterMassClaimsSection } from './DispositionsInterMassClaimsSection';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect, type ScSelectOption } from './ScSelect';

const SOCIETE_ACQUETS_LIQUIDATION_OPTIONS: ScSelectOption[] = [
  { value: 'quotes', label: 'Quotes contractuelles' },
  { value: 'attribution_survivant', label: 'Attribution au survivant' },
];

interface DispositionsCommonSectionProps {
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  showSharedTransmissionPct: boolean;
  isPacsIndivision: boolean;
  showDonationEntreEpoux: boolean;
  nbDescendantBranches: number;
  nbEnfantsNonCommuns: number;
  isCommunityRegime: boolean;
  isSocieteAcquetsRegime: boolean;
  isParticipationAcquetsRegime: boolean;
  isCommunauteUniverselleRegime: boolean;
  isCommunauteMeublesAcquetsRegime: boolean;
  interMassClaimPocketOptions: { value: SuccessionAssetPocket; label: string }[];
  onAddInterMassClaim: () => void;
  onUpdateInterMassClaim: (
    claimId: string,
    field: 'kind' | 'fromPocket' | 'toPocket' | 'amount' | 'enabled' | 'label',
    value: string | number | boolean,
  ) => void;
  onRemoveInterMassClaim: (claimId: string) => void;
  preciputConfiguratorProps: Omit<
    DispositionsPreciputConfiguratorProps,
    'title' | 'globalHint'
  >;
}

function clampPercentage(value: string): number {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

export function DispositionsCommonSection({
  dispositionsDraft,
  setDispositionsDraft,
  showSharedTransmissionPct,
  isPacsIndivision,
  showDonationEntreEpoux,
  nbDescendantBranches,
  nbEnfantsNonCommuns,
  isCommunityRegime,
  isSocieteAcquetsRegime,
  isParticipationAcquetsRegime,
  isCommunauteUniverselleRegime,
  isCommunauteMeublesAcquetsRegime,
  interMassClaimPocketOptions,
  onAddInterMassClaim,
  onUpdateInterMassClaim,
  onRemoveInterMassClaim,
  preciputConfiguratorProps,
}: DispositionsCommonSectionProps) {
  const updateParticipationAcquets = (
    updater: (
      current: DispositionsDraftState['participationAcquets'],
    ) => DispositionsDraftState['participationAcquets'],
  ) => {
    setDispositionsDraft((prev) => ({
      ...prev,
      participationAcquets: updater(prev.participationAcquets),
    }));
  };

  const updateSocieteAcquets = (
    updater: (
      current: DispositionsDraftState['societeAcquets'],
    ) => DispositionsDraftState['societeAcquets'],
  ) => {
    setDispositionsDraft((prev) => ({
      ...prev,
      societeAcquets: updater(prev.societeAcquets),
    }));
  };

  return (
    <div className="sc-dispositions-modal__section sc-dispositions-modal__section--common">
      {showSharedTransmissionPct && (
        <div className="sc-field">
          <label>
            {isPacsIndivision
              ? 'Part indivise transmise au survivant (%)'
              : 'Attribution des biens communs au survivant (%)'}
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={dispositionsDraft.attributionBiensCommunsPct}
            onChange={(e) => setDispositionsDraft((prev) => ({
              ...prev,
              attributionBiensCommunsPct: clampPercentage(e.target.value),
            }))}
          />
          <p className="sc-hint sc-hint--compact">
            50 = partage usuel ; 100 = attribution intégrale économique.
          </p>
        </div>
      )}

      {showDonationEntreEpoux && (
        <div className="sc-field">
          <label>Donation entre époux</label>
          <ScSelect
            value={dispositionsDraft.donationEntreEpouxActive ? 'oui' : 'non'}
            onChange={(value) => setDispositionsDraft((prev) => ({
              ...prev,
              donationEntreEpouxActive: value === 'oui',
            }))}
            options={OUI_NON_OPTIONS}
          />
        </div>
      )}

      {showDonationEntreEpoux && dispositionsDraft.donationEntreEpouxActive && (
        <div className="sc-field">
          <label>Type de donation entre époux</label>
          <ScSelect
            value={dispositionsDraft.donationEntreEpouxOption}
            onChange={(value) => setDispositionsDraft((prev) => ({
              ...prev,
              donationEntreEpouxOption: value as SuccessionDonationEntreEpouxOption,
            }))}
            options={DONATION_ENTRE_EPOUX_OPTIONS}
          />
          <p className="sc-hint sc-hint--compact">
            Le choix du type de donation entre époux se fait au moment du décès.
          </p>
          {dispositionsDraft.donationEntreEpouxOption === 'pleine_propriete_totale' && (
            <p className="sc-hint sc-hint--compact">
              Cette option simule une transmission de 100 % au conjoint survivant. En présence d&apos;enfants,
              elle n&apos;est pas automatique et peut être réduite pour respecter leur réserve héréditaire.
            </p>
          )}
        </div>
      )}

      {showDonationEntreEpoux
        && !dispositionsDraft.donationEntreEpouxActive
        && nbDescendantBranches > 0 && (
          <div className="sc-field">
            <label>Choix légal du conjoint</label>
            {nbEnfantsNonCommuns > 0 ? (
              <p className="sc-hint sc-hint--compact">
                En présence d&apos;enfants non communs, le conjoint survivant n&apos;a droit qu&apos;au quart en pleine propriété
                (art. 757 CC).
              </p>
            ) : (
              <>
                <ScSelect
                  value={dispositionsDraft.choixLegalConjointSansDDV ?? '__moteur__'}
                  onChange={(value) => setDispositionsDraft((prev) => ({
                    ...prev,
                    choixLegalConjointSansDDV: value === '__moteur__'
                      ? null
                      : value as 'usufruit' | 'quart_pp',
                  }))}
                  options={CHOIX_LEGAL_CONJOINT_OPTIONS}
                />
                <p className="sc-hint sc-hint--compact">
                  Sans précision, le simulateur conserve l&apos;hypothèse moteur actuelle ; le droit positif prévoit un
                  choix entre usufruit total et quart en pleine propriété.
                </p>
              </>
            )}
          </div>
        )}

      {isCommunauteUniverselleRegime && (
        <div className="sc-field">
          <label>Stipulation contraire en communauté universelle</label>
          <ScSelect
            value={dispositionsDraft.stipulationContraireCU ? 'oui' : 'non'}
            onChange={(value) => setDispositionsDraft((prev) => ({
              ...prev,
              stipulationContraireCU: value === 'oui',
            }))}
            options={OUI_NON_OPTIONS}
          />
          <p className="sc-hint sc-hint--compact">
            Si oui, les biens détaillés qualifiés &quot;propres par nature&quot; et rattachés à un époux restent hors de la
            masse commune simplifiée.
          </p>
        </div>
      )}

      {isCommunauteMeublesAcquetsRegime && (
        <div className="sc-field">
          <label>Qualification meuble / immeuble pour CMA</label>
          <p className="sc-hint sc-hint--compact">
            Les actifs détaillés qualifiés meubles sont rapprochés de la communauté simplifiée. Les immeubles restent
            sur leur masse déclarée. À défaut de saisie explicite, la catégorie détaillée sert de proxy.
          </p>
        </div>
      )}

      {isParticipationAcquetsRegime && (
        <>
          <div className="sc-field">
            <label>Bloc participation aux acquêts</label>
            <ScSelect
              value={dispositionsDraft.participationAcquets.active ? 'oui' : 'non'}
              onChange={(value) => updateParticipationAcquets((current) => ({
                ...current,
                active: value === 'oui',
              }))}
              options={OUI_NON_OPTIONS}
            />
            <p className="sc-hint sc-hint--compact">
              Active un calcul simplifié de créance de participation au 1er décès.
            </p>
          </div>

          {dispositionsDraft.participationAcquets.active && (
            <>
              <div className="sc-field">
                <label>Patrimoine final dérivé des actifs saisis</label>
                <ScSelect
                  value={dispositionsDraft.participationAcquets.useCurrentAssetsAsFinalPatrimony ? 'oui' : 'non'}
                  onChange={(value) => updateParticipationAcquets((current) => ({
                    ...current,
                    useCurrentAssetsAsFinalPatrimony: value === 'oui',
                  }))}
                  options={OUI_NON_OPTIONS}
                />
                <p className="sc-hint sc-hint--compact">
                  Oui = le simulateur reprend les actifs propres actuellement saisis pour chaque époux.
                </p>
              </div>

              <div className="sc-field">
                <label>Patrimoine originaire Époux 1 (EUR)</label>
                <ScNumericInput
                  value={dispositionsDraft.participationAcquets.patrimoineOriginaireEpoux1 || 0}
                  min={0}
                  onChange={(value) => updateParticipationAcquets((current) => ({
                    ...current,
                    patrimoineOriginaireEpoux1: value,
                  }))}
                />
              </div>

              <div className="sc-field">
                <label>Patrimoine originaire Époux 2 (EUR)</label>
                <ScNumericInput
                  value={dispositionsDraft.participationAcquets.patrimoineOriginaireEpoux2 || 0}
                  min={0}
                  onChange={(value) => updateParticipationAcquets((current) => ({
                    ...current,
                    patrimoineOriginaireEpoux2: value,
                  }))}
                />
              </div>

              {!dispositionsDraft.participationAcquets.useCurrentAssetsAsFinalPatrimony && (
                <>
                  <div className="sc-field">
                    <label>Patrimoine final Époux 1 (EUR)</label>
                    <ScNumericInput
                      value={dispositionsDraft.participationAcquets.patrimoineFinalEpoux1 || 0}
                      min={0}
                      onChange={(value) => updateParticipationAcquets((current) => ({
                        ...current,
                        patrimoineFinalEpoux1: value,
                      }))}
                    />
                  </div>

                  <div className="sc-field">
                    <label>Patrimoine final Époux 2 (EUR)</label>
                    <ScNumericInput
                      value={dispositionsDraft.participationAcquets.patrimoineFinalEpoux2 || 0}
                      min={0}
                      onChange={(value) => updateParticipationAcquets((current) => ({
                        ...current,
                        patrimoineFinalEpoux2: value,
                      }))}
                    />
                  </div>
                </>
              )}

              <div className="sc-field">
                <label>Quote de créance Époux 1 (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={dispositionsDraft.participationAcquets.quoteEpoux1Pct}
                  onChange={(e) => {
                    const quoteEpoux1Pct = clampPercentage(e.target.value);
                    updateParticipationAcquets((current) => ({
                      ...current,
                      quoteEpoux1Pct,
                      quoteEpoux2Pct: 100 - quoteEpoux1Pct,
                    }));
                  }}
                />
              </div>

              <div className="sc-field">
                <label>Quote de créance Époux 2 (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={dispositionsDraft.participationAcquets.quoteEpoux2Pct}
                  onChange={(e) => {
                    const quoteEpoux2Pct = clampPercentage(e.target.value);
                    updateParticipationAcquets((current) => ({
                      ...current,
                      quoteEpoux1Pct: 100 - quoteEpoux2Pct,
                      quoteEpoux2Pct,
                    }));
                  }}
                />
                <p className="sc-hint sc-hint--compact">
                  La quote du conjoint créancier s&apos;applique à l&apos;écart d&apos;acquêts net calculé.
                </p>
              </div>
            </>
          )}
        </>
      )}

      <DispositionsInterMassClaimsSection
        dispositionsDraft={dispositionsDraft}
        interMassClaimPocketOptions={interMassClaimPocketOptions}
        onAddInterMassClaim={onAddInterMassClaim}
        onUpdateInterMassClaim={onUpdateInterMassClaim}
        onRemoveInterMassClaim={onRemoveInterMassClaim}
      />

      {isCommunityRegime && (
        <DispositionsPreciputConfigurator
          {...preciputConfiguratorProps}
          title="Clause de préciput (EUR)"
          globalHint="Le préciput permet au conjoint survivant de prélever certains biens ou une somme sur la communauté avant le partage successoral."
        />
      )}

      {isSocieteAcquetsRegime && (
        <>
          <div className="sc-field">
            <label>Bloc société d&apos;acquets</label>
            <ScSelect
              value={dispositionsDraft.societeAcquets.active ? 'oui' : 'non'}
              onChange={(value) => updateSocieteAcquets((current) => ({
                ...current,
                active: value === 'oui',
              }))}
              options={OUI_NON_OPTIONS}
            />
            <p className="sc-hint sc-hint--compact">
              Active la liquidation contractuelle de la poche société d&apos;acquets.
            </p>
          </div>

          {dispositionsDraft.societeAcquets.active && (
            <>
              <div className="sc-field">
                <label>Mode de liquidation de la société d&apos;acquets</label>
                <ScSelect
                  value={dispositionsDraft.societeAcquets.liquidationMode}
                  onChange={(value) => updateSocieteAcquets((current) => ({
                    ...current,
                    liquidationMode: value as 'quotes' | 'attribution_survivant',
                  }))}
                  options={SOCIETE_ACQUETS_LIQUIDATION_OPTIONS}
                />
                <p className="sc-hint sc-hint--compact">
                  Le mode quotes répartit la poche selon les quotes contractuelles ; le mode attribution ajoute une part
                  préalable au survivant avant de partager le reliquat.
                </p>
              </div>

              <div className="sc-field">
                <label>Quote Époux 1 dans la société d&apos;acquets (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={dispositionsDraft.societeAcquets.quoteEpoux1Pct}
                  onChange={(e) => {
                    const quoteEpoux1Pct = clampPercentage(e.target.value);
                    updateSocieteAcquets((current) => ({
                      ...current,
                      quoteEpoux1Pct,
                      quoteEpoux2Pct: 100 - quoteEpoux1Pct,
                    }));
                  }}
                />
              </div>

              <div className="sc-field">
                <label>Quote Époux 2 dans la société d&apos;acquets (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={dispositionsDraft.societeAcquets.quoteEpoux2Pct}
                  onChange={(e) => {
                    const quoteEpoux2Pct = clampPercentage(e.target.value);
                    updateSocieteAcquets((current) => ({
                      ...current,
                      quoteEpoux1Pct: 100 - quoteEpoux2Pct,
                      quoteEpoux2Pct,
                    }));
                  }}
                />
                <p className="sc-hint sc-hint--compact">
                  Les quotes contractuelles sont maintenues à 100 % au total.
                </p>
              </div>

              {dispositionsDraft.societeAcquets.liquidationMode === 'attribution_survivant' && (
                <div className="sc-field">
                  <label>Attribution préalable au survivant (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={dispositionsDraft.societeAcquets.attributionSurvivantPct}
                    onChange={(e) => updateSocieteAcquets((current) => ({
                      ...current,
                      attributionSurvivantPct: clampPercentage(e.target.value),
                    }))}
                  />
                  <p className="sc-hint sc-hint--compact">
                    Cette part est attribuée au survivant avant d&apos;appliquer les quotes sur le reliquat.
                  </p>
                </div>
              )}

              <div className="sc-field">
                <label>Attribution intégrale de la société d&apos;acquets</label>
                <ScSelect
                  value={dispositionsDraft.attributionIntegrale ? 'oui' : 'non'}
                  onChange={(value) => setDispositionsDraft((prev) => ({
                    ...prev,
                    attributionIntegrale: value === 'oui',
                  }))}
                  options={OUI_NON_OPTIONS}
                />
                <p className="sc-hint sc-hint--compact">
                  Si oui, la poche société d&apos;acquets est reportée en totalité au survivant au 1er décès.
                </p>
              </div>

              <DispositionsPreciputConfigurator
                {...preciputConfiguratorProps}
                title="Préciput sur la société d'acquets (EUR)"
                globalHint="Le préciput est prélevé sur la société d'acquets avant la liquidation du reliquat."
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
