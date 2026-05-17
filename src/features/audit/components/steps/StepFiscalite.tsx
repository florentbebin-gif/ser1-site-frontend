import { DEFAULT_TAX_SETTINGS } from '../../../../constants/settingsDefaults';
import type { StepProps } from './types';

const TMI_OPTIONS = Array.from(
  new Set(DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent.map((row) => row.rate)),
).sort((a, b) => a - b);

export default function StepFiscalite({ dossier, updateDossier }: StepProps) {
  const { situationFiscale } = dossier;

  return (
    <div className="audit-step-form">
      <h2>Fiscalité</h2>

      <div className="audit-form-section">
        <h3>Impôt sur le revenu</h3>
        <div className="audit-form-row">
          <label htmlFor="audit-fiscalite-annee-reference">Année de référence</label>
          <input
            id="audit-fiscalite-annee-reference"
            type="number"
            value={situationFiscale.anneeReference}
            onChange={(e) =>
              updateDossier({
                situationFiscale: {
                  ...situationFiscale,
                  anneeReference: parseInt(e.target.value) || new Date().getFullYear() - 1,
                },
              })
            }
          />
        </div>
        <div className="audit-form-row">
          <label htmlFor="audit-fiscalite-rfr">Revenu fiscal de référence (€)</label>
          <input
            id="audit-fiscalite-rfr"
            type="number"
            value={situationFiscale.revenuFiscalReference}
            onChange={(e) =>
              updateDossier({
                situationFiscale: {
                  ...situationFiscale,
                  revenuFiscalReference: parseFloat(e.target.value) || 0,
                },
              })
            }
          />
        </div>
        <div className="audit-form-row">
          <label htmlFor="audit-fiscalite-nombre-parts">Nombre de parts</label>
          <input
            id="audit-fiscalite-nombre-parts"
            type="number"
            step="0.5"
            min="1"
            value={situationFiscale.nombreParts}
            onChange={(e) =>
              updateDossier({
                situationFiscale: {
                  ...situationFiscale,
                  nombreParts: parseFloat(e.target.value) || 1,
                },
              })
            }
          />
        </div>
        <div className="audit-form-row">
          <label htmlFor="audit-fiscalite-ir">Impôt sur le revenu (€)</label>
          <input
            id="audit-fiscalite-ir"
            type="number"
            value={situationFiscale.impotRevenu}
            onChange={(e) =>
              updateDossier({
                situationFiscale: {
                  ...situationFiscale,
                  impotRevenu: parseFloat(e.target.value) || 0,
                },
              })
            }
          />
        </div>
        <div className="audit-form-row">
          <label htmlFor="audit-fiscalite-tmi">TMI (%)</label>
          <select
            id="audit-fiscalite-tmi"
            value={situationFiscale.tmi}
            onChange={(e) =>
              updateDossier({
                situationFiscale: {
                  ...situationFiscale,
                  tmi: parseInt(e.target.value) || 0,
                },
              })
            }
          >
            {TMI_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {rate}%
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="audit-form-section">
        <h3>Autres impôts</h3>
        <div className="audit-form-row">
          <label htmlFor="audit-fiscalite-ifi">IFI (€)</label>
          <input
            id="audit-fiscalite-ifi"
            type="number"
            value={situationFiscale.ifi || 0}
            onChange={(e) =>
              updateDossier({
                situationFiscale: {
                  ...situationFiscale,
                  ifi: parseFloat(e.target.value) || 0,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
