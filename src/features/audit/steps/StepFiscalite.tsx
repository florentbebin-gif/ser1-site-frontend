import type { StepProps } from './types';

export default function StepFiscalite({ dossier, updateDossier }: StepProps) {
  const { situationFiscale } = dossier;

  return (
    <div className="step-form">
      <h2>Fiscalité</h2>

      <div className="form-section">
        <h3>Impôt sur le revenu</h3>
        <div className="form-row">
          <label>Année de référence</label>
          <input
            type="number"
            value={situationFiscale.anneeReference}
            onChange={(e) => updateDossier({
              situationFiscale: {
                ...situationFiscale,
                anneeReference: parseInt(e.target.value) || new Date().getFullYear() - 1,
              },
            })}
          />
        </div>
        <div className="form-row">
          <label>Revenu fiscal de référence (€)</label>
          <input
            type="number"
            value={situationFiscale.revenuFiscalReference}
            onChange={(e) => updateDossier({
              situationFiscale: {
                ...situationFiscale,
                revenuFiscalReference: parseFloat(e.target.value) || 0,
              },
            })}
          />
        </div>
        <div className="form-row">
          <label>Nombre de parts</label>
          <input
            type="number"
            step="0.5"
            min="1"
            value={situationFiscale.nombreParts}
            onChange={(e) => updateDossier({
              situationFiscale: {
                ...situationFiscale,
                nombreParts: parseFloat(e.target.value) || 1,
              },
            })}
          />
        </div>
        <div className="form-row">
          <label>Impôt sur le revenu (€)</label>
          <input
            type="number"
            value={situationFiscale.impotRevenu}
            onChange={(e) => updateDossier({
              situationFiscale: {
                ...situationFiscale,
                impotRevenu: parseFloat(e.target.value) || 0,
              },
            })}
          />
        </div>
        <div className="form-row">
          <label>TMI (%)</label>
          <select
            value={situationFiscale.tmi}
            onChange={(e) => updateDossier({
              situationFiscale: {
                ...situationFiscale,
                tmi: parseInt(e.target.value) || 0,
              },
            })}
          >
            <option value="0">0%</option>
            <option value="11">11%</option>
            <option value="30">30%</option>
            <option value="41">41%</option>
            <option value="45">45%</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3>Autres impôts</h3>
        <div className="form-row">
          <label>IFI (€)</label>
          <input
            type="number"
            value={situationFiscale.ifi || 0}
            onChange={(e) => updateDossier({
              situationFiscale: {
                ...situationFiscale,
                ifi: parseFloat(e.target.value) || 0,
              },
            })}
          />
        </div>
      </div>
    </div>
  );
}
