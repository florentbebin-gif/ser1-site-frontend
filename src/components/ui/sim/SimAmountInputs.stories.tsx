import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimAmountInputEuro } from './SimAmountInputEuro';
import { SimAmountInputNumeric } from './SimAmountInputNumeric';
import { SimAmountInputPercent } from './SimAmountInputPercent';

function SimAmountInputsPreview() {
  const [montant, setMontant] = useState(250000);
  const [taux, setTaux] = useState(4.5);
  const [parts, setParts] = useState(2.5);

  return (
    <div className="premium-card settings-design-system__input-grid">
      <SimAmountInputEuro label="Montant euro" value={montant} onChange={setMontant} min={0} />
      <SimAmountInputPercent
        label="Taux décimal"
        value={taux}
        onChange={setTaux}
        min={0}
        max={20}
      />
      <SimAmountInputNumeric
        label="Nombre libre"
        unit="parts"
        value={parts}
        onChange={setParts}
        min={0}
      />
    </div>
  );
}

const meta = {
  title: 'Composants/Sim/Amount inputs',
  component: SimAmountInputsPreview,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SimAmountInputsPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primitives: Story = {};
