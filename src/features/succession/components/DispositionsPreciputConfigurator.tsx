import type { Dispatch, SetStateAction } from 'react';
import type { DispositionsDraftState } from '../successionSimulator.helpers';
import type { SuccessionPreciputCandidate } from '../successionPreciput';
import type { ScSelectOption } from './ScSelect';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';
import { OUI_NON_OPTIONS } from '../successionSimulator.constants';

const PRECIPUT_MODE_OPTIONS: ScSelectOption[] = [
  {
    value: 'global',
    label: 'Montant global',
    description: 'Conserve la saisie simple par montant.',
  },
  {
    value: 'cible',
    label: 'Bien(s) cible(s)',
    description: 'Préleve une liste de biens compatibles avant partage.',
  },
];

function formatPreciputAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export interface DispositionsPreciputConfiguratorProps {
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  pendingPreciputCandidateKey: string;
  setPendingPreciputCandidateKey: Dispatch<SetStateAction<string>>;
  preciputCandidateOptions: ScSelectOption[];
  preciputCandidatesByKey: Map<string, SuccessionPreciputCandidate>;
  preciputScopeLabel: string;
  syncedPreciputSelections: DispositionsDraftState['preciputSelections'];
  onAddPreciputSelection: (candidateKey: string) => void;
  onUpdatePreciputSelection: (
    selectionId: string,
    field: 'enabled' | 'amount',
    value: boolean | number,
  ) => void;
  onRemovePreciputSelection: (selectionId: string) => void;
  title: string;
  globalHint: string;
}

export function DispositionsPreciputConfigurator({
  dispositionsDraft,
  setDispositionsDraft,
  pendingPreciputCandidateKey,
  setPendingPreciputCandidateKey,
  preciputCandidateOptions,
  preciputCandidatesByKey,
  preciputScopeLabel,
  syncedPreciputSelections,
  onAddPreciputSelection,
  onUpdatePreciputSelection,
  onRemovePreciputSelection,
  title,
  globalHint,
}: DispositionsPreciputConfiguratorProps) {
  const hasSelectableCandidate = preciputCandidateOptions.some(
    (option) => option.value !== '' && !option.disabled,
  );

  return (
    <>
      <div className="sc-field">
        <label>Mode de préciput</label>
        <ScSelect
          value={dispositionsDraft.preciputMode}
          onChange={(value) => setDispositionsDraft((prev) => ({
            ...prev,
            preciputMode: value as 'global' | 'cible',
          }))}
          options={PRECIPUT_MODE_OPTIONS.map((option) => ({
            ...option,
            description: option.value === 'cible' && !hasSelectableCandidate
              ? `Aucun bien compatible dans ${preciputScopeLabel}.`
              : option.description,
            disabled: option.value === 'cible' && !hasSelectableCandidate,
          }))}
        />
        <p className="sc-hint sc-hint--compact">
          Le mode ciblé est réservé aux biens actuellement rattachés à {preciputScopeLabel}.
        </p>
      </div>

      <div className="sc-field">
        <label>{dispositionsDraft.preciputMode === 'cible' ? `${title} de repli (EUR)` : title}</label>
        <ScNumericInput
          value={dispositionsDraft.preciputMontant || 0}
          min={0}
          onChange={(value) => setDispositionsDraft((prev) => ({
            ...prev,
            preciputMontant: value,
          }))}
        />
        <p className="sc-hint sc-hint--compact">
          {dispositionsDraft.preciputMode === 'cible'
            ? 'Ce montant reste disponible comme montant de repli si aucune sélection ciblée valide n’est retenue.'
            : globalHint}
        </p>
      </div>

      {dispositionsDraft.preciputMode === 'cible' && (
        <>
          <div className="sc-field">
            <label>Ajouter un bien au préciput ciblé</label>
            <ScSelect
              value={pendingPreciputCandidateKey}
              onChange={(value) => onAddPreciputSelection(value)}
              options={preciputCandidateOptions}
            />
            <p className="sc-hint sc-hint--compact">
              Seuls les actifs détaillés et groupements fonciers compatibles sont sélectionnables.
            </p>
          </div>

          {syncedPreciputSelections.length > 0 ? (
            <div className="sc-preciput-list">
              {syncedPreciputSelections.map((selection) => {
                const candidate = preciputCandidatesByKey.get(
                  `${selection.sourceType}:${selection.sourceId}`,
                );
                const maxAmount = candidate?.maxAmount ?? 0;

                return (
                  <div key={selection.id} className="sc-preciput-item">
                    <div className="sc-preciput-item__header">
                      <div>
                        <div className="sc-preciput-item__title">{selection.labelSnapshot}</div>
                        <p className="sc-hint sc-hint--compact">
                          Disponible jusqu&apos;à {formatPreciputAmount(maxAmount)} dans {preciputScopeLabel}.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="sc-remove-btn sc-remove-btn--quiet"
                        onClick={() => {
                          onRemovePreciputSelection(selection.id);
                          setPendingPreciputCandidateKey('');
                        }}
                        aria-label="Supprimer la sélection de préciput"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="sc-preciput-item__grid">
                      <div className="sc-field">
                        <label>Sélection active</label>
                        <ScSelect
                          value={selection.enabled ? 'oui' : 'non'}
                          onChange={(value) => onUpdatePreciputSelection(
                            selection.id,
                            'enabled',
                            value === 'oui',
                          )}
                          options={OUI_NON_OPTIONS}
                        />
                      </div>

                      <div className="sc-field">
                        <label>Montant ciblé (EUR)</label>
                        <ScNumericInput
                          value={selection.amount}
                          min={0}
                          onChange={(value) => onUpdatePreciputSelection(selection.id, 'amount', value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="sc-hint sc-hint--compact">
              Aucun bien ciblé pour l’instant. Ajoutez au moins une ligne compatible pour activer le préciput ciblé.
            </p>
          )}
        </>
      )}
    </>
  );
}
