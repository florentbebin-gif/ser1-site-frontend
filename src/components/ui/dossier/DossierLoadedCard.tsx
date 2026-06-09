import { useEffect, useState, type ReactElement } from 'react';

import './DossierContextCards.css';

interface DossierLoadedCardProps {
  testId?: string;
  filenameTestId?: string;
  disclaimerTestId?: string;
}

export function DossierLoadedCard({
  testId = 'home-status-card',
  filenameTestId = 'home-loaded-filename',
  disclaimerTestId = 'home-status-disclaimer',
}: DossierLoadedCardProps): ReactElement {
  const [loadedFilename, setLoadedFilename] = useState<string | null>(null);

  useEffect(() => {
    try {
      let fileName = sessionStorage.getItem('ser1:loadedFilename');
      if (fileName) {
        fileName = fileName.replace(/\.(ser1|json)$/i, '');
      }
      setLoadedFilename(fileName || null);
    } catch {
      setLoadedFilename(null);
    }
  }, []);

  return (
    <section className="dossier-context-card" data-testid={testId}>
      <span className="dossier-context-card__label">Dossier de travail</span>
      <span className="dossier-context-card__value" data-testid={filenameTestId}>
        {loadedFilename || 'Session locale'}
      </span>
      <span className="dossier-context-card__divider" />
      <span className="dossier-context-card__hint" data-testid={disclaimerTestId}>
        Session locale — sauvegardez le dossier pour le conserver.
      </span>
    </section>
  );
}

export default DossierLoadedCard;
