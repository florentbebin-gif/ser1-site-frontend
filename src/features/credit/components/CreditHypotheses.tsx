import { IconChevronDown } from '@/icons/ui';

interface CreditHypothesesProps {
  hypothesesOpen: boolean;
  onToggle: () => void;
}

export function CreditHypotheses({ hypothesesOpen, onToggle }: CreditHypothesesProps) {
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
        <IconChevronDown className={`cv-hypotheses__chevron${hypothesesOpen ? ' is-open' : ''}`} />
      </button>
      {hypothesesOpen && (
        <ul>
          <li>Les résultats sont indicatifs et ne constituent pas une offre de prêt.</li>
          <li>Le calcul suppose un taux fixe sur toute la durée du prêt.</li>
          <li>
            L&apos;assurance emprunteur est calculée selon le mode sélectionné (capital initial ou
            restant dû) pour chaque prêt.
          </li>
          <li>
            Les frais de dossier, de garantie et de notaire ne sont pas inclus dans ce simulateur.
          </li>
        </ul>
      )}
    </div>
  );
}
