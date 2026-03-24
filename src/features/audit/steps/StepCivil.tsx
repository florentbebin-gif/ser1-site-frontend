import type { StepProps } from './types';

export default function StepCivil({ dossier, updateDossier }: StepProps) {
  const { situationCivile, situationFamiliale } = dossier;
  const isMarie = situationFamiliale.situationMatrimoniale === 'marie';

  return (
    <div className="step-form">
      <h2>Situation civile</h2>

      {isMarie && (
        <div className="form-section">
          <h3>Régime matrimonial</h3>
          <div className="form-row">
            <label>Régime</label>
            <select
              value={situationCivile.regimeMatrimonial || ''}
              onChange={(e) => updateDossier({
                situationCivile: {
                  ...situationCivile,
                  regimeMatrimonial: e.target.value as typeof situationCivile.regimeMatrimonial,
                },
              })}
            >
              <option value="">Sélectionner...</option>
              <option value="communaute_legale">Communauté réduite aux acquêts</option>
              <option value="communaute_universelle">Communauté universelle</option>
              <option value="separation_biens">Séparation de biens</option>
              <option value="participation_acquets">Participation aux acquêts</option>
              <option value="communaute_meubles_acquets">Communauté de meubles et acquêts</option>
              <option value="separation_biens_societe_acquets">Séparation de biens avec société d'acquêts</option>
            </select>
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={situationCivile.contratMariage}
                onChange={(e) => updateDossier({
                  situationCivile: { ...situationCivile, contratMariage: e.target.checked },
                })}
              />
              Contrat de mariage
            </label>
          </div>
        </div>
      )}

      <div className="form-section">
        <h3>Donations antérieures</h3>
        <p className="form-hint">Les donations réalisées au cours des 15 dernières années.</p>
        <button
          className="chip"
          onClick={() => updateDossier({
            situationCivile: {
              ...situationCivile,
              donations: [...situationCivile.donations, {
                id: crypto.randomUUID(),
                type: 'donation_simple',
                date: '',
                montant: 0,
                beneficiaire: '',
              }],
            },
          })}
        >
          + Ajouter une donation
        </button>
        {situationCivile.donations.map((donation, idx) => (
          <div key={donation.id} className="form-card">
            <div className="form-row">
              <label>Montant</label>
              <input
                type="number"
                value={donation.montant}
                onChange={(e) => {
                  const newDonations = [...situationCivile.donations];
                  newDonations[idx] = { ...donation, montant: parseFloat(e.target.value) || 0 };
                  updateDossier({ situationCivile: { ...situationCivile, donations: newDonations } });
                }}
              />
            </div>
            <div className="form-row">
              <label>Bénéficiaire</label>
              <input
                type="text"
                value={donation.beneficiaire}
                onChange={(e) => {
                  const newDonations = [...situationCivile.donations];
                  newDonations[idx] = { ...donation, beneficiaire: e.target.value };
                  updateDossier({ situationCivile: { ...situationCivile, donations: newDonations } });
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
