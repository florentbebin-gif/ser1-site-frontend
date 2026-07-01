import { useEffect, useState, type ReactElement } from 'react';

import type { Actif, Passif, PassifEmprunt, ProprietaireType } from '@/domain/audit/types';
import {
  SimAmountInputEuro,
  SimAmountInputPercent,
  type SimSelectOption,
} from '@/components/ui/sim';

import { AuditDrawer } from '../components/AuditDrawer';
import {
  ACTIF_TYPE_OPTIONS,
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  createActif,
  createDette,
  createEmprunt,
  DateField,
  DELAI_REALISATION_OPTIONS,
  DrawerFooter,
  EMPRUNT_TYPE_OPTIONS,
  emptyToUndefined,
  HORIZON_PLACEMENT_OPTIONS,
  MODE_DETENTION_OPTIONS,
  PASSIF_NATURE_OPTIONS,
  PROFIL_RISQUE_OPTIONS,
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

function normalizePassifOwner<T extends { proprietaire?: ProprietaireType }>(
  passif: T,
  options: SimSelectOption[],
): T {
  const allowed = new Set(options.map((option) => option.value));
  if (passif.proprietaire && allowed.has(passif.proprietaire)) return passif;
  return { ...passif, proprietaire: (options[0]?.value ?? 'commun') as ProprietaireType };
}

function optionalActifValue<T extends string>(value: string): T | undefined {
  return value ? (value as T) : undefined;
}

function updateAssurance(
  form: PassifEmprunt,
  patch: Partial<NonNullable<PassifEmprunt['assuranceEmprunteur']>>,
): PassifEmprunt {
  return {
    ...form,
    assuranceEmprunteur: {
      quotiteMr: form.assuranceEmprunteur?.quotiteMr ?? 0,
      quotiteMme: form.assuranceEmprunteur?.quotiteMme ?? 0,
      primeMensuelle: form.assuranceEmprunteur?.primeMensuelle,
      taea: form.assuranceEmprunteur?.taea,
      ...patch,
    },
  };
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
    <AuditDrawer
      open={open}
      size="md"
      title={actif ? 'Modifier un actif' : 'Ajouter un actif'}
      subtitle="Inventaire déclaratif : montant et propriétaire saisis, non consolidés."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} onDelete={onDelete} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Identification" first>
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
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
        <AuditDrawerSection title="Valorisation & détention">
          <AuditDrawerFieldGrid>
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
        <AuditDrawerSection
          title="Analyse économique"
          description="Champs déclaratifs utiles à la lecture patrimoniale, sans score automatique."
        >
          <AuditDrawerFieldGrid columns={3}>
            <SelectField
              label="Mode de détention"
              value={form.modeDetention ?? ''}
              options={MODE_DETENTION_OPTIONS}
              onChange={(modeDetention) =>
                setForm({
                  ...form,
                  modeDetention:
                    optionalActifValue<NonNullable<Actif['modeDetention']>>(modeDetention),
                })
              }
            />
            <SelectField
              label="Horizon"
              value={form.horizonPlacement ?? ''}
              options={HORIZON_PLACEMENT_OPTIONS}
              onChange={(horizonPlacement) =>
                setForm({
                  ...form,
                  horizonPlacement:
                    optionalActifValue<NonNullable<Actif['horizonPlacement']>>(horizonPlacement),
                })
              }
            />
            <SelectField
              label="Profil risque"
              value={form.profilRisque ?? ''}
              options={PROFIL_RISQUE_OPTIONS}
              onChange={(profilRisque) =>
                setForm({
                  ...form,
                  profilRisque:
                    optionalActifValue<NonNullable<Actif['profilRisque']>>(profilRisque),
                })
              }
            />
            <SelectField
              label="Délai de réalisation"
              value={form.delaiRealisation ?? ''}
              options={DELAI_REALISATION_OPTIONS}
              onChange={(delaiRealisation) =>
                setForm({
                  ...form,
                  delaiRealisation:
                    optionalActifValue<NonNullable<Actif['delaiRealisation']>>(delaiRealisation),
                })
              }
            />
            <SimAmountInputPercent
              label="Taux de revalorisation"
              value={form.tauxRevalorisation ?? 0}
              onChange={(tauxRevalorisation) => setForm({ ...form, tauxRevalorisation })}
              onEmpty={() => setForm({ ...form, tauxRevalorisation: undefined })}
            />
            <SimAmountInputPercent
              label="Taux de revenu"
              value={form.tauxRevenu ?? 0}
              onChange={(tauxRevenu) => setForm({ ...form, tauxRevenu })}
              onEmpty={() => setForm({ ...form, tauxRevenu: undefined })}
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawer>
  );
}

function EmpruntIdentityFields({
  form,
  setForm,
  proprietaireOptions,
}: {
  form: PassifEmprunt;
  setForm: (form: PassifEmprunt) => void;
  proprietaireOptions: SimSelectOption[];
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
      <SelectField
        label="Propriétaire"
        value={form.proprietaire ?? 'commun'}
        options={proprietaireOptions}
        onChange={(proprietaire) =>
          setForm({ ...form, proprietaire: proprietaire as ProprietaireType })
        }
      />
    </>
  );
}

