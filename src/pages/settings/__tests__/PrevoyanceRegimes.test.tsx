// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVOYANCE_MAINTIEN_LEGAL_CODE } from '@/domain/prevoyance/constants';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import MementoPrevoyanceEntrySection from '../memento/MementoPrevoyanceEntrySection';
import type { PrevoyanceEditorTarget } from '../PrevoyanceRegimes/usePrevoyanceMementoSettings';

let isAdmin = false;
const applyEditorTargetMock = vi.fn();

const baseData: PrevoyanceRegimeSettings['data'] = {
  arret: {
    carences: { maladie: 3, accident: 0, hospitalisation: 0 },
    maxDurationDays: 1095,
    paliers: [
      {
        fromDay: 4,
        toDay: 1095,
        label: 'IJSS régime général',
        amount: { mode: 'formula', value: null, label: '50 % du salaire journalier moyen' },
      },
    ],
  },
  invalidite: {
    paliers: [
      {
        fromRate: 33,
        toRate: 65,
        label: 'Catégorie 1',
        amount: { mode: 'fixed_eur_year', value: 4059.72, label: '4 059,72 € min' },
      },
      {
        fromRate: 66,
        toRate: null,
        label: 'Catégorie 2',
        amount: { mode: 'fixed_eur_year', value: 24030, label: '24 030 € max' },
      },
    ],
  },
  deces: {
    capital: { mode: 'formula', value: null, label: 'Capital décès forfaitaire' },
    doublementAccident: false,
    doubleEffet: false,
    renteConjoint: null,
    renteEducation: null,
  },
  cotisations: {
    mode: 'percent_salary',
    value: 7,
    assiette: 'TA',
    repartition: { employeur: 60, salarie: 40 },
  },
};

const sources: PrevoyanceRegimeSettings['sources'] = {
  references: [
    {
      organisme: 'Ameli',
      titre: 'Invalidité et capital décès',
      url: 'https://www.ameli.fr/',
      dateConsultation: '2026-05-24',
      valeursCouvertes: ['invalidité', 'décès'],
      confiance: 'haute',
      relevanceNote:
        'La page Ameli de test atteste les champs invalidité et décès affichés par la carte.',
      verifiedAt: '2026-05-24',
    },
  ],
  noteAdmin: 'Note interne invisible aux users.',
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
    code: 'cnavpl',
    label: 'Profession libérale — socle CNAVPL',
    caisse: 'CNAVPL',
    population: 'liberal',
    defaultContractKind: 'individuel',
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

vi.mock('../PrevoyanceRegimes/PrevoyanceProvider', () => ({
  usePrevoyanceContext: () => ({
    isAdmin,
    loading: false,
    regimes,
    maintien,
    applyEditorTarget: applyEditorTargetMock,
  }),
}));

describe('MementoPrevoyanceEntrySection', () => {
  beforeEach(() => {
    isAdmin = false;
    applyEditorTargetMock.mockReset();
  });

  it('affiche les régimes salariés aux users en lecture seule avec les références consultables', async () => {
    const user = userEvent.setup();
    render(<MementoPrevoyanceEntrySection entryKey="prevoyance.regimes-salaries" />);

    const cpam = screen.getByRole('button', { name: /Salarié secteur privé — CPAM/i });
    expect(cpam).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('button', { name: /Artisan \/ commerçant/i }),
    ).not.toBeInTheDocument();

    await user.click(cpam);
    expect(cpam).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Ameli' })).toHaveAttribute(
      'href',
      'https://www.ameli.fr/',
    );
    expect(screen.queryByText('Vérifié')).not.toBeInTheDocument();
    expect(screen.queryByText(/consulté le 2026-05-24/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Valeurs couvertes/i)).not.toBeInTheDocument();
    expect(screen.getByText('Cotisations')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.queryByText('Note interne invisible aux users.')).not.toBeInTheDocument();
  });

  it('affiche la qualité de source aux admins sans la confondre avec la date de consultation', async () => {
    const user = userEvent.setup();
    isAdmin = true;

    render(<MementoPrevoyanceEntrySection entryKey="prevoyance.regimes-salaries" />);

    const cpam = screen.getByRole('button', { name: /Salarié secteur privé — CPAM/i });
    await user.click(cpam);

    expect(screen.getByText('Qualité source : vérifiée')).toBeInTheDocument();
    expect(screen.getByText(/consulté le 2026-05-24/i)).toBeInTheDocument();
  });

  it('répartit les indépendants et les caisses libérales dans leurs entrées', () => {
    const { rerender } = render(
      <MementoPrevoyanceEntrySection entryKey="prevoyance.regimes-independants" />,
    );

    expect(
      screen.getByRole('button', { name: /Artisan \/ commerçant — SSI/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Profession libérale/i })).not.toBeInTheDocument();

    rerender(<MementoPrevoyanceEntrySection entryKey="prevoyance.affiliation-caisses" />);

    expect(
      screen.getByRole('button', { name: /Profession libérale — socle CNAVPL/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Artisan \/ commerçant/i }),
    ).not.toBeInTheDocument();
  });

  it('permet à l’admin de valider une modification en brouillon sans sauvegarde locale', async () => {
    const user = userEvent.setup();
    isAdmin = true;

    render(<MementoPrevoyanceEntrySection entryKey="prevoyance.regimes-independants" />);

    await user.click(screen.getByRole('button', { name: /Artisan \/ commerçant — SSI/i }));
    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    const dialog = await screen.findByRole('dialog', { name: 'Modifier le régime' });

    expect(
      within(dialog).getByRole('button', { name: 'Valider les modifications' }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();

    const labelInput = within(dialog).getAllByLabelText('Libellé')[0];
    await user.clear(labelInput);
    await user.type(labelInput, 'Artisan modifié — SSI');
    await user.click(within(dialog).getByRole('button', { name: 'Valider les modifications' }));

    expect(applyEditorTargetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'regime',
        originalCode: 'ssi-artisan-commercant',
        value: expect.objectContaining({
          code: 'ssi-artisan-commercant',
          label: 'Artisan modifié — SSI',
        }),
      }) satisfies PrevoyanceEditorTarget,
    );
  });

  it('affiche le maintien employeur sous son entrée dédiée', async () => {
    const user = userEvent.setup();
    isAdmin = true;

    render(<MementoPrevoyanceEntrySection entryKey="prevoyance.maintien-employeur" />);

    expect(screen.getByText('Maintien employeur légal')).toBeInTheDocument();
    expect(screen.getByText('Carence : 7 j')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    expect(
      await screen.findByRole('dialog', { name: 'Modifier le maintien employeur' }),
    ).toBeInTheDocument();
  });

  it('rappelle que les contrats assurantiels restent dans Base-Contrat sans dupliquer de paramètre', () => {
    render(<MementoPrevoyanceEntrySection entryKey="prevoyance.contrats-assurantiels" />);

    expect(screen.getByText('Contrats assurantiels')).toBeInTheDocument();
    expect(screen.getByText(/Produits & enveloppes réglementés/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
  });
});
