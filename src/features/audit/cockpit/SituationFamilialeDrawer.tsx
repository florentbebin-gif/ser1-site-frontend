import { useEffect, useState, type ReactElement } from 'react';

import {
  type AuditAvatarKind,
  type DossierAudit,
  type PersonInfo,
  type SituationFamiliale,
} from '@/domain/audit/types';

import { AuditAvatarAppearancePicker } from '../components/AuditAvatarAppearancePicker';
import { AuditDrawerXL } from '../components/AuditDrawerXL';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  DateField,
  DrawerFooter,
  emptyToUndefined,
  SITUATION_OPTIONS,
  TextField,
} from './auditCockpitShared';
import { TagRow, TagToggle } from './auditDrawerControls';

const COUPLE_STATUSES: Array<SituationFamiliale['situationMatrimoniale']> = [
  'marie',
  'pacse',
  'concubinage',
];

const UNION_DETAIL_STATUSES: Array<SituationFamiliale['situationMatrimoniale']> = [
  'marie',
  'pacse',
];

export function SituationFamilialeDrawer({
  open,
  dossier,
  onClose,
  onSave,
}: {
  open: boolean;
  dossier: DossierAudit;
  onClose: () => void;
  onSave: (situationFamiliale: SituationFamiliale) => void;
}): ReactElement {
  const [form, setForm] = useState(dossier.situationFamiliale);
  useEffect(() => {
    if (open) setForm(dossier.situationFamiliale);
  }, [dossier.situationFamiliale, open]);

  const hasCouple = COUPLE_STATUSES.includes(form.situationMatrimoniale);
  const showUnionDetails = UNION_DETAIL_STATUSES.includes(form.situationMatrimoniale);

  return (
    <AuditDrawerXL
      open={open}
      title="Situation familiale"
      subtitle="Client principal, conjoint éventuel et statut du foyer."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <PersonFields
          title="Client principal"
          person={form.mr}
          onChange={(person) => setForm((previous) => ({ ...previous, mr: person }))}
          avatarKind="homme"
        />
        <AuditDrawerSection title="Statut civil">
          <div className="audit-status-union-grid">
            <SituationSegmentedControl
              value={form.situationMatrimoniale}
              onChange={(value) => {
                const nextHasCouple = COUPLE_STATUSES.includes(value);
                const nextShowsUnionDetails = UNION_DETAIL_STATUSES.includes(value);
                setForm((previous) => ({
                  ...previous,
                  situationMatrimoniale: value,
                  mme: nextHasCouple ? (previous.mme ?? createEmptyPerson()) : undefined,
                  dateUnion: nextShowsUnionDetails ? previous.dateUnion : undefined,
                  lieuUnion: nextShowsUnionDetails ? previous.lieuUnion : undefined,
                }));
              }}
            />
            {showUnionDetails ? (
              <AuditDrawerFieldGrid>
                <DateField
                  label="Date de l’union"
                  value={form.dateUnion ?? ''}
                  onChange={(dateUnion) =>
                    setForm((previous) => ({
                      ...previous,
                      dateUnion: emptyToUndefined(dateUnion),
                    }))
                  }
                />
              </AuditDrawerFieldGrid>
            ) : null}
          </div>
        </AuditDrawerSection>
        {hasCouple ? (
          <div className="audit-drawer-reveal">
            <ConjointUnionFields
              person={form.mme ?? createEmptyPerson()}
              onPersonChange={(person) => setForm((previous) => ({ ...previous, mme: person }))}
            />
          </div>
        ) : null}
        {hasCouple ? (
          <AuditDrawerSection
            title="Précisions fiscales du couple"
            description="Informations déclaratives utiles aux modules fiscaux et réversion, sans calcul runtime dans l’audit."
          >
            <TagRow>
              <TagToggle
                label="Imposition séparée l’année du mariage"
                checked={Boolean(form.impositionSepareeAnneeUnion)}
                onChange={(impositionSepareeAnneeUnion) =>
                  setForm((previous) => ({ ...previous, impositionSepareeAnneeUnion }))
                }
              />
              <TagToggle
                label="Non-résident fiscal"
                checked={Boolean(form.nonResidentFiscal)}
                onChange={(nonResidentFiscal) =>
                  setForm((previous) => ({ ...previous, nonResidentFiscal }))
                }
              />
            </TagRow>
          </AuditDrawerSection>
        ) : null}
      </div>
    </AuditDrawerXL>
  );
}

