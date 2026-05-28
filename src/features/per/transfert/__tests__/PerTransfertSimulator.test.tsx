// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import { PerTransfertSimulator } from '../PerTransfertSimulator';
import { PerTransfertWizardSteps } from '../components/PerTransfertWizardSteps';
import { ContractAuditCards } from '../components/ContractAuditCards';
import { PerTransfertHypotheses } from '../components/PerTransfertHypotheses';
import { PerTransfertFraisInfoModal } from '../components/PerTransfertFraisInfoModal';
import { PerTransfertInfoModal } from '../components/PerTransfertInfoModal';
import { PerTransfertPrefonPocketsForm } from '../components/PerTransfertPrefonPocketsForm';
import { RentRevaluationInfoModal } from '../components/RentRevaluationInfoModal';
import { TransferRulesInfoModal } from '../components/TransferRulesInfoModal';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';

const getBaseCgRetraiteCatalogMock = vi.hoisted(() => vi.fn());
const setUserModeMock = vi.hoisted(() => vi.fn());

vi.mock('@/utils/cache/baseCgRetraiteRepository', () => ({
  getBaseCgRetraiteCatalog: () => getBaseCgRetraiteCatalogMock(),
}));

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    loading: false,
    error: null,
    fiscalContext: {
      irScaleCurrent: [{ rate: 0 }],
      rvtoTaxableFractionByAge: [{ label: 'test', ageMaxInclusive: null, fraction: 0 }],
      pfuRateIR: 0,
      psRateGeneral: 0,
      psRateRenteInterests: 0,
      psRateRenteCapitalCASA: 0,
      abat10Rate: 0,
      psRateRetirementDefault: 0,
      smallAnnuityMonthlyCapitalExitThreshold: 1,
      smallAnnuityAnnualCapitalExitThreshold: 1,
      smallAnnuityCapitalExitFlatTaxRate: 0,
      smallAnnuityCapitalExitFlatTaxAbatementRate: 0,
    },
  }),
}));

vi.mock('@/settings/userMode', () => ({
  useUserMode: () => ({ mode: 'simplifie', setMode: setUserModeMock, isLoading: false }),
}));

beforeEach(() => {
  getBaseCgRetraiteCatalogMock.mockReset();
  getBaseCgRetraiteCatalogMock.mockResolvedValue([]);
});

// ——— Tests composants purs ———

