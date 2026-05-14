import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModeToggleView } from './ModeToggle';

const meta = {
  title: 'Composants/ModeToggle',
  component: ModeToggleView,
  args: {
    isExpert: false,
    isLoading: false,
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ModeToggleView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Simplifie: Story = {};

export const Expert: Story = {
  args: {
    isExpert: true,
  },
};

export const Chargement: Story = {
  args: {
    isLoading: true,
  },
};
