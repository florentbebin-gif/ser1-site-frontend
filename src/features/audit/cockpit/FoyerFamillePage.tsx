import { useMemo, useState, type ReactElement } from 'react';

import type { DossierAudit } from '@/domain/audit/types';
import { IconBriefcase, IconGift, IconNetwork, IconUsers } from '@/icons/ui';

import { AuditCockpitShell } from '../components/AuditCockpitShell';
import type { AuditCockpitPageProps, SummaryCardData } from './auditCockpitShared';
import {
  fullName,
  emptyToUndefined,
  formatDate,
  hasCompletePerson,
  labelForOption,
  REGIME_OPTIONS,
  SITUATION_OPTIONS,
  SummaryCardGrid,
} from './auditCockpitShared';
import {
  FiliationDrawer,
  ProfessionDrawer,
  RegimeDonationsDrawer,
  SituationFamilialeDrawer,
} from './FoyerFamilleDrawers';

type FoyerDrawer = 'famille' | 'filiation' | 'regime' | 'profession';

export function FoyerFamillePage({
  dossier,
  viewModel,
  updateDossier,
  onSelectSection,
}: AuditCockpitPageProps): ReactElement {
  const [drawer, setDrawer] = useState<FoyerDrawer | null>(null);
  const cards = useMemo(
    () => buildFoyerCards(dossier, (nextDrawer) => setDrawer(nextDrawer)),
    [dossier],
  );

  return (
    <AuditCockpitShell
      viewModel={viewModel}
      currentSectionId="situation-familiale"
      eyebrow="Socle F1"
      title="Foyer & famille"
      subtitle="Cartes de synthèse et de saisie du foyer, raccordées au dossier patrimonial F1."
      onSelectSection={onSelectSection}
    >
      <SummaryCardGrid cards={cards} />
      <SituationFamilialeDrawer
        open={drawer === 'famille'}
        dossier={dossier}
        onClose={() => setDrawer(null)}
        onSave={(situationFamiliale) => {
          updateDossier((previous) => ({ ...previous, situationFamiliale }));
          setDrawer(null);
        }}
      />
      <FiliationDrawer
        open={drawer === 'filiation'}
        dossier={dossier}
        onClose={() => setDrawer(null)}
        onSave={(enfants) => {
          updateDossier((previous) => ({
            ...previous,
            situationFamiliale: { ...previous.situationFamiliale, enfants },
          }));
          setDrawer(null);
        }}
      />
      <RegimeDonationsDrawer
        open={drawer === 'regime'}
        dossier={dossier}
        onClose={() => setDrawer(null)}
        onSave={(situationCivile) => {
          updateDossier((previous) => ({ ...previous, situationCivile }));
          setDrawer(null);
        }}
      />
      <ProfessionDrawer
        open={drawer === 'profession'}
        dossier={dossier}
        onClose={() => setDrawer(null)}
        onSave={(mrProfession, mmeProfession) => {
          updateDossier((previous) => ({
            ...previous,
            situationFamiliale: {
              ...previous.situationFamiliale,
              mr: {
                ...previous.situationFamiliale.mr,
                profession: emptyToUndefined(mrProfession),
              },
              mme: previous.situationFamiliale.mme
                ? {
                    ...previous.situationFamiliale.mme,
                    profession: emptyToUndefined(mmeProfession),
                  }
                : undefined,
            },
          }));
          setDrawer(null);
        }}
      />
    </AuditCockpitShell>
  );
}

