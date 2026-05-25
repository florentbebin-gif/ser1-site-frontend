import type { Dispatch, SetStateAction } from 'react';
import { SimAmountInputPercent } from '@/components/ui/sim';
import { OUI_NON_OPTIONS } from '../successionSimulator.constants';
import type { DispositionsDraftState } from '../successionSimulator.helpers';
import { DispositionsPreciputConfigurator } from './DispositionsPreciputConfigurator';
import type { DispositionsPreciputConfiguratorProps } from './DispositionsPreciputConfigurator';
import { clampPercentage } from './dispositions.helpers';
import { ScSelect, type ScSelectOption } from './ScSelect';

const SOCIETE_ACQUETS_LIQUIDATION_OPTIONS: ScSelectOption[] = [
  { value: 'quotes', label: 'Quotes contractuelles' },
  { value: 'attribution_survivant', label: 'Attribution au survivant' },
];

interface DispositionsSocieteAcquetsSectionProps {
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  preciputConfiguratorProps: Omit<DispositionsPreciputConfiguratorProps, 'title' | 'globalHint'>;
}

export function DispositionsSocieteAcquetsSection({
  dispositionsDraft,
  setDispositionsDraft,
  preciputConfiguratorProps,
}: DispositionsSocieteAcquetsSectionProps) {
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
    <>
      <div className="sc-field">
        <label htmlFor="sc-dispositions-societe-acquets-active">Bloc société d&apos;acquets</label>
        <ScSelect
          id="sc-dispositions-societe-acquets-active"
          value={dispositionsDraft.societeAcquets.active ? 'oui' : 'non'}
          onChange={(value) =>
            updateSocieteAcquets((current) => ({
              ...current,
              active: value === 'oui',
            }))
          }
          options={OUI_NON_OPTIONS}
        />
        <p className="sc-hint sc-hint--compact">
          Active la liquidation contractuelle de la poche société d&apos;acquets.
        </p>
      </div>

      {dispositionsDraft.societeAcquets.active && (
        <>
          <div className="sc-field">
            <label htmlFor="sc-dispositions-societe-acquets-liquidation">
              Mode de liquidation de la société d&apos;acquets
            </label>
            <ScSelect
              id="sc-dispositions-societe-acquets-liquidation"
              value={dispositionsDraft.societeAcquets.liquidationMode}
              onChange={(value) =>
                updateSocieteAcquets((current) => ({
                  ...current,
                  liquidationMode: value as 'quotes' | 'attribution_survivant',
                }))
              }
              options={SOCIETE_ACQUETS_LIQUIDATION_OPTIONS}
            />
            <p className="sc-hint sc-hint--compact">
              Le mode quotes répartit la poche selon les quotes contractuelles ; le mode attribution
              ajoute une part préalable au survivant avant de partager le reliquat.
            </p>
          </div>

          <div className="sc-field">
            <label htmlFor="sc-dispositions-societe-acquets-quote-epoux1">
              Quote Époux 1 dans la société d&apos;acquets (%)
            </label>
            <SimAmountInputPercent
              id="sc-dispositions-societe-acquets-quote-epoux1"
              min={0}
              max={100}
              value={dispositionsDraft.societeAcquets.quoteEpoux1Pct}
              onChange={(value) => {
                const quoteEpoux1Pct = clampPercentage(String(value));
                updateSocieteAcquets((current) => ({
                  ...current,
                  quoteEpoux1Pct,
                  quoteEpoux2Pct: 100 - quoteEpoux1Pct,
                }));
              }}
            />
          </div>

          <div className="sc-field">
            <label htmlFor="sc-dispositions-societe-acquets-quote-epoux2">
              Quote Époux 2 dans la société d&apos;acquets (%)
            </label>
            <SimAmountInputPercent
              id="sc-dispositions-societe-acquets-quote-epoux2"
              min={0}
              max={100}
              value={dispositionsDraft.societeAcquets.quoteEpoux2Pct}
              onChange={(value) => {
                const quoteEpoux2Pct = clampPercentage(String(value));
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
              <label htmlFor="sc-dispositions-societe-acquets-attribution-survivant">
                Attribution préalable au survivant (%)
              </label>
              <SimAmountInputPercent
                id="sc-dispositions-societe-acquets-attribution-survivant"
                min={0}
                max={100}
                value={dispositionsDraft.societeAcquets.attributionSurvivantPct}
                onChange={(value) =>
                  updateSocieteAcquets((current) => ({
                    ...current,
                    attributionSurvivantPct: clampPercentage(String(value)),
                  }))
                }
              />
              <p className="sc-hint sc-hint--compact">
                Cette part est attribuée au survivant avant d&apos;appliquer les quotes sur le
                reliquat.
              </p>
            </div>
          )}

          <div className="sc-field">
            <label htmlFor="sc-dispositions-societe-acquets-attribution-integrale">
              Attribution intégrale de la société d&apos;acquets
            </label>
            <ScSelect
              id="sc-dispositions-societe-acquets-attribution-integrale"
              value={dispositionsDraft.attributionIntegrale ? 'oui' : 'non'}
              onChange={(value) =>
                setDispositionsDraft((prev) => ({
                  ...prev,
                  attributionIntegrale: value === 'oui',
                }))
              }
              options={OUI_NON_OPTIONS}
            />
            <p className="sc-hint sc-hint--compact">
              Si oui, la poche société d&apos;acquets est reportée en totalité au survivant au 1er
              décès.
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
  );
}
