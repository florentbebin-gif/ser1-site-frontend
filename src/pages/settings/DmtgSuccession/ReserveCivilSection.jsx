import React from 'react';
import { RESERVE_HEREDITAIRE, DROITS_CONJOINT } from './dmtgReferenceData';

export default function ReserveCivilSection({ openSection, setOpenSection }) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={openSection === 'reserve'}
        onClick={() => setOpenSection(openSection === 'reserve' ? null : 'reserve')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Réserve héréditaire & droits du conjoint
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'reserve' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'reserve' && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Règles du Code civil — lecture seule (non paramétrable).
          </p>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Réserve héréditaire (art. 913 C. civ.)
            </div>
            <table className="settings-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Enfants</th>
                  <th>Réserve</th>
                  <th>Quotité disponible</th>
                </tr>
              </thead>
              <tbody>
                {RESERVE_HEREDITAIRE.map((row) => (
                  <tr key={row.enfants}>
                    <td style={{ textAlign: 'left' }}>{row.enfants}</td>
                    <td>{row.reserve}</td>
                    <td>{row.quotiteDisponible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="income-tax-block">
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Droits du conjoint survivant (art. 757 et s. C. civ.)
            </div>
            <table className="settings-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Situation</th>
                  <th style={{ textAlign: 'left' }}>Droits</th>
                </tr>
              </thead>
              <tbody>
                {DROITS_CONJOINT.map((row) => (
                  <tr key={row.situation}>
                    <td style={{ textAlign: 'left' }}>{row.situation}</td>
                    <td style={{ textAlign: 'left' }}>{row.droits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 12, color: 'var(--color-c9)', margin: '8px 0 0 0' }}>
              Le conjoint survivant est exonéré de droits de succession (loi TEPA 2007).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