function createEmptyPerson(): PersonInfo {
  return { prenom: '', nom: '', dateNaissance: '' };
}

function SituationSegmentedControl({
  value,
  onChange,
}: {
  value: SituationFamiliale['situationMatrimoniale'];
  onChange: (value: SituationFamiliale['situationMatrimoniale']) => void;
}): ReactElement {
  return (
    <div className="audit-segmented" role="radiogroup" aria-label="Situation matrimoniale">
      {SITUATION_OPTIONS.map((option) => {
        const checked = value === option.value;
        return (
          <button
            type="button"
            key={option.value}
            className="audit-segmented__option"
            role="radio"
            aria-checked={checked}
            data-active={checked ? 'true' : undefined}
            onClick={() => onChange(option.value as SituationFamiliale['situationMatrimoniale'])}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PersonFields({
  title,
  person,
  onChange,
  avatarKind,
}: {
  title: string;
  person: PersonInfo;
  onChange: (person: PersonInfo) => void;
  avatarKind: AuditAvatarKind;
}): ReactElement {
  return (
    <AuditDrawerSection title={title}>
      <PersonIdentityEditor
        label={title}
        person={person}
        onChange={onChange}
        avatarKind={avatarKind}
      />
    </AuditDrawerSection>
  );
}

function PersonIdentityEditor({
  label,
  person,
  onChange,
  avatarKind,
}: {
  label: string;
  person: PersonInfo;
  onChange: (person: PersonInfo) => void;
  avatarKind: AuditAvatarKind;
}): ReactElement {
  return (
    <div className="audit-person-editor">
      <AuditAvatarAppearancePicker
        label={`Apparence ${label.toLowerCase()}`}
        kind={person.avatarKind ?? avatarKind}
        subject="adulte"
        appearance={person.avatarAppearance}
        onChange={({ kind, appearance }) =>
          onChange({ ...person, avatarKind: kind, avatarAppearance: appearance })
        }
      />
      <div className="audit-person-editor__fields">
        <AuditDrawerFieldGrid columns={3}>
          <TextField
            label="Prénom"
            value={person.prenom}
            onChange={(prenom) => onChange({ ...person, prenom })}
          />
          <TextField
            label="Nom"
            value={person.nom}
            controlClassName="audit-person-name-input"
            onChange={(nom) => onChange({ ...person, nom })}
          />
          <TextField
            label="Nom de naissance"
            value={person.nomNaissance ?? ''}
            controlClassName="audit-person-name-input"
            onChange={(nomNaissance) =>
              onChange({ ...person, nomNaissance: emptyToUndefined(nomNaissance) })
            }
          />
        </AuditDrawerFieldGrid>
        <AuditDrawerFieldGrid columns={3}>
          <DateField
            label="Date de naissance"
            value={person.dateNaissance}
            onChange={(dateNaissance) => onChange({ ...person, dateNaissance })}
          />
          <TextField
            label="Lieu de naissance"
            value={person.lieuNaissance ?? person.communeNaissance ?? ''}
            onChange={(lieuNaissance) =>
              onChange({ ...person, lieuNaissance: emptyToUndefined(lieuNaissance) })
            }
          />
          <TextField
            label="Nationalité"
            value={person.nationalite ?? ''}
            onChange={(nationalite) =>
              onChange({ ...person, nationalite: emptyToUndefined(nationalite) })
            }
          />
        </AuditDrawerFieldGrid>
        <TagRow>
          <TagToggle
            label="En situation de handicap"
            tone="impact"
            checked={Boolean(person.handicap)}
            onChange={(handicap) => onChange({ ...person, handicap })}
          />
        </TagRow>
      </div>
    </div>
  );
}

function ConjointUnionFields({
  person,
  onPersonChange,
}: {
  person: PersonInfo;
  onPersonChange: (person: PersonInfo) => void;
}): ReactElement {
  return (
    <AuditDrawerSection title="Conjoint">
      <PersonIdentityEditor
        label="Conjoint"
        person={person}
        onChange={onPersonChange}
        avatarKind="femme"
      />
    </AuditDrawerSection>
  );
}
