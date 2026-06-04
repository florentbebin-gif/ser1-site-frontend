import type { StepProps } from './types';
import { SimTemporalField } from '@/components/ui/sim';
import { AuditEuroField } from './AuditNumberFields';

export default function StepPassif({ dossier, updateDossier }: StepProps) {
  const { passif } = dossier;
  const totalPassif = passif.emprunts.reduce((sum, emprunt) => sum + emprunt.capitalRestantDu, 0);

  return (
    <div className="audit-step-form">
      <h2>Passif</h2>
      <div className="audit-summary-bar">
        Total emprunts CRD : <strong>{totalPassif.toLocaleString('fr-FR')} €</strong>
      </div>

      <button
        type="button"
        className="premium-btn"
        onClick={() =>
          updateDossier({
            passif: {
              ...passif,
              emprunts: [
                ...passif.emprunts,
                {
                  id: crypto.randomUUID(),
                  libelle: '',
                  type: 'immobilier',
                  capitalInitial: 0,
                  capitalRestantDu: 0,
                  mensualite: 0,
                  tauxInteret: 0,
                  dateDebut: '',
                  dateFin: '',
                },
              ],
            },
          })
        }
      >
        + Ajouter un emprunt
      </button>

      {passif.emprunts.map((emprunt, idx) => (
        <div key={emprunt.id} className="audit-form-card">
          <div className="audit-form-row">
            <label htmlFor={`audit-emprunt-libelle-${emprunt.id}`}>Libellé</label>
            <input
              id={`audit-emprunt-libelle-${emprunt.id}`}
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
          <AuditEuroField
            id={`audit-emprunt-crd-${emprunt.id}`}
            label="Capital restant dû (€)"
            value={emprunt.capitalRestantDu}
            onChange={(value) => {
              const newEmprunts = [...passif.emprunts];
              newEmprunts[idx] = { ...emprunt, capitalRestantDu: value };
              updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
            }}
          />
          <AuditEuroField
            id={`audit-emprunt-mensualite-${emprunt.id}`}
            label="Mensualité (€)"
            value={emprunt.mensualite}
            onChange={(value) => {
              const newEmprunts = [...passif.emprunts];
              newEmprunts[idx] = { ...emprunt, mensualite: value };
              updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
            }}
          />
          <div className="audit-form-row">
            <label htmlFor={`audit-emprunt-date-fin-${emprunt.id}`}>Date de fin</label>
            <SimTemporalField
              id={`audit-emprunt-date-fin-${emprunt.id}`}
              value={emprunt.dateFin}
              onChange={(value) => {
                const newEmprunts = [...passif.emprunts];
                newEmprunts[idx] = { ...emprunt, dateFin: value };
                updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
              }}
            />
          </div>
          <button
            type="button"
            className="chip audit-chip-small audit-chip-danger"
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
