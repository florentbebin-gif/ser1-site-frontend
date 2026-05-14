import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuccessionHypotheses } from './SuccessionHypotheses';
import '../styles/index.css';

const assumptions = [
  'Les droits sont estimés à partir du contexte familial déclaré.',
  'Les assurances hors succession sont restituées à titre indicatif.',
  'Les options civiles complexes restent à valider avec le conseil compétent.',
];

const meta = {
  title: 'Simulateurs/Succession/Hypotheses',
  component: SuccessionHypotheses,
  parameters: {
    layout: 'centered',
  },
  args: {
    hypothesesOpen: true,
    assumptions,
    onToggle: () => {},
  },
} satisfies Meta<typeof SuccessionHypotheses>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ouvert: Story = {};

export const Ferme: Story = {
  args: {
    hypothesesOpen: false,
  },
};
