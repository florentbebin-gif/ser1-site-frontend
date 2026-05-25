import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimFieldShell } from './SimFieldShell';
import { SimSelect, type SimSelectOption } from './SimSelect';

const options: SimSelectOption[] = [
  { value: 'simplifie', label: 'Simplifié', description: 'Affichage rendez-vous' },
  { value: 'expert', label: 'Expert', description: 'Hypothèses avancées' },
  { value: 'verrouille', label: 'Verrouillé', disabled: true },
];

function SimPrimitivesPreview() {
  const [mode, setMode] = useState('simplifie');

  return (
    <div className="premium-card" style={{ width: 'calc(var(--space-8) * 7 + var(--space-6))' }}>
      <SimFieldShell
        label="Mode local"
        hint="Override non persistant pour le simulateur courant."
        controlId="storybook-sim-mode"
      >
        <SimSelect
          value={mode}
          onChange={setMode}
          options={options}
          placeholder="Choisir un mode"
          ariaLabel="Mode local"
          testId="storybook-sim-mode"
        />
      </SimFieldShell>

      <SimFieldShell label="Taux annuel" error="Le taux doit rester positif.">
        <input className="sim-field__control" value="-1,25" readOnly />
        <span className="sim-field__unit">%</span>
      </SimFieldShell>
    </div>
  );
}

const meta = {
  title: 'Composants/Sim/Primitives',
  component: SimPrimitivesPreview,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SimPrimitivesPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ChampsEtSelect: Story = {};
