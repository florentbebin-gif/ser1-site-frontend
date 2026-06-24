import { useEffect, useState, type ReactElement } from 'react';

import type { Actif, Passif, PassifEmprunt, ProprietaireType } from '@/domain/audit/types';
import { SimAmountInputEuro, SimAmountInputPercent } from '@/components/ui/sim';

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
  PROPRIETAIRE_OPTIONS,
  SelectField,
  TextAreaField,
  TextField,
} from './auditCockpitShared';

export function ActifDrawer({
  open,
  actif,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  actif?: Actif;
  onClose: () => void;
  onSave: (actif: Actif) => void;
  onDelete?: () => void;
}): ReactElement {
  const [form, setForm] = useState<Actif>(actif ?? createActif());
  useEffect(() => {
    if (open) setForm(actif ?? createActif());
  }, [actif, open]);

  return (
    <AuditDrawerXL
      open={open}
      title={actif ? 'Modifier un actif' : 'Ajouter un actif'}
      subtitle="Inventaire déclaratif, sans structuration F3."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} onDelete={onDelete} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Actif déclaré">
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
              options={PROPRIETAIRE_OPTIONS}
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

export function EmpruntDrawer({
  open,
  emprunt,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  emprunt?: PassifEmprunt;
  onClose: () => void;
  onSave: (emprunt: PassifEmprunt) => void;
  onDelete?: () => void;
}): ReactElement {
  const [form, setForm] = useState<PassifEmprunt>(emprunt ?? createEmprunt());
  useEffect(() => {
    if (open) setForm(emprunt ?? createEmprunt());
  }, [emprunt, open]);

  return (
    <AuditDrawerXL
      open={open}
      title={emprunt ? 'Modifier un emprunt' : 'Ajouter un emprunt'}
      subtitle="Capital et mensualité saisis, sans calcul de capacité."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} onDelete={onDelete} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Emprunt déclaré">
          <AuditDrawerFieldGrid>
            <TextField
              label="Libellé"
              value={form.libelle}
              onChange={(libelle) => setForm({ ...form, libelle })}
            />
            <SelectField
              label="Type"
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
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}

export function DetteDrawer({
  open,
  dette,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  dette?: Passif['autresDettes'][number];
  onClose: () => void;
  onSave: (dette: Passif['autresDettes'][number]) => void;
  onDelete?: () => void;
}): ReactElement {
  const [form, setForm] = useState<Passif['autresDettes'][number]>(dette ?? createDette());
  useEffect(() => {
    if (open) setForm(dette ?? createDette());
  }, [dette, open]);

  return (
    <AuditDrawerXL
      open={open}
      title={dette ? 'Modifier une dette' : 'Ajouter une dette'}
      subtitle="Dette synthétique rattachée au passif déclaré."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} onDelete={onDelete} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Dette déclarée">
          <AuditDrawerFieldGrid>
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
              onChange={(description) =>
                setForm({ ...form, description: emptyToUndefined(description) })
              }
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}
