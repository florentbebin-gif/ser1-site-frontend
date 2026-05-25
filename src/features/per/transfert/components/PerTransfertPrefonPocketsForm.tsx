import { SimActionButton, SimInfoButton } from '@/components/ui/sim';
import {
  COMPARTMENT_LABELS,
  PREFON_USER_2026_SERVICE_VALUE,
  type BaseCgRetraitePrefonPocket,
  type PerTransfertCompartment,
} from '@/data/base-cg-retraite';
import {
  PerTransfertDecimalMoneyField,
  PerTransfertIntegerField,
  PerTransfertSelectField,
} from './PerTransfertFields';

interface PerTransfertPrefonPocketsFormProps {
  pockets: BaseCgRetraitePrefonPocket[];
  onChange: (_pockets: BaseCgRetraitePrefonPocket[]) => void;
  onOpenInfo: () => void;
  onOpenPocketSettings: (_index: number) => void;
}

const COMPARTMENT_OPTIONS = (Object.keys(COMPARTMENT_LABELS) as PerTransfertCompartment[]).map(
  (value) => ({
    value,
    label: COMPARTMENT_LABELS[value],
  }),
);

function normalizedPocket(
  pocket?: Partial<BaseCgRetraitePrefonPocket>,
): BaseCgRetraitePrefonPocket {
  return {
    compartment: pocket?.compartment ?? 'C1',
    points: pocket?.points ?? 0,
    capitalAmount: pocket?.capitalAmount ?? 0,
    unitValue: pocket?.unitValue ?? null,
    serviceValue: pocket?.serviceValue ?? PREFON_USER_2026_SERVICE_VALUE,
    transferValue: pocket?.transferValue ?? null,
    serviceRevaluationRate: pocket?.serviceRevaluationRate ?? 0,
    reversionEnabled: pocket?.reversionEnabled ?? false,
    reversionRate: pocket?.reversionRate ?? 0,
    spouseBirthYear: pocket?.spouseBirthYear ?? null,
    spouseAgeAtLiquidation: pocket?.spouseAgeAtLiquidation ?? null,
    c0CapitalOptionEnabled: pocket?.c0CapitalOptionEnabled ?? false,
    capitalOptionEnabled: pocket?.capitalOptionEnabled ?? true,
  };
}

export function PerTransfertPrefonPocketsForm({
  pockets,
  onChange,
  onOpenInfo,
  onOpenPocketSettings,
}: PerTransfertPrefonPocketsFormProps) {
  const rows = pockets.length > 0 ? pockets : [normalizedPocket()];

  const updatePocket = (index: number, updates: Partial<BaseCgRetraitePrefonPocket>) => {
    onChange(
      rows.map((pocket, rowIndex) =>
        rowIndex === index ? normalizedPocket({ ...pocket, ...updates }) : normalizedPocket(pocket),
      ),
    );
  };

  const addPocket = () => onChange([...rows.map(normalizedPocket), normalizedPocket()]);
  const removePocket = (index: number) =>
    onChange(rows.filter((_, rowIndex) => rowIndex !== index).map(normalizedPocket));

  return (
    <section className="per-transfert-points-panel per-transfert-prefon-pockets">
      <header className="per-transfert-prefon-pockets__header">
        <div>
          <h3>Compartiments Préfon</h3>
          <p>
            Saisissez chaque poche du relevé : compartiment, points acquis et valeur de service du
            point.
          </p>
        </div>
        <SimInfoButton ariaLabel="Informations sur les valeurs Préfon" onClick={onOpenInfo} />
      </header>

      <div className="per-transfert-prefon-pockets__list">
        {rows.map((pocket, index) => (
          <fieldset
            className="per-transfert-prefon-pockets__row"
            key={`${pocket.compartment}-${index}`}
          >
            <legend>
              Poche {index + 1}
              <SimActionButton
                variant="edit"
                mode="text"
                label="Paramètres de la poche"
                onClick={() => onOpenPocketSettings(index)}
                ariaLabel={`Paramètres de la poche ${index + 1}`}
              />
            </legend>
            <PerTransfertSelectField
              label="Compartiment"
              value={pocket.compartment}
              onChange={(value) =>
                updatePocket(index, { compartment: value as PerTransfertCompartment })
              }
              options={COMPARTMENT_OPTIONS}
            />
            <PerTransfertIntegerField
              label="Points acquis"
              value={pocket.points ?? 0}
              onChange={(value) => updatePocket(index, { points: value })}
              min={0}
            />
            <PerTransfertDecimalMoneyField
              label="Valeur de service du point"
              value={pocket.serviceValue ?? 0}
              onChange={(value) => updatePocket(index, { serviceValue: value })}
              min={0}
            />
            <SimActionButton
              variant="delete"
              mode="text"
              label="Supprimer"
              onClick={() => removePocket(index)}
              disabled={rows.length <= 1}
              ariaLabel={`Supprimer la poche ${index + 1}`}
              danger
            />
          </fieldset>
        ))}
      </div>

      <SimActionButton variant="add" mode="text" label="Ajouter une poche" onClick={addPocket} />
    </section>
  );
}
