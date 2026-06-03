import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import { BaseCgTextField, BaseCgTextareaField } from './BaseCgRetraiteModalFields';
import { formatFieldValue, rateInputValue, updateText } from './baseCgRetraiteModalUtils';

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
      <BaseCgTextField
        label="Âge limite de liquidation"
        value={formatFieldValue(draft.phaseLiquidation.ageLimiteLiquidation)}
        onChange={(value) => onLiquidationChange('ageLimiteLiquidation', updateText(value))}
      />
      <BaseCgTextField
        label="Sortie en capital à la retraite"
        value={draft.phaseLiquidation.sortieCapitalRetraite ?? ''}
        onChange={(value) => onLiquidationChange('sortieCapitalRetraite', updateText(value))}
      />
      <BaseCgTextField
        label="Fractionnement du capital"
        value={draft.phaseLiquidation.fractionnementCapital ?? ''}
        onChange={(value) => onLiquidationChange('fractionnementCapital', updateText(value))}
      />
      <BaseCgTextField
        label="Rachat libre"
        value={draft.phaseLiquidation.rachatLibre ?? ''}
        onChange={(value) => onLiquidationChange('rachatLibre', updateText(value))}
      />
      <BaseCgTextField
        label="Table conversion rente"
        value={draft.phaseLiquidation.tableConversionRente ?? ''}
        onChange={(value) => onLiquidationChange('tableConversionRente', updateText(value))}
      />
      <BaseCgTextField
        label="Table garantie à l'adhésion"
        value={draft.phaseLiquidation.tableGarantieAdhesion ?? ''}
        onChange={(value) => onLiquidationChange('tableGarantieAdhesion', updateText(value))}
      />
      <BaseCgTextField
        label="Taux technique"
        value={rateInputValue(draft.phaseLiquidation.tauxTechnique)}
        onChange={(value) => onLiquidationChange('tauxTechnique', updateText(value))}
      />
      <BaseCgTextField
        label="Taux frais sur arrérages"
        inputMode="decimal"
        value={rateInputValue(
          draft.phaseLiquidation.fraisArrerages ?? draft.phaseLiquidation.fraisArreragesRate,
        )}
        onChange={(value) => {
          onLiquidationChange('fraisArrerages', updateText(value));
          if (!value.trim()) {
            onLiquidationChange('fraisArreragesRate', null);
          }
        }}
      />
      <BaseCgTextField
        label="Annuités garanties"
        value={draft.phaseLiquidation.annuitesGaranties ?? ''}
        onChange={(value) => onLiquidationChange('annuitesGaranties', updateText(value))}
      />
      <BaseCgTextField
        label="Réversion incluse dans la rente"
        value={draft.phaseLiquidation.reversionIncluse ?? ''}
        onChange={(value) => onLiquidationChange('reversionIncluse', updateText(value))}
      />
      <BaseCgTextareaField
        label="Réversion possible"
        className="base-cg-modal__wide"
        value={draft.phaseLiquidation.reversionPossible ?? ''}
        onChange={(value) => onLiquidationChange('reversionPossible', updateText(value))}
      />
      <BaseCgTextareaField
        label="Rente estimée"
        className="base-cg-modal__wide"
        rows={2}
        value={formatFieldValue(draft.phaseLiquidation.renteEstimee)}
        onChange={(value) => onLiquidationChange('renteEstimee', updateText(value))}
      />
    </>
  );
}
