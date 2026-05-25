import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimActionButton } from './SimActionButton';
import { SimDisclosureButton } from './SimDisclosureButton';
import { SimMetric } from './SimMetric';
import { SimModalSectionNav } from './SimModalSectionNav';
import { SimSkeletonCard, SimSkeletonKpi, SimSkeletonText } from './SimSkeleton';

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
            note="Simulation courante"
          />
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
