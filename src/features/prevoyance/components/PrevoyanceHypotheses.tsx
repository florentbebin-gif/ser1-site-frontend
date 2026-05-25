import { useState } from 'react';

export function PrevoyanceHypotheses() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sim-hypotheses prevoyance-hypotheses">
      <button
        type="button"
        className="sim-hypotheses__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="sim-hypotheses__label">HYPOTHÈSES ET LIMITES</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`sim-hypotheses__chevron${open ? ' is-open' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open ? (
        <ul className="sim-hypotheses__body">
          <li>Les garanties du régime obligatoire proviennent des paramètres Prévoyance.</li>
          <li>
            Les contrats saisis représentent des hypothèses de couverture et doivent être rapprochés
            des notices contractuelles.
          </li>
          <li>
            Les résultats sont indicatifs et n’intègrent pas l’ensemble des exclusions, franchises
            ou clauses particulières.
          </li>
        </ul>
      ) : null}
    </div>
  );
}
