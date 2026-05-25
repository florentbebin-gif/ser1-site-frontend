import { formatPercentInput, parsePercentInput } from '@/utils/numbers';
import { SimAmountInputBase, type SimAmountInputPublicProps } from './SimAmountInputBase';

export interface SimAmountInputPercentProps extends SimAmountInputPublicProps {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function SimAmountInputPercent({
  unit = '%',
  minimumFractionDigits,
  maximumFractionDigits,
  ...props
}: SimAmountInputPercentProps) {
  return (
    <SimAmountInputBase
      {...props}
      unit={unit}
      inputMode="decimal"
      parseValue={(raw) => parsePercentInput(raw, 0)}
      formatValue={(value) =>
        formatPercentInput(value, { minimumFractionDigits, maximumFractionDigits })
      }
    />
  );
}
