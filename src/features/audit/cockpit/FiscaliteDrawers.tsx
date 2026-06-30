import { useEffect, useState, type ReactElement } from 'react';

import type { BudgetSynthese, RevenuCategorie, SituationFiscale } from '@/domain/audit/types';
import {
  SimAmountInputEuro,
  SimAmountInputNumeric,
  type SimSelectOption,
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
import {
  ACTIVITE_CATEGORIES,
  CAPITAL_CATEGORIES,
  revenusForCategories,
  type FiscalDrawerId,
} from './auditFiscaliteModel';

const ACTIVITE_OPTIONS = REVENU_CATEGORIE_OPTIONS.filter((option) =>
  (ACTIVITE_CATEGORIES as string[]).includes(option.value),
);
const CAPITAL_OPTIONS = REVENU_CATEGORIE_OPTIONS.filter((option) =>
  (CAPITAL_CATEGORIES as string[]).includes(option.value),
);

const RCM_OPTION_OPTIONS: SimSelectOption[] = [
  { value: 'pfu', label: 'PFU (prélèvement forfaitaire unique)' },
  { value: 'bareme', label: 'Barème de l’IR (abattement 40 %)' },
];

interface FiscalDrawerContentProps {
  drawer: FiscalDrawerId | null;
  situationFiscale: SituationFiscale;
  budget: BudgetSynthese | undefined;
  onClose: () => void;
  onSaveFiscale: (situationFiscale: SituationFiscale) => void;
  onSaveBudget: (budget: BudgetSynthese) => void;
}

export function FiscalDrawerContent({
  drawer,
  situationFiscale,
  budget,
  onClose,
  onSaveFiscale,
  onSaveBudget,
}: FiscalDrawerContentProps): ReactElement | null {
  if (!drawer) return null;
  if (drawer === 'budget') {
    return <BudgetDrawer open budget={budget} onClose={onClose} onSave={onSaveBudget} />;
  }
  if (drawer === 'capital') {
    return (
      <RevenusCapitalDrawer
        open
        situationFiscale={situationFiscale}
        onClose={onClose}
        onSave={onSaveFiscale}
      />
    );
  }
  if (drawer === 'charges') {
    return (
      <ChargesDrawer
        open
        situationFiscale={situationFiscale}
        onClose={onClose}
        onSave={onSaveFiscale}
      />
    );
  }
  return (
    <RevenusActiviteDrawer
      open
      situationFiscale={situationFiscale}
      onClose={onClose}
      onSave={onSaveFiscale}
    />
  );
}

interface FiscalFormDrawerProps {
  open: boolean;
  situationFiscale: SituationFiscale;
  onClose: () => void;
  onSave: (situationFiscale: SituationFiscale) => void;
}

function useFiscalForm(open: boolean, situationFiscale: SituationFiscale) {
  const [form, setForm] = useState(situationFiscale);
  useEffect(() => {
    if (open) setForm(situationFiscale);
  }, [open, situationFiscale]);
  return [form, setForm] as const;
}

// Remplace le sous-ensemble de revenus d'un groupe sans toucher aux autres groupes.
function withGroupRevenus(
  form: SituationFiscale,
  categories: RevenuCategorie['categorie'][],
  group: RevenuCategorie[],
): SituationFiscale {
  const others = form.revenus.filter((revenu) => !categories.includes(revenu.categorie));
  return { ...form, revenus: [...others, ...group] };
}

function RevenusActiviteDrawer({
  open,
  situationFiscale,
  onClose,
  onSave,
}: FiscalFormDrawerProps): ReactElement {
  const [form, setForm] = useFiscalForm(open, situationFiscale);
  const group = revenusForCategories(form.revenus, ACTIVITE_CATEGORIES);

  return (
    <AuditDrawerXL
      open={open}
      title="Revenus d’activité & foyer fiscal"
      subtitle="Salaires, TNS et pensions du foyer, et données de l’avis."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Foyer fiscal" first>
          <AuditDrawerFieldGrid>
            <SimAmountInputNumeric
              label="Année de référence"
              value={form.anneeReference}
              onChange={(anneeReference) => setForm({ ...form, anneeReference })}
            />
            <SimAmountInputNumeric
              label="Nombre de parts"
              value={form.nombreParts}
              onChange={(nombreParts) => setForm({ ...form, nombreParts })}
              minimumFractionDigits={0}
              maximumFractionDigits={2}
            />
            <SimAmountInputEuro
              label="RFR déclaré sur l’avis"
              value={form.revenuFiscalReference}
              onChange={(revenuFiscalReference) => setForm({ ...form, revenuFiscalReference })}
              onEmpty={() => setForm({ ...form, revenuFiscalReference: 0 })}
            />
            <SimAmountInputEuro
              label="IR déclaré sur l’avis"
              value={form.impotRevenu}
              onChange={(impotRevenu) => setForm({ ...form, impotRevenu })}
              onEmpty={() => setForm({ ...form, impotRevenu: 0 })}
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>

        <RevenusGroupEditor
          revenus={group}
          options={ACTIVITE_OPTIONS}
          defaultCategorie="salaires"
          addLabel="Ajouter un revenu d’activité"
          onChange={(next) => setForm(withGroupRevenus(form, ACTIVITE_CATEGORIES, next))}
        />
      </div>
    </AuditDrawerXL>
  );
}

function RevenusCapitalDrawer({
  open,
  situationFiscale,
  onClose,
  onSave,
}: FiscalFormDrawerProps): ReactElement {
  const [form, setForm] = useFiscalForm(open, situationFiscale);
  const group = revenusForCategories(form.revenus, CAPITAL_CATEGORIES);

  return (
    <AuditDrawerXL
      open={open}
      title="Revenus du capital & patrimoine"
      subtitle="Capitaux mobiliers, plus-values et revenus fonciers."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Option d’imposition" first>
          <AuditDrawerFieldGrid>
            <SelectField
              label="Imposition des capitaux mobiliers"
              value={form.rcmOption ?? 'pfu'}
              options={RCM_OPTION_OPTIONS}
              onChange={(rcmOption) =>
                setForm({ ...form, rcmOption: rcmOption as SituationFiscale['rcmOption'] })
              }
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>

        <RevenusGroupEditor
          revenus={group}
          options={CAPITAL_OPTIONS}
          defaultCategorie="capitaux_mobiliers"
          addLabel="Ajouter un revenu du capital"
          onChange={(next) => setForm(withGroupRevenus(form, CAPITAL_CATEGORIES, next))}
        />
      </div>
    </AuditDrawerXL>
  );
}

function ChargesDrawer({
  open,
  situationFiscale,
  onClose,
  onSave,
}: FiscalFormDrawerProps): ReactElement {
  const [form, setForm] = useFiscalForm(open, situationFiscale);

  return (
    <AuditDrawerXL
      open={open}
      title="Charges, déductions & réductions"
      subtitle="Charges déductibles du revenu et réductions / crédits d’impôt."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Déductions et réductions" first>
          <AuditDrawerFieldGrid>
            <SimAmountInputEuro
              label="Charges déductibles du revenu"
              value={form.chargesDeductibles ?? 0}
              onChange={(chargesDeductibles) => setForm({ ...form, chargesDeductibles })}
              onEmpty={() => setForm({ ...form, chargesDeductibles: undefined })}
            />
            <SimAmountInputEuro
              label="Réductions et crédits d’impôt"
              value={form.reductionsCredits ?? 0}
              onChange={(reductionsCredits) => setForm({ ...form, reductionsCredits })}
              onEmpty={() => setForm({ ...form, reductionsCredits: undefined })}
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}

function BudgetDrawer({
  open,
  budget,
  onClose,
  onSave,
}: {
  open: boolean;
  budget: BudgetSynthese | undefined;
  onClose: () => void;
  onSave: (budget: BudgetSynthese) => void;
}): ReactElement {
  const [form, setForm] = useState<BudgetSynthese>(
    budget ?? { ressourcesAnnuelles: 0, chargesAnnuelles: 0 },
  );
  useEffect(() => {
    if (open) setForm(budget ?? { ressourcesAnnuelles: 0, chargesAnnuelles: 0 });
  }, [open, budget]);

  return (
    <AuditDrawerXL
      open={open}
      title="Budget & capacité"
      subtitle="Ressources et charges annuelles du foyer, hors impôts."
      onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onSave={() => onSave(form)} />}
    >
      <div className="audit-drawer-form">
        <AuditDrawerSection title="Train de vie annuel" first>
          <AuditDrawerFieldGrid>
            <SimAmountInputEuro
              label="Ressources annuelles"
              value={form.ressourcesAnnuelles}
              onChange={(ressourcesAnnuelles) => setForm({ ...form, ressourcesAnnuelles })}
              onEmpty={() => setForm({ ...form, ressourcesAnnuelles: 0 })}
            />
            <SimAmountInputEuro
              label="Charges courantes annuelles"
              value={form.chargesAnnuelles}
              onChange={(chargesAnnuelles) => setForm({ ...form, chargesAnnuelles })}
              onEmpty={() => setForm({ ...form, chargesAnnuelles: 0 })}
            />
          </AuditDrawerFieldGrid>
        </AuditDrawerSection>
      </div>
    </AuditDrawerXL>
  );
}

// ─── Éditeur de revenus d'un groupe (catégories filtrées) ─────────────────────

function RevenusGroupEditor({
  revenus,
  options,
  defaultCategorie,
  addLabel,
  onChange,
}: {
  revenus: RevenuCategorie[];
  options: SimSelectOption[];
  defaultCategorie: RevenuCategorie['categorie'];
  addLabel: string;
  onChange: (revenus: RevenuCategorie[]) => void;
}): ReactElement {
  const add = () => onChange([...revenus, { ...createRevenu(), categorie: defaultCategorie }]);

  return (
    <div className="audit-drawer-form">
      <button type="button" className="audit-drawer-add" onClick={add}>
        <IconPlus />
        <span>{addLabel}</span>
      </button>
      {revenus.length === 0 ? (
        <p className="audit-drawer-empty">Aucun revenu de ce type renseigné.</p>
      ) : (
        revenus.map((revenu, index) => (
          <RevenuFields
            key={revenu.id}
            revenu={revenu}
            index={index}
            options={options}
            onChange={(next) => onChange(updateAt(revenus, index, next))}
            onRemove={() => onChange(revenus.filter((item) => item.id !== revenu.id))}
          />
        ))
      )}
    </div>
  );
}

function RevenuFields({
  revenu,
  index,
  options,
  onChange,
  onRemove,
}: {
  revenu: RevenuCategorie;
  index: number;
  options: SimSelectOption[];
  onChange: (revenu: RevenuCategorie) => void;
  onRemove: () => void;
}): ReactElement {
  return (
    <AuditDrawerSection title={`Revenu ${index + 1}`}>
      <AuditDrawerFieldGrid>
        <SelectField
          label="Catégorie"
          value={revenu.categorie}
          options={options}
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
          label="Montant net imposable"
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
