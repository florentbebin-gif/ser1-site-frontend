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
        <span className="sc-hypotheses__title">Hypotheses et limites</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`sc-hypotheses__chevron${hypothesesOpen ? ' is-open' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
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
