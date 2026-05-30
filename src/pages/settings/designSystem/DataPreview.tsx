import {
  SimCollapsibleTable,
  SimDelta,
  SimKpiReference,
  SimMetric,
  SimSparkline,
  SimStatusBadge,
} from '@/components/ui/sim';
import { snippets, tableRows } from '../designSystemCatalog';
import { SettingsDesignSystemCodeSnippet } from '../SettingsDesignSystemCodeSnippet';

export function DesignSystemDataPreview() {
  return (
    <div className="settings-design-system__stack">
      <div className="settings-design-system__ui-grid">
        <article className="settings-design-system__ui-card">
          <h3>Métriques</h3>
          <SimMetric
            variant="hero"
            label="Impôt estimé"
            value="12 400"
            unit="€"
            note={
              <span className="sim-kpi-note">
                <SimSparkline />
                <SimKpiReference kind="ir" />
              </span>
            }
          />
          <SimMetric
            variant="secondary"
            label="Avancement"
            value="42"
            unit="%"
            delta={<SimDelta value={2} unit="pts" precision={0} />}
          />
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Statuts</h3>
          <div className="settings-design-system__action-row">
            <SimStatusBadge variant="optimal">Optimal</SimStatusBadge>
            <SimStatusBadge variant="attention">À revoir</SimStatusBadge>
            <SimStatusBadge variant="critique">Critique</SimStatusBadge>
            <SimStatusBadge variant="info">Info</SimStatusBadge>
          </div>
          <div className="settings-design-system__action-row">
            <SimDelta value={4.8} unit="%" />
            <SimDelta value={-1200} formatValue={(value) => `${value.toLocaleString('fr-FR')} €`} />
          </div>
        </article>

        <article className="settings-design-system__ui-card">
          <h3>Table repliable</h3>
          <SimCollapsibleTable
            title="Projection repliable"
            rows={tableRows}
            columns={['Année', 'Versement', 'Impact']}
            defaultOpen
            tableAriaLabel="Projection repliable design system"
            renderRow={(row) => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td>{row.versement}</td>
                <td>{row.impact}</td>
              </tr>
            )}
          />
        </article>
      </div>
      <SettingsDesignSystemCodeSnippet label="Extrait données">
        {snippets.data}
      </SettingsDesignSystemCodeSnippet>
    </div>
  );
}
