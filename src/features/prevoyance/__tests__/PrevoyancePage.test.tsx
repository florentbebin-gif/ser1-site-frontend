// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVOYANCE_MAINTIEN_LEGAL_CODE } from '@/domain/prevoyance/constants';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import { triggerPageReset } from '@/utils/reset';
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

const sources: PrevoyanceRegimeSettings['sources'] = {
  references: [
    {
      organisme: 'Source de test',
      titre: 'Barème de test',
      url: 'https://example.test/prevoyance',
      dateConsultation: '2026-05-24',
      valeursCouvertes: ['test'],
      confiance: 'haute',
    },
  ],
};

const regimes: PrevoyanceRegimeSettings[] = [
  {
    code: 'salarie-cpam',
    label: 'Salarié secteur privé — CPAM',
    caisse: 'CPAM',
    population: 'salarie',
    defaultContractKind: 'collectif',
    year: 2026,
    data: baseData,
    sources,
  },
  {
    code: 'ssi-artisan-commercant',
    label: 'Artisan / commerçant — SSI',
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

vi.mock('@/settings/userMode', () => ({
  useUserMode: () => ({ mode: 'simplifie', setMode: vi.fn(), isLoading: false }),
}));

describe('PrevoyancePage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  async function saisirDateNaissance(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText('Date de naissance'), '1980-01-01');
    await screen.findByText('Garanties souscrites hors régime obligatoire');
  }

  async function choisirRegime(user: ReturnType<typeof userEvent.setup>, optionName: RegExp) {
    await user.click(await screen.findByRole('button', { name: /Artisan \/ commerçant|Salarié/i }));
    await user.click(await screen.findByRole('option', { name: optionName }));
  }

  async function ajouterContrat(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
    await user.click(await screen.findByRole('button', { name: 'Terminer' }));
  }

  async function creerTroisContrats(user: ReturnType<typeof userEvent.setup>) {
    await saisirDateNaissance(user);
    expect(await screen.findByRole('heading', { name: 'Contrat 1' })).toBeInTheDocument();

    await ajouterContrat(user);
    await ajouterContrat(user);

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: /Contrat [123]/i })).toHaveLength(3);
    });
  }

  async function ouvrirDecoupageArret(user: ReturnType<typeof userEvent.setup>) {
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
      'sim-action-btn--add',
    );
    expect(
      screen.getByText('Utilisez le bouton supprimer pour retirer une période.'),
    ).toBeInTheDocument();
  }

  it('affiche le parcours salarié sans frais généraux', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    expect(
      await screen.findByText('Choix du régime obligatoire et des ayants droit'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Enfants')).toHaveValue(null);
    expect(screen.queryByText('Parcours')).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Salarié' })).toBeNull();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Artisan \/ commerçant — SSI/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Revenu imposable à couvrir')).toHaveValue('');
    await choisirRegime(user, /Salarié secteur privé — CPAM/i);
    await waitFor(() => expect(screen.getByLabelText('Salaire brut annuel')).toHaveValue(''));
    expect(
      screen.queryByText('Garanties souscrites hors régime obligatoire'),
    ).not.toBeInTheDocument();
    await saisirDateNaissance(user);
    expect(screen.getByRole('button', { name: 'Ajouter un contrat' })).toHaveClass(
      'sim-action-btn--add',
    );
    expect(screen.queryByText('Comparer')).not.toBeInTheDocument();
    expect(screen.queryByText('Frais généraux')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Cotisation' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
    expect(screen.queryByRole('button', { name: 'Frais généraux' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Acte juridique' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ajouter une période arrêt de travail au contrat 1' }),
    ).toHaveClass('sim-action-btn--add');
    await user.click(screen.getByRole('button', { name: 'Invalidité' }));
    expect(
      screen.getByRole('button', { name: 'Ajouter un seuil invalidité au contrat 1' }),
    ).toHaveClass('sim-action-btn--add');
    await user.click(screen.getByRole('button', { name: 'Acte juridique' }));
    expect(screen.getAllByText('Acte juridique').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    await user.click(screen.getByRole('button', { name: /Salarié secteur privé — CPAM/i }));
    expect(screen.getByText('Salarié agricole — MSA')).toBeInTheDocument();
    expect(screen.queryByText('MSA salariés')).not.toBeInTheDocument();
    expect(screen.getAllByText('RO').length).toBeGreaterThan(0);
    expect(screen.getByText('empl')).toBeInTheDocument();
    act(() => {
      triggerPageReset('prevoyance');
    });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Artisan \/ commerçant — SSI/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Revenu imposable à couvrir')).toBeInTheDocument();
  });

  it('affiche les repères header, un état vide utile et les hypothèses avant saisie complète', async () => {
    render(<PrevoyancePage />);

    expect(await screen.findByText('Mode expert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mode expert indisponible/i })).toBeDisabled();
    expect(
      screen.getByText(
        'Renseignez le régime et la date de naissance pour afficher la synthèse de garanties.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Arrêt de travail' })).toBeNull();
    expect(screen.getByRole('button', { name: /HYPOTHÈSES ET LIMITES/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: /Hypothèses et limites/i })).toHaveClass(
      'sim-disclosure-btn',
    );
  });

  it('charge le parcours TNS par défaut et permet trois contrats en cartes compactes', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
    expect((await screen.findAllByText('Frais généraux')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Frais généraux').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Ajouter un contrat' })).toHaveClass(
      'sim-action-btn--add',
    );
    expect(screen.queryByText('Comparer')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modifier Contrat 1/i })).toHaveClass(
      'sim-action-btn--edit',
    );
    expect(screen.getByRole('button', { name: /Dupliquer Contrat 1/i })).toHaveClass(
      'sim-action-btn--duplicate',
    );
    expect(screen.getByRole('button', { name: /Supprimer Contrat 1/i })).toHaveClass(
      'sim-action-btn--delete',
    );
    expect(document.querySelectorAll('.prevoyance-sidebar .sim-metric').length).toBeGreaterThan(1);

    await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
    await user.click(await screen.findByRole('button', { name: 'Terminer' }));
    expect(screen.getByText('Comparer')).toBeInTheDocument();
    expect(screen.getByText('Cumuler')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
    await user.click(await screen.findByRole('button', { name: 'Terminer' }));

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: /Contrat [123]/i })).toHaveLength(3);
    });
  });

  it('borne les contrats à trois', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await creerTroisContrats(user);

    expect(screen.getByRole('button', { name: 'Ajouter un contrat' })).toBeDisabled();
  });

  it('ouvre le découpage arrêt depuis l’édition du contrat', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await creerTroisContrats(user);
    await ouvrirDecoupageArret(user);

    await user.click(screen.getByRole('button', { name: /Ajouter une période/i }));
    const periodInputs = document.querySelectorAll<HTMLInputElement>(
      '.prevoyance-period-row input',
    );
    expect(periodInputs).toHaveLength(6);

    fireEvent.change(periodInputs[1], { target: { value: '90' } });
    expect(periodInputs[3]).toHaveValue(91);

    fireEvent.change(periodInputs[3], { target: { value: '31' } });
    expect(periodInputs[1]).toHaveValue(30);
  });

  it('verrouille la dernière période arrêt à 1 095 jours', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await creerTroisContrats(user);
    await ouvrirDecoupageArret(user);
    await user.click(screen.getByRole('button', { name: /Ajouter une période/i }));

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
    expect(threePeriodInputs[7]).toHaveValue(1095);
    expect(threePeriodInputs[7]).toBeDisabled();
    expect(threePeriodInputs[7]).toHaveAttribute('title', 'Verrouillée à 1 095 jours');
  });

  it('permet de supprimer un palier invalidité ajouté', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await saisirDateNaissance(user);
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
    expect(
      screen.getAllByRole('button', { name: /Supprimer le palier invalidité/i })[0],
    ).toHaveClass('sim-action-btn--delete');

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

  it('affiche le capital décès même avec les rentes conjoint et éducation', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await user.click(await screen.findByRole('button', { name: 'Célibataire' }));
    await user.click(await screen.findByRole('option', { name: 'Marié' }));
    fireEvent.change(screen.getByLabelText('Enfants'), { target: { value: '2' } });
    await saisirDateNaissance(user);
    await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
    await user.click(await screen.findByRole('button', { name: 'Décès' }));
    const decesInputs = document.querySelectorAll<HTMLInputElement>(
      '.prevoyance-mini-section .sim-field__control',
    );
    fireEvent.change(decesInputs[0] as HTMLInputElement, { target: { value: '250000' } });
    fireEvent.change(decesInputs[1] as HTMLInputElement, { target: { value: '12000' } });
    fireEvent.change(decesInputs[2] as HTMLInputElement, { target: { value: '8000' } });
    await user.click(screen.getByRole('button', { name: 'Terminer' }));

    const decesCard = screen.getByRole('heading', { name: 'Décès' }).closest('section');
    expect(decesCard).not.toBeNull();
    const deces = within(decesCard as HTMLElement);
    const decesText = decesCard?.textContent?.replace(/\s/g, ' ') ?? '';
    expect(decesText).toContain('Contrat 1 · Capital');
    expect(decesText).toContain('250 000 €');
    expect(deces.getByText('Rente conjoint')).toBeInTheDocument();
    expect(decesText).toContain('12 000 €');
    expect(deces.getByText('Rente éducation')).toBeInTheDocument();
    expect(decesText).toContain('8 000 €');
  });
});
