// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentType } from 'react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PerTransfertWizardSteps } from '../components/PerTransfertWizardSteps';
import { ContractAuditCards } from '../components/ContractAuditCards';
import { PerTransfertSidebar } from '../components/PerTransfertSidebar';
import { PerTransfertHypotheses } from '../components/PerTransfertHypotheses';
import { PerTransfertFraisInfoModal } from '../components/PerTransfertFraisInfoModal';
import { PerTransfertPrefonPocketsForm } from '../components/PerTransfertPrefonPocketsForm';
import { TransferRulesInfoModal } from '../components/TransferRulesInfoModal';
import type {
  PerTransfertCapitalFiscalResult,
  PerTransfertFiscalResult,
  PerTransfertResult,
} from '@/engine/per';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';

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

// ——— Résultat minimal pour la synthèse PER transfert ———

function makeFiscalResult(
  overrides: Partial<PerTransfertFiscalResult> = {},
): PerTransfertFiscalResult {
  const grossAnnualRent = overrides.grossAnnualRent ?? overrides.netAnnualRent ?? 0;
  const socialContributions = overrides.socialContributions ?? 0;
  const incomeTax = overrides.incomeTax ?? 0;
  const netOfAllTaxes =
    overrides.netOfAllTaxes ??
    overrides.netAnnualRent ??
    Math.max(0, grossAnnualRent - incomeTax - socialContributions);
  return {
    family: 'RVTG',
    taxableFraction: 1,
    taxableIncome: grossAnnualRent,
    grossAnnualRent,
    netOfSocialContributions:
      overrides.netOfSocialContributions ?? Math.max(0, grossAnnualRent - socialContributions),
    netOfAllTaxes,
    incomeTax,
    socialContributions,
    netAnnualRent: netOfAllTaxes,
    ...overrides,
  };
}

function makeCapitalFiscalResult(
  overrides: Partial<PerTransfertCapitalFiscalResult> = {},
): PerTransfertCapitalFiscalResult {
  const capital = overrides.capital ?? 0;
  const socialContributions = overrides.socialContributions ?? 0;
  const incomeTax = overrides.incomeTax ?? 0;
  const netOfAllTaxes =
    overrides.netOfAllTaxes ??
    overrides.netIRPS ??
    Math.max(0, capital - socialContributions - incomeTax);
  const netOfSocialContributions =
    overrides.netOfSocialContributions ??
    overrides.netPS ??
    Math.max(0, capital - socialContributions);
  return {
    available: false,
    capital,
    gains: 0,
    netOfSocialContributions,
    netOfAllTaxes,
    netOfAllTaxesWithQuotient: overrides.netOfAllTaxesWithQuotient ?? netOfAllTaxes,
    incomeTax,
    incomeTaxAtBareme: overrides.incomeTaxAtBareme ?? incomeTax,
    incomeTaxWithQuotient: overrides.incomeTaxWithQuotient ?? incomeTax,
    socialContributions,
    netPS: netOfSocialContributions,
    netIRPS: netOfAllTaxes,
    ...overrides,
  };
}

function makeResult(overrides: Partial<PerTransfertResult> = {}): PerTransfertResult {
  return {
    compartment: 'C1',
    currentConversionRate: 0.03,
    capitalAfterTransfer: 97000,
    capitalAtLiquidation: 110000,
    currentRent: {
      grossAnnualRent: 3000,
      netAnnualRent: 2200,
      fiscal: makeFiscalResult({
        grossAnnualRent: 3000,
        taxableIncome: 2700,
        incomeTax: 810,
        netAnnualRent: 2200,
      }),
      cumulativeToShortHorizon: 22000,
      cumulativeToLongHorizon: 44000,
    },
    keepScenario: {
      capitalAtLiquidation: 97000,
      currentRent: {
        grossAnnualRent: 3000,
        netAnnualRent: 2200,
        netMonthly: 2200 / 12,
        fiscal: makeFiscalResult({
          grossAnnualRent: 3000,
          taxableIncome: 2700,
          incomeTax: 810,
          netAnnualRent: 2200,
        }),
        cumulativeToShortHorizon: 22000,
        cumulativeToLongHorizon: 44000,
      },
    },
    newPerRent: {
      capitalNet: 110000,
      annuityFactor: 15,
      grossAnnualRent: 2800,
      netAnnualRent: 2400,
      monthlyRent: 200,
      apparentRate: 0.025,
    },
    newPerFiscal: makeFiscalResult({
      grossAnnualRent: 2800,
      taxableIncome: 2520,
      incomeTax: 756,
      netAnnualRent: 2400,
    }),
    capitalExit: {
      shareRate: 0,
      capitalConvertedToRent: 110000,
      capitalAvailableAtLiquidation: 0,
      unique: makeCapitalFiscalResult(),
      shortHorizon: {
        horizonAge: 80,
        years: 16,
        annualWithdrawal: 0,
        annualNetWithdrawal: 0,
        cumulativeWithdrawals: 0,
        cumulativeNetWithdrawals: 0,
        residualCapital: 0,
      },
      longHorizon: {
        horizonAge: 90,
        years: 26,
        annualWithdrawal: 0,
        annualNetWithdrawal: 0,
        cumulativeWithdrawals: 0,
        cumulativeNetWithdrawals: 0,
        residualCapital: 0,
      },
      withoutWithdrawalToLongHorizon: 0,
    },
    smallAnnuityCapitalExitEligible: false,
    warnings: [],
    ...overrides,
  };
}

