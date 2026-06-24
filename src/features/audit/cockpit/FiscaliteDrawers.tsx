import { useEffect, useState, type ReactElement } from 'react';

import type { RevenuCategorie, SituationFiscale } from '@/domain/audit/types';
import {
  SimAmountInputEuro,
  SimAmountInputNumeric,
  SimAmountInputPercent,
} from '@/components/ui/sim';
import { IconPlus, IconTrash } from '@/icons/ui';

import { AuditDrawerXL } from '../components/AuditDrawerXL';
import {
  AuditDrawerFieldGrid,
  AuditDrawerSection,
  BENEFICIAIRE_OPTIONS,
  createRevenu,
  DrawerFooter,
  REVENU_CATEGORIE_OPTIONS,
  SelectField,
  updateAt,
} from './auditCockpitShared';

type FiscalDrawer = 'avis' | 'revenus' | 'lecture' | 'impots';

export function FiscalDrawerContent({
  drawer,
  situationFiscale,
  onClose,
  onSave,
}: {
  drawer: FiscalDrawer | null;
  situationFiscale: SituationFiscale;
  onClose: () => void;
  onSave: (situationFiscale: SituationFiscale) => void;
}): ReactElement | null {
  if (!drawer) return null;
  if (drawer === 'avis') {
    return (
      <AvisFiscalDrawer
        open
        situationFiscale={situationFiscale}
        onClose={onClose}
        onSave={onSave}
      />
    );
  }
  if (drawer === 'revenus') {
    return (
      <RevenusDrawer open situationFiscale={situationFiscale} onClose={onClose} onSave={onSave} />
    );
  }
  if (drawer === 'lecture') {
    return (
      <LectureFiscaleDrawer
        open
        situationFiscale={situationFiscale}
        onClose={onClose}
        onSave={onSave}
      />
    );
  }
  return (
    <AutresImpotsDrawer
      open
      situationFiscale={situationFiscale}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function AvisFiscalDrawer({
  open,
  situationFiscale,
  onClose,
  onSave,
}: FiscalDrawerProps): ReactElement {
  const [form, setForm] = useState(situationFiscale);
  useEffect(() => {
    if (open) setForm(situationFiscale);
  }, [open, situationFiscale]);

  return (
    <AuditDrawerXL
      open={open}
      title="Avis d’imposition"
      subtitle="Valeurs lues ou renseignées depuis l’avis, sans recalcul."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Données de l’avis">
          <AuditDrawerFieldGrid>
            <SimAmountInputNumeric
              label="Année de référence"
              value={form.anneeReference}
              onChange={(anneeReference) => setForm({ ...form, anneeReference })}
            />
            <SimAmountInputEuro
              label="Revenu fiscal de référence"
              value={form.revenuFiscalReference}
              onChange={(revenuFiscalReference) => setForm({ ...form, revenuFiscalReference })}
              onEmpty={() => setForm({ ...form, revenuFiscalReference: 0 })}
            />
            <SimAmountInputEuro
              label="IR indiqué sur avis"
              value={form.impotRevenu}
              onChange={(impotRevenu) => setForm({ ...form, impotRevenu })}
              onEmpty={() => setForm({ ...form, impotRevenu: 0 })}
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}

interface FiscalDrawerProps {
  open: boolean;
  situationFiscale: SituationFiscale;
  onClose: () => void;
  onSave: (situationFiscale: SituationFiscale) => void;
}

function RevenusDrawer({
  open,
  situationFiscale,
  onClose,
  onSave,
}: FiscalDrawerProps): ReactElement {
  const [revenus, setRevenus] = useState(situationFiscale.revenus);
  useEffect(() => {
    if (open) setRevenus(situationFiscale.revenus);
  }, [open, situationFiscale.revenus]);

  return (
    <AuditDrawerXL
      open={open}
      title="Revenus déclarés"
      subtitle="Catégories et montants renseignés, sans adapter IR."
      onClose={onClose}
      footer={
        <DrawerFooter onCancel={onClose} onSave={() => onSave({ ...situationFiscale, revenus })} />
      }
    >
      <div className="audit-drawer-form">
        <button
          type="button"
          className="audit-drawer-add"
          onClick={() => setRevenus((previous) => [...previous, createRevenu()])}
        >
          <IconPlus />
          <span>Ajouter une catégorie</span>
        </button>
        {revenus.map((revenu, index) => (
          <RevenuFields
            key={revenu.id}
            revenu={revenu}
            index={index}
            onChange={(nextRevenu) =>
              setRevenus((previous) => updateAt(previous, index, nextRevenu))
            }
            onRemove={() =>
              setRevenus((previous) => previous.filter((item) => item.id !== revenu.id))
            }
          />
        ))}
      </div>
    </AuditDrawerXL>
  );
}

function RevenuFields({
  revenu,
  index,
  onChange,
  onRemove,
}: {
  revenu: RevenuCategorie;
  index: number;
  onChange: (revenu: RevenuCategorie) => void;
  onRemove: () => void;
}): ReactElement {
  return (
    <AuditDrawerSection title={`Revenu ${index + 1}`}>
      <AuditDrawerFieldGrid>
        <SelectField
          label="Catégorie"
          value={revenu.categorie}
          options={REVENU_CATEGORIE_OPTIONS}
          onChange={(categorie) =>
            onChange({ ...revenu, categorie: categorie as RevenuCategorie['categorie'] })
          }
        />
        <SelectField
          label="Bénéficiaire"
          value={revenu.beneficiaire}
          options={BENEFICIAIRE_OPTIONS}
          onChange={(beneficiaire) =>
            onChange({ ...revenu, beneficiaire: beneficiaire as RevenuCategorie['beneficiaire'] })
          }
        />
        <SimAmountInputEuro
          label="Montant brut"
          value={revenu.montantBrut}
          onChange={(montantBrut) => onChange({ ...revenu, montantBrut })}
        />
        <SimAmountInputEuro
          label="Montant net"
          value={revenu.montantNet}
          onChange={(montantNet) => onChange({ ...revenu, montantNet })}
        />
      </AuditDrawerFieldGrid>
      <button type="button" className="audit-drawer-remove" onClick={onRemove}>
        <IconTrash />
        <span>Retirer</span>
      </button>
    </AuditDrawerSection>
  );
}

function LectureFiscaleDrawer({
  open,
  situationFiscale,
  onClose,
  onSave,
}: FiscalDrawerProps): ReactElement {
  const [form, setForm] = useState(situationFiscale);
  useEffect(() => {
    if (open) setForm(situationFiscale);
  }, [open, situationFiscale]);

  return (
    <AuditDrawerXL
      open={open}
      title="Lecture fiscale du foyer"
      subtitle="Parts et TMI renseignées par l’utilisateur, jamais calculées ici."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Lecture déclarative">
          <AuditDrawerFieldGrid>
            <SimAmountInputNumeric
              label="Nombre de parts renseigné"
              value={form.nombreParts}
              onChange={(nombreParts) => setForm({ ...form, nombreParts })}
              minimumFractionDigits={0}
              maximumFractionDigits={2}
            />
            <SimAmountInputPercent
              label="TMI renseignée"
              value={form.tmi}
              onChange={(tmi) => setForm({ ...form, tmi })}
              onEmpty={() => setForm({ ...form, tmi: 0 })}
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}

function AutresImpotsDrawer({
  open,
  situationFiscale,
  onClose,
  onSave,
}: FiscalDrawerProps): ReactElement {
  const [form, setForm] = useState(situationFiscale);
  useEffect(() => {
    if (open) setForm(situationFiscale);
  }, [open, situationFiscale]);

  return (
    <AuditDrawerXL
      open={open}
      title="IFI / autres impôts"
      subtitle="Montants indiqués, sans optimisation ni recommandation."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Autres impôts indiqués">
          <AuditDrawerFieldGrid>
            <SimAmountInputEuro
              label="IFI indiqué"
              value={form.ifi ?? 0}
              onChange={(ifi) => setForm({ ...form, ifi })}
              onEmpty={() => setForm({ ...form, ifi: undefined })}
            />
            <SimAmountInputEuro
              label="CEHR indiquée"
              value={form.cehr ?? 0}
              onChange={(cehr) => setForm({ ...form, cehr })}
              onEmpty={() => setForm({ ...form, cehr: undefined })}
            />
            <SimAmountInputEuro
              label="Taxe foncière indiquée"
              value={form.taxeFonciere ?? 0}
              onChange={(taxeFonciere) => setForm({ ...form, taxeFonciere })}
              onEmpty={() => setForm({ ...form, taxeFonciere: undefined })}
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}
