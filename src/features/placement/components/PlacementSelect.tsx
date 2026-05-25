import { SimFieldShell, SimSelect } from '@/components/ui/sim';
import type { SimSelectOption } from '@/components/ui/sim';

export type PlacementSelectOption = SimSelectOption;

interface PlacementSelectProps {
  value: string;
  onChange: (_value: string) => void;
  options: PlacementSelectOption[];
  label?: string;
}

export function PlacementSelect({ value, onChange, options, label }: PlacementSelectProps) {
  return (
    <SimFieldShell label={label} className="pl-field">
      <SimSelect value={value} onChange={onChange} options={options} />
    </SimFieldShell>
  );
}
