// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyDossier, type DossierAudit, type PersonInfo } from '@/domain/audit/types';

import { ProfessionDrawer } from '../ProfessionDrawer';

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({ colors: {} }),
}));

function renderDrawer({
  mutate,
  onSave,
}: {
  mutate?: (audit: DossierAudit) => void;
  onSave?: (mr: PersonInfo, mme: PersonInfo | undefined) => void;
} = {}) {
  const audit = createEmptyDossier();
  mutate?.(audit);
  const saveHandler = onSave ?? vi.fn<(mr: PersonInfo, mme: PersonInfo | undefined) => void>();
  const result = render(
    <ProfessionDrawer open dossier={audit} onClose={vi.fn()} onSave={saveHandler} />,
  );
  return { ...result, onSave: saveHandler };
}

async function selectOption(label: string, option: string) {
  fireEvent.click(screen.getAllByLabelText(label)[0]);
  await userEvent.click(screen.getByRole('option', { name: option }));
}

describe('ProfessionDrawer', () => {
  it('affiche les profils avec nom, fallback et avatar comme dans Libéralités', () => {
    renderDrawer({
      mutate: (audit) => {
        audit.situationFamiliale.situationMatrimoniale = 'marie';
        audit.situationFamiliale.mr.prenom = 'Jean';
        audit.situationFamiliale.mr.nom = 'Martin';
        audit.situationFamiliale.mr.avatarKind = 'homme';
        audit.situationFamiliale.mme = {
          prenom: 'Claire',
          nom: 'Durand',
          dateNaissance: '',
          avatarKind: 'femme',
        };
      },
    });

    expect(screen.getByText('Jean Martin')).toBeVisible();
    expect(screen.getByText('Claire Durand')).toBeVisible();
    expect(screen.getByText('Client principal')).toBeVisible();
    expect(screen.getByText('Conjoint')).toBeVisible();
    expect(
      document.body.querySelectorAll('.audit-profession-identity .audit-avatar-badge'),
    ).toHaveLength(2);
  });

  it('affiche le statut social comme premier pivot sans modules avancés', async () => {
    renderDrawer();

    expect(
      screen.getByText('Statut professionnel, affiliation et paramètres d’activité par personne.'),
    ).toBeVisible();
    expect(
      screen.queryByText('Statut social, caisse et paramètres conditionnels par personne.'),
    ).toBeNull();
    expect(screen.queryByText('Modules avancés')).toBeNull();
    expect(screen.getAllByLabelText('Statut social')[0]).toBeVisible();
    expect(screen.queryByText('Profession (libellé)')).toBeNull();
    expect(screen.queryByText('Nature de l’activité')).toBeNull();
    expect(screen.queryByText('Caisse d’affiliation')).toBeNull();

    fireEvent.click(screen.getAllByLabelText('Statut social')[0]);

    expect(screen.getByText('Activités salariées')).toBeVisible();
    expect(screen.getByText('Activités chef d’entreprise')).toBeVisible();
    expect(screen.getByText('Autres')).toBeVisible();
    expect(screen.getByRole('option', { name: 'Salarié cadre du secteur privé' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Fonctionnaire' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Micro entrepreneur' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'TNS Individuel' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Chômage' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Maladie / invalidité' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Retraité' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Sans activité' })).toBeVisible();
  });

  it('affiche la cascade TNS individuel avec mode IS, caisse médicale et CPAM conditionnelle', async () => {
    renderDrawer({
      mutate: (audit) => {
        audit.situationFamiliale.mr.statutSocial = 'tns_individuel';
        audit.situationFamiliale.mr.modeExercice = 'societe_is';
        audit.situationFamiliale.mr.caisseRetraite = 'carmf';
        audit.situationFamiliale.mr.statutConventionnel = 'non_conventionne';
      },
    });

    expect(screen.getByLabelText('Mode d’exercice')).toHaveTextContent('En société à l’IS');
    expect(screen.getByText('% rémunération du mandat')).toBeVisible();
    expect(screen.getByLabelText('Caisse d’affiliation')).toHaveTextContent('CARMF');
    expect(screen.getByLabelText('Conventionné')).toHaveTextContent('Non');
    expect(screen.queryByText('Taux de prise en charge CPAM')).toBeNull();

    await selectOption('Conventionné', 'Secteur 1');

    expect(screen.getByText('Taux de prise en charge CPAM')).toBeVisible();
    expect(screen.getByText('PLR')).toHaveClass('audit-status-badge');
    expect(screen.getByText('Santé')).toHaveClass('audit-status-badge');
    expect(screen.queryByText('Avantages en nature divers')).toBeNull();
  });

  it('masque la rémunération du mandat pour SSI commerçant, SSI artisan et MSA', () => {
    for (const caisseRetraite of ['ssi_commercant', 'ssi_artisan', 'msa'] as const) {
      const { unmount } = renderDrawer({
        mutate: (audit) => {
          audit.situationFamiliale.mr.statutSocial = 'tns_individuel';
          audit.situationFamiliale.mr.modeExercice = 'societe_is';
          audit.situationFamiliale.mr.caisseRetraite = caisseRetraite;
          audit.situationFamiliale.mr.remunerationMandatPct = 5;
        },
      });

      expect(screen.getByLabelText('Mode d’exercice')).toHaveTextContent('En société à l’IS');
      expect(screen.queryByText('% rémunération du mandat')).toBeNull();

      unmount();
    }
  });

  it('limite un salarié ou fonctionnaire au libellé de profession', () => {
    renderDrawer({
      mutate: (audit) => {
        audit.situationFamiliale.mr.statutSocial =
          'salarie_cadre_prive' as PersonInfo['statutSocial'];
        audit.situationFamiliale.mr.profession = 'Directeur financier';
        audit.situationFamiliale.mr.caisseRetraite = 'carmf';
        audit.situationFamiliale.mr.statutConventionnel = 'secteur_1';
      },
    });

    expect(screen.getByLabelText('Statut social')).toHaveTextContent(
      'Salarié cadre du secteur privé',
    );
    expect(screen.getByText('Profession (libellé)')).toBeVisible();
    expect(screen.getByDisplayValue('Directeur financier')).toBeVisible();
    expect(screen.queryByText('Caisse d’affiliation')).toBeNull();
    expect(screen.queryByText('Mode d’exercice')).toBeNull();
    expect(screen.queryByText('Conventionné')).toBeNull();
    expect(screen.queryByText('Paramétrage de la fiche de paie')).toBeNull();
  });

  it('masque le libellé de profession pour les statuts non actifs', () => {
    for (const statutSocial of [
      'chomage',
      'maladie_invalidite',
      'retraite',
      'militaire',
      'sans_activite',
    ] as const) {
      const { unmount } = renderDrawer({
        mutate: (audit) => {
          audit.situationFamiliale.mr.statutSocial = statutSocial as PersonInfo['statutSocial'];
          audit.situationFamiliale.mr.profession = 'Ancien libellé';
        },
      });

      expect(screen.queryByText('Profession (libellé)')).toBeNull();
      expect(screen.queryByDisplayValue('Ancien libellé')).toBeNull();
      expect(screen.queryByText('Caisse d’affiliation')).toBeNull();

      unmount();
    }
  });

  it('reprend les champs d’un entrepreneur individuel pour micro entrepreneur sans mode d’exercice', () => {
    renderDrawer({
      mutate: (audit) => {
        audit.situationFamiliale.mr.statutSocial =
          'micro_entrepreneur' as PersonInfo['statutSocial'];
        audit.situationFamiliale.mr.caisseRetraite = 'carmf';
        audit.situationFamiliale.mr.statutConventionnel = 'secteur_1';
        audit.situationFamiliale.mr.tauxPriseEnChargeCpam = 100;
      },
    });

    expect(screen.getByLabelText('Statut social')).toHaveTextContent('Micro entrepreneur');
    expect(screen.getByText('Profession (libellé)')).toBeVisible();
    expect(screen.queryByText('Mode d’exercice')).toBeNull();
    expect(screen.getByLabelText('Caisse d’affiliation')).toHaveTextContent('CARMF');
    expect(screen.getByLabelText('Conventionné')).toHaveTextContent('Secteur 1');
    expect(screen.getByText('Taux de prise en charge CPAM')).toBeVisible();
    expect(screen.getByText('PLR')).toHaveClass('audit-status-badge');
    expect(screen.getByText('Santé')).toHaveClass('audit-status-badge');
    expect(screen.queryByText('Avantages en nature divers')).toBeNull();
  });

  it('affiche le badge PLR catégorisé pour les caisses libérales réglementées automatiques', () => {
    const carmf = renderDrawer({
      mutate: (audit) => {
        audit.situationFamiliale.mr.statutSocial = 'tns_article_62';
        audit.situationFamiliale.mr.caisseRetraite = 'carmf';
      },
    });

    expect(screen.getByText('PLR')).toHaveClass('audit-status-badge');
    expect(screen.getByText('Santé')).toHaveClass('audit-status-badge');
    carmf.unmount();

    renderDrawer({
      mutate: (audit) => {
        audit.situationFamiliale.mr.statutSocial = 'tns_article_62';
        audit.situationFamiliale.mr.caisseRetraite = 'msa';
      },
    });

    expect(screen.queryByText('PLR')).toBeNull();
  });

  it('rend le badge PLR activable pour la CIPAV avec choix de catégorie', async () => {
    const onSave = vi.fn<(mr: PersonInfo, mme: PersonInfo | undefined) => void>();
    renderDrawer({
      onSave,
      mutate: (audit) => {
        audit.situationFamiliale.mr.statutSocial = 'tns_article_62';
        audit.situationFamiliale.mr.caisseRetraite = 'cipav';
      },
    });

    expect(screen.queryByLabelText('Badge Profession libérale réglementée')).toBeNull();
    expect(screen.getByRole('button', { name: 'PLR' })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'PLR' }));

    expect(screen.getByRole('button', { name: 'PLR' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Catégorie PLR')).toHaveTextContent('Non renseigné');

    fireEvent.click(screen.getByLabelText('Catégorie PLR'));
    await userEvent.click(screen.getByRole('option', { name: 'Technique et cadre de vie' }));

    expect(
      screen
        .getAllByText('Technique et cadre de vie')
        .some((element) => element.classList.contains('audit-status-badge')),
    ).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      professionLiberaleReglementee: true,
      professionLiberaleCategorie: 'technique_cadre_vie',
    });
  });

  it('aligne les cartes de profils en haut même quand un conjoint a peu de champs', () => {
    renderDrawer({
      mutate: (audit) => {
        audit.situationFamiliale.situationMatrimoniale = 'marie';
        audit.situationFamiliale.mr.prenom = 'Jean';
        audit.situationFamiliale.mr.nom = 'Martin';
        audit.situationFamiliale.mr.statutSocial = 'tns_individuel';
        audit.situationFamiliale.mr.caisseRetraite = 'carmf';
        audit.situationFamiliale.mme = {
          prenom: 'Claire',
          nom: 'Martin',
          dateNaissance: '',
          statutSocial: 'sans_activite',
        };
      },
    });

    const columns = document.body.querySelector('.audit-profession-columns');
    const sections = document.body.querySelectorAll('.audit-profession-card');

    expect(columns).toHaveClass('audit-profession-columns');
    expect(sections).toHaveLength(2);
    expect(sections[0]).toHaveAttribute('data-density', 'rich');
    expect(sections[1]).toHaveAttribute('data-density', 'simple');
  });

  it('affiche les champs spécifiques de caisse et nettoie avant sauvegarde', async () => {
    const onSave = vi.fn<(mr: PersonInfo, mme: PersonInfo | undefined) => void>();
    renderDrawer({
      onSave,
      mutate: (audit) => {
        audit.situationFamiliale.mr.statutSocial = 'tns_article_62';
        audit.situationFamiliale.mr.caisseRetraite = 'crn';
        audit.situationFamiliale.mr.commissionsBrutes = 120000;
        audit.situationFamiliale.mr.atexa = 'd';
        audit.situationFamiliale.mr.moyenneProduitsEtude = 450000;
      },
    });

    expect(screen.getByText('Prestation de serment avant 2014')).toBeVisible();
    expect(screen.getByText('Régime de Colmar et Metz')).toBeVisible();
    expect(screen.getByText('Moyenne des produits de l’étude')).toBeVisible();
    expect(screen.queryByText('Commissions brutes')).toBeNull();
    expect(screen.queryByText('ATEXA')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const [mr] = onSave.mock.calls[0];
    expect(mr).toMatchObject({
      caisseRetraite: 'crn',
      moyenneProduitsEtude: 450000,
      commissionsBrutes: undefined,
      atexa: undefined,
    });
  });

  it('réserve le paramétrage fiche de paie à l’assimilé salarié', async () => {
    renderDrawer({
      mutate: (audit) => {
        audit.situationFamiliale.mr.statutSocial = 'assimile_salarie';
        audit.situationFamiliale.mr.caisseRetraite = 'carmf';
      },
    });

    expect(screen.getByLabelText('Caisse d’affiliation')).toHaveTextContent('Régime général');
    expect(screen.queryByText('Avantages en nature divers')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Paramétrage de la fiche de paie' }));

    const modal = screen.getByRole('dialog', { name: 'Paramétrage de la fiche de paie' });
    expect(within(modal).getByText('Taux d’activité')).toBeVisible();
    expect(within(modal).getByText('Accident du travail')).toBeVisible();
    expect(within(modal).getByLabelText('Affiliation CNBF')).toHaveTextContent('Non');

    fireEvent.click(within(modal).getByLabelText('Affiliation CNBF'));
    await userEvent.click(screen.getByRole('option', { name: 'Oui' }));

    expect(within(modal).getByText('Ancienneté CNBF')).toBeVisible();
    expect(within(modal).getByText('Classe retraite CNBF')).toBeVisible();
  });
});
