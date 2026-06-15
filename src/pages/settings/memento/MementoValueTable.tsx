import { useId, type ReactElement } from 'react';

import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import {
  groupMementoReferenceValuesBySubdomain,
  type MementoReferenceValue,
  type MementoReferenceValueDomain,
} from '@/domain/settings-memento/referenceValues';
import { useMementoReferenceValues } from '@/hooks/settings/useMementoReferenceValues';

interface MementoValueTableProps {
  isAdmin: boolean;
  domain: MementoReferenceValueDomain;
  title: string;
  description: string;
}

function valueToInput(value: number | null): string {
  return value === null ? '' : String(value);
}

function unitLabel(unit: string | null): string {
  if (unit === 'EUR') return '€';
  return unit ?? '';
}

function formatReferenceValue(row: MementoReferenceValue): string {
  if (row.value_text !== null && row.value_numeric === null) return row.value_text;

  const formattedValue =
    row.value_numeric === null
      ? ''
      : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(row.value_numeric);
  const unit = unitLabel(row.unit);
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

function valueCell(
  row: MementoReferenceValue,
  isAdmin: boolean,
  handleNumericChange: (key: string, field: 'value_numeric' | 'year', value: string) => void,
  handleTextChange: (key: string, field: 'value_text' | 'note', value: string) => void,
): ReactElement {
  if (!isAdmin) {
    return (
      <span className="settings-memento-reference-values__readonly">
        {formatReferenceValue(row)}
      </span>
    );
  }

  if (row.value_text !== null && row.value_numeric === null) {
    return (
      <label className="settings-memento-reference-values__input">
        <input
          aria-label={`${row.label} — valeur`}
          type="text"
          value={row.value_text}
          disabled={!isAdmin}
          onChange={(event) => handleTextChange(row.key, 'value_text', event.target.value)}
        />
      </label>
    );
  }

  return (
    <label className="settings-memento-reference-values__input">
      <input
        aria-label={`${row.label} — valeur`}
        type="number"
        step="any"
        value={valueToInput(row.value_numeric)}
        disabled={!isAdmin}
        onChange={(event) => handleNumericChange(row.key, 'value_numeric', event.target.value)}
      />
      {row.unit ? <span>{unitLabel(row.unit)}</span> : null}
    </label>
  );
}

export default function MementoValueTable({
  isAdmin,
  domain,
  title,
  description,
}: MementoValueTableProps): ReactElement {
  const titleId = useId();
  const { rows, loading, error, handleNumericChange, handleTextChange } = useMementoReferenceValues(
    isAdmin,
    {
      domain,
      saveTargetId: `memento-reference-values-${domain}`,
      saveTargetLabel: title,
    },
  );
  const groups = groupMementoReferenceValuesBySubdomain(rows);

  return (
    <section className="settings-memento-reference-values" aria-labelledby={titleId}>
      <div className="settings-memento-reference-values__header">
        <h4 id={titleId}>{title}</h4>
        <p>{description}</p>
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
                    <td>{valueCell(row, isAdmin, handleNumericChange, handleTextChange)}</td>
                    <td>
                      {isAdmin ? (
                        <label className="settings-memento-reference-values__year">
                          <input
                            aria-label={`${row.label} — année`}
                            type="number"
                            value={row.year}
                            onChange={(event) =>
                              handleNumericChange(row.key, 'year', event.target.value)
                            }
                          />
                        </label>
                      ) : (
                        <span className="settings-memento-reference-values__readonly">
                          {row.year}
                        </span>
                      )}
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
    </section>
  );
}
