import type { ReactElement } from 'react';

import { IconFileText, IconHardDrive, IconSave, IconUsers } from '@/icons/ui';

import { useLocalSaveHistory } from '../hooks/useLocalSaveHistory';

interface DossierTravailCardProps {
  dossierClientLabel: string | null;
}

const NO_LOCAL_FILE_LABEL = 'Aucun fichier local';
const UNSAVED_SINCE_LOAD_LABEL = 'Non enregistré depuis le chargement';

export function DossierTravailCard({ dossierClientLabel }: DossierTravailCardProps): ReactElement {
  const { currentFilename, lastSavedFilename, history } = useLocalSaveHistory();
  const filename = currentFilename ?? lastSavedFilename ?? NO_LOCAL_FILE_LABEL;
  const lastSavedLabel = lastSavedFilename
    ? 'Enregistré localement'
    : currentFilename
      ? UNSAVED_SINCE_LOAD_LABEL
      : 'Non enregistré';

  return (
    <section
      className="dossier-travail sim-tile-flat"
      data-testid="dossier-loaded-card"
      aria-labelledby="dossier-travail-title"
    >
      <header className="dossier-travail__header">
        <span className="dossier-travail__icon">
          <IconFileText className="dossier-travail__icon-svg" />
        </span>
        <div className="dossier-travail__heading">
          <p className="dossier-travail__eyebrow">Dossier</p>
          <h2 id="dossier-travail-title" className="dossier-travail__title">
            Dossier de travail
          </h2>
        </div>
      </header>

      <dl className="dossier-travail__facts">
        <div className="dossier-travail__fact">
          <dt>
            <IconUsers className="dossier-travail__fact-icon" />
            Client
          </dt>
          <dd className="dossier-travail__client-value" data-testid="dossier-client-label">
            {dossierClientLabel ?? 'Client à renseigner'}
          </dd>
        </div>
        <div className="dossier-travail__fact">
          <dt>
            <IconHardDrive className="dossier-travail__fact-icon" />
            Fichier local
          </dt>
          <dd data-testid="dossier-loaded-filename" data-state={saveValueState(filename, 'file')}>
            {filename}
          </dd>
        </div>
        <div className="dossier-travail__fact">
          <dt>
            <IconSave className="dossier-travail__fact-icon" />
            État local
          </dt>
          <dd
            data-testid="dossier-loaded-disclaimer"
            data-state={saveValueState(lastSavedLabel, 'save')}
          >
            {lastSavedLabel}
          </dd>
        </div>
      </dl>

      {history.length > 0 ? (
        <div className="dossier-travail__history" aria-label="Historique local des sauvegardes">
          <ol className="dossier-travail__history-list">
            {history.map((entry) => (
              <li key={`${entry.action}-${entry.savedAt}`}>
                <span>{entry.action === 'save' ? 'Sauvegarde' : 'Chargement'}</span>
                <time dateTime={entry.savedAt}>{formatHistoryDate(entry.savedAt)}</time>
              </li>
            ))}
          </ol>
          <p className="dossier-travail__history-caption">Historique conservé sur cet appareil</p>
        </div>
      ) : null}
    </section>
  );
}

function saveValueState(value: string, kind: 'file' | 'save'): 'unsaved' | undefined {
  if (kind === 'file') return value === NO_LOCAL_FILE_LABEL ? 'unsaved' : undefined;
  return value === 'Non enregistré' || value === UNSAVED_SINCE_LOAD_LABEL ? 'unsaved' : undefined;
}

function formatHistoryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date locale indisponible';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
