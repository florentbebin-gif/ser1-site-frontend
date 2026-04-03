import React from 'react';
import { RESERVE_HEREDITAIRE, DROITS_CONJOINT } from './dmtgReferenceData';

interface ReserveHereditaireRow {
  enfants: number | string;
  reserve: string;
  quotiteDisponible: string;
}

interface DroitsConjointRow {
  situation: string;
  droits: string;
}

interface ReserveCivilSectionProps {
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ReserveCivilSection({
  openSection,
  setOpenSection,
}: ReserveCivilSectionProps): React.ReactElement {
  const isOpen = openSection === 'reserve';
  const reserveRows = RESERVE_HEREDITAIRE as ReserveHereditaireRow[];
  const droitsConjointRows = DROITS_CONJOINT as DroitsConjointRow[];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={isOpen}
        onClick={() => setOpenSection(isOpen ? null : 'reserve')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Reserve hereditaire & droits du conjoint
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Regles du Code civil - lecture seule (non parametrable).
          </p>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Reserve hereditaire (art. 913 C. civ.)
            </div>
            <table className="settings-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Enfants</th>
                  <th>Reserve</th>
                  <th>Quotite disponible</th>
                </tr>
              </thead>
              <tbody>
                {reserveRows.map((row) => (
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
                {droitsConjointRows.map((row) => (
                  <tr key={row.situation}>
                    <td style={{ textAlign: 'left' }}>{row.situation}</td>
                    <td style={{ textAlign: 'left' }}>{row.droits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 12, color: 'var(--color-c9)', margin: '8px 0 0 0' }}>
              Le conjoint survivant est exonere de droits de succession (loi TEPA 2007).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