function EmpruntCreditFields({
  form,
  setForm,
}: {
  form: PassifEmprunt;
  setForm: (form: PassifEmprunt) => void;
}): ReactElement {
  return (
    <>
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

function EmpruntAssuranceFields({
  form,
  setForm,
  showConjoint,
}: {
  form: PassifEmprunt;
  setForm: (form: PassifEmprunt) => void;
  showConjoint: boolean;
}): ReactElement {
  return (
    <>
      <SimAmountInputPercent
        label="Quotité décès client"
        value={form.assuranceEmprunteur?.quotiteMr ?? 0}
        onChange={(quotiteMr) => setForm(updateAssurance(form, { quotiteMr }))}
      />
      {showConjoint ? (
        <SimAmountInputPercent
          label="Quotité décès conjoint"
          value={form.assuranceEmprunteur?.quotiteMme ?? 0}
          onChange={(quotiteMme) => setForm(updateAssurance(form, { quotiteMme }))}
        />
      ) : null}
      <SimAmountInputEuro
        label="Prime assurance mensuelle"
        value={form.assuranceEmprunteur?.primeMensuelle ?? 0}
        onChange={(primeMensuelle) => setForm(updateAssurance(form, { primeMensuelle }))}
        onEmpty={() => setForm(updateAssurance(form, { primeMensuelle: undefined }))}
      />
      <SimAmountInputEuro
        label="Échéance assurance comprise"
        value={form.echeanceAssuranceComprise ?? 0}
        onChange={(echeanceAssuranceComprise) => setForm({ ...form, echeanceAssuranceComprise })}
        onEmpty={() => setForm({ ...form, echeanceAssuranceComprise: undefined })}
      />
      <SimAmountInputPercent
        label="TAEG"
        value={form.taeg ?? 0}
        onChange={(taeg) => setForm({ ...form, taeg })}
        onEmpty={() => setForm({ ...form, taeg: undefined })}
      />
      <SimAmountInputEuro
        label="Coût global crédit"
        value={form.coutGlobalCredit ?? 0}
        onChange={(coutGlobalCredit) => setForm({ ...form, coutGlobalCredit })}
        onEmpty={() => setForm({ ...form, coutGlobalCredit: undefined })}
      />
      <SimAmountInputEuro
        label="Coût global assurance"
        value={form.coutGlobalAssurance ?? 0}
        onChange={(coutGlobalAssurance) => setForm({ ...form, coutGlobalAssurance })}
        onEmpty={() => setForm({ ...form, coutGlobalAssurance: undefined })}
      />
      <SimAmountInputPercent
        label="TAEA"
        value={form.assuranceEmprunteur?.taea ?? 0}
        onChange={(taea) => setForm(updateAssurance(form, { taea }))}
        onEmpty={() => setForm(updateAssurance(form, { taea: undefined }))}
      />
    </>
  );
}

function DetteFields({
  form,
  setForm,
  proprietaireOptions,
}: {
  form: Passif['autresDettes'][number];
  setForm: (form: Passif['autresDettes'][number]) => void;
  proprietaireOptions: SimSelectOption[];
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
      <SelectField
        label="Propriétaire"
        value={form.proprietaire ?? 'commun'}
        options={proprietaireOptions}
        onChange={(proprietaire) =>
          setForm({ ...form, proprietaire: proprietaire as ProprietaireType })
        }
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
  proprietaireOptions,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  emprunt?: PassifEmprunt;
  dette?: Passif['autresDettes'][number];
  proprietaireOptions: SimSelectOption[];
  onClose: () => void;
  onSave: (result: PassifSaveResult) => void;
  onDelete?: () => void;
}): ReactElement {
  const editing = Boolean(emprunt || dette);
  const initialNature: 'emprunt' | 'dette' = dette ? 'dette' : 'emprunt';
  const [nature, setNature] = useState<'emprunt' | 'dette'>(initialNature);
  const [empruntForm, setEmpruntForm] = useState<PassifEmprunt>(
    normalizePassifOwner(emprunt ?? createEmprunt(), proprietaireOptions),
  );
  const [detteForm, setDetteForm] = useState<Passif['autresDettes'][number]>(
    normalizePassifOwner(dette ?? createDette(), proprietaireOptions),
  );

  useEffect(() => {
    if (!open) return;
    setNature(dette ? 'dette' : 'emprunt');
    setEmpruntForm(normalizePassifOwner(emprunt ?? createEmprunt(), proprietaireOptions));
    setDetteForm(normalizePassifOwner(dette ?? createDette(), proprietaireOptions));
  }, [open, emprunt, dette, proprietaireOptions]);

  const handleSave = () => {
    if (nature === 'emprunt') onSave({ kind: 'emprunt', emprunt: empruntForm });
    else onSave({ kind: 'dette', dette: detteForm });
  };
  const drawerSize = nature === 'dette' ? 'md' : 'lg';
  const hasConjoint = proprietaireOptions.some((option) => option.value === 'mme');

  return (
    <AuditDrawer
      open={open}
      size={drawerSize}
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
              <EmpruntIdentityFields
                form={empruntForm}
                setForm={setEmpruntForm}
                proprietaireOptions={proprietaireOptions}
              />
            ) : (
              <DetteFields
                form={detteForm}
                setForm={setDetteForm}
                proprietaireOptions={proprietaireOptions}
              />
            )}
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
        {nature === 'emprunt' ? (
          <>
            <AuditDrawerSection title="Crédit">
              <AuditDrawerFieldGrid columns={3}>
                <EmpruntCreditFields form={empruntForm} setForm={setEmpruntForm} />
              </AuditDrawerFieldGrid>
            </AuditDrawerSection>
            <AuditDrawerSection
              title="Assurance & coût du crédit"
              description="Données déclaratives pour analyser les échéances et la couverture."
            >
              <AuditDrawerFieldGrid columns={3}>
                <EmpruntAssuranceFields
                  form={empruntForm}
                  setForm={setEmpruntForm}
                  showConjoint={hasConjoint}
                />
              </AuditDrawerFieldGrid>
            </AuditDrawerSection>
          </>
        ) : null}
      </div>
    </AuditDrawer>
  );
}
