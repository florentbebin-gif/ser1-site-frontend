import { useEffect, useState, type ReactElement } from 'react';

import type { Actif, Passif, PassifEmprunt, ProprietaireType } from '@/domain/audit/types';
import {
  SimAmountInputEuro,
  SimAmountInputPercent,
  type SimSelectOption,
} from '@/components/ui/sim';

import { AuditDrawerXL } from '../components/AuditDrawerXL';
import {
  ACTIF_TYPE_OPTIONS,
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  createActif,
  createDette,
  createEmprunt,
  DateField,
  DrawerFooter,
  EMPRUNT_TYPE_OPTIONS,
  emptyToUndefined,
  PASSIF_NATURE_OPTIONS,
  SelectField,
  TextAreaField,
  TextField,
} from './auditCockpitShared';

export type PassifSaveResult =
  | { kind: 'emprunt'; emprunt: PassifEmprunt }
  | { kind: 'dette'; dette: Passif['autresDettes'][number] };

function normalizeActifOwner(actif: Actif, options: SimSelectOption[]): Actif {
  const allowed = new Set(options.map((option) => option.value));
  if (allowed.has(actif.proprietaire)) return actif;
  return { ...actif, proprietaire: (options[0]?.value ?? 'mr') as ProprietaireType };
}

export function ActifDrawer({
  open,
  actif,
  proprietaireOptions,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  actif?: Actif;
  proprietaireOptions: SimSelectOption[];
  onClose: () => void;
  onSave: (actif: Actif) => void;
  onDelete?: () => void;
}): ReactElement {
  const [form, setForm] = useState<Actif>(
    normalizeActifOwner(actif ?? createActif(), proprietaireOptions),
  );
  useEffect(() => {
    if (open) setForm(normalizeActifOwner(actif ?? createActif(), proprietaireOptions));
  }, [actif, open, proprietaireOptions]);

  return (
    <AuditDrawerXL
      open={open}
      title={actif ? 'Modifier un actif' : 'Ajouter un actif'}
      subtitle="Inventaire déclaratif : montant et propriétaire saisis, non consolidés."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} onDelete={onDelete} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Actif déclaré" first>
          <AuditDrawerFieldGrid>
            <TextField
              label="Libellé"
              value={form.libelle}
              onChange={(libelle) => setForm({ ...form, libelle })}
            />
            <SelectField
              label="Type"
              value={form.type}
              options={ACTIF_TYPE_OPTIONS}
              onChange={(type) => setForm({ ...form, type: type as Actif['type'] } as Actif)}
            />
            <SimAmountInputEuro
              label="Valeur saisie"
              value={form.valeur}
              onChange={(valeur) => setForm({ ...form, valeur })}
            />
            <SelectField
              label="Propriétaire"
              value={form.proprietaire}
              options={proprietaireOptions}
              onChange={(proprietaire) =>
                setForm({ ...form, proprietaire: proprietaire as ProprietaireType })
              }
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}

function EmpruntFields({
  form,
  setForm,
}: {
  form: PassifEmprunt;
  setForm: (form: PassifEmprunt) => void;
}): ReactElement {
  return (
    <>
      <TextField
        label="Libellé"
        value={form.libelle}
        onChange={(libelle) => setForm({ ...form, libelle })}
      />
      <SelectField
        label="Type d'emprunt"
        value={form.type}
        options={EMPRUNT_TYPE_OPTIONS}
        onChange={(type) => setForm({ ...form, type: type as PassifEmprunt['type'] })}
      />
      <SimAmountInputEuro
        label="Capital initial"
        value={form.capitalInitial}
        onChange={(capitalInitial) => setForm({ ...form, capitalInitial })}
      />
      <SimAmountInputEuro
        label="Capital restant dû"
        value={form.capitalRestantDu}
        onChange={(capitalRestantDu) => setForm({ ...form, capitalRestantDu })}
      />
      <SimAmountInputEuro
        label="Mensualité"
        value={form.mensualite}
        onChange={(mensualite) => setForm({ ...form, mensualite })}
      />
      <SimAmountInputPercent
        label="Taux renseigné"
        value={form.tauxInteret}
        onChange={(tauxInteret) => setForm({ ...form, tauxInteret })}
      />
      <DateField
        label="Date de début"
        value={form.dateDebut}
        onChange={(dateDebut) => setForm({ ...form, dateDebut })}
      />
      <DateField
        label="Date de fin"
        value={form.dateFin}
        onChange={(dateFin) => setForm({ ...form, dateFin })}
      />
    </>
  );
}

function DetteFields({
  form,
  setForm,
}: {
  form: Passif['autresDettes'][number];
  setForm: (form: Passif['autresDettes'][number]) => void;
}): ReactElement {
  return (
    <>
      <TextField
        label="Libellé"
        value={form.libelle}
        onChange={(libelle) => setForm({ ...form, libelle })}
      />
      <SimAmountInputEuro
        label="Montant saisi"
        value={form.montant}
        onChange={(montant) => setForm({ ...form, montant })}
      />
      <TextAreaField
        label="Description"
        value={form.description ?? ''}
        onChange={(description) => setForm({ ...form, description: emptyToUndefined(description) })}
      />
    </>
  );
}

export function PassifDrawer({
  open,
  emprunt,
  dette,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  emprunt?: PassifEmprunt;
  dette?: Passif['autresDettes'][number];
  onClose: () => void;
  onSave: (result: PassifSaveResult) => void;
  onDelete?: () => void;
}): ReactElement {
  const editing = Boolean(emprunt || dette);
  const initialNature: 'emprunt' | 'dette' = dette ? 'dette' : 'emprunt';
  const [nature, setNature] = useState<'emprunt' | 'dette'>(initialNature);
  const [empruntForm, setEmpruntForm] = useState<PassifEmprunt>(emprunt ?? createEmprunt());
  const [detteForm, setDetteForm] = useState<Passif['autresDettes'][number]>(
    dette ?? createDette(),
  );

  useEffect(() => {
    if (!open) return;
    setNature(dette ? 'dette' : 'emprunt');
    setEmpruntForm(emprunt ?? createEmprunt());
    setDetteForm(dette ?? createDette());
  }, [open, emprunt, dette]);

  const handleSave = () => {
    if (nature === 'emprunt') onSave({ kind: 'emprunt', emprunt: empruntForm });
    else onSave({ kind: 'dette', dette: detteForm });
  };

  return (
    <AuditDrawerXL
      open={open}
      title={editing ? 'Modifier un passif' : 'Ajouter un passif'}
      subtitle="Passif déclaratif : emprunt ou autre dette, non consolidé."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={handleSave} onDelete={onDelete} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Passif déclaré" first>
          <AuditDrawerFieldGrid>
            {editing ? null : (
              <SelectField
                label="Nature du passif"
                value={nature}
                options={PASSIF_NATURE_OPTIONS}
                onChange={(value) => setNature(value as 'emprunt' | 'dette')}
              />
            )}
            {nature === 'emprunt' ? (
              <EmpruntFields form={empruntForm} setForm={setEmpruntForm} />
            ) : (
              <DetteFields form={detteForm} setForm={setDetteForm} />
            )}
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}
