import { useMemo } from 'react';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { AuditEuroField, AuditNumberField } from './AuditNumberFields';
import type { StepProps } from './types';

export default function StepFiscalite({ dossier, updateDossier }: StepProps) {
  const { situationFiscale } = dossier;
  const { fiscalContext } = useFiscalContext({ strict: false });
  const tmiOptions = useMemo(
    () =>
      Array.from(new Set(fiscalContext.irScaleCurrent.map((row) => row.rate))).sort(
        (a, b) => a - b,
      ),
    [fiscalContext.irScaleCurrent],
  );

  return (
    <div className="audit-step-form">
      <h2>Fiscalité</h2>

      <div className="audit-form-section">
        <h3>Impôt sur le revenu</h3>
        <AuditNumberField
          id="audit-fiscalite-annee-reference"
          label="Année de référence"
          value={situationFiscale.anneeReference}
          integer
          onChange={(anneeReference) =>
            updateDossier({
              situationFiscale: {
                ...situationFiscale,
                anneeReference: anneeReference || new Date().getFullYear() - 1,
              },
            })
          }
        />
        <AuditEuroField
          id="audit-fiscalite-rfr"
          label="Revenu fiscal de référence (€)"
          value={situationFiscale.revenuFiscalReference}
          onChange={(revenuFiscalReference) =>
            updateDossier({
              situationFiscale: {
                ...situationFiscale,
                revenuFiscalReference,
              },
            })
          }
        />
        <AuditNumberField
          id="audit-fiscalite-nombre-parts"
          label="Nombre de parts"
          value={situationFiscale.nombreParts}
          min={1}
          onChange={(nombreParts) =>
            updateDossier({
              situationFiscale: {
                ...situationFiscale,
                nombreParts: nombreParts || 1,
              },
            })
          }
        />
        <AuditEuroField
          id="audit-fiscalite-ir"
          label="Impôt sur le revenu (€)"
          value={situationFiscale.impotRevenu}
          onChange={(impotRevenu) =>
            updateDossier({
              situationFiscale: {
                ...situationFiscale,
                impotRevenu,
              },
            })
          }
        />
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
            {tmiOptions.map((rate) => (
              <option key={rate} value={rate}>
                {rate}%
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="audit-form-section">
        <h3>Autres impôts</h3>
        <AuditEuroField
          id="audit-fiscalite-ifi"
          label="IFI (€)"
          value={situationFiscale.ifi || 0}
          onChange={(ifi) =>
            updateDossier({
              situationFiscale: {
                ...situationFiscale,
                ifi,
              },
            })
          }
        />
      </div>
    </div>
  );
}
