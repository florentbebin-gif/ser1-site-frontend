import type { VersementPonctuel } from '@/engine/placement/versementConfig';
import { SimActionButton, SimAmountInputEuro, SimAmountInputPercent } from '@/components/ui/sim';
import { PlacementNumberField } from './PlacementAmountControls';
import { AllocationSlider } from './PlacementTables';
import { VersementSectionShell } from './VersementConfigModalSectionShell';

interface VersementPonctuelsSectionProps {
  ponctuels: VersementPonctuel[];
  dureeEpargne: number;
  isSCPI: boolean;
  onAddPonctuel: () => void;
  onUpdatePonctuel: <K extends keyof VersementPonctuel>(
    index: number,
    field: K,
    value: VersementPonctuel[K],
  ) => void;
  onUpdatePonctuelAlloc: (_index: number, _capi: number, _distrib: number) => void;
  onRemovePonctuel: (_index: number) => void;
}

export function VersementPonctuelsSection({
  ponctuels,
  dureeEpargne,
  isSCPI,
  onAddPonctuel,
  onUpdatePonctuel,
  onUpdatePonctuelAlloc,
  onRemovePonctuel,
}: VersementPonctuelsSectionProps) {
  return (
    <VersementSectionShell
      step="3"
      title="Versements ponctuels"
      action={<SimActionButton variant="add" mode="text" label="Ajouter" onClick={onAddPonctuel} />}
    >
      {ponctuels.length === 0 ? (
        <div className="vcm__empty">
          <p>Aucun versement ponctuel configuré</p>
          <SimActionButton
            variant="add"
            mode="text"
            label="Ajouter un versement"
            onClick={onAddPonctuel}
          />
        </div>
      ) : (
        <div className={`vcm__ponctuels${isSCPI ? ' vcm__ponctuels--scpi' : ''}`}>
          <div className="vcm__ponctuel-headers">
            <span>Année</span>
            <span>Montant</span>
            {!isSCPI && <span>Frais d'entrée</span>}
            <span className="vcm__ponctuel-header--center">Allocation</span>
            <span />
          </div>

          {ponctuels.map((ponctuel, index) => (
            <div key={index} className="vcm__ponctuel-row">
              <div className="vcm__ponctuel-cell">
                <PlacementNumberField
                  value={ponctuel.annee}
                  onChange={(value) => onUpdatePonctuel(index, 'annee', value ?? 1)}
                  min={1}
                  max={dureeEpargne}
                  inline
                />
              </div>

              <div className="vcm__ponctuel-cell">
                <SimAmountInputEuro
                  value={ponctuel.montant}
                  ariaLabel="Montant"
                  className="vcm__mini-input"
                  fieldClassName="vcm__mini-field"
                  rowClassName="vcm__mini-input-wrap"
                  unitClassName="vcm__mini-unit"
                  onChange={(value) => onUpdatePonctuel(index, 'montant', value)}
                />
              </div>

              {!isSCPI && (
                <div className="vcm__ponctuel-cell">
                  <SimAmountInputPercent
                    value={ponctuel.fraisEntree * 100}
                    ariaLabel="Frais d'entrée (%)"
                    min={0}
                    max={100}
                    className="vcm__mini-input"
                    fieldClassName="vcm__mini-field"
                    rowClassName="vcm__mini-input-wrap"
                    unitClassName="vcm__mini-unit"
                    minimumFractionDigits={1}
                    maximumFractionDigits={1}
                    onChange={(value) => onUpdatePonctuel(index, 'fraisEntree', value / 100)}
                  />
                </div>
              )}

              <div className="vcm__ponctuel-cell vcm__ponctuel-cell--alloc">
                {isSCPI ? (
                  <span className="vcm__alloc-fixed">100% D</span>
                ) : (
                  <AllocationSlider
                    pctCapi={ponctuel.pctCapitalisation}
                    pctDistrib={ponctuel.pctDistribution}
                    onChange={(capi, distrib) => onUpdatePonctuelAlloc(index, capi, distrib)}
                    isSCPI={false}
                    readOnly
                  />
                )}
              </div>

              <div className="vcm__ponctuel-cell">
                <SimActionButton
                  variant="delete"
                  mode="icon"
                  label="Supprimer"
                  onClick={() => onRemovePonctuel(index)}
                  ariaLabel={`Supprimer le versement ponctuel ${index + 1}`}
                  danger
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </VersementSectionShell>
  );
}
