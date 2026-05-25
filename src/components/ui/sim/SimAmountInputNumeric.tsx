import { formatDecimalInput, parseDecimalInput } from '@/utils/numbers';
import { SimAmountInputBase, type SimAmountInputPublicProps } from './SimAmountInputBase';

export interface SimAmountInputNumericProps extends SimAmountInputPublicProps {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function SimAmountInputNumeric({
  minimumFractionDigits,
  maximumFractionDigits,
  ...props
}: SimAmountInputNumericProps) {
  return (
    <SimAmountInputBase
      {...props}
      inputMode="decimal"
      parseValue={(raw) => parseDecimalInput(raw, 0)}
      formatValue={(value) =>
        formatDecimalInput(value, { minimumFractionDigits, maximumFractionDigits })
      }
    />
  );
}
