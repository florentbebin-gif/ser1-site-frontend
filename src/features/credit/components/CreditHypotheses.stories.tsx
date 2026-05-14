import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreditHypotheses } from './CreditHypotheses';
import '../styles/index.css';

const meta = {
  title: 'Simulateurs/Credit/Hypotheses',
  component: CreditHypotheses,
  parameters: {
    layout: 'centered',
  },
  args: {
    hypothesesOpen: true,
    onToggle: () => {},
  },
} satisfies Meta<typeof CreditHypotheses>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ouvert: Story = {};

export const Ferme: Story = {
  args: {
    hypothesesOpen: false,
  },
};
