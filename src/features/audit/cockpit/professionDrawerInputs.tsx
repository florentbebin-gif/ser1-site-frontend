import type { ReactElement } from 'react';

import { SimAmountInputEuro } from '@/components/ui/sim';

import { SelectField } from './auditCockpitShared';
import { YES_NO_OPTIONS } from './professionFieldRules';

export function BooleanSelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}): ReactElement {
  return (
    <SelectField
      label={label}
      value={value ? 'oui' : 'non'}
      options={YES_NO_OPTIONS}
      onChange={(next) => onChange(next === 'oui')}
    />
  );
}

export function EuroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}): ReactElement {
  return (
    <SimAmountInputEuro
      label={label}
      value={value ?? 0}
      onChange={onChange}
      onEmpty={() => onChange(undefined)}
    />
  );
}
