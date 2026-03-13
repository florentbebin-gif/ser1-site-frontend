import React from 'react';
import { numberOrEmpty } from '@/utils/settingsHelpers';

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
  updateField: (path: string[], value: number | null) => void;
  isAdmin: boolean;
}

const REGION_SECTIONS: RegionSection[] = [
  { key: 'metropole', label: 'Residence en metropole' },
  {
    key: 'gmr',
    label: 'Residence en Martinique, Guadeloupe, Reunion, Saint-Barthelemy, Saint-Martin',
  },
  { key: 'guyane', label: 'Residence en Guyane' },
];

const THRESHOLD_FIELDS: ThresholdField[] = [
  { key: 'rfrMaxExemption1Part', label: 'Plafond exoneration (1 part)' },
  { key: 'rfrMaxReduced1Part', label: 'Plafond taux reduit (1 part)' },
  { key: 'rfrMaxMedian1Part', label: 'Plafond taux median (1 part)' },
  { key: 'incrementQuarterExemption', label: 'Majoration par quart - exoneration' },
  { key: 'incrementQuarterReduced', label: 'Majoration par quart - taux reduit' },
  { key: 'incrementQuarterMedian', label: 'Majoration par quart - taux median' },
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  updateField(
                    ['retirementThresholds', yearKey, region.key, field.key],
                    e.target.value === '' ? null : Number(e.target.value),
                  );
                }}
                disabled={!isAdmin}
              />
              <span>EUR</span>
            </div>
          ))}
        </React.Fragment>
      ))}
    </>
  );
}
