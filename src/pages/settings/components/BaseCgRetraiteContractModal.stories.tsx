import type { Meta, StoryObj } from '@storybook/react-vite';
import { BASECG_CATALOG, type BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import { BaseCgRetraiteContractModal } from './BaseCgRetraiteContractModal';
import '../styles/base-cg-retraite.css';
import '../styles/premium.css';
import '../styles/modals.css';

function getReferenceContract(): BaseCgRetraiteContract {
  const contract =
    BASECG_CATALOG.find((item) => item.id === 'prefon-perin-per-prefon-retraite-42') ??
    BASECG_CATALOG[0];

  if (!contract) {
    throw new Error('Catalogue Base CG retraite vide.');
  }

  return {
    ...contract,
    documents: [
      {
        id: 'storybook-conditions-generales',
        label: 'Conditions Générales',
        type: 'conditions_generales',
        sourceUrl: 'https://example.invalid/base-cg-retraite.pdf',
        versionLabel: '2025',
        storagePath: '',
        fileName: 'conditions-generales.pdf',
        mime: 'application/pdf',
        bytes: 512000,
        status: 'linked',
      },
    ],
  };
}

function getIncompleteContract(): BaseCgRetraiteContract {
  const contract = getReferenceContract();
  return {
    ...contract,
    id: 'storybook-contrat-incomplet',
    sourceId: 'Ajout local',
    compagnie: '',
    nomContrat: 'Contrat retraite à compléter',
    phaseEpargne: {
      ...contract.phaseEpargne,
      rendementFondsEuro: null,
      fraisVersements: null,
      fraisGestion: null,
      fraisArbitrage: null,
      garantiesComplementaires: null,
    },
    phaseLiquidation: {
      ...contract.phaseLiquidation,
      sortieCapitalRetraite: null,
      tableConversionRente: null,
      fraisArrerages: null,
      reversionPossible: null,
    },
    documents: [],
  };
}

const referenceContract = getReferenceContract();

const meta = {
  title: 'Settings/Base CG Retraite/Modale contrat',
  component: BaseCgRetraiteContractModal,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    contract: referenceContract,
    onClose: () => {},
    onSave: (_contract) => {},
  },
} satisfies Meta<typeof BaseCgRetraiteContractModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Identite: Story = {};

export const Epargne: Story = {
  args: {
    initialTab: 'epargne',
  },
};

export const Liquidation: Story = {
  args: {
    initialTab: 'liquidation',
  },
};

export const Documents: Story = {
  args: {
    initialTab: 'documents',
  },
};

export const ContratIncomplet: Story = {
  args: {
    contract: getIncompleteContract(),
  },
};