function buildFoyerCards(
  dossier: DossierAudit,
  openDrawer: (drawer: FoyerDrawer) => void,
): SummaryCardData[] {
  const { situationFamiliale, situationCivile } = dossier;
  const hasPrincipal = hasCompletePerson(situationFamiliale.mr);
  const couple = situationFamiliale.mme;
  const situationKnown = hasPrincipal || Boolean(situationFamiliale.dateUnion);
  const childrenComplete = situationFamiliale.enfants.filter((enfant) => enfant.prenom.trim());
  const coupleStatus = new Set(['marie', 'pacse']).has(situationFamiliale.situationMatrimoniale);
  const professionKnown = [
    situationFamiliale.mr.profession,
    situationFamiliale.mme?.profession,
  ].filter(Boolean);

  return [
    {
      id: 'situation-familiale',
      title: 'Situation familiale',
      status: hasPrincipal ? 'complet' : situationKnown ? 'partiel' : 'vide',
      known: [
        labelForOption(SITUATION_OPTIONS, situationFamiliale.situationMatrimoniale),
        fullName(situationFamiliale.mr),
        couple ? `Conjoint : ${fullName(couple) || 'à compléter'}` : '',
        situationFamiliale.dateUnion ? `Union : ${formatDate(situationFamiliale.dateUnion)}` : '',
      ].filter(Boolean),
      missing: [
        !situationFamiliale.mr.prenom.trim() ? 'Prénom client principal' : '',
        !situationFamiliale.mr.nom.trim() ? 'Nom client principal' : '',
        !situationFamiliale.mr.dateNaissance.trim() ? 'Date de naissance client principal' : '',
        coupleStatus && !couple ? 'Conjoint à renseigner' : '',
      ].filter(Boolean),
      alert:
        coupleStatus && !couple ? 'Foyer déclaré en couple sans conjoint renseigné.' : undefined,
      icon: <IconUsers />,
      ctaLabel: hasPrincipal ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('famille'),
    },
    {
      id: 'filiation',
      title: 'Filiation',
      status:
        situationFamiliale.enfants.length === 0
          ? 'vide'
          : childrenComplete.length === situationFamiliale.enfants.length
            ? 'complet'
            : 'partiel',
      known: situationFamiliale.enfants.map((enfant) =>
        [enfant.prenom || 'Enfant à nommer', enfant.estCommun ? 'commun' : 'union précédente']
          .filter(Boolean)
          .join(' · '),
      ),
      missing: situationFamiliale.enfants
        .flatMap((enfant, index) => [
          !enfant.prenom.trim() ? `Prénom enfant ${index + 1}` : '',
          !enfant.dateNaissance.trim() ? `Date de naissance enfant ${index + 1}` : '',
        ])
        .filter(Boolean),
      icon: <IconNetwork />,
      ctaLabel: situationFamiliale.enfants.length > 0 ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('filiation'),
    },
    {
      id: 'regime-donations',
      title: 'Régime matrimonial & donations',
      status:
        situationCivile.regimeMatrimonial || situationCivile.donations.length > 0
          ? 'complet'
          : coupleStatus
            ? 'partiel'
            : 'vide',
      known: [
        situationCivile.regimeMatrimonial
          ? labelForOption(REGIME_OPTIONS, situationCivile.regimeMatrimonial)
          : '',
        situationCivile.contratMariage ? 'Contrat de mariage renseigné' : '',
        situationCivile.donations.length > 0
          ? `${situationCivile.donations.length} donation(s) synthétique(s)`
          : '',
      ].filter(Boolean),
      missing: [
        coupleStatus && !situationCivile.regimeMatrimonial ? 'Régime matrimonial' : '',
        situationCivile.donations.some((donation) => !donation.beneficiaire.trim())
          ? 'Bénéficiaire donation'
          : '',
      ].filter(Boolean),
      alert:
        coupleStatus && !situationCivile.regimeMatrimonial
          ? 'Le régime est requis pour qualifier le foyer.'
          : undefined,
      icon: <IconGift />,
      ctaLabel:
        situationCivile.regimeMatrimonial || situationCivile.donations.length > 0
          ? 'Modifier'
          : 'Compléter',
      onAction: () => openDrawer('regime'),
    },
    {
      id: 'situation-professionnelle',
      title: 'Situation professionnelle',
      status:
        professionKnown.length === 0
          ? 'vide'
          : professionKnown.length === (couple ? 2 : 1)
            ? 'complet'
            : 'partiel',
      known: [
        situationFamiliale.mr.profession
          ? `${fullName(situationFamiliale.mr) || 'Client principal'} : ${situationFamiliale.mr.profession}`
          : '',
        couple?.profession ? `${fullName(couple) || 'Conjoint'} : ${couple.profession}` : '',
      ].filter(Boolean),
      missing: [
        !situationFamiliale.mr.profession?.trim() ? 'Profession client principal' : '',
        couple && !couple.profession?.trim() ? 'Profession conjoint' : '',
      ].filter(Boolean),
      icon: <IconBriefcase />,
      ctaLabel: professionKnown.length > 0 ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('profession'),
    },
  ];
}
