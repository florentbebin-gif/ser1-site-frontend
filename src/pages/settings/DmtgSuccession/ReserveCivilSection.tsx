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
          Réserve héréditaire & droits du conjoint
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p className="dmtg-intro">
            Règles du Code civil - lecture seule (non paramétrable).
          </p>

          <div className="income-tax-block dmtg-block--mb16">
            <div className="dmtg-block-title">
              Réserve héréditaire (art. 913 C. civ.)
            </div>
            <table className="settings-table dmtg-table--mt8">
              <thead>
                <tr>
                  <th className="dmtg-col-left">Enfants</th>
                  <th>Réserve</th>
                  <th>Quotité disponible</th>
                </tr>
              </thead>
              <tbody>
                {reserveRows.map((row) => (
                  <tr key={row.enfants}>
                    <td className="dmtg-col-left">{row.enfants}</td>
                    <td>{row.reserve}</td>
                    <td>{row.quotiteDisponible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="income-tax-block">
            <div className="dmtg-block-title">
              Droits du conjoint survivant (art. 757 et s. C. civ.)
            </div>
            <table className="settings-table dmtg-table--mt8">
              <thead>
                <tr>
                  <th className="dmtg-col-left">Situation</th>
                  <th className="dmtg-col-left">Droits</th>
                </tr>
              </thead>
              <tbody>
                {droitsConjointRows.map((row) => (
                  <tr key={row.situation}>
                    <td className="dmtg-col-left">{row.situation}</td>
                    <td className="dmtg-col-left">{row.droits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="dmtg-note--mt8">
              Le conjoint survivant est exonéré de droits de succession (loi TEPA 2007).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
