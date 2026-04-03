import type { StepProps } from './types';

export default function StepPassif({ dossier, updateDossier }: StepProps) {
  const { passif } = dossier;
  const totalPassif = passif.emprunts.reduce((sum, emprunt) => sum + emprunt.capitalRestantDu, 0);

  return (
    <div className="step-form">
      <h2>Passif</h2>
      <div className="summary-bar">
        Total emprunts CRD : <strong>{totalPassif.toLocaleString('fr-FR')} €</strong>
      </div>

      <button
        type="button"
        className="premium-btn"
        onClick={() => updateDossier({
          passif: {
            ...passif,
            emprunts: [...passif.emprunts, {
              id: crypto.randomUUID(),
              libelle: '',
              type: 'immobilier',
              capitalInitial: 0,
              capitalRestantDu: 0,
              mensualite: 0,
              tauxInteret: 0,
              dateDebut: '',
              dateFin: '',
            }],
          },
        })}
      >
        + Ajouter un emprunt
      </button>

      {passif.emprunts.map((emprunt, idx) => (
        <div key={emprunt.id} className="form-card">
          <div className="form-row">
            <label>Libellé</label>
            <input
              type="text"
              value={emprunt.libelle}
              onChange={(e) => {
                const newEmprunts = [...passif.emprunts];
                newEmprunts[idx] = { ...emprunt, libelle: e.target.value };
                updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
              }}
              placeholder="Ex: Crédit résidence principale"
            />
          </div>
          <div className="form-row">
            <label>Capital restant dû (€)</label>
            <input
              type="number"
              value={emprunt.capitalRestantDu}
              onChange={(e) => {
                const newEmprunts = [...passif.emprunts];
                newEmprunts[idx] = { ...emprunt, capitalRestantDu: parseFloat(e.target.value) || 0 };
                updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
              }}
            />
          </div>
          <div className="form-row">
            <label>Mensualité (€)</label>
            <input
              type="number"
              value={emprunt.mensualite}
              onChange={(e) => {
                const newEmprunts = [...passif.emprunts];
                newEmprunts[idx] = { ...emprunt, mensualite: parseFloat(e.target.value) || 0 };
                updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
              }}
            />
          </div>
          <div className="form-row">
            <label>Date de fin</label>
            <input
              type="date"
              value={emprunt.dateFin}
              onChange={(e) => {
                const newEmprunts = [...passif.emprunts];
                newEmprunts[idx] = { ...emprunt, dateFin: e.target.value };
                updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
              }}
            />
          </div>
          <button
            type="button"
            className="chip chip-small chip-danger"
            onClick={() => {
              updateDossier({
                passif: {
                  ...passif,
                  emprunts: passif.emprunts.filter((_, i) => i !== idx),
                },
              });
            }}
          >
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}
