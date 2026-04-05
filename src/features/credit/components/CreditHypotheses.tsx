interface CreditHypothesesProps {
  hypothesesOpen: boolean;
  onToggle: () => void;
}

export function CreditHypotheses({
  hypothesesOpen,
  onToggle,
}: CreditHypothesesProps) {
  return (
    <div className="cv-hypotheses">
      <button
        type="button"
        className="cv-hypotheses__toggle"
        onClick={onToggle}
        aria-expanded={hypothesesOpen}
        data-testid="credit-hypotheses-toggle"
      >
        <span className="cv-hypotheses__title">Hypothèses et limites</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`cv-hypotheses__chevron${hypothesesOpen ? ' is-open' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {hypothesesOpen && (
        <ul>
          <li>Les résultats sont indicatifs et ne constituent pas une offre de prêt.</li>
          <li>Le calcul suppose un taux fixe sur toute la durée du prêt.</li>
          <li>L&apos;assurance emprunteur est calculée selon le mode sélectionné (capital initial ou restant dû) pour chaque prêt.</li>
          <li>Les frais de dossier, de garantie et de notaire ne sont pas inclus dans ce simulateur.</li>
        </ul>
      )}
    </div>
  );
}
