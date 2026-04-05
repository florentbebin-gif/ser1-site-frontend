import { useState } from 'react';

const PER_ASSUMPTIONS: string[] = [
  'Plafonds de déduction calculés selon l\'art. 163 quatervicies du CGI.',
  'PASS retenu : valeur administrée dans les paramètres fiscaux (Settings > Prélèvements).',
  'Plafond Madelin (art. 154 bis) : 10 % du bénéfice imposable plafonné à 8 PASS, majoré de 15 % entre 1 et 8 PASS.',
  'Les versements obligatoires employeur (art. 83 / PERO / PEROB) viennent en déduction du plafond 163 quatervicies.',
  'La mutualisation des plafonds entre conjoints (case 6QR) suppose une imposition commune.',
  'Les revenus projetés pour l\'année en cours sont estimatifs et ne remplacent pas la déclaration définitive.',
  'Date limite de versement déductible : 31 décembre de l\'année fiscale en cours.',
];

export function PerHypotheses() {
  const [open, setOpen] = useState(false);

  return (
    <div className="per-hypotheses">
      <button
        type="button"
        className="per-hypotheses__toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="per-hypotheses__title">Hypothèses et limites</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`per-hypotheses__chevron${open ? ' is-open' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul className="per-hypotheses__list">
          {PER_ASSUMPTIONS.map((assumption, index) => (
            <li key={`per-hyp-${index}`}>{assumption}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
