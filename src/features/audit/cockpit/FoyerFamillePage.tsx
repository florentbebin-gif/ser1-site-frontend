import { useMemo, useState, type ReactElement, type ReactNode } from 'react';

import type { DossierAudit } from '@/domain/audit/types';
import {
  IconBriefcase,
  IconCalendar,
  IconChevronRight,
  IconClipboardCheck,
  IconFileText,
  IconGift,
  IconHome,
  IconNetwork,
  IconShield,
  IconUsers,
} from '@/icons/ui';

import { AuditCockpitShell } from '../components/AuditCockpitShell';
import { FoyerFiliation } from '../components/FoyerFiliation';
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

interface FoyerFact {
  label: string;
  value: string;
  icon: ReactNode;
  emphasis?: boolean;
  tone?: 'missing';
}

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
  const foyerFacts = useMemo(() => buildFoyerFacts(dossier), [dossier]);

  return (
    <AuditCockpitShell
      viewModel={viewModel}
      currentSectionId="situation-familiale"
      title="Foyer & famille"
      subtitle="Cartes de synthèse et de saisie du foyer, raccordées au dossier patrimonial F1."
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
        <FoyerSummary facts={foyerFacts} />
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

function FoyerSummary({ facts }: { facts: FoyerFact[] }): ReactElement {
  return (
    <section className="audit-foyer-summary" aria-labelledby="audit-foyer-summary-title">
      <header className="audit-foyer-card-head">
        <div className="audit-foyer-card-head__main">
          <span className="audit-foyer-card-head__icon" aria-hidden="true">
            <IconHome />
          </span>
          <h2 id="audit-foyer-summary-title">Synthèse foyer</h2>
        </div>
      </header>
      <dl className="audit-key-value-grid">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="audit-key-value-grid__item"
            data-emphasis={fact.emphasis ? 'true' : undefined}
            data-tone={fact.tone}
          >
            <span className="audit-key-value-grid__icon" aria-hidden="true">
              {fact.icon}
            </span>
            <div>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <FoyerSummaryIllustration />
    </section>
  );
}

function FoyerSummaryIllustration(): ReactElement {
  return (
    <svg
      className="audit-foyer-summary__illustration"
      viewBox="0 0 150 112"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M35 62 L75 31 L115 62"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45 58 V92 H105 V58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M66 92 V72 H84 V92"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="58" cy="56" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M46 80 C48 69 68 69 70 80"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="92" cy="56" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M80 80 C82 69 102 69 104 80"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="75" cy="72" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M66 90 C68 82 82 82 84 90"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22 95 C34 102 52 102 64 95 M88 95 C101 102 121 101 132 94"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M121 78 C127 72 137 75 136 84 C134 94 123 95 119 88"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

function buildFoyerFacts(dossier: DossierAudit): FoyerFact[] {
  const { situationFamiliale, situationCivile } = dossier;
  const principal = fullName(situationFamiliale.mr);
  const conjoint = situationFamiliale.mme ? fullName(situationFamiliale.mme) : '';
  const enfants = situationFamiliale.enfants
    .map((enfant) => enfant.prenom.trim())
    .filter(Boolean)
    .join(', ');

  return [
    {
      label: 'Client principal',
      value: principal || 'À compléter',
      icon: <IconUsers />,
      emphasis: true,
      tone: principal ? undefined : 'missing',
    },
    { label: 'Conjoint', value: conjoint || 'Non renseigné', icon: <IconUsers />, emphasis: true },
    {
      label: 'Profession',
      value: situationFamiliale.mr.profession || 'Non renseignée',
      icon: <IconBriefcase />,
    },
    {
      label: 'Profession conjoint',
      value: situationFamiliale.mme?.profession || 'Non renseignée',
      icon: <IconBriefcase />,
    },
    {
      label: 'Situation',
      value: labelForOption(SITUATION_OPTIONS, situationFamiliale.situationMatrimoniale),
      icon: <IconClipboardCheck />,
    },
    {
      label: 'Union',
      value: situationFamiliale.dateUnion
        ? formatDate(situationFamiliale.dateUnion)
        : 'Non renseignée',
      icon: <IconCalendar />,
    },
    {
      label: 'Régime',
      value: situationCivile.regimeMatrimonial
        ? labelForOption(REGIME_OPTIONS, situationCivile.regimeMatrimonial)
        : 'À compléter',
      icon: <IconShield />,
      tone: situationCivile.regimeMatrimonial ? undefined : 'missing',
    },
    {
      label: 'Enfants',
      value:
        situationFamiliale.enfants.length > 0
          ? `${situationFamiliale.enfants.length} - ${enfants || 'à nommer'}`
          : 'Non renseigné',
      icon: <IconFileText />,
    },
  ];
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
  ].filter((profession): profession is string => Boolean(profession?.trim()));
  const regimeSummary = situationCivile.regimeMatrimonial
    ? labelForOption(REGIME_OPTIONS, situationCivile.regimeMatrimonial)
    : situationCivile.donations.length > 0
      ? `${situationCivile.donations.length} libéralité(s) renseignée(s)`
      : coupleStatus
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
      status:
        situationFamiliale.enfants.length === 0
          ? 'vide'
          : childrenComplete.length === situationFamiliale.enfants.length
            ? 'complet'
            : 'partiel',
      summaryLine:
        situationFamiliale.enfants.length > 0
          ? `${situationFamiliale.enfants.length} enfant(s) renseigné(s)`
          : 'Aucun proche renseigné',
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
      title: 'Régime matrimonial & libéralités',
      status:
        situationCivile.regimeMatrimonial || situationCivile.donations.length > 0
          ? 'complet'
          : coupleStatus
            ? 'partiel'
            : 'vide',
      summaryLine: regimeSummary,
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
      ctaTone:
        situationCivile.regimeMatrimonial || situationCivile.donations.length > 0
          ? undefined
          : 'required',
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
