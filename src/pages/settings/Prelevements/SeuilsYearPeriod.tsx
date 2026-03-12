// @ts-nocheck
import React from 'react';
import { numberOrEmpty } from '@/utils/settingsHelpers';

const REGION_SECTIONS = [
  { key: 'metropole', label: 'Résidence en métropole' },
  {
    key: 'gmr',
    label: 'Résidence en Martinique, Guadeloupe, Réunion, Saint-Barthélemy, Saint-Martin',
  },
  { key: 'guyane', label: 'Résidence en Guyane' },
];

const THRESHOLD_FIELDS = [
  { key: 'rfrMaxExemption1Part', label: 'Plafond exonération (1 part)' },
  { key: 'rfrMaxReduced1Part', label: 'Plafond taux réduit (1 part)' },
  { key: 'rfrMaxMedian1Part', label: 'Plafond taux médian (1 part)' },
  { key: 'incrementQuarterExemption', label: 'Majoration par quart – exonération' },
  { key: 'incrementQuarterReduced', label: 'Majoration par quart – taux réduit' },
  { key: 'incrementQuarterMedian', label: 'Majoration par quart – taux médian' },
];

export default function SeuilsYearPeriod({
  yearKey,
  yearLabel,
  thresholds,
  updateField,
  isAdmin,
}) {
  return (
    <>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {yearLabel}
      </div>

      {REGION_SECTIONS.map((region, regionIndex) => (
        <React.Fragment key={`${yearKey}-${region.key}`}>
          <div style={{ fontWeight: 500, marginTop: regionIndex === 0 ? 8 : 16, marginBottom: 4 }}>
            {region.label}
          </div>

          {THRESHOLD_FIELDS.map((field) => (
            <div className="settings-field-row" key={`${yearKey}-${region.key}-${field.key}`}>
              <label>{field.label}</label>
              <input
                type="number"
                value={numberOrEmpty(thresholds?.[region.key]?.[field.key])}
                onChange={(e) =>
                  updateField(
                    ['retirementThresholds', yearKey, region.key, field.key],
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                disabled={!isAdmin}
              />
              <span>€</span>
            </div>
          ))}
        </React.Fragment>
      ))}
    </>
  );
}

