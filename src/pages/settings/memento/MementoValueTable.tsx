import { useState, type ReactElement } from 'react';

import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import { groupMementoReferenceValuesBySubdomain } from '@/domain/settings-memento/referenceValues';
import { useMementoReferenceValues } from '@/hooks/settings/useMementoReferenceValues';

interface MementoValueTableProps {
  isAdmin: boolean;
}

function valueToInput(value: number | null): string {
  return value === null ? '' : String(value);
}

function unitLabel(unit: string | null): string {
  if (unit === 'EUR') return '€';
  return unit ?? '';
}

export default function MementoValueTable({ isAdmin }: MementoValueTableProps): ReactElement {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const { rows, loading, saving, error, handleNumericChange, save } =
    useMementoReferenceValues(isAdmin);
  const groups = groupMementoReferenceValuesBySubdomain(rows);

  async function handleSave(): Promise<void> {
    const result = await save();
    setSaveMessage(result.ok ? 'Valeurs mémento enregistrées.' : (result.error ?? null));
  }

  return (
    <section className="settings-memento-reference-values" aria-labelledby="memento-values-title">
      <div className="settings-memento-reference-values__header">
        <h4 id="memento-values-title">Valeurs de référence</h4>
        <p>Plafonds et taux utiles à la lecture des produits réglementés.</p>
      </div>

      {loading ? <p className="settings-memento-empty">Chargement des valeurs...</p> : null}
      {error ? <p className="settings-memento-reference-values__error">{error}</p> : null}

      {!loading && groups.length === 0 ? (
        <p className="settings-memento-empty">Aucune valeur de référence disponible.</p>
      ) : null}

      {groups.map((group) => (
        <section key={group.id} className="settings-memento-reference-values__group">
          <h5>{group.label}</h5>
          <div className="settings-memento-reference-values__table-wrap">
            <table className="settings-memento-reference-values__table">
              <thead>
                <tr>
                  <th scope="col">Repère</th>
                  <th scope="col">Valeur</th>
                  <th scope="col">Année</th>
                  <th scope="col">Références</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">
                      <span>{row.label}</span>
                      {row.note ? <small>{row.note}</small> : null}
                    </th>
                    <td>
                      <label className="settings-memento-reference-values__input">
                        <input
                          aria-label={`${row.label} — valeur`}
                          type="number"
                          step="any"
                          value={valueToInput(row.value_numeric)}
                          disabled={!isAdmin}
                          onChange={(event) =>
                            handleNumericChange(row.key, 'value_numeric', event.target.value)
                          }
                        />
                        {row.unit ? <span>{unitLabel(row.unit)}</span> : null}
                      </label>
                    </td>
                    <td>
                      <label className="settings-memento-reference-values__year">
                        <input
                          aria-label={`${row.label} — année`}
                          type="number"
                          value={row.year}
                          disabled={!isAdmin}
                          onChange={(event) =>
                            handleNumericChange(row.key, 'year', event.target.value)
                          }
                        />
                      </label>
                    </td>
                    <td>
                      <LegalRefInlineList ids={row.ref_ids} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {isAdmin ? (
        <div className="settings-memento-reference-values__actions">
          <button
            type="button"
            className="settings-btn settings-btn--primary"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les valeurs mémento'}
          </button>
          {saveMessage ? <span>{saveMessage}</span> : null}
        </div>
      ) : null}
    </section>
  );
}
