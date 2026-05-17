import type { BaseCgRetraiteContract } from '@/data/basecg';
import {
  commitRate,
  formatFieldValue,
  formatRateLabel,
  formatRatePercent,
  parseRatePercent,
  rateInputValue,
  updateText,
} from './baseCgRetraiteModalUtils';

type LiquidationSetter = <K extends keyof BaseCgRetraiteContract['phaseLiquidation']>(
  _key: K,
  _value: BaseCgRetraiteContract['phaseLiquidation'][K],
) => void;

interface Props {
  draft: BaseCgRetraiteContract;
  onLiquidationChange: LiquidationSetter;
}

export function BaseCgRetraiteLiquidationTab({ draft, onLiquidationChange }: Props) {
  return (
    <>
      <label>
        Âge limite de liquidation
        <input
          value={formatFieldValue(draft.phaseLiquidation.ageLimiteLiquidation)}
          onChange={(event) => onLiquidationChange('ageLimiteLiquidation', updateText(event.target.value))}
        />
      </label>
      <label>
        Sortie en capital à la retraite
        <input
          value={draft.phaseLiquidation.sortieCapitalRetraite ?? ''}
          onChange={(event) => onLiquidationChange('sortieCapitalRetraite', updateText(event.target.value))}
        />
      </label>
      <label>
        Fractionnement du capital
        <input
          value={draft.phaseLiquidation.fractionnementCapital ?? ''}
          onChange={(event) => onLiquidationChange('fractionnementCapital', updateText(event.target.value))}
        />
      </label>
      <label>
        Rachat libre
        <input
          value={draft.phaseLiquidation.rachatLibre ?? ''}
          onChange={(event) => onLiquidationChange('rachatLibre', updateText(event.target.value))}
        />
      </label>
      <label>
        Table conversion rente
        <input
          value={draft.phaseLiquidation.tableConversionRente ?? ''}
          onChange={(event) => onLiquidationChange('tableConversionRente', updateText(event.target.value))}
        />
      </label>
      <label>
        Table garantie à l'adhésion
        <input
          value={draft.phaseLiquidation.tableGarantieAdhesion ?? ''}
          onChange={(event) => onLiquidationChange('tableGarantieAdhesion', updateText(event.target.value))}
        />
      </label>
      <label>
        Taux technique
        <input
          value={rateInputValue(draft.phaseLiquidation.tauxTechnique)}
          onChange={(event) => onLiquidationChange('tauxTechnique', commitRate(event.target.value))}
        />
      </label>
      <label>
        Taux frais sur arrérages
        <input
          type="number"
          value={formatRatePercent(draft.phaseLiquidation.fraisArreragesRate)}
          onChange={(event) => {
            const rate = parseRatePercent(event.target.value);
            onLiquidationChange('fraisArreragesRate', rate);
            onLiquidationChange('fraisArrerages', formatRateLabel(rate));
          }}
        />
      </label>
      <label>
        Annuités garanties
        <input
          value={draft.phaseLiquidation.annuitesGaranties ?? ''}
          onChange={(event) => onLiquidationChange('annuitesGaranties', updateText(event.target.value))}
        />
      </label>
      <label>
        Réversion incluse dans la rente
        <input
          value={draft.phaseLiquidation.reversionIncluse ?? ''}
          onChange={(event) => onLiquidationChange('reversionIncluse', updateText(event.target.value))}
        />
      </label>
      <label className="base-cg-modal__wide">
        Réversion possible
        <textarea
          value={draft.phaseLiquidation.reversionPossible ?? ''}
          onChange={(event) => onLiquidationChange('reversionPossible', updateText(event.target.value))}
          rows={3}
        />
      </label>
      <label className="base-cg-modal__wide">
        Rente estimée
        <textarea
          value={formatFieldValue(draft.phaseLiquidation.renteEstimee)}
          onChange={(event) => onLiquidationChange('renteEstimee', updateText(event.target.value))}
          rows={2}
        />
      </label>
    </>
  );
}
