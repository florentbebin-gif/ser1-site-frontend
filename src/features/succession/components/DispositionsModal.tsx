import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
  type FamilyMember,
  type SituationMatrimoniale,
  type SuccessionAssetDetailEntry,
  type SuccessionBeneficiaryRef,
  type SuccessionDispositionTestamentaire,
  type SuccessionDonationEntreEpouxOption,
  type SuccessionEnfant,
  type SuccessionGroupementFoncierEntry,
  type SuccessionPrimarySide,
  type SuccessionTestamentConfig,
} from '../successionDraft';
import type {
  buildTestamentBeneficiaryOptions} from '../successionTestament';
import {
  getQuotiteDisponiblePctForSide,
  getReserveHintForSide,
  getTestamentCardTitle,
} from '../successionTestament';
import { TESTAMENT_TYPE_DESCRIPTIONS } from '../successionTestament.constants';
import {
  CHOIX_LEGAL_CONJOINT_OPTIONS,
  DISPOSITION_TESTAMENTAIRE_OPTIONS,
  DONATION_ENTRE_EPOUX_OPTIONS,
  OUI_NON_OPTIONS,
} from '../successionSimulator.constants';
import type { DispositionsDraftState } from '../successionSimulator.helpers';
import {
  buildSuccessionPreciputCandidates,
  createSuccessionPreciputSelection,
  getSuccessionPreciputEligiblePocket,
  syncSuccessionPreciputSelections,
} from '../successionPreciput';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';

const SOCIETE_ACQUETS_LIQUIDATION_OPTIONS = [
  { value: 'quotes', label: 'Quotes contractuelles' },
  { value: 'attribution_survivant', label: 'Attribution au survivant' },
] as const;

const PRECIPUT_MODE_OPTIONS = [
  {
    value: 'global',
    label: 'Montant global',
    description: 'Conserve la saisie simple par montant.',
  },
  {
    value: 'cible',
    label: 'Bien(s) cible(s)',
    description: 'Preleve une liste de biens compatibles avant partage.',
  },
] as const;

function formatPreciputAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

