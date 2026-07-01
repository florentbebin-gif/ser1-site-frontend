import type { ReactElement, ReactNode } from 'react';

import type { SimSelectOption } from '@/components/ui/sim';
import type { TypeAdoption } from '@/domain/audit/types';
import { IconTrash } from '@/icons/ui';

import { DateField, SelectField, TextField, emptyToUndefined } from './auditCockpitShared';
import {
  ADOPTION_OPTIONS,
  type CivilFiscalFields,
  NIVEAU_SCOLAIRE_OPTIONS,
  toggleCivilFiscal,
} from './filiationConfig';

export type RelatedCardRelationTone = 'client' | 'conjoint';

export function RelatedCardShell({
  deceased,
  header,
  children,
  relationTone,
}: {
  deceased: boolean;
  header: ReactNode;
  children: ReactNode;
  relationTone?: RelatedCardRelationTone;
}): ReactElement {
  return (
    <article
      className="audit-related-card"
      data-deceased={deceased ? 'true' : undefined}
      data-relation-tone={relationTone}
    >
      {header}
      {children}
    </article>
  );
}

export function CardHeader({
  avatar,
  label,
  branchLabel,
  deceased,
  removeLabel,
  onRemove,
}: {
  avatar: ReactNode;
  label: string;
  branchLabel?: string;
  deceased: boolean;
  removeLabel: string;
  onRemove: () => void;
}): ReactElement {
  return (
    <header className="audit-related-card__header">
      <div className="audit-related-card__identity">
        {avatar}
        <span>{label}</span>
        {branchLabel ? (
          <span className="audit-related-card__branch-badge">{branchLabel}</span>
        ) : null}
        {deceased ? <span className="audit-related-card__life-status">Décédé</span> : null}
      </div>
      <button
        type="button"
        className="audit-drawer-remove audit-related-card__remove"
        aria-label={removeLabel}
        onClick={onRemove}
      >
        <IconTrash />
      </button>
    </header>
  );
}

function DeceasedToggle({
  deceased,
  onToggle,
}: {
  deceased: boolean;
  onToggle: (next: boolean) => void;
}): ReactElement {
  return (
    <button
      type="button"
      className="audit-related-card__deceased-toggle"
      aria-label={deceased ? 'Indiquer que cette personne est vivante' : 'Indiquer un décès'}
      aria-pressed={deceased}
      data-active={deceased ? 'true' : undefined}
      onClick={() => onToggle(!deceased)}
    >
      <span aria-hidden="true" />
      <strong>{deceased ? 'Décédé' : 'Décès'}</strong>
    </button>
  );
}

export function IdentityRow({
  lienControl,
  prenom,
  nom,
  dateNaissance,
  deceased,
  onPrenom,
  onNom,
  onDate,
  onDeceased,
}: {
  lienControl: ReactNode;
  prenom: string;
  nom: string;
  dateNaissance: string;
  deceased: boolean;
  onPrenom: (value: string) => void;
  onNom: (value: string | undefined) => void;
  onDate: (value: string) => void;
  onDeceased: (next: boolean) => void;
}): ReactElement {
  return (
    <div className="audit-related-card__grid" data-row="identity">
      {lienControl}
      <TextField label="Prénom" value={prenom} onChange={onPrenom} />
      <TextField
        label="Nom"
        value={nom}
        controlClassName="audit-person-name-input"
        onChange={(value) => onNom(emptyToUndefined(value))}
      />
      <DateField label="Date de naissance" value={dateNaissance} onChange={onDate} />
      <DeceasedToggle deceased={deceased} onToggle={onDeceased} />
    </div>
  );
}

export function QualifierTag({
  label,
  tone,
  active,
  onToggle,
}: {
  label: string;
  tone: 'fiscal' | 'impact';
  active: boolean;
  onToggle: (next: boolean) => void;
}): ReactElement {
  return (
    <button
      type="button"
      className="audit-related-card__tag"
      aria-pressed={active}
      data-selected={active ? 'true' : undefined}
      data-tone={tone}
      onClick={() => onToggle(!active)}
    >
      <span aria-hidden="true" />
      {label}
    </button>
  );
}

export function SegmentedReveal({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: SimSelectOption[];
  value: string | undefined;
  onSelect: (value: string) => void;
}): ReactElement {
  return (
    <div className="audit-related-card__reveal audit-drawer-reveal" role="group" aria-label={label}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            type="button"
            key={option.value}
            className="audit-ddv-card__option"
            data-selected={selected ? 'true' : undefined}
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Zone « Situation civile & fiscale » partagée enfant / petit-enfant. */
export function CivilFiscalZone({
  value,
  transmission,
  compact = false,
  onChange,
}: {
  value: CivilFiscalFields;
  transmission?: ReactNode;
  compact?: boolean;
  onChange: (next: CivilFiscalFields) => void;
}): ReactElement {
  const aCharge = Boolean(value.fiscalementACharge);
  return (
    <div
      className="audit-related-card__qualification"
      data-compact={compact ? 'true' : undefined}
      data-school={aCharge ? 'true' : undefined}
      data-transmission={transmission ? 'true' : undefined}
    >
      <div className="audit-related-card__civil">
        <p className="audit-related-card__group-label">Situation civile &amp; fiscale</p>
        <div className="audit-related-card__tag-row">
          <QualifierTag
            label="Fiscalement à charge"
            tone="fiscal"
            active={aCharge}
            onToggle={(next) => onChange(toggleCivilFiscal(value, 'fiscalementACharge', next))}
          />
          {aCharge ? (
            <QualifierTag
              label="Garde alternée"
              tone="fiscal"
              active={Boolean(value.gardeAlternee)}
              onToggle={(next) => onChange({ ...value, gardeAlternee: next })}
            />
          ) : null}
          <QualifierTag
            label="En situation de handicap"
            tone="impact"
            active={Boolean(value.handicap)}
            onToggle={(next) => onChange(toggleCivilFiscal(value, 'handicap', next))}
          />
          <QualifierTag
            label="Enfant adopté"
            tone="fiscal"
            active={Boolean(value.adopte)}
            onToggle={(next) => onChange(toggleCivilFiscal(value, 'adopte', next))}
          />
        </div>
        {value.adopte ? (
          <SegmentedReveal
            label="Type d’adoption"
            options={ADOPTION_OPTIONS}
            value={value.typeAdoption}
            onSelect={(typeAdoption) =>
              onChange({ ...value, typeAdoption: typeAdoption as TypeAdoption })
            }
          />
        ) : null}
      </div>
      {transmission ? <div className="audit-related-card__succession">{transmission}</div> : null}
      {aCharge ? (
        <div className="audit-related-card__school">
          <SelectField
            label="Scolarité"
            value={value.niveauScolaire ?? ''}
            options={NIVEAU_SCOLAIRE_OPTIONS}
            onChange={(niveau) =>
              onChange({
                ...value,
                niveauScolaire: emptyToUndefined(niveau) as CivilFiscalFields['niveauScolaire'],
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}
