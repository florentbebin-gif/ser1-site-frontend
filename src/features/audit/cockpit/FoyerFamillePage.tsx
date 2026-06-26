import { useMemo, useState, type ReactElement } from 'react';

import type { DossierAudit } from '@/domain/audit/types';
import { IconBriefcase, IconChevronRight, IconGift, IconNetwork, IconUsers } from '@/icons/ui';

import { AuditCockpitShell } from '../components/AuditCockpitShell';
import { FoyerFiliation } from '../components/FoyerFiliation';
import type { AuditCockpitPageProps, SummaryCardData } from './auditCockpitShared';
import {
  fullName,
  formatDate,
  hasCompletePerson,
  labelForOption,
  REGIME_OPTIONS,
  SITUATION_OPTIONS,
  SummaryCardGrid,
} from './auditCockpitShared';
import { FoyerSummary } from './FoyerSummary';
import {
  FiliationDrawer,
  ProfessionDrawer,
  RegimeDonationsDrawer,
  SituationFamilialeDrawer,
} from './FoyerFamilleDrawers';
import { relationLabel } from './filiationConfig';

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
      title="Foyer & famille"
      subtitle="Cartes de synthèse et de saisie du foyer."
      actions={
        <button
          type="button"
          className="audit-cockpit__primary-action"
          onClick={() => onSelectSection('actifs')}
        >
          <span>Continuer l’audit</span>
          <IconChevronRight />
        </button>
      }
      onSelectSection={onSelectSection}
    >
      <section className="audit-foyer-pivot" aria-label="Synthèse pivot du foyer">
        <FoyerSummary dossier={dossier} />
        <FoyerMiniFiliation viewModel={viewModel} />
      </section>
      <section className="audit-foyer-sections" aria-labelledby="audit-foyer-sections-title">
        <header className="audit-foyer-section-head">
          <h2 id="audit-foyer-sections-title">Saisie du foyer</h2>
        </header>
        <SummaryCardGrid cards={cards} variant="tiles" />
      </section>
      <section
        className="audit-cockpit__summary-band sim-band"
        aria-label="Périmètre foyer et famille"
      >
        <p>
          Données déclaratives F1, non consolidées. Les calculs patrimoniaux et successoraux restent
          hors périmètre de cette page.
        </p>
      </section>
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
        onSave={(enfants, proches) => {
          updateDossier((previous) => ({
            ...previous,
            situationFamiliale: { ...previous.situationFamiliale, enfants, proches },
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
        onSave={(mr, mme) => {
          updateDossier((previous) => ({
            ...previous,
            situationFamiliale: {
              ...previous.situationFamiliale,
              mr,
              mme,
            },
          }));
          setDrawer(null);
        }}
      />
    </AuditCockpitShell>
  );
}

function FoyerMiniFiliation({
  viewModel,
}: {
  viewModel: AuditCockpitPageProps['viewModel'];
}): ReactElement {
  const { principal, conjoint, enfants, filiationHasData } = viewModel.synthese;
  return (
    <section className="audit-foyer-filiation" aria-labelledby="audit-foyer-filiation-title">
      <header className="audit-foyer-card-head">
        <div className="audit-foyer-card-head__main">
          <span className="audit-foyer-card-head__icon" aria-hidden="true">
            <IconNetwork />
          </span>
          <h2 id="audit-foyer-filiation-title">Filiation & proches</h2>
        </div>
      </header>
      <div className="audit-foyer-filiation__canvas">
        <FoyerFiliation
          principal={principal}
          conjoint={conjoint}
          enfants={enfants}
          hasData={filiationHasData}
          mode="compact"
        />
      </div>
    </section>
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
  const proches = situationFamiliale.proches ?? [];
  const prochesComplete = proches.filter((proche) => proche.prenom.trim());
  const hasFiliationData = situationFamiliale.enfants.length > 0 || proches.length > 0;
  const filiationCounts = [
    situationFamiliale.enfants.length > 0 ? `${situationFamiliale.enfants.length} enfant(s)` : '',
    proches.length > 0 ? `${proches.length} proche(s)` : '',
  ].filter(Boolean);
  const coupleStatus = new Set(['marie', 'pacse']).has(situationFamiliale.situationMatrimoniale);
  const professionKnown = [
    situationFamiliale.mr.profession,
    situationFamiliale.mme?.profession,
  ].filter((profession): profession is string => Boolean(profession?.trim()));
  const isMarried = situationFamiliale.situationMatrimoniale === 'marie';
  const hasTransmissionData =
    situationCivile.donations.length > 0 || situationCivile.testaments.length > 0;
  const regimeSummary =
    isMarried && situationCivile.regimeMatrimonial
      ? labelForOption(REGIME_OPTIONS, situationCivile.regimeMatrimonial)
      : hasTransmissionData
        ? [
            situationCivile.donations.length > 0
              ? `${situationCivile.donations.length} donation(s)`
              : '',
            situationCivile.testaments.length > 0
              ? `${situationCivile.testaments.length} testament(s)`
              : '',
          ]
            .filter(Boolean)
            .join(' · ')
        : isMarried
          ? 'Régime à compléter'
          : 'Libéralités à qualifier';

  return [
    {
      id: 'situation-familiale',
      title: 'Situation familiale',
      status: hasPrincipal ? 'complet' : situationKnown ? 'partiel' : 'vide',
      summaryLine: [
        labelForOption(SITUATION_OPTIONS, situationFamiliale.situationMatrimoniale),
        fullName(situationFamiliale.mr) || 'identité à compléter',
      ].join(' · '),
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
      title: 'Filiation & proches',
      status: !hasFiliationData
        ? 'vide'
        : childrenComplete.length === situationFamiliale.enfants.length &&
            prochesComplete.length === proches.length
          ? 'complet'
          : 'partiel',
      summaryLine: hasFiliationData
        ? `${filiationCounts.join(' · ')} renseigné(s)`
        : 'Aucun enfant ni proche renseigné',
      known: [
        ...situationFamiliale.enfants.map((enfant) =>
          [enfant.prenom || 'Enfant à nommer', enfant.estCommun ? 'commun' : 'union précédente']
            .filter(Boolean)
            .join(' · '),
        ),
        ...proches.map((proche) =>
          [proche.prenom || 'Proche à nommer', relationLabel(proche.lienParente)]
            .filter(Boolean)
            .join(' · '),
        ),
      ],
      missing: [
        ...situationFamiliale.enfants.flatMap((enfant, index) => [
          !enfant.prenom.trim() ? `Prénom enfant ${index + 1}` : '',
          !enfant.dateNaissance.trim() ? `Date de naissance enfant ${index + 1}` : '',
        ]),
        ...proches.flatMap((proche, index) =>
          !proche.prenom.trim() ? [`Prénom proche ${index + 1}`] : [],
        ),
      ].filter(Boolean),
      icon: <IconNetwork />,
      ctaLabel: hasFiliationData ? 'Modifier' : 'Compléter',
      onAction: () => openDrawer('filiation'),
    },
    {
      id: 'regime-donations',
      title: 'Libéralités & transmission',
      status:
        (isMarried && situationCivile.regimeMatrimonial) || hasTransmissionData
          ? 'complet'
          : isMarried
            ? 'partiel'
            : 'vide',
      summaryLine: regimeSummary,
      known: [
        isMarried && situationCivile.regimeMatrimonial
          ? labelForOption(REGIME_OPTIONS, situationCivile.regimeMatrimonial)
          : '',
        situationCivile.donations.length > 0
          ? `${situationCivile.donations.length} donation(s) synthétique(s)`
          : '',
        situationCivile.testaments.length > 0
          ? `${situationCivile.testaments.length} testament(s) synthétique(s)`
          : '',
      ].filter(Boolean),
      missing: [
        isMarried && !situationCivile.regimeMatrimonial ? 'Régime matrimonial' : '',
        situationCivile.donations.some(
          (donation) => !donation.donataire && !donation.beneficiaire.trim(),
        )
          ? 'Donataire donation'
          : '',
      ].filter(Boolean),
      alert:
        isMarried && !situationCivile.regimeMatrimonial
          ? 'Le régime est requis pour qualifier le foyer.'
          : undefined,
      icon: <IconGift />,
      ctaLabel: situationCivile.regimeMatrimonial || hasTransmissionData ? 'Modifier' : 'Compléter',
      ctaTone: situationCivile.regimeMatrimonial || hasTransmissionData ? undefined : 'required',
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
      summaryLine: buildProfessionSummary(professionKnown),
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

function buildProfessionSummary(professions: string[]): string {
  const cleaned = professions.map((profession) => profession.trim()).filter(Boolean);
  if (cleaned.length === 0) return 'Professions à compléter';
  const unique = Array.from(new Set(cleaned));
  if (cleaned.length === 1) return cleaned[0] ?? 'Profession renseignée';
  if (unique.length === 1) return `${cleaned.length} ${pluralizeLabel(unique[0]!)}`;
  return `${cleaned.length} situations renseignées`;
}

function pluralizeLabel(label: string): string {
  if (/[sx]$/i.test(label)) return label;
  return `${label}s`;
}
