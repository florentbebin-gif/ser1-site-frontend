import { useState } from 'react';
import { SimModalShell, SimSegmentedControl } from '@/components/ui/sim';
import type {
  PrevoyanceContractAggregationMode,
  PrevoyanceContractDraft,
  PrevoyanceContractKind,
} from '@/domain/prevoyance/types';
import { createDefaultContract } from '../defaults';
import { euro } from '../formatters';
import { CollectiveContractCard } from './CollectiveContractCard';
import { IndividualContractCard } from './IndividualContractCard';
import { SectionCard } from './FormPrimitives';

interface ContractsBlockProps {
  kind: PrevoyanceContractKind;
  contracts: PrevoyanceContractDraft[];
  contractAggregationMode: PrevoyanceContractAggregationMode;
  annualBase: number;
  pass: number;
  salaireBrutAnnuel: number;
  hasConjoint: boolean;
  hasChildren: boolean;
  onContractsChange: (contracts: PrevoyanceContractDraft[]) => void;
  onContractAggregationModeChange: (mode: PrevoyanceContractAggregationMode) => void;
  onOpenFrais: (contract: Extract<PrevoyanceContractDraft, { kind: 'individuel' }>) => void;
}

export function ContractsBlock({
  kind,
  contracts,
  contractAggregationMode,
  annualBase,
  pass,
  salaireBrutAnnuel,
  hasConjoint,
  hasChildren,
  onContractsChange,
  onContractAggregationModeChange,
  onOpenFrais,
}: ContractsBlockProps) {
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const editingContract = contracts.find((contract) => contract.id === editingContractId) ?? null;

  const addContract = () => {
    if (contracts.length >= 3) return;
    const next = createDefaultContract(kind, contracts.length + 1, annualBase);
    onContractsChange([...contracts, next]);
    setEditingContractId(next.id);
  };
  const updateContract = (next: PrevoyanceContractDraft) => {
    onContractsChange(contracts.map((contract) => (contract.id === next.id ? next : contract)));
  };
  const removeContract = (id: string) => {
    onContractsChange(contracts.filter((contract) => contract.id !== id));
    if (editingContractId === id) setEditingContractId(null);
  };
  const duplicateContract = (contract: PrevoyanceContractDraft) => {
    if (contracts.length >= 3) return;
    const duplicate = structuredClone(contract) as PrevoyanceContractDraft;
    duplicate.id = `contrat-${Date.now()}-${contracts.length + 1}`;
    duplicate.name = `Contrat ${contracts.length + 1}`;
    onContractsChange([...contracts, duplicate]);
    setEditingContractId(duplicate.id);
  };

  return (
    <SectionCard
      title="Contrats de prévoyance"
      subtitle="Garanties privées à comparer ou à cumuler"
      icon="contracts"
      actions={
        <button
          type="button"
          className="prevoyance-add-button"
          onClick={addContract}
          disabled={contracts.length >= 3}
        >
          Ajouter
        </button>
      }
    >
      <div className="prevoyance-contract-mode">
        <SimSegmentedControl
          value={contractAggregationMode}
          onChange={(value) =>
            onContractAggregationModeChange(value as PrevoyanceContractAggregationMode)
          }
          ariaLabel="Mode de lecture des contrats de prévoyance"
          size="sm"
          options={[
            { value: 'compare', label: 'Comparer' },
            { value: 'cumulate', label: 'Cumuler' },
          ]}
        />
      </div>

      <div className="prevoyance-contract-summary-grid" data-count={contracts.length}>
        {contracts.map((contract) => (
          <article key={contract.id} className="prevoyance-contract-summary">
            <div>
              <h3>{contract.name}</h3>
              <p>
                {contract.kind === 'individuel'
                  ? contract.indemnisation
                  : `Entreprise · ${contract.assiette}`}
              </p>
            </div>
            <dl>
              <div>
                <dt>Arrêt</dt>
                <dd>
                  {contract.kind === 'individuel'
                    ? `${contract.arret.paliers.length} période(s)`
                    : `${contract.arret.salairePct} % salaire`}
                </dd>
              </div>
              <div>
                <dt>Décès</dt>
                <dd>
                  {contract.kind === 'individuel'
                    ? euro(contract.deces.capital)
                    : `${contract.deces.salairePct} % salaire`}
                </dd>
              </div>
            </dl>
            <div className="prevoyance-contract-summary__actions">
              <button
                type="button"
                className="prevoyance-link-button"
                onClick={() => setEditingContractId(contract.id)}
              >
                Modifier
              </button>
              <button
                type="button"
                className="prevoyance-link-button"
                onClick={() => duplicateContract(contract)}
                disabled={contracts.length >= 3}
              >
                Dupliquer
              </button>
              {contracts.length > 1 ? (
                <button
                  type="button"
                  className="prevoyance-link-button"
                  onClick={() => removeContract(contract.id)}
                >
                  Supprimer
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {editingContract ? (
        <SimModalShell
          title={`Modifier ${editingContract.name}`}
          subtitle="Base, arrêt de travail, invalidité, décès et cotisation."
          onClose={() => setEditingContractId(null)}
          modalClassName="prevoyance-contract-modal"
          footer={
            <button
              type="button"
              className="sim-modal-btn sim-modal-btn--primary"
              onClick={() => setEditingContractId(null)}
            >
              Terminer
            </button>
          }
        >
          <div className="prevoyance-contract-modal__steps" aria-hidden="true">
            <span>Base</span>
            <span>Arrêt</span>
            <span>Invalidité</span>
            <span>Décès</span>
            <span>Cotisation</span>
          </div>
          {editingContract.kind === 'collectif' ? (
            <CollectiveContractCard
              contract={editingContract}
              index={contracts.findIndex((contract) => contract.id === editingContract.id)}
              pass={pass}
              salaireBrutAnnuel={salaireBrutAnnuel}
              onChange={updateContract}
              onRemove={() => removeContract(editingContract.id)}
              removable={contracts.length > 1}
              hasConjoint={hasConjoint}
              hasChildren={hasChildren}
            />
          ) : (
            <IndividualContractCard
              contract={editingContract}
              index={contracts.findIndex((contract) => contract.id === editingContract.id)}
              onChange={updateContract}
              onRemove={() => removeContract(editingContract.id)}
              onOpenFrais={() => onOpenFrais(editingContract)}
              removable={contracts.length > 1}
              hasConjoint={hasConjoint}
              hasChildren={hasChildren}
            />
          )}
        </SimModalShell>
      ) : null}
    </SectionCard>
  );
}
