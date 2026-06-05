import React from 'react';
import { LegalRefList } from '@/components/legal/LegalRefLink';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import { AVANTAGES_MATRIMONIAUX_REFERENCE } from './dmtgReferenceData';

interface AvantagesMatrimoniauxSectionProps {
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function AvantagesMatrimoniauxSection({
  openSection,
  setOpenSection,
}: AvantagesMatrimoniauxSectionProps): React.ReactElement {
  const isOpen = openSection === 'avantagesMatrimoniaux';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header fisc-acc-header--with-icon"
        aria-expanded={isOpen}
        onClick={() => setOpenSection(isOpen ? null : 'avantagesMatrimoniaux')}
      >
        <SettingsTitleWithIcon
          icon="sparkles"
          className="settings-premium-title settings-premium-title--flush"
        >
          Avantages matrimoniaux
        </SettingsTitleWithIcon>
        <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p className="dmtg-intro">
            Clauses de contrat de mariage influençant la liquidation civile avant calcul des droits
            de succession. Ces éléments doivent être qualifiés avant tout calcul DMTG.
          </p>

          {AVANTAGES_MATRIMONIAUX_REFERENCE.map((item) => (
            <div key={item.id} className="income-tax-block dmtg-block--mb12">
              <div className="dmtg-block-title">{item.label}</div>
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

          <div className="income-tax-block dmtg-block--mt4">
            <div className="dmtg-block-title">Vigilances juridiques</div>
            <ul className="dmtg-list--vigilances">
              <li className="dmtg-list-item--mb4">
                <span>
                  Les avantages matrimoniaux ne sont en principe pas qualifiés de donations.
                </span>
                <div className="dmtg-reference-row dmtg-reference-row--mt4">
                  <span>Références :</span>
                  <LegalRefList ids={['code-civil-1516', 'code-civil-1525', 'code-civil-1527']} />
                </div>
              </li>
              <li className="dmtg-list-item--mb4">
                <span>
                  En présence d’enfants non communs, l’excédent au-delà de la quotité entre époux
                  peut être réduit.
                </span>
                <div className="dmtg-reference-row dmtg-reference-row--mt4">
                  <span>Références :</span>
                  <LegalRefList ids={['code-civil-1527', 'code-civil-1094-1']} />
                </div>
              </li>
              <li>
                En cas de divorce, les avantages à effet différé sont révoqués de plein droit sauf
                volonté contraire.
                <div className="dmtg-reference-row dmtg-reference-row--mt4">
                  <span>Référence :</span>
                  <LegalRefList ids={['code-civil-265']} />
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
