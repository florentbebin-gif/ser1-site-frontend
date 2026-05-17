import type { Dispatch, SetStateAction } from 'react';
import { OUI_NON_OPTIONS } from '../successionSimulator.constants';
import type { DispositionsDraftState } from '../successionSimulator.helpers';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';

interface DispositionsParticipationAcquetsSectionProps {
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
}

function clampPercentage(value: string): number {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

export function DispositionsParticipationAcquetsSection({
  dispositionsDraft,
  setDispositionsDraft,
}: DispositionsParticipationAcquetsSectionProps) {
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

  return (
    <>
      <div className="sc-field">
        <label htmlFor="sc-dispositions-participation-active">Bloc participation aux acquêts</label>
        <ScSelect
          id="sc-dispositions-participation-active"
          value={dispositionsDraft.participationAcquets.active ? 'oui' : 'non'}
          onChange={(value) =>
            updateParticipationAcquets((current) => ({
              ...current,
              active: value === 'oui',
            }))
          }
          options={OUI_NON_OPTIONS}
        />
        <p className="sc-hint sc-hint--compact">
          Active un calcul simplifié de créance de participation au 1er décès.
        </p>
      </div>

      {dispositionsDraft.participationAcquets.active && (
        <>
          <div className="sc-field">
            <label htmlFor="sc-dispositions-participation-use-assets">
              Patrimoine final dérivé des actifs saisis
            </label>
            <ScSelect
              id="sc-dispositions-participation-use-assets"
              value={
                dispositionsDraft.participationAcquets.useCurrentAssetsAsFinalPatrimony
                  ? 'oui'
                  : 'non'
              }
              onChange={(value) =>
                updateParticipationAcquets((current) => ({
                  ...current,
                  useCurrentAssetsAsFinalPatrimony: value === 'oui',
                }))
              }
              options={OUI_NON_OPTIONS}
            />
            <p className="sc-hint sc-hint--compact">
              Oui = le simulateur reprend les actifs propres actuellement saisis pour chaque époux.
            </p>
          </div>

          <div className="sc-field">
            <label htmlFor="sc-dispositions-participation-originaire-epoux1">
              Patrimoine originaire Époux 1 (EUR)
            </label>
            <ScNumericInput
              id="sc-dispositions-participation-originaire-epoux1"
              value={dispositionsDraft.participationAcquets.patrimoineOriginaireEpoux1 || 0}
              min={0}
              onChange={(value) =>
                updateParticipationAcquets((current) => ({
                  ...current,
                  patrimoineOriginaireEpoux1: value,
                }))
              }
            />
          </div>

          <div className="sc-field">
            <label htmlFor="sc-dispositions-participation-originaire-epoux2">
              Patrimoine originaire Époux 2 (EUR)
            </label>
            <ScNumericInput
              id="sc-dispositions-participation-originaire-epoux2"
              value={dispositionsDraft.participationAcquets.patrimoineOriginaireEpoux2 || 0}
              min={0}
              onChange={(value) =>
                updateParticipationAcquets((current) => ({
                  ...current,
                  patrimoineOriginaireEpoux2: value,
                }))
              }
            />
          </div>

          {!dispositionsDraft.participationAcquets.useCurrentAssetsAsFinalPatrimony && (
            <>
              <div className="sc-field">
                <label htmlFor="sc-dispositions-participation-final-epoux1">
                  Patrimoine final Époux 1 (EUR)
                </label>
                <ScNumericInput
                  id="sc-dispositions-participation-final-epoux1"
                  value={dispositionsDraft.participationAcquets.patrimoineFinalEpoux1 || 0}
                  min={0}
                  onChange={(value) =>
                    updateParticipationAcquets((current) => ({
                      ...current,
                      patrimoineFinalEpoux1: value,
                    }))
                  }
                />
              </div>

              <div className="sc-field">
                <label htmlFor="sc-dispositions-participation-final-epoux2">
                  Patrimoine final Époux 2 (EUR)
                </label>
                <ScNumericInput
                  id="sc-dispositions-participation-final-epoux2"
                  value={dispositionsDraft.participationAcquets.patrimoineFinalEpoux2 || 0}
                  min={0}
                  onChange={(value) =>
                    updateParticipationAcquets((current) => ({
                      ...current,
                      patrimoineFinalEpoux2: value,
                    }))
                  }
                />
              </div>
            </>
          )}

          <div className="sc-field">
            <label htmlFor="sc-dispositions-participation-quote-epoux1">
              Quote de créance Époux 1 (%)
            </label>
            <input
              id="sc-dispositions-participation-quote-epoux1"
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
            <label htmlFor="sc-dispositions-participation-quote-epoux2">
              Quote de créance Époux 2 (%)
            </label>
            <input
              id="sc-dispositions-participation-quote-epoux2"
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
              La quote du conjoint créancier s&apos;applique à l&apos;écart d&apos;acquêts net
              calculé.
            </p>
          </div>
        </>
      )}
    </>
  );
}
