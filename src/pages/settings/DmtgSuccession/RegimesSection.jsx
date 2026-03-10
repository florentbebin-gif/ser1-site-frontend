import React from 'react';
import { REGIMES_MATRIMONIAUX, REGIMES_ORDER } from '@/engine/civil';
import { SITUATIONS_FAMILIALES_SUCCESSION } from './dmtgReferenceData';

export default function RegimesSection({ openSection, setOpenSection }) {
  const regimes = REGIMES_ORDER.map((id) => REGIMES_MATRIMONIAUX[id]);

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={openSection === 'regimes'}
        onClick={() => setOpenSection(openSection === 'regimes' ? null : 'regimes')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Régimes matrimoniaux & PACS
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'regimes' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'regimes' && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Référentiel civil utilisé par la simulation successorale (lecture seule).
            Les situations familiales et les régimes matrimoniaux sont distingués.
          </p>

          <div className="income-tax-block" style={{ marginBottom: 12 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Situations familiales
            </div>
            <table className="settings-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Situation</th>
                  <th style={{ textAlign: 'left' }}>Cadre juridique</th>
                  <th style={{ textAlign: 'left' }}>Incidence successorale</th>
                </tr>
              </thead>
              <tbody>
                {SITUATIONS_FAMILIALES_SUCCESSION.map((situation) => (
                  <tr key={situation.id}>
                    <td style={{ textAlign: 'left' }}>{situation.label}</td>
                    <td style={{ textAlign: 'left' }}>{situation.cadre}</td>
                    <td style={{ textAlign: 'left' }}>{situation.incidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {regimes.map((regime) => (
            <div
              key={regime.id}
              className="income-tax-block"
              style={{ marginBottom: 12 }}
            >
              <div className="income-tax-block-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
                <span>{regime.label}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 10,
                  backgroundColor: regime.category === 'communautaire' ? 'var(--color-c4)' : 'var(--color-c6)',
                  color: 'var(--color-c1)',
                  whiteSpace: 'nowrap',
                }}>
                  {regime.category === 'communautaire' ? 'Communautaire' : 'Séparatiste'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: '0 0 8px 0' }}>
                {regime.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <strong style={{ color: 'var(--color-c1)' }}>Avantages</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {regime.avantages.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-c9)' }}>Limites</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {regime.limites.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          <div className="income-tax-block" style={{ marginTop: 4 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              PACS
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: 0 }}>
              Par défaut : séparation de biens. Option : indivision des acquêts.
              Le partenaire pacsé est exonéré de droits de succession (loi TEPA 2007).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
