import { formatPercentInput, parsePercentInput } from '@/utils/numbers';
import { SimAmountInputBase, type SimAmountInputPublicProps } from './SimAmountInputBase';

export type SimAmountInputPercentProps = SimAmountInputPublicProps;

export function SimAmountInputPercent({ unit = '%', ...props }: SimAmountInputPercentProps) {
  return (
    <SimAmountInputBase
      {...props}
      unit={unit}
      inputMode="decimal"
      parseValue={(raw) => parsePercentInput(raw, 0)}
      formatValue={formatPercentInput}
    />
  );
}
