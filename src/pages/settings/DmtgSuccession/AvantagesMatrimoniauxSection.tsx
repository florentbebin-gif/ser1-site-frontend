import React from 'react';
import { AVANTAGES_MATRIMONIAUX_REFERENCE } from './dmtgReferenceData';

interface AvantageMatrimonialReference {
  id: string;
  label: string;
  definition: string;
  impact: string;
  minimumFields: string[];
  legalRefs: string;
}

interface AvantagesMatrimoniauxSectionProps {
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function AvantagesMatrimoniauxSection({
  openSection,
  setOpenSection,
}: AvantagesMatrimoniauxSectionProps): React.ReactElement {
  const isOpen = openSection === 'avantagesMatrimoniaux';
  const avantages = AVANTAGES_MATRIMONIAUX_REFERENCE as AvantageMatrimonialReference[];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={isOpen}
        onClick={() => setOpenSection(isOpen ? null : 'avantagesMatrimoniaux')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Avantages matrimoniaux
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p className="dmtg-intro">
            Clauses de contrat de mariage influençant la liquidation civile avant calcul des droits de succession.
            Ces éléments doivent être qualifiés avant tout calcul DMTG.
          </p>

          {avantages.map((item) => (
            <div key={item.id} className="income-tax-block dmtg-block--mb12">
              <div className="dmtg-block-title">
                {item.label}
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

          <div className="income-tax-block dmtg-block--mt4">
            <div className="dmtg-block-title">
              Vigilances juridiques
            </div>
            <ul className="dmtg-list--vigilances">
              <li className="dmtg-list-item--mb4">
                Les avantages matrimoniaux ne sont en principe pas qualifiés de donations.
                Références : C. civ. art. 1516, 1525, 1527.
              </li>
              <li className="dmtg-list-item--mb4">
                En présence d’enfants non communs, l’excédent au-delà de la quotité entre époux peut être réduit.
                Références : C. civ. art. 1527 et 1094-1.
              </li>
              <li>
                En cas de divorce, les avantages à effet différé sont révoqués de plein droit sauf volonté contraire.
                Référence : C. civ. art. 265 (version en vigueur depuis le 2 juin 2024).
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
