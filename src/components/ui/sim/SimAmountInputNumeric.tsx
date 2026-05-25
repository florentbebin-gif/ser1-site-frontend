import { formatDecimalInput, parseDecimalInput } from '@/utils/numbers';
import { SimAmountInputBase, type SimAmountInputPublicProps } from './SimAmountInputBase';

export type SimAmountInputNumericProps = SimAmountInputPublicProps;

export function SimAmountInputNumeric(props: SimAmountInputNumericProps) {
  return (
    <SimAmountInputBase
      {...props}
      inputMode="decimal"
      parseValue={(raw) => parseDecimalInput(raw, 0)}
      formatValue={formatDecimalInput}
    />
  );
}
