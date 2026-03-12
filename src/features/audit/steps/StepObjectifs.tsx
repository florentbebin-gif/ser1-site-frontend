import type { ObjectifClient } from '../types';
import { OBJECTIFS_CLIENT_LABELS } from '../types';
import type { StepProps } from './types';

export default function StepObjectifs({ dossier, updateDossier }: StepProps) {
  const { objectifs, actifs } = dossier;
  const hasEntreprise = actifs.some((actif) => 'type' in actif && actif.type === 'entreprise');

  const allObjectifs: ObjectifClient[] = [
    'proteger_conjoint',
    'proteger_proches',
    'proteger_revenus_sante',
    ...(hasEntreprise ? ['proteger_entreprise', 'proteger_associes'] as ObjectifClient[] : []),
    'preparer_transmission',
    'developper_patrimoine',
    'revenus_differes',
    'revenus_immediats',
    'reduire_fiscalite',
    'reduire_droits_succession',
  ];

  const toggleObjectif = (objectif: ObjectifClient) => {
    const nextObjectifs = objectifs.includes(objectif)
      ? objectifs.filter((current) => current !== objectif)
      : [...objectifs, objectif];
    updateDossier({ objectifs: nextObjectifs });
  };

  return (
    <div className="step-form">
      <h2>Objectifs client</h2>
      <p className="form-hint">Sélectionnez les objectifs prioritaires du client.</p>

      <div className="objectifs-grid">
        {allObjectifs.map((objectif) => (
          <label key={objectif} className={`objectif-card ${objectifs.includes(objectif) ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={objectifs.includes(objectif)}
              onChange={() => toggleObjectif(objectif)}
            />
            <span>{OBJECTIFS_CLIENT_LABELS[objectif]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
