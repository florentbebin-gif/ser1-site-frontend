import React from 'react';
import { LIBERALITES_REFERENCE } from './dmtgReferenceData';

interface LiberaliteReference {
  id: string;
  family: string;
  label: string;
  definition: string;
  impact: string;
  minimumFields: string[];
  legalRefs: string;
}

interface LiberalitesSectionProps {
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function LiberalitesSection({
  openSection,
  setOpenSection,
}: LiberalitesSectionProps): React.ReactElement {
  const isOpen = openSection === 'liberalites';
  const liberalites = LIBERALITES_REFERENCE as LiberaliteReference[];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={isOpen}
        onClick={() => setOpenSection(isOpen ? null : 'liberalites')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Libéralités
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Référentiel patrimonial pour qualifier les libéralités utiles à la simulation.
            Les éléments ci-dessous sont informatifs et n’ajoutent pas de calcul automatique à ce stade.
          </p>

          {liberalites.map((item) => (
            <div key={item.id} className="income-tax-block" style={{ marginBottom: 12 }}>
              <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-c9)', marginBottom: 6 }}>
                {item.family}
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: '0 0 6px 0' }}>
                <strong style={{ color: 'var(--color-c1)' }}>Définition :</strong> {item.definition}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: '0 0 6px 0' }}>
                <strong style={{ color: 'var(--color-c1)' }}>Impact patrimonial :</strong> {item.impact}
              </p>
              <div style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 6 }}>
                <strong style={{ color: 'var(--color-c1)' }}>Champs minimaux :</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {item.minimumFields.map((field) => <li key={field}>{field}</li>)}
                </ul>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-c9)', margin: 0 }}>
                Références : {item.legalRefs}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
