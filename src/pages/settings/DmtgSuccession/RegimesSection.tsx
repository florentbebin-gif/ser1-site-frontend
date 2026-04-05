import React from 'react';
import { REGIMES_MATRIMONIAUX, REGIMES_ORDER, type RegimeInfo } from '@/engine/civil';
import { SITUATIONS_FAMILIALES_SUCCESSION } from './dmtgReferenceData';

interface SituationFamiliale {
  id: string;
  label: string;
  cadre: string;
  incidence: string;
}

interface RegimesSectionProps {
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function RegimesSection({
  openSection,
  setOpenSection,
}: RegimesSectionProps): React.ReactElement {
  const isOpen = openSection === 'regimes';
  const regimes: RegimeInfo[] = REGIMES_ORDER.map((id) => REGIMES_MATRIMONIAUX[id]);
  const situationsFamiliales = SITUATIONS_FAMILIALES_SUCCESSION as SituationFamiliale[];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={isOpen}
        onClick={() => setOpenSection(isOpen ? null : 'regimes')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Régimes matrimoniaux & PACS
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p className="dmtg-intro">
            Référentiel civil utilisé par la simulation successorale (lecture seule).
            Les situations familiales et les régimes matrimoniaux sont distingués.
          </p>

          <div className="income-tax-block dmtg-block--mb12">
            <div className="dmtg-block-title">
              Situations familiales
            </div>
            <table className="settings-table dmtg-table--mt8">
              <thead>
                <tr>
                  <th className="dmtg-col-left">Situation</th>
                  <th className="dmtg-col-left">Cadre juridique</th>
                  <th className="dmtg-col-left">Incidence successorale</th>
                </tr>
              </thead>
              <tbody>
                {situationsFamiliales.map((situation) => (
                  <tr key={situation.id}>
                    <td className="dmtg-col-left">{situation.label}</td>
                    <td className="dmtg-col-left">{situation.cadre}</td>
                    <td className="dmtg-col-left">{situation.incidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {regimes.map((regime) => (
            <div
              key={regime.id}
              className="income-tax-block dmtg-block--mb12"
            >
              <div className="dmtg-block-title dmtg-block-title--flex">
                <span>{regime.label}</span>
                <span className={`dmtg-badge ${regime.category === 'communautaire' ? 'dmtg-badge--communautaire' : 'dmtg-badge--separatiste'}`}>
                  {regime.category === 'communautaire' ? 'Communautaire' : 'Séparatiste'}
                </span>
              </div>
              <p className="dmtg-desc">
                {regime.description}
              </p>
              <div className="dmtg-grid-2col">
                <div>
                  <strong className="dmtg-strong">Avantages</strong>
                  <ul className="dmtg-list">
                    {regime.avantages.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <strong className="dmtg-strong--secondary">Limites</strong>
                  <ul className="dmtg-list">
                    {regime.limites.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          <div className="income-tax-block dmtg-block--mt4">
            <div className="dmtg-block-title">
              PACS
            </div>
            <p className="dmtg-desc--flush">
              Par défaut : séparation de biens. Option : indivision des acquêts.
              Le partenaire pacsé est exonéré de droits de succession (loi TEPA 2007).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
