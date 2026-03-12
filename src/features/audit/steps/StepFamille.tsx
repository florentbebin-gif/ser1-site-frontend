import type { StepProps } from './types';

export default function StepFamille({ dossier, updateDossier }: StepProps) {
  const { situationFamiliale } = dossier;

  return (
    <div className="step-form">
      <h2>Situation familiale</h2>

      <div className="form-section">
        <h3>Monsieur</h3>
        <div className="form-row">
          <label>Prénom</label>
          <input
            type="text"
            value={situationFamiliale.mr.prenom}
            onChange={(e) => updateDossier({
              situationFamiliale: {
                ...situationFamiliale,
                mr: { ...situationFamiliale.mr, prenom: e.target.value },
              },
            })}
            placeholder="Prénom"
          />
        </div>
        <div className="form-row">
          <label>Nom</label>
          <input
            type="text"
            value={situationFamiliale.mr.nom}
            onChange={(e) => updateDossier({
              situationFamiliale: {
                ...situationFamiliale,
                mr: { ...situationFamiliale.mr, nom: e.target.value },
              },
            })}
            placeholder="Nom"
          />
        </div>
        <div className="form-row">
          <label>Date de naissance</label>
          <input
            type="date"
            value={situationFamiliale.mr.dateNaissance}
            onChange={(e) => updateDossier({
              situationFamiliale: {
                ...situationFamiliale,
                mr: { ...situationFamiliale.mr, dateNaissance: e.target.value },
              },
            })}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Situation</h3>
        <div className="form-row">
          <label>Situation matrimoniale</label>
          <select
            value={situationFamiliale.situationMatrimoniale}
            onChange={(e) => updateDossier({
              situationFamiliale: {
                ...situationFamiliale,
                situationMatrimoniale: e.target.value as typeof situationFamiliale.situationMatrimoniale,
              },
            })}
          >
            <option value="celibataire">Célibataire</option>
            <option value="marie">Marié(e)</option>
            <option value="pacse">Pacsé(e)</option>
            <option value="concubinage">Concubinage</option>
            <option value="divorce">Divorcé(e)</option>
            <option value="veuf">Veuf/Veuve</option>
          </select>
        </div>

        {['marie', 'pacse', 'concubinage'].includes(situationFamiliale.situationMatrimoniale) && (
          <div className="form-section">
            <h3>Madame / Partenaire</h3>
            <div className="form-row">
              <label>Prénom</label>
              <input
                type="text"
                value={situationFamiliale.mme?.prenom || ''}
                onChange={(e) => updateDossier({
                  situationFamiliale: {
                    ...situationFamiliale,
                    mme: {
                      ...situationFamiliale.mme || { nom: '', dateNaissance: '' },
                      prenom: e.target.value,
                    },
                  },
                })}
                placeholder="Prénom"
              />
            </div>
            <div className="form-row">
              <label>Nom</label>
              <input
                type="text"
                value={situationFamiliale.mme?.nom || ''}
                onChange={(e) => updateDossier({
                  situationFamiliale: {
                    ...situationFamiliale,
                    mme: {
                      ...situationFamiliale.mme || { prenom: '', dateNaissance: '' },
                      nom: e.target.value,
                    },
                  },
                })}
                placeholder="Nom"
              />
            </div>
            <div className="form-row">
              <label>Date de naissance</label>
              <input
                type="date"
                value={situationFamiliale.mme?.dateNaissance || ''}
                onChange={(e) => updateDossier({
                  situationFamiliale: {
                    ...situationFamiliale,
                    mme: {
                      ...situationFamiliale.mme || { prenom: '', nom: '' },
                      dateNaissance: e.target.value,
                    },
                  },
                })}
              />
            </div>
          </div>
        )}

        <div className="form-row">
          <label>Nombre d'enfants</label>
          <input
            type="number"
            min="0"
            value={situationFamiliale.enfants.length}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 0;
              const current = situationFamiliale.enfants;
              let newEnfants = [...current];

              if (count > current.length) {
                for (let i = current.length; i < count; i += 1) {
                  newEnfants.push({ prenom: '', dateNaissance: '', estCommun: true });
                }
              } else {
                newEnfants = newEnfants.slice(0, count);
              }

              updateDossier({
                situationFamiliale: { ...situationFamiliale, enfants: newEnfants },
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
