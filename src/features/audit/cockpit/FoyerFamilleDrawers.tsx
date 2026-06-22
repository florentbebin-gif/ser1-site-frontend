import { useEffect, useState, type ReactElement } from 'react';

import {
  type DossierAudit,
  type DonationInfo,
  type EnfantInfo,
  type PersonInfo,
  type SituationCivile,
  type SituationFamiliale,
} from '@/domain/audit/types';
import { SimAmountInputEuro } from '@/components/ui/sim';
import { IconPlus, IconTrash } from '@/icons/ui';

import { AuditDrawerXL } from '../components/AuditDrawerXL';
import {
  CheckboxField,
  createDonation,
  DateField,
  DrawerFooter,
  DONATION_TYPE_OPTIONS,
  emptyToUndefined,
  REGIME_OPTIONS,
  SelectField,
  SITUATION_OPTIONS,
  TextAreaField,
  TextField,
  updateAt,
} from './auditCockpitShared';

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

  const hasCouple = ['marie', 'pacse', 'concubinage'].includes(form.situationMatrimoniale);

  return (
    <AuditDrawerXL
      open={open}
      title="Situation familiale"
      subtitle="Client principal, conjoint éventuel et statut du foyer."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <SelectField
          label="Situation matrimoniale"
          value={form.situationMatrimoniale}
          options={SITUATION_OPTIONS}
          onChange={(value) =>
            setForm((previous) => ({
              ...previous,
              situationMatrimoniale: value as SituationFamiliale['situationMatrimoniale'],
              mme: ['marie', 'pacse', 'concubinage'].includes(value)
                ? (previous.mme ?? { prenom: '', nom: '', dateNaissance: '' })
                : previous.mme,
            }))
          }
        />
        <DateField
          label="Date d’union"
          value={form.dateUnion ?? ''}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, dateUnion: emptyToUndefined(value) }))
          }
        />
        <PersonFields
          title="Client principal"
          person={form.mr}
          onChange={(person) => setForm((previous) => ({ ...previous, mr: person }))}
        />
        {hasCouple ? (
          <PersonFields
            title="Conjoint"
            person={form.mme ?? { prenom: '', nom: '', dateNaissance: '' }}
            onChange={(person) => setForm((previous) => ({ ...previous, mme: person }))}
          />
        ) : null}
      </div>
    </AuditDrawerXL>
  );
}

function PersonFields({
  title,
  person,
  onChange,
}: {
  title: string;
  person: PersonInfo;
  onChange: (person: PersonInfo) => void;
}): ReactElement {
  return (
    <fieldset className="audit-drawer-fieldset">
      <legend>{title}</legend>
      <TextField
        label="Prénom"
        value={person.prenom}
        onChange={(prenom) => onChange({ ...person, prenom })}
      />
      <TextField label="Nom" value={person.nom} onChange={(nom) => onChange({ ...person, nom })} />
      <DateField
        label="Date de naissance"
        value={person.dateNaissance}
        onChange={(dateNaissance) => onChange({ ...person, dateNaissance })}
      />
      <TextField
        label="Profession"
        value={person.profession ?? ''}
        onChange={(profession) => onChange({ ...person, profession: emptyToUndefined(profession) })}
      />
    </fieldset>
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
      title="Filiation"
      subtitle="Enfants et personnes liées portées par F1."
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
        {enfants.map((enfant, index) => (
          <fieldset className="audit-drawer-fieldset" key={`${index}-${enfant.prenom}`}>
            <legend>Enfant {index + 1}</legend>
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
                setEnfants((previous) => updateAt(previous, index, { ...enfant, dateNaissance }))
              }
            />
            <SelectField
              label="Lien"
              value={enfant.estCommun ? 'commun' : (enfant.parentPrincipal ?? 'mr')}
              options={[
                { value: 'commun', label: 'Enfant commun' },
                { value: 'mr', label: 'Client principal' },
                { value: 'mme', label: 'Conjoint' },
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
            <button
              type="button"
              className="audit-drawer-remove"
              onClick={() =>
                setEnfants((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <IconTrash />
              <span>Retirer</span>
            </button>
          </fieldset>
        ))}
      </div>
    </AuditDrawerXL>
  );
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

  return (
    <AuditDrawerXL
      open={open}
      title="Régime matrimonial & donations"
      subtitle="Régime et donations synthétiques du socle F1."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <fieldset className="audit-drawer-fieldset">
          <legend>Régime matrimonial</legend>
          <SelectField
            label="Régime"
            value={form.regimeMatrimonial ?? ''}
            options={REGIME_OPTIONS}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                regimeMatrimonial: emptyToUndefined(value) as SituationCivile['regimeMatrimonial'],
              }))
            }
          />
          <CheckboxField
            label="Contrat de mariage"
            checked={form.contratMariage}
            onChange={(contratMariage) => setForm((previous) => ({ ...previous, contratMariage }))}
          />
          <DateField
            label="Date du contrat"
            value={form.dateContrat ?? ''}
            onChange={(dateContrat) =>
              setForm((previous) => ({ ...previous, dateContrat: emptyToUndefined(dateContrat) }))
            }
          />
          <TextField
            label="Notaire"
            value={form.notaire ?? ''}
            onChange={(notaire) =>
              setForm((previous) => ({ ...previous, notaire: emptyToUndefined(notaire) }))
            }
          />
        </fieldset>
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
          <DonationFields
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

function DonationFields({
  donation,
  index,
  onChange,
  onRemove,
}: {
  donation: DonationInfo;
  index: number;
  onChange: (donation: DonationInfo) => void;
  onRemove: () => void;
}): ReactElement {
  return (
    <fieldset className="audit-drawer-fieldset">
      <legend>Donation {index + 1}</legend>
      <SelectField
        label="Type"
        value={donation.type}
        options={DONATION_TYPE_OPTIONS}
        onChange={(type) => onChange({ ...donation, type: type as DonationInfo['type'] })}
      />
      <DateField
        label="Date"
        value={donation.date}
        onChange={(date) => onChange({ ...donation, date })}
      />
      <SimAmountInputEuro
        label="Montant renseigné"
        value={donation.montant ?? 0}
        onChange={(montant) => onChange({ ...donation, montant })}
        onEmpty={() => onChange({ ...donation, montant: undefined })}
      />
      <TextField
        label="Bénéficiaire"
        value={donation.beneficiaire}
        onChange={(beneficiaire) => onChange({ ...donation, beneficiaire })}
      />
      <TextAreaField
        label="Description"
        value={donation.description ?? ''}
        onChange={(description) =>
          onChange({ ...donation, description: emptyToUndefined(description) })
        }
      />
      <button type="button" className="audit-drawer-remove" onClick={onRemove}>
        <IconTrash />
        <span>Retirer</span>
      </button>
    </fieldset>
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
        <TextField
          label="Profession client principal"
          value={mrProfession}
          onChange={setMrProfession}
        />
        {dossier.situationFamiliale.mme ? (
          <TextField
            label="Profession conjoint"
            value={mmeProfession}
            onChange={setMmeProfession}
          />
        ) : null}
      </div>
    </AuditDrawerXL>
  );
}
