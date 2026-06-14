import type { ReactElement } from 'react';
import ImpotsDmtgSection from '../Impots/ImpotsDmtgSection';
import AvDecesSection from '../DmtgSuccession/AvDecesSection';
import AvantagesMatrimoniauxSection from '../DmtgSuccession/AvantagesMatrimoniauxSection';
import DonationSection from '../DmtgSuccession/DonationSection';
import LiberalitesSection from '../DmtgSuccession/LiberalitesSection';
import RegimesSection from '../DmtgSuccession/RegimesSection';
import {
  DroitsConjointSection,
  ReserveHereditaireSection,
} from '../DmtgSuccession/ReserveCivilSection';
import { useDmtgSuccessionContext } from '../DmtgSuccession/DmtgSuccessionProvider';
import '../styles/impots.css';
import '../styles/dmtg.css';

interface MementoDmtgEntrySectionProps {
  entryKey: string;
}

function MementoDmtgNumericEntrySection({
  entryKey,
}: MementoDmtgEntrySectionProps): ReactElement | null {
  const context = useDmtgSuccessionContext();

  if (context.loading) {
    return (
      <div className="settings-memento-entry-section settings-dmtg-entry-section">
        <p className="settings-memento-empty">Chargement des paramètres DMTG...</p>
      </div>
    );
  }

  switch (entryKey) {
    case 'transmission.succession-dmtg':
      return (
        <ImpotsDmtgSection
          dmtg={context.dmtg}
          updateDmtgCategory={context.updateDmtgCategory}
          isAdmin={context.isAdmin}
          errors={context.dmtgErrors}
        />
      );
    case 'transmission.donations-anterieures':
      return (
        <DonationSection
          donation={context.donation}
          updateDonation={context.updateDonation}
          isAdmin={context.isAdmin}
        />
      );
    case 'transmission.assurance-vie-deces':
      return (
        <AvDecesSection
          avDeces={context.avDeces}
          updateAvDeces={context.updateAvDeces}
          isAdmin={context.isAdmin}
          errors={context.avDecesErrors}
        />
      );
    default:
      return null;
  }
}

export default function MementoDmtgEntrySection({
  entryKey,
}: MementoDmtgEntrySectionProps): ReactElement | null {
  switch (entryKey) {
    case 'transmission.succession-dmtg':
    case 'transmission.donations-anterieures':
    case 'transmission.assurance-vie-deces':
      return <MementoDmtgNumericEntrySection entryKey={entryKey} />;
    case 'transmission.liberalites':
      return <LiberalitesSection />;
    case 'civil.reserve-quotite':
      return <ReserveHereditaireSection />;
    case 'civil.devolution-conjoint-survivant':
      return <DroitsConjointSection />;
    case 'civil.regime-matrimonial':
      return (
        <>
          <RegimesSection />
          <AvantagesMatrimoniauxSection />
        </>
      );
    default:
      return null;
  }
}
