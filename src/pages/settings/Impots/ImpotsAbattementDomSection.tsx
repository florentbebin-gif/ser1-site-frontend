import React from 'react';
import SettingsTable from '@/components/settings/SettingsTable';

type DomPeriodKey = 'current' | 'previous';
type CellValue = string | number | null;
type DomZoneKey = 'gmr' | 'guyane';

interface DomZone {
  _key: DomZoneKey;
  zone: string;
  zoneKey: DomZoneKey;
}

interface DomZoneValues {
  ratePercent: number | null;
  cap: number | null;
}

interface IncomeTaxDomAbatement {
  current?: Partial<Record<DomZoneKey, DomZoneValues>>;
  previous?: Partial<Record<DomZoneKey, DomZoneValues>>;
}

interface IncomeTaxSettings {
  currentYearLabel?: string;
  previousYearLabel?: string;
  domAbatement?: IncomeTaxDomAbatement;
}

interface ImpotsAbattementDomSectionProps {
  incomeTax: IncomeTaxSettings;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ImpotsAbattementDomSection({
  incomeTax,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: ImpotsAbattementDomSectionProps): React.ReactElement {
  const isOpen = openSection === 'dom';
  const domZones: DomZone[] = [
    { _key: 'gmr', zone: 'Guadeloupe / Martinique / Réunion', zoneKey: 'gmr' },
    { _key: 'guyane', zone: 'Guyane / Mayotte', zoneKey: 'guyane' },
  ];

  const domCols = [
    { key: 'zone', header: 'Zone', type: 'display' as const },
    { key: 'ratePercent', header: 'Taux %', className: 'taux-col' },
    { key: 'cap', header: 'Plafond EUR' },
  ];

  const periods: DomPeriodKey[] = ['current', 'previous'];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-dom"
        aria-expanded={isOpen}
        aria-controls="impots-panel-dom"
        onClick={() => setOpenSection(isOpen ? null : 'dom')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Abattement DOM sur l’IR (barème)
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="impots-panel-dom"
          role="region"
          aria-labelledby="impots-header-dom"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 8 }}>
            Appliqué sur l’impôt issu du barème <strong>après plafonnement du quotient familial</strong> et
            <strong> avant</strong> décote + réductions/crédits.
          </p>

          <div className="income-tax-columns">
            {periods.map((period) => (
              <div className="income-tax-col" key={period}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  {period === 'current'
                    ? incomeTax.currentYearLabel || 'Année N'
                    : incomeTax.previousYearLabel || 'Année N-1'}
                </div>
                <SettingsTable
                  columns={domCols}
                  rows={domZones.map((zone) => ({
                    _key: zone._key,
                    zone: zone.zone,
                    ratePercent: incomeTax.domAbatement?.[period]?.[zone.zoneKey]?.ratePercent,
                    cap: incomeTax.domAbatement?.[period]?.[zone.zoneKey]?.cap,
                  }))}
                  onCellChange={(index, key, value: CellValue) => {
                    updateField(
                      ['incomeTax', 'domAbatement', period, domZones[index].zoneKey, key],
                      value === null ? '' : value,
                    );
                  }}
                  disabled={!isAdmin}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
