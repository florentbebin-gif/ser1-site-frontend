// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyDossier, type DossierAudit } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import { buildAuditLandingViewModel } from '../../auditLandingViewModel';
import { ActifsPassifsPage } from '../ActifsPassifsPage';

const NOW = new Date('2026-06-27T10:00:00.000Z');

function renderPage(mutate?: (audit: DossierAudit) => void) {
  const audit = createEmptyDossier();
  mutate?.(audit);
  const viewModel = buildAuditLandingViewModel(
    buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
    { now: NOW },
  );

  return render(
    <ActifsPassifsPage
      dossier={audit}
      viewModel={viewModel}
      updateDossier={vi.fn()}
      onSelectSection={vi.fn()}
    />,
  );
}

describe('ActifsPassifsPage', () => {
  it('affiche un état vide invitant, sans jargon, et ouvre le drawer d’ajout', async () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Actifs / passifs' })).toBeInTheDocument();
    expect(screen.getByText('Commencez l’inventaire')).toBeInTheDocument();
    expect(screen.queryByText(/patrimoine net/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/F3/)).not.toBeInTheDocument();

    const inventory = screen.getByRole('region', { name: 'Inventaire déclaré' });
    expect(inventory.querySelector('.audit-detention-head__avatars')).toBeNull();
    expect(within(inventory).queryByText('Client')).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Ajouter un actif' })[0]!);
    expect(screen.getByRole('dialog', { name: 'Ajouter un actif' })).toBeVisible();
  });

  it('résume par carte et ne signale que les incohérences sur les lignes', async () => {
    renderPage((audit) => {
      audit.actifs = [
        {
          id: 'a1',
          type: 'residence_principale',
          libelle: 'Résidence principale',
          valeur: 300000,
          proprietaire: 'commun',
        },
      ];
      audit.passif.emprunts = [
        {
          id: 'p1',
          libelle: 'Prêt incohérent',
          type: 'immobilier',
          capitalInitial: 100000,
          capitalRestantDu: 150000,
          mensualite: 0,
          tauxInteret: 0,
          dateDebut: '',
          dateFin: '',
        },
      ];
    });

    // Carte de synthèse « Actifs » (haut) : répartition par famille.
    const actifsCard = screen.getByRole('region', { name: 'Actifs' });
    expect(within(actifsCard).getByText('Immobilier')).toBeInTheDocument();

    // Sous-section « Actifs » du tableau (h3), distincte de la carte (h2).
    expect(screen.getByRole('heading', { level: 3, name: 'Actifs' })).toBeInTheDocument();

    // Emprunt incohérent (CRD > capital initial) → pastille « À vérifier ».
    expect(screen.getAllByText('À vérifier').length).toBeGreaterThan(0);
    // La ligne cohérente ne porte aucune pastille.
    expect(
      within(screen.getByRole('button', { name: 'Modifier Résidence principale' })).queryByText(
        'À vérifier',
      ),
    ).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Modifier Prêt incohérent' }));
    expect(screen.getByRole('dialog', { name: 'Modifier un passif' })).toBeVisible();
  });

  it('ouvre un drawer passif unifié avec choix de la nature', async () => {
    renderPage();

    await userEvent.click(screen.getAllByRole('button', { name: 'Ajouter un passif' })[0]!);
    const dialog = screen.getByRole('dialog', { name: 'Ajouter un passif' });
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText('Nature du passif')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Nature du passif' }));
    expect(screen.getByRole('option', { name: 'Autre dette' })).toBeVisible();
  });

  it('permet de qualifier le propriétaire depuis le drawer actif', async () => {
    renderPage((audit) => {
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.mme = { prenom: 'Nina', nom: 'Dupont', dateNaissance: '' };
      audit.actifs = [
        {
          id: 'a1',
          type: 'livret',
          libelle: 'Livret A',
          valeur: 20000,
          proprietaire: 'commun',
        },
      ];
    });

    await userEvent.click(screen.getByRole('button', { name: 'Modifier Livret A' }));
    const dialog = screen.getByRole('dialog', { name: 'Modifier un actif' });
    expect(dialog).toBeVisible();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Propriétaire' }));
    expect(screen.getByRole('option', { name: 'Client principal' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Nina Dupont' })).toBeVisible();
  });
});
