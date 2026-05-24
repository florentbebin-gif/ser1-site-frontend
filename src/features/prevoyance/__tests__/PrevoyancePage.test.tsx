// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVOYANCE_MAINTIEN_LEGAL_CODE } from '@/domain/prevoyance/constants';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import PrevoyancePage from '../PrevoyancePage';

const baseData: PrevoyanceRegimeSettings['data'] = {
  arret: {
    carences: { maladie: 3, accident: 0, hospitalisation: 0 },
    maxDurationDays: 1095,
    paliers: [
      {
        fromDay: 4,
        toDay: 1095,
        label: 'IJSS',
        amount: { mode: 'formula', value: null, label: 'RO' },
      },
    ],
  },
  invalidite: {
    paliers: [
      {
        fromRate: 0,
        toRate: 32,
        label: 'Non déclenché',
        amount: { mode: 'fixed_eur_month', value: 0, label: '0 €' },
      },
      {
        fromRate: 33,
        toRate: null,
        label: 'Pension invalidité',
        amount: { mode: 'formula', value: null, label: 'RO invalidité' },
      },
    ],
  },
  deces: {
    capital: { mode: 'formula', value: null, label: 'Capital RO' },
    doublementAccident: false,
    doubleEffet: false,
    renteConjoint: null,
    renteEducation: null,
  },
  cotisations: { mode: 'none', value: null },
};

const sources = {
  fiche: 'Mémento 2026',
  pagesPdf: [1],
  noteValidation: 'Test',
};

const regimes: PrevoyanceRegimeSettings[] = [
  {
    code: 'salarie-cpam',
    label: 'Salarié CPAM',
    caisse: 'CPAM',
    population: 'salarie',
    defaultContractKind: 'collectif',
    year: 2026,
    data: baseData,
    sources,
  },
  {
    code: 'ssi',
    label: 'SSI',
    caisse: 'SSI',
    population: 'tns',
    defaultContractKind: 'individuel',
    year: 2026,
    data: baseData,
    sources,
  },
  {
    code: 'salarie-msa',
    label: 'Salarié agricole — MSA',
    caisse: 'MSA salariés',
    population: 'salarie',
    defaultContractKind: 'collectif',
    year: 2026,
    data: baseData,
    sources,
  },
];

const maintien: PrevoyanceMaintienEmployeurSettings[] = [
  {
    code: PREVOYANCE_MAINTIEN_LEGAL_CODE,
    label: 'Code du travail',
    year: 2026,
    data: {
      maintienEmployeur: {
        carenceDays: 7,
        minAncienneteYears: 1,
        paliers: [
          {
            fromAncienneteYears: 1,
            toAncienneteYears: null,
            firstPeriodDays: 30,
            firstPeriodRate: 90,
            secondPeriodDays: 30,
            secondPeriodRate: 66.67,
          },
        ],
      },
    },
    sources,
  },
];

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: { passHistoryByYear: { 2026: 48_060 } },
  }),
}));

vi.mock('@/utils/cache/prevoyanceSettingsCache', () => ({
  getPrevoyanceRegimeSettings: vi.fn(async () => regimes),
  getPrevoyanceMaintienEmployeurSettings: vi.fn(async () => maintien),
}));

describe('PrevoyancePage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  async function saisirDateNaissance(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText('Date de naissance'), '1980-01-01');
    await screen.findByText('Garanties souscrites hors régime obligatoire');
  }

  it('affiche le parcours salarié sans frais professionnels', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    expect(
      await screen.findByText('Choix du régime obligatoire et des ayants droit'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Garanties souscrites hors régime obligatoire'),
    ).not.toBeInTheDocument();
    await saisirDateNaissance(user);
    expect(screen.getByText('Comparer')).toBeInTheDocument();
    expect(screen.getByText('Non applicable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Salarié CPAM/i }));
    expect(screen.getByText('Salarié agricole — MSA')).toBeInTheDocument();
    expect(screen.queryByText('MSA salariés')).not.toBeInTheDocument();
    expect(screen.getAllByText('Régime obligatoire').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Maintien employeur/i)).toBeNull();
  });

  it('bascule en TNS et permet trois contrats en cartes compactes', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
    await user.click(screen.getByRole('radio', { name: 'TNS / libéral' }));
    expect((await screen.findAllByText('Frais professionnels')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Frais professionnels').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
    await user.click(await screen.findByRole('button', { name: 'Terminer' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
    await user.click(await screen.findByRole('button', { name: 'Terminer' }));

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: /Contrat [123]/i })).toHaveLength(3);
    });
  });

  it('borne les contrats à trois et ouvre le découpage arrêt', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
    await user.click(screen.getByRole('radio', { name: 'TNS / libéral' }));
    expect(await screen.findByRole('heading', { name: 'Contrat 1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
    await user.click(await screen.findByRole('button', { name: 'Terminer' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
    await user.click(await screen.findByRole('button', { name: 'Terminer' }));

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: /Contrat [123]/i })).toHaveLength(3);
    });

    await user.click(screen.getAllByRole('button', { name: /Modifier Contrat/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /Découper les périodes/i })[0]);
    expect(await screen.findByText('Découper l’arrêt de travail')).toBeInTheDocument();
    expect(screen.getByText('Cliquez × pour retirer une période.')).toBeInTheDocument();
  });

  it('permet de supprimer un palier invalidité ajouté', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
    await user.click(screen.getByRole('radio', { name: 'TNS / libéral' }));
    await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
    await user.click(await screen.findByRole('button', { name: 'Invalidité' }));
    await user.click(
      await screen.findByRole('button', {
        name: 'Ajouter un palier invalidité au contrat 1',
      }),
    );

    expect(screen.getAllByRole('button', { name: /Supprimer le palier invalidité/i })).toHaveLength(
      3,
    );

    await user.click(screen.getAllByRole('button', { name: /Supprimer le palier invalidité/i })[0]);

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /Supprimer le palier invalidité/i }),
      ).toHaveLength(2);
    });
  });

  it('ouvre la modale d’estimation des frais professionnels', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
    await user.click(screen.getByRole('radio', { name: 'TNS / libéral' }));
    expect((await screen.findAllByText('Frais professionnels')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
    await user.click(await screen.findByRole('button', { name: 'Frais professionnels' }));
    await user.click(screen.getByRole('button', { name: /Estimer depuis un compte de résultat/i }));

    expect(
      await screen.findByText('Estimation à partir des charges du compte de résultat.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Achats et charges externes')).toBeInTheDocument();
    expect(screen.getByText('Loyers et crédit-bail')).toBeInTheDocument();
    expect(screen.getByText('Assurances')).toBeInTheDocument();
    expect(screen.getByText('Salaires et charges')).toBeInTheDocument();
    expect(screen.getByText('Dotations aux amortissements')).toBeInTheDocument();
    expect(screen.getByText('Frais bancaires')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retenir ce montant' })).toBeInTheDocument();
  });
});
