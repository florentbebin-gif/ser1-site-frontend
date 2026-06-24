import { useEffect, useState, type ReactElement } from 'react';

import {
  type AuditAvatarKind,
  type DossierAudit,
  type EnfantInfo,
  type PersonInfo,
  type SituationCivile,
  type SituationFamiliale,
} from '@/domain/audit/types';
import { IconPlus, IconTrash } from '@/icons/ui';

import { AuditAvatarAppearancePicker } from '../components/AuditAvatarAppearancePicker';
import { AuditDrawerXL } from '../components/AuditDrawerXL';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  CheckboxField,
  createDonation,
  DateField,
  DrawerFooter,
  emptyToUndefined,
  REGIME_OPTIONS,
  SelectField,
  SITUATION_OPTIONS,
  TextField,
  updateAt,
} from './auditCockpitShared';
import { FoyerDonationFields } from './FoyerDonationFields';

const CORE_SITUATION_OPTIONS = SITUATION_OPTIONS.filter((option) =>
  ['celibataire', 'marie', 'pacse', 'concubinage'].includes(option.value),
);
const COUPLE_STATUSES: Array<SituationFamiliale['situationMatrimoniale']> = [
  'marie',
  'pacse',
  'concubinage',
];
const REGIME_STATUSES: Array<SituationFamiliale['situationMatrimoniale']> = ['marie', 'pacse'];

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
          columns={3}
        />
        <AuditDrawerSection title="Statut civil">
          <SituationSegmentedControl
            value={form.situationMatrimoniale}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                situationMatrimoniale: value,
                mme: COUPLE_STATUSES.includes(value)
                  ? (previous.mme ?? { prenom: '', nom: '', dateNaissance: '' })
                  : previous.mme,
              }))
            }
          />
        </AuditDrawerSection>
        {hasCouple ? (
          <>
            <PersonFields
              title="Conjoint"
              person={form.mme ?? { prenom: '', nom: '', dateNaissance: '' }}
              onChange={(person) => setForm((previous) => ({ ...previous, mme: person }))}
              avatarKind="femme"
              columns={3}
            />
            <AuditDrawerSection title="Union">
              <AuditDrawerFieldGrid columns={2}>
                <DateField
                  label="Date de l’union"
                  value={form.dateUnion ?? ''}
                  onChange={(value) =>
                    setForm((previous) => ({ ...previous, dateUnion: emptyToUndefined(value) }))
                  }
                />
              </AuditDrawerFieldGrid>
            </AuditDrawerSection>
          </>
        ) : null}
      </div>
    </AuditDrawerXL>
  );
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
      {CORE_SITUATION_OPTIONS.map((option) => {
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
  columns = 2,
}: {
  title: string;
  person: PersonInfo;
  onChange: (person: PersonInfo) => void;
  avatarKind: AuditAvatarKind;
  columns?: 2 | 3;
}): ReactElement {
  return (
    <AuditDrawerSection title={title}>
      <AuditAvatarAppearancePicker
        label={`Apparence ${title.toLowerCase()}`}
        kind={person.avatarKind ?? avatarKind}
        subject="adulte"
        appearance={person.avatarAppearance}
        onChange={({ kind, appearance }) =>
          onChange({ ...person, avatarKind: kind, avatarAppearance: appearance })
        }
      />
      <AuditDrawerFieldGrid columns={columns}>
        <TextField
          label="Prénom"
          value={person.prenom}
          onChange={(prenom) => onChange({ ...person, prenom })}
        />
        <TextField
          label="Nom"
          value={person.nom}
          onChange={(nom) => onChange({ ...person, nom })}
        />
        <DateField
          label="Date de naissance"
          value={person.dateNaissance}
          onChange={(dateNaissance) => onChange({ ...person, dateNaissance })}
        />
      </AuditDrawerFieldGrid>
    </AuditDrawerSection>
  );
}

export function FiliationDrawer({
  open,
  dossier,
  onClose,
  onSave,
}: {
  open: boolean;
  dossier: DossierAudit;
  onClose: () => void;
  onSave: (enfants: EnfantInfo[]) => void;
}): ReactElement {
  const [enfants, setEnfants] = useState(dossier.situationFamiliale.enfants);
  useEffect(() => {
    if (open) setEnfants(dossier.situationFamiliale.enfants);
  }, [dossier.situationFamiliale.enfants, open]);

  return (
    <AuditDrawerXL
      open={open}
      title="Filiation & proches"
      subtitle="Personnes liées disponibles dans le socle F1 actuel."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(enfants)} />}
    >
      <div className="audit-drawer-form">
        <button
          type="button"
          className="audit-drawer-add"
          onClick={() =>
            setEnfants((previous) => [
              ...previous,
              { prenom: '', dateNaissance: '', estCommun: true },
            ])
          }
        >
          <IconPlus />
          <span>Ajouter un enfant</span>
        </button>
        {enfants.length === 0 ? (
          <p className="audit-drawer-empty">Aucun enfant renseigné.</p>
        ) : null}
        <div className="audit-related-list">
          {enfants.map((enfant, index) => (
            <div className="audit-related-row" key={`enfant-${index}`}>
              <AuditAvatarAppearancePicker
                label={`Apparence enfant ${index + 1}`}
                kind={enfant.avatarKind ?? avatarKindForChild(index)}
                subject="enfant"
                appearance={enfant.avatarAppearance}
                onChange={({ kind, appearance }) =>
                  setEnfants((previous) =>
                    updateAt(previous, index, {
                      ...enfant,
                      avatarKind: kind,
                      avatarAppearance: appearance,
                    }),
                  )
                }
              />
              <AuditDrawerFieldGrid columns={3}>
                <SelectField
                  label="Lien de parenté"
                  value={enfant.estCommun ? 'commun' : (enfant.parentPrincipal ?? 'mr')}
                  options={[
                    { value: 'commun', label: 'Enfant commun' },
                    { value: 'mr', label: 'Enfant union précédente · client' },
                    { value: 'mme', label: 'Enfant union précédente · conjoint' },
                  ]}
                  onChange={(value) =>
                    setEnfants((previous) =>
                      updateAt(previous, index, {
                        ...enfant,
                        estCommun: value === 'commun',
                        parentPrincipal: value === 'commun' ? undefined : (value as 'mr' | 'mme'),
                      }),
                    )
                  }
                />
                <TextField
                  label="Prénom"
                  value={enfant.prenom}
                  onChange={(prenom) =>
                    setEnfants((previous) => updateAt(previous, index, { ...enfant, prenom }))
                  }
                />
                <DateField
                  label="Date de naissance"
                  value={enfant.dateNaissance}
                  onChange={(dateNaissance) =>
                    setEnfants((previous) =>
                      updateAt(previous, index, { ...enfant, dateNaissance }),
                    )
                  }
                />
              </AuditDrawerFieldGrid>
              <button
                type="button"
                className="audit-drawer-remove audit-related-row__remove"
                onClick={() =>
                  setEnfants((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <IconTrash />
                <span>Retirer</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </AuditDrawerXL>
  );
}

function avatarKindForChild(index: number): AuditAvatarKind {
  return index % 2 === 0 ? 'fille' : 'garcon';
}

export function RegimeDonationsDrawer({
  open,
  dossier,
  onClose,
  onSave,
}: {
  open: boolean;
  dossier: DossierAudit;
  onClose: () => void;
  onSave: (situationCivile: SituationCivile) => void;
}): ReactElement {
  const [form, setForm] = useState(dossier.situationCivile);
  useEffect(() => {
    if (open) setForm(dossier.situationCivile);
  }, [dossier.situationCivile, open]);
  const showRegime = REGIME_STATUSES.includes(dossier.situationFamiliale.situationMatrimoniale);

  return (
    <AuditDrawerXL
      open={open}
      title={showRegime ? 'Régime & libéralités' : 'Libéralités & transmission'}
      subtitle={
        showRegime
          ? 'Régime et libéralités disponibles dans le socle F1.'
          : 'Libéralités consignées hors régime matrimonial.'
      }
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        {showRegime ? (
          <AuditDrawerSection title="Régime matrimonial">
            <AuditDrawerFieldGrid columns={4}>
              <SelectField
                label="Régime matrimonial"
                value={form.regimeMatrimonial ?? ''}
                options={REGIME_OPTIONS}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    regimeMatrimonial: emptyToUndefined(
                      value,
                    ) as SituationCivile['regimeMatrimonial'],
                  }))
                }
              />
              <DateField
                label="Date d’effet"
                value={form.dateContrat ?? ''}
                onChange={(dateContrat) =>
                  setForm((previous) => ({
                    ...previous,
                    dateContrat: emptyToUndefined(dateContrat),
                  }))
                }
              />
              <TextField
                label="Notaire"
                value={form.notaire ?? ''}
                onChange={(notaire) =>
                  setForm((previous) => ({ ...previous, notaire: emptyToUndefined(notaire) }))
                }
              />
              <CheckboxField
                label="Contrat"
                checked={form.contratMariage}
                onChange={(contratMariage) =>
                  setForm((previous) => ({ ...previous, contratMariage }))
                }
              />
            </AuditDrawerFieldGrid>
          </AuditDrawerSection>
        ) : null}
        <button
          type="button"
          className="audit-drawer-add"
          onClick={() =>
            setForm((previous) => ({
              ...previous,
              donations: [...previous.donations, createDonation()],
            }))
          }
        >
          <IconPlus />
          <span>Ajouter une donation</span>
        </button>
        {form.donations.map((donation, index) => (
          <FoyerDonationFields
            key={donation.id}
            donation={donation}
            index={index}
            onChange={(nextDonation) =>
              setForm((previous) => ({
                ...previous,
                donations: updateAt(previous.donations, index, nextDonation),
              }))
            }
            onRemove={() =>
              setForm((previous) => ({
                ...previous,
                donations: previous.donations.filter((item) => item.id !== donation.id),
              }))
            }
          />
        ))}
      </div>
    </AuditDrawerXL>
  );
}

export function ProfessionDrawer({
  open,
  dossier,
  onClose,
  onSave,
}: {
  open: boolean;
  dossier: DossierAudit;
  onClose: () => void;
  onSave: (mrProfession: string, mmeProfession: string) => void;
}): ReactElement {
  const [mrProfession, setMrProfession] = useState(dossier.situationFamiliale.mr.profession ?? '');
  const [mmeProfession, setMmeProfession] = useState(
    dossier.situationFamiliale.mme?.profession ?? '',
  );

  useEffect(() => {
    if (!open) return;
    setMrProfession(dossier.situationFamiliale.mr.profession ?? '');
    setMmeProfession(dossier.situationFamiliale.mme?.profession ?? '');
  }, [dossier.situationFamiliale.mme?.profession, dossier.situationFamiliale.mr.profession, open]);

  return (
    <AuditDrawerXL
      open={open}
      title="Situation professionnelle"
      subtitle="Professions connues du foyer F1."
      onClose={onClose}
      footer={
        <DrawerFooter onCancel={onClose} onSave={() => onSave(mrProfession, mmeProfession)} />
      }
    >
      <div className="audit-drawer-form">
        <div
          className="audit-profession-columns"
          data-columns={dossier.situationFamiliale.mme ? 2 : 1}
        >
          <AuditDrawerSection title="Client principal">
            <TextField label="Profession" value={mrProfession} onChange={setMrProfession} />
          </AuditDrawerSection>
          {dossier.situationFamiliale.mme ? (
            <AuditDrawerSection title="Conjoint">
              <TextField label="Profession" value={mmeProfession} onChange={setMmeProfession} />
            </AuditDrawerSection>
          ) : null}
        </div>
      </div>
    </AuditDrawerXL>
  );
}
