import type { ReactElement } from 'react';
import { LegalRefList } from '@/components/legal/LegalRefLink';
import { AVANTAGES_MATRIMONIAUX_REFERENCE } from './dmtgReferenceData';
import { AVANTAGES_MATRIMONIAUX_VIGILANCE_LEGAL_REFERENCE_IDS } from './dmtgLegalReferenceIds';

export default function AvantagesMatrimoniauxSection(): ReactElement {
  return (
    <section className="settings-memento-entry-section settings-dmtg-entry-section">
      <h6>Avantages matrimoniaux</h6>
      <p className="dmtg-intro">
        Clauses de contrat de mariage influençant la liquidation civile avant calcul des droits de
        succession.
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
            <span>Les avantages matrimoniaux ne sont en principe pas qualifiés de donations.</span>
            <div className="dmtg-reference-row dmtg-reference-row--mt4">
              <span>Références :</span>
              <LegalRefList
                ids={AVANTAGES_MATRIMONIAUX_VIGILANCE_LEGAL_REFERENCE_IDS.qualification}
              />
            </div>
          </li>
          <li className="dmtg-list-item--mb4">
            <span>
              En présence d’enfants non communs, l’excédent au-delà de la quotité entre époux peut
              être réduit.
            </span>
            <div className="dmtg-reference-row dmtg-reference-row--mt4">
              <span>Références :</span>
              <LegalRefList
                ids={AVANTAGES_MATRIMONIAUX_VIGILANCE_LEGAL_REFERENCE_IDS.enfantsNonCommuns}
              />
            </div>
          </li>
          <li>
            En cas de divorce, les avantages à effet différé sont révoqués de plein droit sauf
            volonté contraire.
            <div className="dmtg-reference-row dmtg-reference-row--mt4">
              <span>Référence :</span>
              <LegalRefList ids={AVANTAGES_MATRIMONIAUX_VIGILANCE_LEGAL_REFERENCE_IDS.divorce} />
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
