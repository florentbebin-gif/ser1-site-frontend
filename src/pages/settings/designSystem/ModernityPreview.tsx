import {
  SimActionButton,
  SimEmptyState,
  SimMetric,
  SimSkeletonCard,
  SimSkeletonKpi,
  SimSkeletonText,
} from '@/components/ui/sim';

export function DesignSystemModernityPreview() {
  return (
    <div className="settings-design-system__modernity-grid">
      <article className="settings-design-system__ui-card">
        <h3>Squelette page</h3>
        <SimSkeletonCard />
      </article>
      <article className="settings-design-system__ui-card">
        <h3>Squelette KPI</h3>
        <SimSkeletonKpi />
      </article>
      <article className="settings-design-system__ui-card">
        <h3>Texte en attente</h3>
        <SimSkeletonText lines={3} />
      </article>
      <article className="settings-design-system__ui-card">
        <h3>Transition vide rempli</h3>
        <div className="sim-sidebar-reveal">
          <SimMetric variant="secondary" label="Synthèse révélée" value="Prête" />
        </div>
      </article>
      <article className="settings-design-system__ui-card">
        <h3>État vide</h3>
        <SimEmptyState
          variant="sidebar"
          illustration="chart"
          title="Synthèse en attente"
          description="Complétez les hypothèses pour afficher les indicateurs."
          cta={<SimActionButton variant="add" mode="text" label="Compléter" />}
        />
      </article>
    </div>
  );
}
