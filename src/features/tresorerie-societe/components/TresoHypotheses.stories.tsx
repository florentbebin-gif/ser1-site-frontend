import type { Meta, StoryObj } from '@storybook/react-vite';
import { TresoHypotheses } from './TresoHypotheses';
import '../styles/index.css';

const meta = {
  title: 'Simulateurs/TresorerieSociete/Hypotheses',
  component: TresoHypotheses,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TresoHypotheses>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ParDefaut: Story = {};
