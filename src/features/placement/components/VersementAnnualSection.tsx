import { type VersementAnnuel, type VersementOption } from '@/engine/placement/versementConfig';
import { SimActionButton } from '@/components/ui/sim';
import { PlacementEuroField, PlacementPercentField } from './PlacementAmountControls';
import { AllocationSlider } from './PlacementTables';
import { VersementSectionShell } from './VersementConfigModalSectionShell';

interface VersementAnnualSectionProps {
  active: boolean;
  annuel: VersementAnnuel;
  isPER: boolean;
  isSCPI: boolean;
  isExpert: boolean;
  onAddAnnual: () => void;
  onRemoveAnnual: () => void;
  onUpdateAnnuel: <K extends keyof VersementAnnuel>(field: K, value: VersementAnnuel[K]) => void;
  onUpdateAnnuelAlloc: (_capi: number, _distrib: number) => void;
  onUpdateAnnuelOption: <K extends keyof VersementOption>(
    optionName: 'garantieBonneFin' | 'exonerationCotisations',
    field: K,
    value: VersementOption[K],
  ) => void;
}

export function VersementAnnualSection({
  active,
  annuel,
  isPER,
  isSCPI,
  isExpert,
  onAddAnnual,
  onRemoveAnnual,
  onUpdateAnnuel,
  onUpdateAnnuelAlloc,
  onUpdateAnnuelOption,
}: VersementAnnualSectionProps) {
  if (!active) {
    return (
      <VersementSectionShell
        step="2"
        title="Versement annuel"
        action={<SimActionButton variant="add" mode="text" label="Ajouter" onClick={onAddAnnual} />}
      >
        <div className="vcm__empty">
          <p>Aucun versement annuel configuré</p>
          <SimActionButton
            variant="add"
            mode="text"
            label="Ajouter un versement annuel"
            onClick={onAddAnnual}
          />
        </div>
      </VersementSectionShell>
    );
  }

  return (
    <VersementSectionShell
      step="2"
      title="Versement annuel"
      action={
        <SimActionButton
          variant="delete"
          mode="text"
          label="Supprimer"
          onClick={onRemoveAnnual}
          danger
        />
      }
    >
      <div className="vcm__card">
        <div className="vcm__row vcm__row--4cols">
          <PlacementEuroField
            label="Montant"
            value={annuel.montant}
            onChange={(value) => onUpdateAnnuel('montant', value)}
          />
          {!isSCPI && (
            <PlacementPercentField
              label="Frais d'entrée"
              value={annuel.fraisEntree}
              onChange={(value) => onUpdateAnnuel('fraisEntree', value)}
            />
          )}
          <div className={`vcm__field vcm__field--alloc${isSCPI ? '' : ''}`}>
            <div className="vcm__label vcm__label--sentence">Allocation</div>
            <AllocationSlider
              pctCapi={annuel.pctCapitalisation}
              pctDistrib={annuel.pctDistribution}
              onChange={onUpdateAnnuelAlloc}
              isSCPI={isSCPI}
              disabled={!isExpert && !isSCPI}
              readOnly
            />
          </div>
        </div>

        {isPER ? (
          <div className="vcm__per-options">
            <div className="vcm__per-option">
              <label className="vcm__checkbox">
                <input
                  type="checkbox"
                  checked={annuel.garantieBonneFin.active}
                  onChange={(event) =>
                    onUpdateAnnuelOption('garantieBonneFin', 'active', event.target.checked)
                  }
                />
                <span>Garantie de bonne fin</span>
              </label>
              {annuel.garantieBonneFin.active ? (
                <PlacementPercentField
                  label="Coût annuel"
                  value={annuel.garantieBonneFin.cout}
                  onChange={(value) => onUpdateAnnuelOption('garantieBonneFin', 'cout', value)}
                />
              ) : null}
              <p className="vcm__hint">Capital décès = durée restante x versement annuel</p>
            </div>

            <div className="vcm__per-option">
              <label className="vcm__checkbox">
                <input
                  type="checkbox"
                  checked={annuel.exonerationCotisations.active}
                  onChange={(event) =>
                    onUpdateAnnuelOption('exonerationCotisations', 'active', event.target.checked)
                  }
                />
                <span>Exonération des cotisations</span>
              </label>
              {annuel.exonerationCotisations.active ? (
                <PlacementPercentField
                  label="Coût annuel"
                  value={annuel.exonerationCotisations.cout}
                  onChange={(value) =>
                    onUpdateAnnuelOption('exonerationCotisations', 'cout', value)
                  }
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </VersementSectionShell>
  );
}
