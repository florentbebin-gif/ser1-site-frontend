import { IconChevronDown } from '@/icons/ui';

interface SuccessionHypothesesProps {
  hypothesesOpen: boolean;
  assumptions: string[];
  onToggle: () => void;
}

export function SuccessionHypotheses({
  hypothesesOpen,
  assumptions,
  onToggle,
}: SuccessionHypothesesProps) {
  return (
    <div className="sc-hypotheses">
      <button
        type="button"
        className="sc-hypotheses__toggle"
        onClick={onToggle}
        aria-expanded={hypothesesOpen}
        data-testid="succession-hypotheses-toggle"
      >
        <span className="sc-hypotheses__title">HYPOTHÈSES ET LIMITES</span>
        <IconChevronDown className={`sc-hypotheses__chevron${hypothesesOpen ? ' is-open' : ''}`} />
      </button>
      {hypothesesOpen && (
        <ul>
          {assumptions.map((assumption, index) => (
            <li key={`assumption-${index}`}>{assumption}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
