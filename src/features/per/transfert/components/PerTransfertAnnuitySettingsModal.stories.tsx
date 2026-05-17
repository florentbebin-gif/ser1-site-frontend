import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PerTransfertFormState } from '../hooks/usePerTransfertSimulator';
import { PerTransfertAnnuitySettingsModal } from './PerTransfertAnnuitySettingsModal';
import '../styles/index.css';

const BASE_STATE: PerTransfertFormState = {
  typeContrat: 'MADELIN',
  compagnie: 'Assureur exemple',
  contractId: 'storybook-per-transfert',
  capitalAcquis: 180000,
  interetsAcquis: 42000,
  renteActuelleAnnuelleBrute: 7800,
  subscriptionDate: '2014-06-15',
  annualCurrentPayment: 2400,
  sex: 'M',
  birthYear: 1960,
  currentAge: 60,
  liquidationAge: 64,
  tmiRetraite: 30,
  transferFeeRate: 1,
  newPerEntryFeeRate: 0.5,
  newPerAnnualPayment: 3600,
  performanceUntilRetirementRate: 2.5,
  currentContractPerformanceUntilRetirementRate: 1.6,
  currentRentRevaluationRate: 1,
  newRentRevaluationRate: 1.4,
  capitalExitRevaluationRate: 1,
  capitalShareRate: 30,
  horizonAgeShort: 80,
  horizonAgeLong: 90,
  mortalityTable: 'TGH05',
  currentRentMode: 'statement',
  currentTechnicalRate: 0,
  currentConversionFeeRate: 0,
  currentArrearsFeeRate: 1.2,
  currentGuaranteedYears: 0,
  currentReversionEnabled: false,
  currentReversionRate: 0,
  currentReversionSpouseBirthYear: 1962,
  technicalRate: 0,
  conversionFeeRate: 0.5,
  arrearsFeeRate: 1,
  guaranteedYears: 0,
  reversionEnabled: false,
  reversionRate: 0,
  spouseBirthYear: 1962,
  spouseAgeAtLiquidation: 62,
  prefonPoints: 0,
  prefonPockets: [],
};

const CAS_LIMITE_STATE: PerTransfertFormState = {
  ...BASE_STATE,
  mortalityTable: 'TPRV93',
  technicalRate: 1.5,
  conversionFeeRate: 3,
  arrearsFeeRate: 2.5,
  newRentRevaluationRate: 0,
  guaranteedYears: 10,
  reversionEnabled: true,
  reversionRate: 100,
  spouseBirthYear: 1938,
  spouseAgeAtLiquidation: 86,
};

const meta = {
  title: 'Simulateurs/PER/Transfert/Modale rente',
  component: PerTransfertAnnuitySettingsModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    state: BASE_STATE,
    update: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof PerTransfertAnnuitySettingsModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const CasLimite: Story = {
  args: {
    state: CAS_LIMITE_STATE,
  },
};