describe('PerTransfertSidebar', () => {
  it('affiche quatre oppositions sans sélecteur de sortie', () => {
    const html = renderToStaticMarkup(
      <PerTransfertSidebar
        result={makeResult()}
        selectedContract={null}
        typeContrat="MADELIN"
        subscriptionDate=""
        step2Done
        horizonAgeShort={80}
        horizonAgeLong={90}
        onHorizonChange={vi.fn()}
        onOpenQuotientInfo={vi.fn()}
        onOpenFractionalInfo={vi.fn()}
      />,
    );

    expect(html).not.toContain('Type de sortie à comparer');
    expect(html).toContain('Contrat actuel');
    expect(html).toContain('Nouveau PER');
    expect(html).toContain('Rente');
    expect(html).toContain('Capital unique');
    expect(html).toContain('Capital fractionné court');
    expect(html).toContain('Capital fractionné long');
    expect(html).toContain('Net de PS + IR');
    expect(html).toContain('Points d’attention');
    expect(html).not.toContain('Rente nette mensuelle');
    expect(html).not.toContain('/mois');
  });

  it('affiche la stratégie Max capital uniquement pour Préfon', () => {
    const html = renderToStaticMarkup(
      <PerTransfertSidebar
        result={makeResult({ compartment: 'C1' })}
        selectedContract={null}
        typeContrat="PER_POINTS"
        subscriptionDate=""
        step2Done
        horizonAgeShort={80}
        horizonAgeLong={90}
        onHorizonChange={vi.fn()}
        onOpenQuotientInfo={vi.fn()}
        onOpenFractionalInfo={vi.fn()}
      />,
    );

    expect(html).toContain('Max capital');
    expect(html).toContain('Tout rente');
  });
});

describe('TransferRulesInfoModal', () => {
  it('détaille la limite PERCO/PERECO d’un transfert tous les trois ans', () => {
    const html = renderToStaticMarkup(<TransferRulesInfoModal onClose={vi.fn()} />);

    expect(html).toContain('L3334-1');
    expect(html).toContain('L224-1');
    expect(html).toContain('limite d’un transfert tous les trois ans');
    expect(html).toContain('PER d’entreprise collectif');
  });
});

describe('PerTransfertFraisInfoModal', () => {
  it('présente le plafond réglementaire applicable aux PERP, Madelin et Article 83', () => {
    const html = renderToStaticMarkup(<PerTransfertFraisInfoModal onClose={vi.fn()} />);

    expect(html).toContain('PERP, Madelin, Article 83 vers un PER');
    expect(html).toContain('1 % des droits acquis');
    expect(html).toContain('10 ans');
    expect(html).toContain('D224-18');
    expect(html).toContain('souvent nuls');
    expect(html).not.toContain('Pas de plafond légal unique');
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
      documents: [],
    };

    const html = renderToStaticMarkup(<ContractAuditCards contract={contract} />);

    expect(html).toContain('Nombre d’UC');
    expect(html).toContain('Frais gestion fonds €');
    expect(html).toContain('Frais gestion UC');
    expect(html).toContain('Fonds € garantis');
    expect(html).toContain('Rente estimée');
    expect(html).toContain('0,45 %');
    expect(html).toContain('Modalités en cas de décès');
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
    expect(html).not.toContain('Valeur transfert nette par point');
    expect(html).not.toContain('Valeur de transfert globale');
  });
});

describe('PerTransfertHypotheses', () => {
  it('mentionne la vérification obligatoire des informations Base CG auprès de la compagnie', async () => {
    render(<PerTransfertHypotheses />);
    await userEvent.click(screen.getByRole('button', { name: /Hypothèses et limites/ }));

    expect(screen.getByText(/Base CG fournie à titre indicatif/i)).toBeInTheDocument();
    expect(screen.getByText(/se rapprocher de la compagnie/i)).toBeInTheDocument();
  });
});
