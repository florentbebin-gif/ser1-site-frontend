import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlacementHypotheses } from './PlacementHypotheses';
import '../styles/index.css';

const meta = {
  title: 'Simulateurs/Placement/Hypotheses',
  component: PlacementHypotheses,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PlacementHypotheses>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ParDefaut: Story = {};
