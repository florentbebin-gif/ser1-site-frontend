// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyDossier, type DossierAudit } from '@/domain/audit/types';

import { RegimeDonationsDrawer } from '../RegimeDonationsDrawer';

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({ colors: {} }),
}));

function renderDrawer(mutate?: (audit: DossierAudit) => void) {
  const audit = createEmptyDossier();
  mutate?.(audit);
  return render(<RegimeDonationsDrawer open dossier={audit} onClose={vi.fn()} onSave={vi.fn()} />);
}

describe('RegimeDonationsDrawer', () => {
  it('garde le titre canonique aligné avec la carte pour un couple marié', () => {
    renderDrawer((audit) => {
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.mme = {
        prenom: 'Camille',
        nom: 'Martin',
        dateNaissance: '1982-02-02',
        avatarKind: 'femme',
      };
    });

    expect(screen.getByRole('heading', { name: 'Libéralités & transmission' })).toBeVisible();
  });

  it('masque régime, DDV et avantages matrimoniaux pour un célibataire', () => {
    renderDrawer();

    expect(screen.queryByText('Régime matrimonial')).toBeNull();
    expect(screen.queryByText(/DDV/i)).toBeNull();
    expect(screen.queryByText('Avantages matrimoniaux')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ajouter une donation' })).toBeVisible();
    expect(screen.getByText('Testament')).toBeVisible();
  });

  it('masque le régime matrimonial, les DDV et les avantages pour un PACS', () => {
    renderDrawer((audit) => {
      audit.situationFamiliale.situationMatrimoniale = 'pacse';
      audit.situationFamiliale.mme = {
        prenom: 'Camille',
        nom: 'Martin',
        dateNaissance: '1982-02-02',
      };
    });

    expect(screen.queryByText('Régime matrimonial')).toBeNull();
    expect(screen.queryByText(/DDV/i)).toBeNull();
    expect(screen.queryByText('Avantages matrimoniaux')).toBeNull();
    expect(screen.getByText('Testament')).toBeVisible();
  });

  it('affiche les DDV mais pas les avantages matrimoniaux pour un régime séparatiste', () => {
    renderDrawer((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Alice',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
        avatarKind: 'femme',
      };
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.mme = {
        prenom: 'Camille',
        nom: 'Martin',
        dateNaissance: '1982-02-02',
      };
      audit.situationCivile.regimeMatrimonial = 'separation_biens';
    });

    expect(screen.getByText('Protection du conjoint survivant')).toBeVisible();
    expect(screen.getAllByText('Alice Martin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Camille Martin').length).toBeGreaterThan(0);
    expect(screen.queryByText('Notaire')).toBeNull();
    expect(screen.queryByText('Contrat de mariage')).toBeNull();
    expect(screen.queryByText('Avantages matrimoniaux')).toBeNull();
  });

  it('garde un testament vierge inactif par défaut', () => {
    renderDrawer((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Alice',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
      };
    });

    expect(screen.getByRole('button', { name: 'Testament actif' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByText('Aucun testament déclaré pour cette personne.')).toBeVisible();
    expect(screen.queryByText('Quote-part')).toBeNull();
  });

  it('n’expose pas de création de personne ni de bénéficiaire libre dans les libéralités', () => {
    renderDrawer((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Alice',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
      };
      audit.situationFamiliale.enfants = [
        {
          id: 'enfant-lou',
          prenom: 'Lou',
          nom: 'Martin',
          dateNaissance: '2010-03-03',
          estCommun: true,
        },
      ];
      audit.situationCivile.donations = [
        {
          id: 'donation-1',
          type: 'donation_simple',
          date: '2020-01-01',
          montant: 15000,
          beneficiaire: 'Lou',
        },
      ];
    });

    expect(screen.queryByRole('button', { name: /ajouter un enfant/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /ajouter un proche/i })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Bénéficiaire' })).toBeNull();
    expect(screen.getByText('Donataire')).toBeVisible();
    expect(screen.queryByText('Montant')).toBeNull();
    expect(screen.getAllByText('Valeur à la donation')).toHaveLength(1);
  });
});
