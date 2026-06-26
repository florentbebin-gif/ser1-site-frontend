import type { ReactElement, ReactNode } from 'react';

import type { DossierAudit } from '@/domain/audit/types';
import {
  IconBriefcase,
  IconCalendar,
  IconClipboardCheck,
  IconFileText,
  IconHome,
  IconShield,
  IconUsers,
} from '@/icons/ui';

import {
  formatDate,
  fullName,
  labelForOption,
  REGIME_OPTIONS,
  SITUATION_OPTIONS,
} from './auditCockpitShared';
import { getProfessionalSituationLabel } from './professionFieldRules';

interface FoyerFact {
  label: string;
  value: string;
  icon: ReactNode;
  column: 'left' | 'right';
  emphasis?: boolean;
  tone?: 'missing';
}

interface FoyerFactColumns {
  left: FoyerFact[];
  right: FoyerFact[];
}

export function FoyerSummary({ dossier }: { dossier: DossierAudit }): ReactElement {
  const facts = buildFoyerFacts(dossier);
  const hasRightColumn = facts.right.length > 0;

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
      <dl className="audit-key-value-grid" data-layout={hasRightColumn ? 'split' : 'single'}>
        {[...facts.left, ...facts.right].map((fact) => (
          <FoyerSummaryFact key={fact.label} fact={fact} />
        ))}
      </dl>
      <FoyerSummaryIllustration />
    </section>
  );
}

function FoyerSummaryFact({ fact }: { fact: FoyerFact }): ReactElement {
  return (
    <div
      className="audit-key-value-grid__item"
      data-column={fact.column}
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

function buildFoyerFacts(dossier: DossierAudit): FoyerFactColumns {
  const { situationFamiliale, situationCivile } = dossier;
  const principal = fullName(situationFamiliale.mr);
  const conjoint = situationFamiliale.mme ? fullName(situationFamiliale.mme) : '';
  const principalProfession = getProfessionalSituationLabel(situationFamiliale.mr);
  const conjointProfession = situationFamiliale.mme
    ? getProfessionalSituationLabel(situationFamiliale.mme)
    : '';
  const conjointBirthDate = situationFamiliale.mme?.dateNaissance.trim() ?? '';
  const enfants = situationFamiliale.enfants
    .map((enfant) => enfant.prenom.trim())
    .filter(Boolean)
    .join(', ');
  const hasConjointData = Boolean(conjoint || conjointProfession || conjointBirthDate);
  const hasChildren = situationFamiliale.enfants.length > 0;

  const left: FoyerFact[] = [
    {
      label: 'Client principal',
      value: principal || 'À compléter',
      icon: <IconUsers />,
      column: 'left',
      emphasis: true,
      tone: principal ? undefined : 'missing',
    },
    {
      label: 'Profession',
      value: principalProfession || 'Non renseignée',
      icon: <IconBriefcase />,
      column: 'left',
    },
    {
      label: 'Situation',
      value: labelForOption(SITUATION_OPTIONS, situationFamiliale.situationMatrimoniale),
      icon: <IconClipboardCheck />,
      column: 'left',
    },
    {
      label: 'Régime',
      value: situationCivile.regimeMatrimonial
        ? labelForOption(REGIME_OPTIONS, situationCivile.regimeMatrimonial)
        : 'À compléter',
      icon: <IconShield />,
      column: 'left',
      tone: situationCivile.regimeMatrimonial ? undefined : 'missing',
    },
  ];
  const right: FoyerFact[] = [];

  if (hasConjointData) {
    right.push(
      {
        label: 'Conjoint',
        value: conjoint || 'À compléter',
        icon: <IconUsers />,
        column: 'right',
        emphasis: true,
      },
      {
        label: 'Profession conjoint',
        value: conjointProfession || 'Non renseignée',
        icon: <IconBriefcase />,
        column: 'right',
      },
      {
        label: 'Union',
        value: situationFamiliale.dateUnion
          ? formatDate(situationFamiliale.dateUnion)
          : 'Non renseignée',
        icon: <IconCalendar />,
        column: 'right',
      },
    );
  }

  if (hasChildren) {
    right.push({
      label: 'Enfants',
      value: `${situationFamiliale.enfants.length} - ${enfants || 'à nommer'}`,
      icon: <IconFileText />,
      column: 'right',
    });
  }

  return { left, right };
}
