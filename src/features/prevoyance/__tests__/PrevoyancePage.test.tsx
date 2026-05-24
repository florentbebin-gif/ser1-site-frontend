// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('affiche le parcours salarié sans frais généraux', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    expect(
      await screen.findByText('Choix du régime obligatoire et des ayants droit'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Enfants')).toHaveValue(null);
    await waitFor(() => expect(screen.getByLabelText('Salaire brut annuel')).toHaveValue(''));
    expect(
      screen.queryByText('Garanties souscrites hors régime obligatoire'),
    ).not.toBeInTheDocument();
    await saisirDateNaissance(user);
    expect(screen.getByText('Comparer')).toBeInTheDocument();
    expect(screen.queryByText('Frais généraux')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Cotisation' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
    expect(screen.queryByRole('button', { name: 'Frais généraux' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Acte juridique' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ajouter une période arrêt de travail au contrat 1' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Invalidité' }));
    expect(
      screen.getByRole('button', { name: 'Ajouter un seuil invalidité au contrat 1' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Acte juridique' }));
    expect(screen.getAllByText('Acte juridique').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    await user.click(screen.getByRole('button', { name: /Salarié CPAM/i }));
    expect(screen.getByText('Salarié agricole — MSA')).toBeInTheDocument();
    expect(screen.queryByText('MSA salariés')).not.toBeInTheDocument();
    expect(screen.getAllByText('RO').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Maintien employeur/i)).toBeNull();
  });

  it('bascule en TNS et permet trois contrats en cartes compactes', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
    await user.click(screen.getByRole('radio', { name: 'TNS / libéral' }));
    expect((await screen.findAllByText('Frais généraux')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Frais généraux').length).toBeGreaterThan(0);

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
    expect(screen.queryByText('Cotisation annuelle')).toBeNull();
    expect(screen.getByLabelText('Franchise accident')).toHaveValue(0);
    expect(screen.getByLabelText('Franchise hospitalisation')).toHaveValue(0);
    expect(screen.getByLabelText('Franchise maladie')).toHaveValue(0);
    await user.click(screen.getByRole('button', { name: 'Cotisation' }));
    expect(screen.getByText('Cotisation annuelle')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Arrêt de travail' }));
    await user.click(screen.getAllByRole('button', { name: /Découper les périodes/i })[0]);
    expect(await screen.findByText('Découper l’arrêt de travail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajouter une période/i })).toHaveClass(
      'sim-modal-btn--ghost',
    );
    expect(screen.getByText('Cliquez × pour retirer une période.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ajouter une période/i }));
    const periodInputs = document.querySelectorAll<HTMLInputElement>(
      '.prevoyance-period-row input',
    );
    expect(periodInputs).toHaveLength(6);

    fireEvent.change(periodInputs[1], { target: { value: '90' } });
    expect(periodInputs[3]).toHaveValue(91);

    fireEvent.change(periodInputs[3], { target: { value: '31' } });
    expect(periodInputs[1]).toHaveValue(30);

    await user.click(screen.getByRole('button', { name: /Ajouter une période/i }));
    const threePeriodInputs = document.querySelectorAll<HTMLInputElement>(
      '.prevoyance-period-row input',
    );
    expect(threePeriodInputs).toHaveLength(9);

    fireEvent.change(threePeriodInputs[6] as HTMLInputElement, { target: { value: '3' } });
    expect(threePeriodInputs[6]).toHaveValue(3);

    fireEvent.change(threePeriodInputs[6] as HTMLInputElement, { target: { value: '365' } });
    expect(threePeriodInputs[4]).toHaveValue(364);
    expect(threePeriodInputs[6]).toHaveValue(365);
  });

  it('permet de supprimer un palier invalidité ajouté', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
    await user.click(screen.getByRole('radio', { name: 'TNS / libéral' }));
    await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
    await user.click(await screen.findByRole('button', { name: 'Invalidité' }));
    await user.click(screen.getByRole('radio', { name: 'Forfaitaire' }));
    expect(screen.getByRole('radio', { name: 'Forfaitaire' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(
      await screen.findByRole('button', {
        name: 'Ajouter un palier invalidité au contrat 1',
      }),
    );

    expect(screen.getAllByRole('button', { name: /Supprimer le palier invalidité/i })).toHaveLength(
      2,
    );

    await user.click(screen.getAllByRole('button', { name: /Supprimer le palier invalidité/i })[0]);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Supprimer le palier invalidité/i })).toBeNull();
    });

    await user.click(screen.getByRole('button', { name: 'Arrêt de travail' }));
    expect(screen.getByRole('radio', { name: 'Indemnitaire' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('ouvre la modale d’estimation des frais généraux sans écraser la garantie', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
    await user.click(screen.getByRole('radio', { name: 'TNS / libéral' }));
    expect((await screen.findAllByText('Frais généraux')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
    await user.click(await screen.findByRole('button', { name: 'Frais généraux' }));
    expect(screen.queryByRole('radio', { name: 'Indemnitaire' })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Forfaitaire' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Montant mensuel frais généraux'), {
      target: { value: '12000' },
    });
    await user.click(
      screen.getByRole('button', { name: /Estimer l’assiette depuis un compte de résultat/i }),
    );

    expect(
      await screen.findByText(
        'Estimation de l’assiette de charges permanentes à maintenir pendant l’arrêt du dirigeant.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Locaux, matériel et véhicules')).toBeInTheDocument();
    expect(screen.getByText('Exploitation et gestion courante')).toBeInTheDocument();
    expect(screen.getByText('Personnel et remplacement')).toBeInTheDocument();
    expect(screen.getByText('Assurances, cotisations et taxes')).toBeInTheDocument();
    expect(screen.getByText('Frais financiers')).toBeInTheDocument();
    expect(screen.getByText('Amortissements et pertes prévues')).toBeInTheDocument();
    expect(screen.getByText(/Comptes indicatifs : 612, 613/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Locaux, matériel et véhicules'), {
      target: { value: '5000' },
    });
    expect(screen.getByRole('button', { name: 'Valider' })).toHaveClass('sim-modal-btn--primary');
    await user.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByLabelText('Montant mensuel frais généraux')).toHaveValue('12\u202f000');

    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
    await user.click(await screen.findByRole('button', { name: 'Frais généraux' }));
    await user.click(
      screen.getByRole('button', { name: /Estimer l’assiette depuis un compte de résultat/i }),
    );
    expect(await screen.findByLabelText('Locaux, matériel et véhicules')).toHaveValue('5\u202f000');
  });

  it('affiche les grands montants dans le besoin décès', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
    await user.click(screen.getByRole('radio', { name: 'TNS / libéral' }));
    fireEvent.change(screen.getByLabelText('Revenu imposable à couvrir'), {
      target: { value: '80000' },
    });
    const besoinInput = screen.getByLabelText('Besoin à couvrir');
    expect(screen.queryByRole('button', { name: 'x1' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'x3' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'x5' })).toBeNull();
    expect(besoinInput).toHaveValue('240\u202f000');
    fireEvent.change(besoinInput, { target: { value: '99999999' } });

    expect(besoinInput).toHaveValue('99\u202f999\u202f999');
  });
});
