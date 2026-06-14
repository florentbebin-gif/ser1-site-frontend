import type { ReactElement } from 'react';
import { LegalRefLink } from '@/components/legal/LegalRefLink';
import { DROITS_CONJOINT, RESERVE_HEREDITAIRE } from './dmtgReferenceData';
import { RESERVE_CIVIL_LEGAL_REFERENCE_IDS } from './dmtgLegalReferenceIds';

interface ReserveHereditaireRow {
  enfants: number | string;
  reserve: string;
  quotiteDisponible: string;
}

interface DroitsConjointRow {
  situation: string;
  droits: string;
}

export function ReserveHereditaireSection(): ReactElement {
  const reserveRows = RESERVE_HEREDITAIRE as ReserveHereditaireRow[];

  return (
    <section className="settings-memento-entry-section settings-dmtg-entry-section">
      <h6>
        Réserve héréditaire (<LegalRefLink id={RESERVE_CIVIL_LEGAL_REFERENCE_IDS.reserve} />)
      </h6>
      <p className="dmtg-intro">Règles du Code civil - lecture seule.</p>
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
    </section>
  );
}

export function DroitsConjointSection(): ReactElement {
  const droitsConjointRows = DROITS_CONJOINT as DroitsConjointRow[];

  return (
    <section className="settings-memento-entry-section settings-dmtg-entry-section">
      <h6>
        Droits du conjoint survivant (
        <LegalRefLink id={RESERVE_CIVIL_LEGAL_REFERENCE_IDS.conjoint} />)
      </h6>
      <p className="dmtg-intro">Options légales du conjoint survivant selon la situation.</p>
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
    </section>
  );
}
