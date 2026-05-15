import React from 'react';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';

type RegionKey = 'metropole' | 'gmr' | 'guyane';
type ThresholdFieldKey =
  | 'rfrMaxExemption1Part'
  | 'rfrMaxReduced1Part'
  | 'rfrMaxMedian1Part'
  | 'incrementQuarterExemption'
  | 'incrementQuarterReduced'
  | 'incrementQuarterMedian';

interface RegionSection {
  key: RegionKey;
  label: string;
}

interface ThresholdField {
  key: ThresholdFieldKey;
  label: string;
}

interface ThresholdValues {
  [key: string]: number | null | undefined;
}

type ThresholdsByRegion = Partial<Record<RegionKey, ThresholdValues>>;

interface SeuilsYearPeriodProps {
  yearKey: string;
  yearLabel: string;
  thresholds?: ThresholdsByRegion;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
}

const REGION_SECTIONS: RegionSection[] = [
  { key: 'metropole', label: 'Résidence en métropole' },
  {
    key: 'gmr',
    label: 'Résidence en Martinique, Guadeloupe, Réunion, Saint-Barthélemy, Saint-Martin',
  },
  { key: 'guyane', label: 'Résidence en Guyane' },
];

const THRESHOLD_FIELDS: ThresholdField[] = [
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
}: SeuilsYearPeriodProps): React.ReactElement {
  return (
    <>
      <div className="income-tax-year-label">
        {yearLabel}
      </div>

      {REGION_SECTIONS.map((region) => (
        <div
          className="income-tax-block income-tax-block--mb12"
          key={`${yearKey}-${region.key}`}
        >
          <div className="income-tax-block-title">{region.label}</div>
          <div className="income-tax-block-body">
            {THRESHOLD_FIELDS.map((field) => (
              <SettingsFieldRow
                key={`${yearKey}-${region.key}-${field.key}`}
                label={field.label}
                path={['retirementThresholds', yearKey, region.key, field.key]}
                value={thresholds?.[region.key]?.[field.key] ?? null}
                onChange={updateField}
                unit="EUR"
                disabled={!isAdmin}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
