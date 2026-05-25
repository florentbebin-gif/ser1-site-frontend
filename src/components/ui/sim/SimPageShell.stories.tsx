import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimPageShell } from './SimPageShell';

const meta = {
  title: 'Composants/Sim/SimPageShell',
  component: SimPageShell,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SimPageShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    title: 'Simulateur crédit',
    subtitle: 'Saisie dense avec colonne de synthèse',
    actions: (
      <button type="button" className="premium-button">
        Exporter
      </button>
    ),
    notice: <p>Hypothèses mises à jour pour la projection courante.</p>,
    children: (
      <>
        <SimPageShell.Main>
          <div className="premium-card">
            <h2>Hypothèses</h2>
            <p>Bloc principal de saisie du simulateur.</p>
          </div>
        </SimPageShell.Main>
        <SimPageShell.Side>
          <div className="premium-card">
            <h2>Synthèse</h2>
            <p>Mensualité estimée : 2 180 €.</p>
          </div>
        </SimPageShell.Side>
      </>
    ),
  },
};

export const Chargement: Story = {
  args: {
    title: 'Succession',
    subtitle: 'Chargement des hypothèses fiscales',
    loading: true,
  },
};

export const Erreur: Story = {
  args: {
    title: 'Simulateur placement',
    error: 'Impossible de recalculer la projection.',
  },
};
