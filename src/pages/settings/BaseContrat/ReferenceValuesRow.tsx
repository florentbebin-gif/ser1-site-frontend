import type { ReactElement } from 'react';

import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import type { MementoReferenceValue } from '@/domain/settings-memento/referenceValues';

interface ReferenceValuesRowProps {
  values: readonly MementoReferenceValue[];
  isAdmin: boolean;
  error: string | null;
  onNumericChange: (key: string, field: 'value_numeric' | 'year', value: string) => void;
  onTextChange: (key: string, field: 'value_text' | 'note', value: string) => void;
}

function valueToInput(value: number | null): string {
  return value === null ? '' : String(value);
}

function unitLabel(unit: MementoReferenceValue['unit']): string {
  if (unit === 'EUR') return '€';
  return unit ?? '';
}

function readableLabel(label: string): string {
  const [, suffix] = label.split(' — ');
  return suffix ?? label;
}

function formatNumber(value: number, unit: MementoReferenceValue['unit']): string {
  const fractionDigits = unit === '%' ? 2 : 0;
  return value.toLocaleString('fr-FR', {
    maximumFractionDigits: fractionDigits,
  });
}

function formatValue(value: MementoReferenceValue): string {
  if (value.value_text !== null && value.value_numeric === null) return value.value_text;
  if (value.value_numeric === null) return 'Valeur à compléter';

  const formatted = formatNumber(value.value_numeric, value.unit);
  const unit = unitLabel(value.unit);
  return unit ? `${formatted} ${unit}` : formatted;
}

function ReferenceValueItem({
  value,
  isAdmin,
  onNumericChange,
  onTextChange,
}: {
  value: MementoReferenceValue;
  isAdmin: boolean;
  onNumericChange: ReferenceValuesRowProps['onNumericChange'];
  onTextChange: ReferenceValuesRowProps['onTextChange'];
}): ReactElement {
  return (
    <article className="base-contrat-reference-values__item">
      <div className="base-contrat-reference-values__item-header">
        <span className="base-contrat-reference-values__label">{readableLabel(value.label)}</span>
        {!isAdmin ? (
          <span className="base-contrat-reference-values__year-label">Année {value.year}</span>
        ) : null}
      </div>

      {isAdmin ? (
        <div className="base-contrat-reference-values__fields">
          {value.value_text !== null && value.value_numeric === null ? (
            <label className="base-contrat-reference-values__field base-contrat-reference-values__field--text">
              <span>Valeur</span>
              <input
                aria-label={`${value.label} — valeur`}
                type="text"
                value={value.value_text}
                onChange={(event) => onTextChange(value.key, 'value_text', event.target.value)}
              />
            </label>
          ) : (
            <label className="base-contrat-reference-values__field">
              <span>Valeur</span>
              <span className="base-contrat-reference-values__input-wrap">
                <input
                  aria-label={`${value.label} — valeur`}
                  type="number"
                  step="any"
                  value={valueToInput(value.value_numeric)}
                  onChange={(event) =>
                    onNumericChange(value.key, 'value_numeric', event.target.value)
                  }
                />
                {value.unit ? <span>{unitLabel(value.unit)}</span> : null}
              </span>
            </label>
          )}
          <label className="base-contrat-reference-values__field base-contrat-reference-values__field--year">
            <span>Année</span>
            <input
              aria-label={`${value.label} — année`}
              type="number"
              value={value.year}
              onChange={(event) => onNumericChange(value.key, 'year', event.target.value)}
            />
          </label>
        </div>
      ) : (
        <div className="base-contrat-reference-values__read">
          <span className="base-contrat-reference-values__value">{formatValue(value)}</span>
        </div>
      )}

      {value.note ? <p className="base-contrat-reference-values__note">{value.note}</p> : null}
      <LegalRefInlineList
        ids={value.ref_ids}
        label="Références :"
        className="base-contrat-reference-values__refs"
      />
    </article>
  );
}

export default function ReferenceValuesRow({
  values,
  isAdmin,
  error,
  onNumericChange,
  onTextChange,
}: ReferenceValuesRowProps): ReactElement | null {
  if (values.length === 0) return null;

  return (
    <section className="base-contrat-reference-values" aria-label="Valeurs de référence">
      <div className="base-contrat-reference-values__header">
        <h4>Chiffres clés</h4>
        <p>Repères annuels applicables au produit.</p>
      </div>
      <div className="base-contrat-reference-values__list">
        {values.map((value) => (
          <ReferenceValueItem
            key={value.key}
            value={value}
            isAdmin={isAdmin}
            onNumericChange={onNumericChange}
            onTextChange={onTextChange}
          />
        ))}
      </div>
      {isAdmin && error ? (
        <div className="base-contrat-reference-values__actions">
          <span className="base-contrat-reference-values__error">{error}</span>
        </div>
      ) : null}
    </section>
  );
}
