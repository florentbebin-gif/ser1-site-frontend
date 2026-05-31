import { SimActionButton } from '@/components/ui/sim';
import type { SuccessionPersonParty } from '../successionDraft';

export function EditRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <SimActionButton
      variant="edit"
      mode="icon"
      label="Modifier"
      className="sc-open-btn"
      onClick={onClick}
      title={label}
      ariaLabel={label}
    />
  );
}

export function getPartyLabel(
  options: { value: SuccessionPersonParty; label: string }[],
  party: SuccessionPersonParty,
): string {
  return options.find((option) => option.value === party)?.label ?? party;
}
