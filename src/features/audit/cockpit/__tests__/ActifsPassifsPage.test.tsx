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
    expect(screen.getByRole('dialog', { name: 'Ajouter un actif' })).toHaveClass('sim-drawer--md');
  });

  it('affiche une seule colonne de détention pour une personne seule', () => {
    renderPage((audit) => {
      audit.situationFamiliale.situationMatrimoniale = 'celibataire';
      audit.actifs = [
        {
          id: 'a1',
          type: 'pea',
          libelle: 'PEA',
          valeur: 50000,
          proprietaire: 'mr',
        },
      ];
    });

    const inventory = screen.getByRole('region', { name: 'Inventaire déclaré' });
    expect(inventory.querySelectorAll('.audit-detention-head__label')).toHaveLength(1);
    expect(within(inventory).queryByText('Commun')).not.toBeInTheDocument();
    const ownerHead = inventory.querySelector('.audit-detention-head');
    expect(ownerHead).not.toBeNull();
    expect(within(ownerHead as HTMLElement).getByText(/50\s000\s€/)).toHaveClass(
      'audit-detention-head__sum',
    );

    const actifRow = screen.getByRole('button', { name: 'Modifier PEA' });
    expect(actifRow.querySelectorAll('.audit-matrix__amount')).toHaveLength(1);
    expect(actifRow.querySelector('.audit-matrix__cell-total')).toBeNull();
  });

  it('résume par carte et ne signale que les incohérences sur les lignes', async () => {
    renderPage((audit) => {
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.mme = { prenom: 'Tati', nom: 'Dupont', dateNaissance: '' };
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
    const inventory = screen.getByRole('region', { name: 'Inventaire déclaré' });
    expect(
      within(inventory).getByRole('heading', { level: 3, name: 'Actifs · Détention' }),
    ).toBeInTheDocument();
    expect(
      within(inventory).getByRole('heading', { level: 3, name: 'Actifs' }),
    ).toBeInTheDocument();
    expect(inventory.querySelector('.audit-inventory-side__matrix-head')).toBeInTheDocument();
    expect(inventory.querySelector('.audit-detention-head__avatars')).toBeInTheDocument();
    expect(
      within(inventory)
        .getAllByText('Tati')
        .some((node) => node.classList.contains('audit-detention-head__label')),
    ).toBe(true);
    expect(
      within(inventory)
        .getAllByText('Commun')
        .some((node) => node.classList.contains('audit-detention-head__label')),
    ).toBe(true);
    const communHead = Array.from(inventory.querySelectorAll('.audit-detention-head')).find(
      (node) => within(node as HTMLElement).queryByText('Commun'),
    );
    expect(communHead).toBeDefined();
    expect(within(communHead as HTMLElement).getByText(/300\s000\s€/)).toHaveClass(
      'audit-detention-head__sum',
    );
    expect(within(inventory).getByRole('button', { name: 'Ajouter un actif' })).toBeInTheDocument();
    expect(
      within(inventory).getByRole('button', { name: 'Ajouter un passif' }),
    ).toBeInTheDocument();

    // La ligne cohérente ne porte aucune pastille.
    const actifRow = screen.getByRole('button', { name: 'Modifier Résidence principale' });
    expect(within(actifRow).queryByText('À vérifier')).toBeNull();
    expect(within(actifRow).getByText('Commun')).toHaveClass('audit-matrix__owner-tag');
    expect(actifRow.querySelectorAll('.audit-matrix__amount')).toHaveLength(3);
    expect(actifRow.querySelector('.audit-matrix__cell-total')).toBeInTheDocument();

    await userEvent.click(
      within(inventory).getByRole('button', {
        name: 'Afficher Passifs · Détention & couverture',
      }),
    );
    const passifRow = screen.getByRole('button', { name: 'Modifier Prêt incohérent' });
    // Emprunt incohérent (CRD > capital initial) → pastille « À vérifier ».
    expect(within(passifRow).getByText('À vérifier')).toBeInTheDocument();
    expect(within(passifRow).getByText('Commun')).toHaveClass('audit-matrix__owner-tag');
    expect(passifRow.querySelectorAll('.audit-matrix__amount')).toHaveLength(3);
    expect(passifRow.querySelector('.audit-matrix__cell-total')).toBeInTheDocument();
    expect(within(inventory).getByText('Couverture décès')).toBeInTheDocument();

    await userEvent.click(passifRow);
    expect(screen.getByRole('dialog', { name: 'Modifier un passif' })).toBeVisible();
  });

  it('ouvre un drawer passif unifié avec choix de la nature', async () => {
    renderPage();

    await userEvent.click(screen.getAllByRole('button', { name: 'Ajouter un passif' })[0]!);
    const dialog = screen.getByRole('dialog', { name: 'Ajouter un passif' });
    expect(dialog).toHaveClass('sim-drawer--lg');
    expect(within(dialog).getByText('Nature du passif')).toBeInTheDocument();
    expect(within(dialog).getByText('Propriétaire')).toBeInTheDocument();
    expect(within(dialog).getByText('Assurance & coût du crédit')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Nature du passif' }));
    await userEvent.click(screen.getByRole('option', { name: 'Autre dette' }));
    expect(dialog).toHaveClass('sim-drawer--md');
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
    expect(dialog).toHaveClass('sim-drawer--md');
    expect(within(dialog).getByText('Analyse économique')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Propriétaire' }));
    expect(screen.getByRole('option', { name: 'Client principal' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Nina Dupont' })).toBeVisible();
  });

  it('expose les vues d’analyse actif et de détails crédit sans inventer de qualification', async () => {
    renderPage((audit) => {
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.mme = { prenom: 'Tati', nom: 'Dupont', dateNaissance: '' };
      audit.actifs = [
        {
          id: 'a1',
          type: 'assurance_vie',
          libelle: 'Assurance-vie',
          valeur: 100000,
          proprietaire: 'mr',
          tauxRendement: 2.5,
          horizonPlacement: 'lt',
          profilRisque: 'dynamique',
          delaiRealisation: 'differe',
        },
      ];
      audit.passif.emprunts = [
        {
          id: 'p1',
          libelle: 'Crédit résidence',
          type: 'immobilier',
          proprietaire: 'commun',
          capitalInitial: 200000,
          capitalRestantDu: 150000,
          mensualite: 900,
          tauxInteret: 2.1,
          dateDebut: '2024-01-01',
          dateFin: '2034-01-01',
          assuranceEmprunteur: {
            quotiteMr: 100,
            quotiteMme: 100,
            primeMensuelle: 45,
            taea: 0.35,
          },
          echeanceAssuranceComprise: 945,
          taeg: 2.35,
          coutGlobalCredit: 24000,
          coutGlobalAssurance: 5400,
        },
      ];
    });

    const inventory = screen.getByRole('region', { name: 'Inventaire déclaré' });
    await userEvent.click(
      within(inventory).getByRole('button', { name: 'Afficher Actifs · Analyse' }),
    );
    expect(
      within(inventory).getByRole('heading', { name: 'Actifs · Analyse' }),
    ).toBeInTheDocument();
    expect(within(inventory).getByText('Long terme')).toBeInTheDocument();
    expect(within(inventory).getByText('Dynamique')).toBeInTheDocument();
    expect(within(inventory).getByText(/2,5\s%/)).toBeInTheDocument();
    expect(within(inventory).getAllByText('À qualifier').length).toBeGreaterThan(0);

    await userEvent.click(
      within(inventory).getByRole('button', { name: 'Afficher Passifs · Détails crédits' }),
    );
    expect(
      within(inventory).getByRole('heading', { name: 'Passifs · Détails crédits' }),
    ).toBeInTheDocument();
    expect(within(inventory).getByText(/Mensualité/)).toBeInTheDocument();
    expect(within(inventory).getByText(/945\s€/)).toBeInTheDocument();
    expect(within(inventory).getByText(/2,35\s%/)).toBeInTheDocument();
  });
});
