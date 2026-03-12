import type { StepProps } from './types';

export default function StepActifs({ dossier, updateDossier }: StepProps) {
  const { actifs } = dossier;
  const totalActifs = actifs.reduce((sum, actif) => sum + actif.valeur, 0);

  return (
    <div className="step-form">
      <h2>Actifs</h2>
      <div className="summary-bar">
        Total actifs : <strong>{totalActifs.toLocaleString('fr-FR')} €</strong>
      </div>

      <button
        className="chip"
        onClick={() => updateDossier({
          actifs: [...actifs, {
            id: crypto.randomUUID(),
            libelle: '',
            valeur: 0,
            proprietaire: 'commun',
            type: 'autre_financier',
          }],
        })}
      >
        + Ajouter un actif
      </button>

      {actifs.map((actif, idx) => (
        <div key={actif.id} className="form-card">
          <div className="form-row">
            <label>Libellé</label>
            <input
              type="text"
              value={actif.libelle}
              onChange={(e) => {
                const newActifs = [...actifs];
                newActifs[idx] = { ...actif, libelle: e.target.value };
                updateDossier({ actifs: newActifs });
              }}
              placeholder="Ex: Résidence principale"
            />
          </div>
          <div className="form-row">
            <label>Valeur (€)</label>
            <input
              type="number"
              value={actif.valeur}
              onChange={(e) => {
                const newActifs = [...actifs];
                newActifs[idx] = { ...actif, valeur: parseFloat(e.target.value) || 0 };
                updateDossier({ actifs: newActifs });
              }}
            />
          </div>
          <div className="form-row">
            <label>Propriétaire</label>
            <select
              value={actif.proprietaire}
              onChange={(e) => {
                const newActifs = [...actifs];
                newActifs[idx] = { ...actif, proprietaire: e.target.value as typeof actif.proprietaire };
                updateDossier({ actifs: newActifs });
              }}
            >
              <option value="mr">Monsieur</option>
              <option value="mme">Madame</option>
              <option value="commun">Communauté</option>
              <option value="indivision">Indivision</option>
            </select>
          </div>
          <button
            className="chip chip-small chip-danger"
            onClick={() => {
              updateDossier({ actifs: actifs.filter((_, i) => i !== idx) });
            }}
          >
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}
