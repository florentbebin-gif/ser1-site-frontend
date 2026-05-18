import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PlafondMadelinDetail } from '../../../../engine/per';
import { PerMadelinInfoModal } from './PerMadelinInfoModal';
import '../../styles/index.css';

const DETAIL_MADELIN_ACTIF: PlafondMadelinDetail = {
  assietteVersement: 82000,
  assietteReport: 76000,
  enveloppe15Versement: 9300,
  enveloppe15Report: 8400,
  enveloppe10: 8200,
  cotisationsVersees: 10400,
  utilisation15Versement: {
    madelinRetraite: 4200,
    per154bis: 2300,
    total: 6500,
  },
  depassement15Versement: {
    madelinRetraite: 0,
    per154bis: 0,
    total: 0,
  },
  utilisation15Report: {
    madelinRetraite: 1800,
    per154bis: 900,
    total: 2700,
  },
  depassement15Report: {
    madelinRetraite: 0,
    per154bis: 0,
    total: 0,
  },
  consommation10: {
    art83: 1200,
    perco: 800,
    madelinRetraite: 2800,
    per154bis: 1800,
    total: 6600,
  },
  reste15Versement: 2800,
  reste15Report: 5700,
  reste10: 1600,
  disponibleRestant: 10100,
  surplusAReintegrer: 0,
  depassement: false,
};

const DETAIL_MADELIN_DEPASSEMENT: PlafondMadelinDetail = {
  ...DETAIL_MADELIN_ACTIF,
  assietteVersement: 54000,
  assietteReport: 48000,
  enveloppe15Versement: 5100,
  enveloppe15Report: 4200,
  enveloppe10: 5400,
  cotisationsVersees: 18000,
  utilisation15Versement: {
    madelinRetraite: 5100,
    per154bis: 0,
    total: 5100,
  },
  depassement15Versement: {
    madelinRetraite: 3400,
    per154bis: 0,
    total: 3400,
  },
  utilisation15Report: {
    madelinRetraite: 4200,
    per154bis: 0,
    total: 4200,
  },
  depassement15Report: {
    madelinRetraite: 2100,
    per154bis: 0,
    total: 2100,
  },
  consommation10: {
    art83: 1800,
    perco: 900,
    madelinRetraite: 2700,
    per154bis: 0,
    total: 5400,
  },
  reste15Versement: 0,
  reste15Report: 0,
  reste10: 0,
  disponibleRestant: 0,
  surplusAReintegrer: 5500,
  depassement: true,
};

const DETAIL_MADELIN_VIDE: PlafondMadelinDetail = {
  assietteVersement: 0,
  assietteReport: 0,
  enveloppe15Versement: 0,
  enveloppe15Report: 0,
  enveloppe10: 0,
  cotisationsVersees: 0,
  utilisation15Versement: {
    madelinRetraite: 0,
    per154bis: 0,
    total: 0,
  },
  depassement15Versement: {
    madelinRetraite: 0,
    per154bis: 0,
    total: 0,
  },
  utilisation15Report: {
    madelinRetraite: 0,
    per154bis: 0,
    total: 0,
  },
  depassement15Report: {
    madelinRetraite: 0,
    per154bis: 0,
    total: 0,
  },
  consommation10: {
    art83: 0,
    perco: 0,
    madelinRetraite: 0,
    per154bis: 0,
    total: 0,
  },
  reste15Versement: 0,
  reste15Report: 0,
  reste10: 0,
  disponibleRestant: 0,
  surplusAReintegrer: 0,
  depassement: false,
};

const meta = {
  title: 'Simulateurs/PER/Potentiel/Modale Madelin',
  component: PerMadelinInfoModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    declarant1: DETAIL_MADELIN_ACTIF,
    declarant2: DETAIL_MADELIN_DEPASSEMENT,
    isCouple: true,
    onClose: () => {},
  },
} satisfies Meta<typeof PerMadelinInfoModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const CasLimite: Story = {
  args: {
    declarant1: DETAIL_MADELIN_VIDE,
    declarant2: undefined,
    isCouple: false,
  },
};
