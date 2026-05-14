import type { Meta, StoryObj } from '@storybook/react-vite';
import { PerHypotheses } from './PerHypotheses';
import '../../styles/index.css';

const meta = {
  title: 'Simulateurs/PER/Hypotheses',
  component: PerHypotheses,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PerHypotheses>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ParDefaut: Story = {};
