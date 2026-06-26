// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyDossier, type DossierAudit, type ProcheInfo } from '@/domain/audit/types';

import { FiliationDrawer } from '../FiliationDrawer';

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({ colors: {} }),
}));

function renderDrawer(mutate?: (audit: DossierAudit) => void) {
  const audit = createEmptyDossier();
  mutate?.(audit);
  return render(<FiliationDrawer open dossier={audit} onClose={vi.fn()} onSave={vi.fn()} />);
}

function expectTextBefore(first: string, second: string) {
  const firstElement = screen.getByText(first);
  const secondElement = screen.getByText(second);
  expect(
    firstElement.compareDocumentPosition(secondElement) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('FiliationDrawer', () => {
  it('propose deux boutons distincts et un état vide combiné', () => {
    renderDrawer();
    expect(screen.getByRole('button', { name: 'Ajouter un enfant' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ajouter un proche' })).toBeVisible();
    expect(screen.getByText('Aucun enfant ni proche renseigné.')).toBeVisible();
  });

  it('active Fiscalement à charge par défaut et lie Scolarité + Garde alternée à ce statut', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un enfant' }));

    // Par défaut un enfant est fiscalement à charge : Scolarité et Garde alternée sont visibles.
    expect(screen.getByText('Scolarité')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Garde alternée' })).toBeVisible();
    expectTextBefore('Situation civile & fiscale', 'Succession / transmission');
    expectTextBefore('Succession / transmission', 'Scolarité');

    await userEvent.click(screen.getByRole('button', { name: 'Fiscalement à charge' }));

    expect(screen.queryByText('Scolarité')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Garde alternée' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Fiscalement à charge' }));

    expect(screen.getByText('Scolarité')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Garde alternée' })).toBeVisible();
  });

  it('révèle le type d’adoption uniquement quand l’enfant est adopté', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un enfant' }));

    expect(screen.queryByRole('button', { name: 'Adoption plénière' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Enfant adopté' }));

    expect(screen.getByRole('button', { name: 'Adoption plénière' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Adoption simple' })).toBeVisible();
  });

  it('révèle la portée de renonciation uniquement quand l’enfant y renonce', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un enfant' }));

    expect(screen.queryByRole('button', { name: 'Des deux parents' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Renonçant à la succession' }));

    expect(screen.getByRole('button', { name: 'Des deux parents' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Du client' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Du conjoint' })).toBeVisible();
  });

  it('rend une carte proche allégée (parent) sans qualification fiscale', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un proche' }));

    expect(screen.getByText('Situation civile & fiscale')).toBeVisible();
    expect(screen.getByRole('button', { name: 'En situation de handicap' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Fiscalement à charge' })).toBeNull();
    expect(screen.queryByText('Scolarité')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Renonçant à la succession' })).toBeNull();
  });

  it('affiche le tag de cohabitation dans le panneau civil des frères et sœurs', () => {
    renderDrawer((audit) => {
      audit.situationFamiliale.proches = [
        {
          id: 'proche-frere',
          lienParente: 'frere_soeur',
          prenom: 'Marc',
          nom: 'Martin',
          dateNaissance: '1978-01-01',
          rattachement: 'client',
        },
      ];
    });

    expect(screen.getByText('Situation civile & fiscale')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Vivant sous le même toit' })).toBeVisible();
  });

  it('désactive le rattachement d’un petit-enfant sans enfant déclaré', () => {
    const proche: ProcheInfo = {
      id: 'proche-pe',
      lienParente: 'petit_enfant',
      prenom: '',
      dateNaissance: '',
    };
    renderDrawer((audit) => {
      audit.situationFamiliale.proches = [proche];
    });

    expect(screen.getByText('Ajoutez d’abord un enfant')).toBeVisible();
  });

  it('n’expose pas de champ « date de décès » (statut booléen seulement)', async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un enfant' }));

    expect(screen.getByRole('button', { name: 'Indiquer un décès' })).toBeVisible();
    expect(screen.queryByLabelText(/date de décès/i)).toBeNull();
    expect(screen.getAllByLabelText('Date de naissance')).toHaveLength(1);
  });
});
