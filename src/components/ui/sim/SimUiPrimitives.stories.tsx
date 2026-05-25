import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimActionButton } from './SimActionButton';
import { SimDelta } from './SimDelta';
import { SimDisclosureButton } from './SimDisclosureButton';
import { SimEmptyState } from './SimEmptyState';
import { SimKpiReference } from './SimKpiReference';
import { SimMetric } from './SimMetric';
import { SimModalSectionNav } from './SimModalSectionNav';
import { SimSkeletonCard, SimSkeletonKpi, SimSkeletonText } from './SimSkeleton';
import { SimSparkline } from './SimSparkline';
import { SimStatusBadge } from './SimStatusBadge';
import { SimTooltip } from './SimTooltip';

const navSections = [
  { id: 'identite', label: 'Identité', controls: 'story-identite' },
  { id: 'revenus', label: 'Revenus', controls: 'story-revenus' },
  { id: 'sortie', label: 'Sortie', controls: 'story-sortie' },
];

function SimUiPrimitivesPreview() {
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('identite');

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 'calc(var(--space-8) * 14)' }}>
      <section className="premium-card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <h3 className="sim-card__title">Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <SimActionButton variant="add" mode="text" label="Ajouter" />
          <SimActionButton variant="edit" mode="icon" label="Modifier" ariaLabel="Modifier" />
          <SimActionButton
            variant="duplicate"
            mode="icon"
            label="Dupliquer"
            ariaLabel="Dupliquer"
          />
          <SimActionButton variant="delete" mode="icon" label="Supprimer" ariaLabel="Supprimer" />
        </div>
      </section>

      <section className="premium-card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <h3 className="sim-card__title">Disclosure</h3>
        <SimDisclosureButton
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          labelClosed="Afficher le détail"
          labelOpen="Masquer le détail"
          controls="story-detail"
        />
      </section>

      <section className="premium-card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <h3 className="sim-card__title">Métriques</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <SimMetric variant="hero" label="Capital cible" value="250 000" unit="€" />
          <SimMetric
            variant="secondary"
            label="Gain fiscal"
            value="4 800"
            unit="€"
            note={
              <span className="sim-kpi-note">
                <SimSparkline />
                <SimKpiReference kind="pfu" />
              </span>
            }
          />
        </div>
      </section>

      <section className="premium-card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <h3 className="sim-card__title">Statuts et écarts</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <SimStatusBadge variant="optimal">Optimal</SimStatusBadge>
          <SimStatusBadge variant="attention">À revoir</SimStatusBadge>
          <SimStatusBadge variant="info">Info</SimStatusBadge>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <SimDelta value={4.8} unit="%" />
          <SimDelta value={-1200} formatValue={(value) => `${value.toLocaleString('fr-FR')} €`} />
        </div>
      </section>

      <section className="premium-card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <h3 className="sim-card__title">Navigation modale</h3>
        <SimModalSectionNav
          sections={navSections}
          activeId={activeSection}
          ariaLabel="Rubriques de démonstration"
          onChange={setActiveSection}
        />
      </section>

      <section className="premium-card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <h3 className="sim-card__title">Squelettes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-4)' }}>
          <SimSkeletonCard />
          <SimSkeletonKpi />
        </div>
        <SimSkeletonText lines={3} />
      </section>

      <section className="premium-card" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <h3 className="sim-card__title">Glossaire</h3>
        <p className="sim-card__subtitle">
          Fiscalité dividendes <SimTooltip label="PFU" description="Définition courte du PFU." />.
        </p>
      </section>

      <SimEmptyState
        illustration="chart"
        title="Synthèse indisponible"
        description="Complétez les hypothèses pour afficher les indicateurs."
      />
    </div>
  );
}

const meta = {
  title: 'Composants/Sim/Primitives UI',
  component: SimUiPrimitivesPreview,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SimUiPrimitivesPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primitives: Story = {};