interface DispositionsModalProps {
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  testamentSides: SuccessionPrimarySide[];
  testamentBeneficiaryOptionsBySide: Record<
    SuccessionPrimarySide,
    ReturnType<typeof buildTestamentBeneficiaryOptions>
  >;
  descendantBranchesBySide: Record<SuccessionPrimarySide, number>;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  assetEntries: SuccessionAssetDetailEntry[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  civilSituation: SituationMatrimoniale;
  showSharedTransmissionPct: boolean;
  isPacsIndivision: boolean;
  showDonationEntreEpoux: boolean;
  nbDescendantBranches: number;
  nbEnfantsNonCommuns: number;
  isCommunityRegime: boolean;
  isSocieteAcquetsRegime: boolean;
  isParticipationAcquetsRegime: boolean;
  updateDispositionsTestament: (
    _side: SuccessionPrimarySide,
    _updater: (_current: SuccessionTestamentConfig) => SuccessionTestamentConfig,
  ) => void;
  getFirstTestamentBeneficiaryRef: (_side: SuccessionPrimarySide) => SuccessionBeneficiaryRef | null;
  onAddParticularLegacy: (_side: SuccessionPrimarySide) => void;
  onUpdateParticularLegacy: (
    _side: SuccessionPrimarySide,
    _legacyId: string,
    _field: 'beneficiaryRef' | 'amount' | 'label',
    _value: string | number | SuccessionBeneficiaryRef | null,
  ) => void;
  onRemoveParticularLegacy: (_side: SuccessionPrimarySide, _legacyId: string) => void;
  onClose: () => void;
  onValidate: () => void;
}

export default function DispositionsModal({
  dispositionsDraft,
  setDispositionsDraft,
  testamentSides,
  testamentBeneficiaryOptionsBySide,
  descendantBranchesBySide,
  enfantsContext,
  familyMembers,
  assetEntries,
  groupementFoncierEntries,
  civilSituation,
  showSharedTransmissionPct,
  isPacsIndivision,
  showDonationEntreEpoux,
  nbDescendantBranches,
  nbEnfantsNonCommuns,
  isCommunityRegime,
  isSocieteAcquetsRegime,
  isParticipationAcquetsRegime,
  updateDispositionsTestament,
  getFirstTestamentBeneficiaryRef,
  onAddParticularLegacy,
  onUpdateParticularLegacy,
  onRemoveParticularLegacy,
  onClose,
  onValidate,
}: DispositionsModalProps) {
  const [pendingPreciputCandidateKey, setPendingPreciputCandidateKey] = useState('');
  const preciputEligiblePocket = useMemo(() => getSuccessionPreciputEligiblePocket({
    isCommunityRegime,
    isSocieteAcquetsRegime: isSocieteAcquetsRegime && dispositionsDraft.societeAcquets.active,
  }), [dispositionsDraft.societeAcquets.active, isCommunityRegime, isSocieteAcquetsRegime]);
  const preciputCandidates = useMemo(() => buildSuccessionPreciputCandidates({
    assetEntries,
    groupementFoncierEntries,
    allowedPocket: preciputEligiblePocket,
  }), [assetEntries, groupementFoncierEntries, preciputEligiblePocket]);
  const syncedPreciputSelections = useMemo(
    () => syncSuccessionPreciputSelections(dispositionsDraft.preciputSelections, preciputCandidates),
    [dispositionsDraft.preciputSelections, preciputCandidates],
  );
  const preciputCandidatesByKey = useMemo(
    () => new Map(preciputCandidates.map((candidate) => [candidate.key, candidate])),
    [preciputCandidates],
  );
  const selectedPreciputCandidateKeys = useMemo(
    () => new Set(syncedPreciputSelections.map((selection) => `${selection.sourceType}:${selection.sourceId}`)),
    [syncedPreciputSelections],
  );
  const preciputCandidateOptions = useMemo(() => [
    { value: '', label: 'Choisir un bien...', disabled: true },
    ...preciputCandidates
      .filter((candidate) => !selectedPreciputCandidateKeys.has(candidate.key))
      .map((candidate) => ({
        value: candidate.key,
        label: candidate.label,
        description: `Disponible jusqu'a ${formatPreciputAmount(candidate.maxAmount)}`,
      })),
  ], [preciputCandidates, selectedPreciputCandidateKeys]);
  const preciputScopeLabel = preciputEligiblePocket === 'societe_acquets'
    ? "la societe d'acquets"
    : 'la communaute';

  const updatePreciputSelections = (
    updater: (_current: DispositionsDraftState['preciputSelections']) => DispositionsDraftState['preciputSelections'],
  ) => {
    setDispositionsDraft((prev) => ({
      ...prev,
      preciputSelections: updater(syncSuccessionPreciputSelections(prev.preciputSelections, preciputCandidates)),
    }));
  };

  const addPreciputSelection = (candidateKey: string) => {
    const candidate = preciputCandidatesByKey.get(candidateKey);
    if (!candidate) return;
    updatePreciputSelections((current) => [
      ...current,
      createSuccessionPreciputSelection(candidate),
    ]);
    setPendingPreciputCandidateKey('');
  };

  const updatePreciputSelection = (
    selectionId: string,
    field: 'enabled' | 'amount',
    value: boolean | number,
  ) => {
    updatePreciputSelections((current) => current.map((selection) => {
      if (selection.id !== selectionId) return selection;
      if (field === 'enabled') {
        return {
          ...selection,
          enabled: Boolean(value),
        };
      }
      const candidate = preciputCandidatesByKey.get(`${selection.sourceType}:${selection.sourceId}`);
      const maxAmount = candidate?.maxAmount ?? 0;
      return {
        ...selection,
        amount: Math.min(maxAmount, Math.max(0, Number(value) || 0)),
      };
    }));
  };

  const removePreciputSelection = (selectionId: string) => {
    updatePreciputSelections((current) => current.filter((selection) => selection.id !== selectionId));
  };

  const renderPreciputConfigurator = ({
    title,
    globalHint,
  }: {
    title: string;
    globalHint: string;
  }) => (
    <>
      <div className="sc-field">
        <label>Mode de preciput</label>
        <ScSelect
          value={dispositionsDraft.preciputMode}
          onChange={(value) => setDispositionsDraft((prev) => ({
            ...prev,
            preciputMode: value as 'global' | 'cible',
          }))}
          options={PRECIPUT_MODE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
            description: option.value === 'cible' && preciputCandidates.length === 0
              ? `Aucun bien compatible dans ${preciputScopeLabel}.`
              : option.description,
            disabled: option.value === 'cible' && preciputCandidates.length === 0,
          }))}
        />
        <p className="sc-hint sc-hint--compact">
          Le mode cible est reserve aux biens actuellement rattaches a {preciputScopeLabel}.
        </p>
      </div>

      <div className="sc-field">
        <label>{dispositionsDraft.preciputMode === 'cible' ? `${title} de fallback (EUR)` : title}</label>
        <ScNumericInput
          value={dispositionsDraft.preciputMontant || 0}
          min={0}
          onChange={(val) => setDispositionsDraft((prev) => ({
            ...prev,
            preciputMontant: val,
          }))}
        />
        <p className="sc-hint sc-hint--compact">
          {dispositionsDraft.preciputMode === 'cible'
            ? "Ce montant reste disponible comme fallback si aucune selection ciblee valide n'est retenue."
            : globalHint}
        </p>
      </div>

      {dispositionsDraft.preciputMode === 'cible' && (
        <>
          <div className="sc-field">
            <label>Ajouter un bien au preciput cible</label>
            <ScSelect
              value={pendingPreciputCandidateKey}
              onChange={(value) => addPreciputSelection(value)}
              options={preciputCandidateOptions}
            />
            <p className="sc-hint sc-hint--compact">
              Seuls les actifs detailles et groupements fonciers compatibles sont selectionnables.
            </p>
          </div>

          {syncedPreciputSelections.length > 0 ? (
            <div className="sc-preciput-list">
              {syncedPreciputSelections.map((selection) => {
                const candidate = preciputCandidatesByKey.get(`${selection.sourceType}:${selection.sourceId}`);
                const maxAmount = candidate?.maxAmount ?? 0;
                return (
                  <div key={selection.id} className="sc-preciput-item">
                    <div className="sc-preciput-item__header">
                      <div>
                        <div className="sc-preciput-item__title">{selection.labelSnapshot}</div>
                        <p className="sc-hint sc-hint--compact">
                          Disponible jusqu&apos;a {formatPreciputAmount(maxAmount)} dans {preciputScopeLabel}.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="sc-remove-btn sc-remove-btn--quiet"
                        onClick={() => removePreciputSelection(selection.id)}
                        aria-label="Supprimer la selection de preciput"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="sc-preciput-item__grid">
                      <div className="sc-field">
                        <label>Selection active</label>
                        <ScSelect
                          value={selection.enabled ? 'oui' : 'non'}
                          onChange={(value) => updatePreciputSelection(selection.id, 'enabled', value === 'oui')}
                          options={OUI_NON_OPTIONS}
                        />
                      </div>

                      <div className="sc-field">
                        <label>Montant cible (EUR)</label>
                        <ScNumericInput
                          value={selection.amount}
                          min={0}
                          onChange={(value) => updatePreciputSelection(selection.id, 'amount', value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="sc-hint sc-hint--compact">
              Aucun bien cible pour l&apos;instant. Ajoutez au moins une ligne compatible pour activer le preciput cible.
            </p>
          )}
        </>
      )}
    </>
  );

  return (
    <div
      className="sc-member-modal-overlay"
      onClick={() => {}}
    >
      <div className="sc-member-modal sc-dispositions-modal">
        <div className="sc-member-modal__header">
          <h3 className="sc-member-modal__title">Dispositions particulières</h3>
          <button
            type="button"
            className="sc-member-modal__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="sc-member-modal__body sc-dispositions-modal__body">
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
                    attributionBiensCommunsPct: Math.min(
                      100,
                      Math.max(0, Number(e.target.value) || 0),
                    ),
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
                    Cette option simule une transmission de 100 % au conjoint survivant. En
                    présence d&apos;enfants, elle n&apos;est pas automatique et peut être réduite
                    pour respecter leur réserve héréditaire.
                  </p>
                )}
              </div>
            )}

            {showDonationEntreEpoux && !dispositionsDraft.donationEntreEpouxActive && nbDescendantBranches > 0 && (
              <div className="sc-field">
                <label>Choix légal du conjoint</label>
                {nbEnfantsNonCommuns > 0 ? (
                  <p className="sc-hint sc-hint--compact">
                    En présence d&apos;enfants non communs, le conjoint survivant n&apos;a droit
                    qu&apos;au quart en pleine propriété (art. 757 CC).
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
                      Sans précision, le simulateur conserve l&apos;hypothèse moteur actuelle ;
                      le droit positif prévoit un choix entre usufruit total et quart en pleine propriété.
                    </p>
                  </>
                )}
              </div>
            )}

            {isParticipationAcquetsRegime && (
              <>
                <div className="sc-field">
                  <label>Bloc participation aux acquets</label>
                  <ScSelect
                    value={dispositionsDraft.participationAcquets.active ? 'oui' : 'non'}
                    onChange={(value) => setDispositionsDraft((prev) => ({
                      ...prev,
                      participationAcquets: {
                        ...prev.participationAcquets,
                        active: value === 'oui',
                      },
                    }))}
                    options={OUI_NON_OPTIONS}
                  />
                  <p className="sc-hint sc-hint--compact">
                    Active un calcul simplifie de creance de participation au 1er deces.
                  </p>
                </div>

                {dispositionsDraft.participationAcquets.active && (
                  <>
                    <div className="sc-field">
                      <label>Patrimoine final derive des actifs saisis</label>
                      <ScSelect
                        value={dispositionsDraft.participationAcquets.useCurrentAssetsAsFinalPatrimony ? 'oui' : 'non'}
                        onChange={(value) => setDispositionsDraft((prev) => ({
                          ...prev,
                          participationAcquets: {
                            ...prev.participationAcquets,
                            useCurrentAssetsAsFinalPatrimony: value === 'oui',
                          },
                        }))}
                        options={OUI_NON_OPTIONS}
                      />
                      <p className="sc-hint sc-hint--compact">
                        Oui = le simulateur reprend les actifs propres actuellement saisis pour chaque epoux.
                      </p>
                    </div>

                    <div className="sc-field">
                      <label>Patrimoine originaire Epoux 1 (EUR)</label>
                      <ScNumericInput
                        value={dispositionsDraft.participationAcquets.patrimoineOriginaireEpoux1 || 0}
                        min={0}
                        onChange={(value) => setDispositionsDraft((prev) => ({
                          ...prev,
                          participationAcquets: {
                            ...prev.participationAcquets,
                            patrimoineOriginaireEpoux1: value,
                          },
                        }))}
                      />
                    </div>

                    <div className="sc-field">
                      <label>Patrimoine originaire Epoux 2 (EUR)</label>
                      <ScNumericInput
                        value={dispositionsDraft.participationAcquets.patrimoineOriginaireEpoux2 || 0}
                        min={0}
                        onChange={(value) => setDispositionsDraft((prev) => ({
                          ...prev,
                          participationAcquets: {
                            ...prev.participationAcquets,
                            patrimoineOriginaireEpoux2: value,
                          },
                        }))}
                      />
                    </div>

                    {!dispositionsDraft.participationAcquets.useCurrentAssetsAsFinalPatrimony && (
                      <>
                        <div className="sc-field">
                          <label>Patrimoine final Epoux 1 (EUR)</label>
                          <ScNumericInput
                            value={dispositionsDraft.participationAcquets.patrimoineFinalEpoux1 || 0}
                            min={0}
                            onChange={(value) => setDispositionsDraft((prev) => ({
                              ...prev,
                              participationAcquets: {
                                ...prev.participationAcquets,
                                patrimoineFinalEpoux1: value,
                              },
                            }))}
                          />
                        </div>

                        <div className="sc-field">
                          <label>Patrimoine final Epoux 2 (EUR)</label>
                          <ScNumericInput
                            value={dispositionsDraft.participationAcquets.patrimoineFinalEpoux2 || 0}
                            min={0}
                            onChange={(value) => setDispositionsDraft((prev) => ({
                              ...prev,
                              participationAcquets: {
                                ...prev.participationAcquets,
                                patrimoineFinalEpoux2: value,
                              },
                            }))}
                          />
                        </div>
                      </>
                    )}

                    <div className="sc-field">
                      <label>Quote de creance Epoux 1 (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={dispositionsDraft.participationAcquets.quoteEpoux1Pct}
                        onChange={(e) => {
                          const quoteEpoux1Pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setDispositionsDraft((prev) => ({
                            ...prev,
                            participationAcquets: {
                              ...prev.participationAcquets,
                              quoteEpoux1Pct,
                              quoteEpoux2Pct: 100 - quoteEpoux1Pct,
                            },
                          }));
                        }}
                      />
                    </div>

                    <div className="sc-field">
                      <label>Quote de creance Epoux 2 (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={dispositionsDraft.participationAcquets.quoteEpoux2Pct}
                        onChange={(e) => {
                          const quoteEpoux2Pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setDispositionsDraft((prev) => ({
                            ...prev,
                            participationAcquets: {
                              ...prev.participationAcquets,
                              quoteEpoux1Pct: 100 - quoteEpoux2Pct,
                              quoteEpoux2Pct,
                            },
                          }));
                        }}
                      />
                      <p className="sc-hint sc-hint--compact">
                        La quote du conjoint creancier s&apos;applique a l&apos;ecart d&apos;acquets net calcule.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            {isCommunityRegime && renderPreciputConfigurator({
              title: 'Clause de preciput (EUR)',
              globalHint: 'Le preciput permet au conjoint survivant de prelever certains biens ou une somme sur la communaute avant le partage successoral.',
            })}

            {isSocieteAcquetsRegime && (
              <>
                <div className="sc-field">
                  <label>Bloc societe d&apos;acquets</label>
                  <ScSelect
                    value={dispositionsDraft.societeAcquets.active ? 'oui' : 'non'}
                    onChange={(value) => setDispositionsDraft((prev) => ({
                      ...prev,
                      societeAcquets: {
                        ...prev.societeAcquets,
                        active: value === 'oui',
                      },
                    }))}
                    options={OUI_NON_OPTIONS}
                  />
                  <p className="sc-hint sc-hint--compact">
                    Active la liquidation contractuelle de la poche societe d&apos;acquets.
                  </p>
                </div>

                {dispositionsDraft.societeAcquets.active && (
                  <>
                    <div className="sc-field">
                      <label>Mode de liquidation de la societe d&apos;acquets</label>
                      <ScSelect
                        value={dispositionsDraft.societeAcquets.liquidationMode}
                        onChange={(value) => setDispositionsDraft((prev) => ({
                          ...prev,
                          societeAcquets: {
                            ...prev.societeAcquets,
                            liquidationMode: value as 'quotes' | 'attribution_survivant',
                          },
                        }))}
                        options={SOCIETE_ACQUETS_LIQUIDATION_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                      />
                      <p className="sc-hint sc-hint--compact">
                        Le mode quotes repartit la poche selon les quotes contractuelles ; le mode attribution ajoute une part prealable au survivant avant de partager le reliquat.
                      </p>
                    </div>

                    <div className="sc-field">
                      <label>Quote Epoux 1 dans la societe d&apos;acquets (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={dispositionsDraft.societeAcquets.quoteEpoux1Pct}
                        onChange={(e) => {
                          const quoteEpoux1Pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setDispositionsDraft((prev) => ({
                            ...prev,
                            societeAcquets: {
                              ...prev.societeAcquets,
                              quoteEpoux1Pct,
                              quoteEpoux2Pct: 100 - quoteEpoux1Pct,
                            },
                          }));
                        }}
                      />
                    </div>

                    <div className="sc-field">
                      <label>Quote Epoux 2 dans la societe d&apos;acquets (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={dispositionsDraft.societeAcquets.quoteEpoux2Pct}
                        onChange={(e) => {
                          const quoteEpoux2Pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setDispositionsDraft((prev) => ({
                            ...prev,
                            societeAcquets: {
                              ...prev.societeAcquets,
                              quoteEpoux1Pct: 100 - quoteEpoux2Pct,
                              quoteEpoux2Pct,
                            },
                          }));
                        }}
                      />
                      <p className="sc-hint sc-hint--compact">
                        Les quotes contractuelles sont maintenues a 100 % au total.
                      </p>
                    </div>

                    {dispositionsDraft.societeAcquets.liquidationMode === 'attribution_survivant' && (
                      <div className="sc-field">
                        <label>Attribution prealable au survivant (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={dispositionsDraft.societeAcquets.attributionSurvivantPct}
                          onChange={(e) => setDispositionsDraft((prev) => ({
                            ...prev,
                            societeAcquets: {
                              ...prev.societeAcquets,
                              attributionSurvivantPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                            },
                          }))}
                        />
                        <p className="sc-hint sc-hint--compact">
                          Cette part est attribuee au survivant avant d&apos;appliquer les quotes sur le reliquat.
                        </p>
                      </div>
                    )}

                    <div className="sc-field">
                      <label>Attribution integrale de la societe d&apos;acquets</label>
                      <ScSelect
                        value={dispositionsDraft.attributionIntegrale ? 'oui' : 'non'}
                        onChange={(value) => setDispositionsDraft((prev) => ({
                          ...prev,
                          attributionIntegrale: value === 'oui',
                        }))}
                        options={OUI_NON_OPTIONS}
                      />
                      <p className="sc-hint sc-hint--compact">
                        Si oui, la poche societe d&apos;acquets est reportee en totalite au survivant au 1er deces.
                      </p>
                    </div>

                    {renderPreciputConfigurator({
                      title: "Preciput sur la societe d'acquets (EUR)",
                      globalHint: "Le preciput est preleve sur la societe d'acquets avant la liquidation du reliquat.",
                    })}
                  </>
                )}
              </>
            )}
          </div>

          <div className="sc-dispositions-modal__section sc-dispositions-modal__section--testament">
            <div className="sc-dispositions-modal__section-header">
              <h4 className="sc-dispositions-modal__section-title">Testament</h4>
            </div>
            <div className={`sc-testament-grid${testamentSides.length === 1 ? ' sc-testament-grid--single' : ''}`}>
              {testamentSides.map((side) => {
                const testament = dispositionsDraft.testamentsBySide[side];
                const beneficiaryOptions = testamentBeneficiaryOptionsBySide[side];
                const beneficiarySelectOptions = [
                  { value: '', label: 'Choisir...', disabled: true },
                  ...beneficiaryOptions,
                ];
                const selectedDisposition = testament.dispositionType ?? 'legs_universel';
                const dispositionDescription = testament.dispositionType
                  ? TESTAMENT_TYPE_DESCRIPTIONS[testament.dispositionType]
                  : null;
                const reserveHint = getReserveHintForSide(enfantsContext, familyMembers, side);
                const quotiteDisponiblePct = getQuotiteDisponiblePctForSide(enfantsContext, familyMembers, side);
                const showAscendantsField = descendantBranchesBySide[side] === 0;
                const hasDerivedParents = familyMembers.some(
                  (member) => member.type === 'parent' && (!member.branch ? side === 'epoux1' : member.branch === side),
                );

                return (
                  <div key={side} className="sc-testament-card">
                    <div className="sc-testament-card__header">
                      <h5 className="sc-testament-card__title">
                        {getTestamentCardTitle(civilSituation, side)}
                      </h5>
                      <span className="sc-testament-card__eyebrow">
                        Quotité disponible : {quotiteDisponiblePct.toFixed(2).replace(/\.00$/, '')} %
                      </span>
                    </div>

                    <div className="sc-field">
                      <label>Testament actif</label>
                      <ScSelect
                        className="sc-testament-select"
                        value={testament.active ? 'oui' : 'non'}
                        onChange={(value) => updateDispositionsTestament(side, (current) => ({
                          ...current,
                          active: value === 'oui',
                          dispositionType: value === 'oui'
                            ? (current.dispositionType ?? 'legs_universel')
                            : current.dispositionType,
                          beneficiaryRef: value === 'oui'
                            ? (current.beneficiaryRef ?? getFirstTestamentBeneficiaryRef(side))
                            : current.beneficiaryRef,
                          quotePartPct: current.quotePartPct || DEFAULT_SUCCESSION_TESTAMENT_CONFIG.quotePartPct,
                        }))}
                        options={OUI_NON_OPTIONS}
                      />
                    </div>

                    {testament.active && (
                      <>
                        <div className="sc-field">
                          <label>Type de disposition testamentaire</label>
                          <ScSelect
                            className="sc-testament-select"
                            value={selectedDisposition}
                            onChange={(value) => updateDispositionsTestament(side, (current) => ({
                              ...current,
                              dispositionType: value as SuccessionDispositionTestamentaire,
                              beneficiaryRef: value === 'legs_particulier'
                                ? current.beneficiaryRef
                                : (current.beneficiaryRef ?? getFirstTestamentBeneficiaryRef(side)),
                            }))}
                            options={DISPOSITION_TESTAMENTAIRE_OPTIONS}
                          />
                          {dispositionDescription && (
                            <p className="sc-hint sc-hint--compact">{dispositionDescription}</p>
                          )}
                        </div>

                        {selectedDisposition !== 'legs_particulier' && (
                          <>
                            <div className="sc-field">
                              <label>Beneficiaire</label>
                              <ScSelect
                                className="sc-testament-select"
                                value={testament.beneficiaryRef ?? ''}
                                onChange={(value) => updateDispositionsTestament(side, (current) => ({
                                  ...current,
                                  beneficiaryRef: value as SuccessionBeneficiaryRef,
                                }))}
                                options={beneficiarySelectOptions}
                              />
                              <p className="sc-hint sc-hint--compact">
                                {reserveHint
                                  ? `Beneficiaires reservataires : ${reserveHint}.`
                                  : 'Aucune reserve hereditaire detectee sur cette branche.'}
                              </p>
                            </div>

                            {selectedDisposition === 'legs_titre_universel' && (
                              <div className="sc-field">
                                <label>Quote-part du legs a titre universel (%)</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={testament.quotePartPct}
                                  onChange={(e) => updateDispositionsTestament(side, (current) => ({
                                    ...current,
                                    quotePartPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                                  }))}
                                  placeholder="Ex : 50"
                                />
                              </div>
                            )}
                          </>
                        )}

                        {selectedDisposition === 'legs_particulier' && (
                          <div className="sc-field">
                            <label>Legs particuliers</label>
                            <div className="sc-testament-legacy-list">
                              {testament.particularLegacies.length === 0 && (
                                <p className="sc-hint sc-hint--compact">
                                  Aucun legs particulier saisi pour le moment.
                                </p>
                              )}
                              {testament.particularLegacies.map((entry) => (
                                <div key={entry.id} className="sc-testament-legacy-row">
                                  <ScSelect
                                    className="sc-testament-select"
                                    value={entry.beneficiaryRef ?? ''}
                                    onChange={(value) => onUpdateParticularLegacy(
                                      side,
                                      entry.id,
                                      'beneficiaryRef',
                                      value as SuccessionBeneficiaryRef,
                                    )}
                                    options={beneficiarySelectOptions}
                                  />
                                  <ScNumericInput
                                    value={entry.amount || 0}
                                    min={0}
                                    onChange={(val) => onUpdateParticularLegacy(
                                      side,
                                      entry.id,
                                      'amount',
                                      val,
                                    )}
                                  />
                                  <input
                                    type="text"
                                    className="sc-input--left"
                                    value={entry.label ?? ''}
                                    onChange={(e) => onUpdateParticularLegacy(
                                      side,
                                      entry.id,
                                      'label',
                                      e.target.value,
                                    )}
                                    placeholder="Libelle optionnel"
                                  />
                                  <button
                                    type="button"
                                    className="sc-remove-btn sc-remove-btn--quiet"
                                    onClick={() => onRemoveParticularLegacy(side, entry.id)}
                                    title="Supprimer ce legs"
                                    aria-label="Supprimer ce legs"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="sc-child-add-btn"
                              onClick={() => onAddParticularLegacy(side)}
                            >
                              + Ajouter un legs
                            </button>
                          </div>
                        )}

                        {showAscendantsField && (
                          <div className="sc-field">
                            <label>Ascendants survivants</label>
                            {hasDerivedParents ? (
                              <span className="sc-auto-derived">
                                Oui - deduit des membres ajoutes
                              </span>
                            ) : (
                              <ScSelect
                                className="sc-testament-select"
                                value={dispositionsDraft.ascendantsSurvivantsBySide[side] ? 'oui' : 'non'}
                                onChange={(value) => setDispositionsDraft((prev) => ({
                                  ...prev,
                                  ascendantsSurvivantsBySide: {
                                    ...prev.ascendantsSurvivantsBySide,
                                    [side]: value === 'oui',
                                  },
                                }))}
                                options={OUI_NON_OPTIONS}
                              />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="sc-member-modal__footer">
          <button
            type="button"
            className="sc-member-modal__btn sc-member-modal__btn--secondary"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="button"
            className="sc-member-modal__btn sc-member-modal__btn--primary"
            onClick={onValidate}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
