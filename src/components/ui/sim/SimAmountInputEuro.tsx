import { formatIntegerInput, parseDecimalInput } from '@/utils/numbers';
import { SimAmountInputBase, type SimAmountInputPublicProps } from './SimAmountInputBase';

export type SimAmountInputEuroProps = SimAmountInputPublicProps;

export function SimAmountInputEuro({ unit = '€', ...props }: SimAmountInputEuroProps) {
  return (
    <SimAmountInputBase
      {...props}
      unit={unit}
      inputMode="numeric"
      parseValue={(raw) => parseDecimalInput(raw, 0)}
      formatValue={(value) => formatIntegerInput(Math.round(value))}
      formatFocusedValue={(value) => (value === 0 ? '' : String(Math.round(value)))}
      normalizeValue={Math.round}
    />
  );
}
