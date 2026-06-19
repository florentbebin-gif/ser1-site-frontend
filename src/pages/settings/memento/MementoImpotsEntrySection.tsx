import type { ReactElement } from 'react';
import { useImpotsContext } from '../Impots/ImpotsProvider';
import MementoImpotsIfiSection from './impots/MementoImpotsIfiSection';
import MementoImpotsIrSection, { MementoImpotsPfuSection } from './impots/MementoImpotsIrSection';
import '../styles/impots.css';

interface MementoImpotsEntrySectionProps {
  entryKey: string;
}

export default function MementoImpotsEntrySection({
  entryKey,
}: MementoImpotsEntrySectionProps): ReactElement | null {
  const { loading } = useImpotsContext();

  if (loading) {
    return <p className="settings-memento-empty">Chargement des paramètres impôts...</p>;
  }

  if (entryKey === 'fiscalite-foyer.ir') return <MementoImpotsIrSection />;
  if (entryKey === 'fiscalite-foyer.ifi') return <MementoImpotsIfiSection />;
  if (entryKey === 'placements.ps-pfu-revenus-capital') return <MementoImpotsPfuSection />;

  return null;
}