describe('PerTransfertWizardSteps', () => {
  const noop = vi.fn();
  const Wizard = PerTransfertWizardSteps as unknown as ComponentType<{
    step: 'contrat' | 'newper';
    step1Done: boolean;
    onStepChange: (_step: 'contrat' | 'newper') => void;
  }>;

  it('affiche seulement les 2 étapes aux libellés courts', () => {
    const html = renderToStaticMarkup(
      <Wizard step="contrat" step1Done={false} onStepChange={noop} />,
    );
    expect(html).toContain('Contrat actuel');
    expect(html).toContain('Nouveau PER');
    expect(html).not.toContain('Le contrat actuel');
    expect(html).not.toContain('Le nouveau PER');
    expect(html).not.toContain('Synth');
  });

  it('désactive seulement Nouveau PER quand le contrat actuel est incomplet', () => {
    const html = renderToStaticMarkup(
      <Wizard step="contrat" step1Done={false} onStepChange={noop} />,
    );
    const matches = html.match(/disabled/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('marque le bon onglet comme sélectionné via aria-selected', () => {
    const html = renderToStaticMarkup(<Wizard step="newper" step1Done onStepChange={noop} />);
    expect(html).toContain('aria-selected="true"');
  });

  it('aucun bouton désactivé quand step1Done est true', () => {
    const html = renderToStaticMarkup(<Wizard step="contrat" step1Done onStepChange={noop} />);
    expect(html).not.toContain('disabled');
  });
});

describe('TransferRulesInfoModal', () => {
  it('détaille la limite PERCO/PERECO d’un transfert tous les trois ans', () => {
    const html = renderToStaticMarkup(<TransferRulesInfoModal onClose={vi.fn()} />);

    expect(html).toContain('L3334-1');
    expect(html).toContain('L224-1');
    expect(html).toContain('sim-info-modal-content');
    expect(html).toContain('limite d’un transfert tous les trois ans');
    expect(html).toContain('PER d’entreprise collectif');
  });
});

describe('PerTransfertFraisInfoModal', () => {
  it('présente le plafond réglementaire applicable aux PERP, Madelin et Article 83', () => {
    const html = renderToStaticMarkup(<PerTransfertFraisInfoModal onClose={vi.fn()} />);

    expect(html).toContain('PERP, Madelin, Article 83 vers un PER');
    expect(html).toContain('sim-info-modal-content');
    expect(html).toContain('1 % des droits acquis');
    expect(html).toContain('10 ans');
    expect(html).toContain('D224-18');
    expect(html).toContain('souvent nuls');
    expect(html).not.toContain('Pas de plafond légal unique');
  });
});

describe('Modales information PER transfert', () => {
  it('partagent le style typographique des modales i', () => {
    const quotePartHtml = renderToStaticMarkup(
      <PerTransfertInfoModal kind="interestsQuotePart" onClose={vi.fn()} />,
    );
    const rentHtml = renderToStaticMarkup(<RentRevaluationInfoModal onClose={vi.fn()} />);

    expect(quotePartHtml).toContain('sim-info-modal-content');
    expect(rentHtml).toContain('sim-info-modal-content');
  });
});

describe('ContractAuditCards', () => {
  it('affiche les champs Base CG manquants avec ventilation frais de gestion', () => {
    const contract: BaseCgRetraiteContract = {
      id: 'audit-contract',
      sourceId: 'Contrat test',
      compagnie: 'Test Vie',
      nomContrat: 'Retraite Test',
      typeContrat: 'MADELIN',
      perCompartment: 'C1',
      phaseEpargne: {
        dateCommercialisation: 'De 2010 à 2017',
        nombreFonds: 50,
        nombreSupportsUc: 123,
        repartitionUcEuro: 'Libre',
        rendementFondsEuro: 'TMG 2%',
        fondsEuroGarantis: '2010-2015 : 3%',
        fraisVersements: 0.03,
        fraisGestion: 0.0045,
        fraisGestionFondsEuro: null,
        fraisGestionUc: null,
        fraisArbitrage: '0,5%',
        fraisTransfertSortant: 0,
        fraisTransfertSortantRate: 0,
        clauseBeneficiaire: 'Standard',
        garantiesComplementaires: 'Garantie plancher',
      },
      phaseLiquidation: {
        ageLimiteLiquidation: '75 ans',
        sortieCapitalRetraite: 'Non',
        fractionnementCapital: 'Non',
        rachatLibre: 'Non',
        tableConversionRente: 'TPRV93',
        tableGarantieAdhesion: 'Oui',
        tauxTechnique: 0.01,
        fraisArrerages: 0.02,
        fraisArreragesRate: 0.02,
        annuitesGaranties: '10 ans',
        reversionPossible: 'Oui',
        reversionIncluse: 'Non',
        renteEstimee: 3200,
      },
      documents: [
        {
          id: 'doc-audit',
          label: 'Conditions générales Retraite Test',
          type: 'conditions_generales',
          status: 'uploaded',
          versionLabel: 'V6369O 06/2025',
          storagePath: 'test/retraite-test/v6369o-06-2025.pdf',
        },
      ],
    };

    const html = renderToStaticMarkup(<ContractAuditCards contract={contract} />);

    expect(html).toContain('Nombre d’UC');
    expect(html).toContain('Frais gestion fonds €');
    expect(html).toContain('Frais gestion UC');
    expect(html).toContain('Fonds € garantis');
    expect(html).toContain('Rente estimée');
    expect(html).toContain('0,45 %');
    expect(html).toContain('Modalités en cas de décès');
    expect(html).toContain(
      'Conditions générales - Version : V6369O 06/2025 - PDF importé - accès authentifié SER1',
    );
    expect(html).toContain('vérifier auprès de la compagnie');
    expect(html).not.toContain('Clause bénéficiaire');
  });

  it('affiche un message global quand un contrat sélectionné ne contient aucune valeur Base CG', () => {
    const emptyContract: BaseCgRetraiteContract = {
      id: 'empty-contract',
      sourceId: 'Contrat vide',
      compagnie: 'Test Vie',
      nomContrat: 'Contrat vide',
      typeContrat: 'PERCO',
      phaseEpargne: {
        dateCommercialisation: null,
        nombreFonds: null,
        repartitionUcEuro: null,
        rendementFondsEuro: null,
        fraisVersements: null,
        fraisGestion: null,
        fraisArbitrage: null,
        fraisTransfertSortant: null,
        fraisTransfertSortantRate: null,
        clauseBeneficiaire: null,
        garantiesComplementaires: null,
      },
      phaseLiquidation: {
        ageLimiteLiquidation: null,
        sortieCapitalRetraite: null,
        fractionnementCapital: null,
        rachatLibre: null,
        tableConversionRente: null,
        tableGarantieAdhesion: null,
        tauxTechnique: null,
        fraisArrerages: null,
        fraisArreragesRate: null,
        annuitesGaranties: null,
        reversionPossible: null,
        reversionIncluse: null,
        renteEstimee: null,
      },
      documents: [],
    };

    const html = renderToStaticMarkup(<ContractAuditCards contract={emptyContract} />);

    expect(html).toContain(
      'La grille de devoir de conseil reste à compléter avec les hypothèses du relevé et des conditions générales.',
    );
    expect(html).not.toContain('Phase épargne');
    expect(html).not.toContain('Phase liquidation');
  });

  it('garde le message long quand aucun contrat Base CG n’est sélectionné', () => {
    const html = renderToStaticMarkup(<ContractAuditCards contract={null} />);

    expect(html).toContain('Aucun contrat Base CG sélectionné');
  });
});

describe('PerTransfertPrefonPocketsForm', () => {
  it('affiche les poches Préfon sans valeur de transfert nette par point', () => {
    const html = renderToStaticMarkup(
      <PerTransfertPrefonPocketsForm
        pockets={[
          {
            compartment: 'C1',
            points: 1000,
            capitalAmount: null,
            unitValue: 0.10219,
            serviceValue: 0.10219,
            transferValue: null,
          },
        ]}
        onChange={vi.fn()}
        onOpenInfo={vi.fn()}
        onOpenPocketSettings={vi.fn()}
      />,
    );

    expect(html).toContain('Valeur de service du point');
    expect(html).toContain('Paramètres de la poche');
    expect(html).toContain('sim-action-btn--edit');
    expect(html).toContain('sim-action-btn--delete');
    expect(html).toContain('sim-action-btn--add');
    expect(html).not.toContain('per-transfert-prefon-pockets__settings');
    expect(html).not.toContain('per-transfert-prefon-pockets__remove');
    expect(html).not.toContain('per-transfert-secondary-button');
    expect(html).not.toContain('Valeur transfert nette par point');
    expect(html).not.toContain('Valeur de transfert globale');
  });
});

describe('PerTransfertHypotheses', () => {
  it('mentionne la vérification obligatoire des informations Base CG auprès de la compagnie', async () => {
    render(<PerTransfertHypotheses />);
    const toggle = screen.getByRole('button', { name: /Afficher les hypothèses et limites/i });

    expect(toggle).toHaveClass('sim-disclosure-btn');
    expect(toggle).toHaveAttribute('aria-controls', 'per-transfert-hypotheses-list');

    await userEvent.click(toggle);

    expect(
      screen.getByText(/Base CG indicative.*aide interne au devoir de conseil/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/se rapprocher de la compagnie/i)).toBeInTheDocument();
  });
});

describe('PerTransfertSimulator', () => {
  it('guide l’arrivée avec le référencement seul avant de révéler les détails', async () => {
    getBaseCgRetraiteCatalogMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PerTransfertSimulator />
      </MemoryRouter>,
    );

    const manualButton = await screen.findByRole('button', { name: /Saisie manuelle/i });

    expect(screen.getByText('Référencement')).toBeInTheDocument();
    expect(screen.queryByText('Audit Base CG')).not.toBeInTheDocument();
    expect(screen.queryByText('Relevé de situation')).not.toBeInTheDocument();
    expect(screen.queryByText('Profil assuré')).not.toBeInTheDocument();
    expect(screen.getByText('Synthèse en attente')).toBeInTheDocument();

    await user.click(manualButton);

    expect(screen.getByText('Relevé de situation')).toBeInTheDocument();
    expect(screen.getByText('Profil assuré')).toBeInTheDocument();
    expect(screen.queryByText('Audit Base CG')).not.toBeInTheDocument();
  });

  it('signale clairement une indisponibilité du catalogue Base CG', async () => {
    getBaseCgRetraiteCatalogMock.mockRejectedValueOnce(
      new Error('Catalogue Base CG retraite indisponible : migration Supabase canonique absente.'),
    );

    render(
      <MemoryRouter>
        <PerTransfertSimulator />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Catalogue Base CG retraite indisponible',
    );
    expect(screen.getByRole('button', { name: /Saisie manuelle/i })).toBeInTheDocument();
  });
});
