import React from 'react';
import { LegalRefList } from '@/components/legal/LegalRefLink';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import { LIBERALITES_REFERENCE } from './dmtgReferenceData';

interface LiberalitesSectionProps {
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function LiberalitesSection({
  openSection,
  setOpenSection,
}: LiberalitesSectionProps): React.ReactElement {
  const isOpen = openSection === 'liberalites';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header fisc-acc-header--with-icon"
        aria-expanded={isOpen}
        onClick={() => setOpenSection(isOpen ? null : 'liberalites')}
      >
        <SettingsTitleWithIcon
          icon="hand-heart"
          className="settings-premium-title settings-premium-title--flush"
        >
          Libéralités
        </SettingsTitleWithIcon>
        <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p className="dmtg-intro">
            Référentiel patrimonial pour qualifier les libéralités utiles à la simulation. Les
            éléments ci-dessous sont informatifs et n’ajoutent pas de calcul automatique à ce stade.
          </p>

          {LIBERALITES_REFERENCE.map((item) => (
            <div key={item.id} className="income-tax-block dmtg-block--mb12">
              <div className="dmtg-block-title">{item.label}</div>
              <div className="dmtg-family-label">{item.family}</div>
              <p className="dmtg-desc--mb6">
                <strong className="dmtg-strong">Définition :</strong> {item.definition}
              </p>
              <p className="dmtg-desc--mb6">
                <strong className="dmtg-strong">Impact patrimonial :</strong> {item.impact}
              </p>
              <div className="dmtg-desc--mb6">
                <strong className="dmtg-strong">Champs minimaux :</strong>
                <ul className="dmtg-list">
                  {item.minimumFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
              <div className="dmtg-note--flush dmtg-reference-row">
                <span>Références :</span>
                <LegalRefList ids={item.legalRefIds} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
