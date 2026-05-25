import type { Dispatch, SetStateAction } from 'react';
import { SimAmountInputPercent } from '@/components/ui/sim';
import type { SuccessionAssetPocket, SuccessionDonationEntreEpouxOption } from '../successionDraft';
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
import { DispositionsParticipationAcquetsSection } from './DispositionsParticipationAcquetsSection';
import { DispositionsSocieteAcquetsSection } from './DispositionsSocieteAcquetsSection';
import { clampPercentage } from './dispositions.helpers';
import { ScSelect } from './ScSelect';

export type DispositionsCommonPanel = 'all' | 'transmission' | 'claims' | 'preciput';

interface DispositionsCommonSectionProps {
  panel?: DispositionsCommonPanel;
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
  preciputConfiguratorProps: Omit<DispositionsPreciputConfiguratorProps, 'title' | 'globalHint'>;
}

export function DispositionsCommonSection({
  panel = 'all',
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
  const showTransmission = panel === 'all' || panel === 'transmission';
  const showClaims = panel === 'all' || panel === 'claims';
  const showPreciput = panel === 'all' || panel === 'preciput';

  return (
    <div
      className={`sc-dispositions-modal__section sc-dispositions-modal__section--common sc-dispositions-modal__section--${panel}`}
    >
      {showTransmission && showSharedTransmissionPct && (
        <div className="sc-field">
          <label htmlFor="sc-dispositions-attribution-biens-communs">
            {isPacsIndivision
              ? 'Part indivise transmise au survivant (%)'
              : 'Attribution des biens communs au survivant (%)'}
          </label>
          <SimAmountInputPercent
            id="sc-dispositions-attribution-biens-communs"
            min={0}
            max={100}
            value={dispositionsDraft.attributionBiensCommunsPct}
            onChange={(value) =>
              setDispositionsDraft((prev) => ({
                ...prev,
                attributionBiensCommunsPct: clampPercentage(String(value)),
              }))
            }
          />
          <p className="sc-hint sc-hint--compact">
            50 = partage usuel ; 100 = attribution intégrale économique.
          </p>
        </div>
      )}

      {showTransmission && showDonationEntreEpoux && (
        <div className="sc-field">
          <label htmlFor="sc-dispositions-donation-entre-epoux">Donation entre époux</label>
          <ScSelect
            id="sc-dispositions-donation-entre-epoux"
            value={dispositionsDraft.donationEntreEpouxActive ? 'oui' : 'non'}
            onChange={(value) =>
              setDispositionsDraft((prev) => ({
                ...prev,
                donationEntreEpouxActive: value === 'oui',
              }))
            }
            options={OUI_NON_OPTIONS}
          />
        </div>
      )}

      {showTransmission && showDonationEntreEpoux && dispositionsDraft.donationEntreEpouxActive && (
        <div className="sc-field">
          <label htmlFor="sc-dispositions-donation-option">Type de donation entre époux</label>
          <ScSelect
            id="sc-dispositions-donation-option"
            value={dispositionsDraft.donationEntreEpouxOption}
            onChange={(value) =>
              setDispositionsDraft((prev) => ({
                ...prev,
                donationEntreEpouxOption: value as SuccessionDonationEntreEpouxOption,
              }))
            }
            options={DONATION_ENTRE_EPOUX_OPTIONS}
          />
          <p className="sc-hint sc-hint--compact">
            Le choix du type de donation entre époux se fait au moment du décès.
          </p>
          {dispositionsDraft.donationEntreEpouxOption === 'pleine_propriete_totale' && (
            <p className="sc-hint sc-hint--compact">
              Cette option simule une transmission de 100 % au conjoint survivant. En présence
              d&apos;enfants, elle n&apos;est pas automatique et peut être réduite pour respecter
              leur réserve héréditaire.
            </p>
          )}
        </div>
      )}

      {showTransmission &&
        showDonationEntreEpoux &&
        !dispositionsDraft.donationEntreEpouxActive &&
        nbDescendantBranches > 0 && (
          <div className="sc-field">
            <div className="sc-field-label">Choix légal du conjoint</div>
            {nbEnfantsNonCommuns > 0 ? (
              <p className="sc-hint sc-hint--compact">
                En présence d&apos;enfants non communs, le conjoint survivant n&apos;a droit
                qu&apos;au quart en pleine propriété (art. 757 CC).
              </p>
            ) : (
              <>
                <ScSelect
                  ariaLabel="Choix légal du conjoint"
                  value={dispositionsDraft.choixLegalConjointSansDDV ?? '__moteur__'}
                  onChange={(value) =>
                    setDispositionsDraft((prev) => ({
                      ...prev,
                      choixLegalConjointSansDDV:
                        value === '__moteur__' ? null : (value as 'usufruit' | 'quart_pp'),
                    }))
                  }
                  options={CHOIX_LEGAL_CONJOINT_OPTIONS}
                />
                <p className="sc-hint sc-hint--compact">
                  Sans précision, le simulateur conserve l&apos;hypothèse moteur actuelle ; le droit
                  positif prévoit un choix entre usufruit total et quart en pleine propriété.
                </p>
              </>
            )}
          </div>
        )}

      {showTransmission && isCommunauteUniverselleRegime && (
        <div className="sc-field">
          <label htmlFor="sc-dispositions-stipulation-cu">
            Stipulation contraire en communauté universelle
          </label>
          <ScSelect
            id="sc-dispositions-stipulation-cu"
            value={dispositionsDraft.stipulationContraireCU ? 'oui' : 'non'}
            onChange={(value) =>
              setDispositionsDraft((prev) => ({
                ...prev,
                stipulationContraireCU: value === 'oui',
              }))
            }
            options={OUI_NON_OPTIONS}
          />
          <p className="sc-hint sc-hint--compact">
            Si oui, les biens détaillés qualifiés &quot;propres par nature&quot; et rattachés à un
            époux restent hors de la masse commune simplifiée.
          </p>
        </div>
      )}

      {showTransmission && isCommunauteMeublesAcquetsRegime && (
        <div className="sc-field">
          <div className="sc-field-label">Qualification meuble / immeuble pour CMA</div>
          <p className="sc-hint sc-hint--compact">
            Les actifs détaillés qualifiés meubles sont rapprochés de la communauté simplifiée. Les
            immeubles restent sur leur masse déclarée. À défaut de saisie explicite, la catégorie
            détaillée sert de proxy.
          </p>
        </div>
      )}

      {showTransmission && isParticipationAcquetsRegime && (
        <DispositionsParticipationAcquetsSection
          dispositionsDraft={dispositionsDraft}
          setDispositionsDraft={setDispositionsDraft}
        />
      )}

      {showClaims && (
        <DispositionsInterMassClaimsSection
          dispositionsDraft={dispositionsDraft}
          interMassClaimPocketOptions={interMassClaimPocketOptions}
          onAddInterMassClaim={onAddInterMassClaim}
          onUpdateInterMassClaim={onUpdateInterMassClaim}
          onRemoveInterMassClaim={onRemoveInterMassClaim}
        />
      )}

      {showPreciput && isCommunityRegime && (
        <DispositionsPreciputConfigurator
          {...preciputConfiguratorProps}
          title="Clause de préciput (EUR)"
          globalHint="Le préciput permet au conjoint survivant de prélever certains biens ou une somme sur la communauté avant le partage successoral."
        />
      )}

      {showPreciput && isSocieteAcquetsRegime && (
        <DispositionsSocieteAcquetsSection
          dispositionsDraft={dispositionsDraft}
          setDispositionsDraft={setDispositionsDraft}
          preciputConfiguratorProps={preciputConfiguratorProps}
        />
      )}
    </div>
  );
}
