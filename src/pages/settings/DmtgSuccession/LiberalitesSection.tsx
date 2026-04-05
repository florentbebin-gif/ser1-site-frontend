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
          <p className="dmtg-intro">
            Référentiel patrimonial pour qualifier les libéralités utiles à la simulation.
            Les éléments ci-dessous sont informatifs et n’ajoutent pas de calcul automatique à ce stade.
          </p>

          {liberalites.map((item) => (
            <div key={item.id} className="income-tax-block dmtg-block--mb12">
              <div className="dmtg-block-title">
                {item.label}
              </div>
              <div className="dmtg-family-label">
                {item.family}
              </div>
              <p className="dmtg-desc--mb6">
                <strong className="dmtg-strong">Définition :</strong> {item.definition}
              </p>
              <p className="dmtg-desc--mb6">
                <strong className="dmtg-strong">Impact patrimonial :</strong> {item.impact}
              </p>
              <div className="dmtg-desc--mb6">
                <strong className="dmtg-strong">Champs minimaux :</strong>
                <ul className="dmtg-list">
                  {item.minimumFields.map((field) => <li key={field}>{field}</li>)}
                </ul>
              </div>
              <p className="dmtg-note--flush">
                Références : {item.legalRefs}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
