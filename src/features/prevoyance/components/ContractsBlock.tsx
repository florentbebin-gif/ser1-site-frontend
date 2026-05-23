import type { PrevoyanceContractDraft, PrevoyanceContractKind } from '@/domain/prevoyance/types';
import { createDefaultContract } from '../defaults';
import { CollectiveContractCard } from './CollectiveContractCard';
import { IndividualContractCard } from './IndividualContractCard';
import { SectionCard } from './FormPrimitives';

interface ContractsBlockProps {
  kind: PrevoyanceContractKind;
  contracts: PrevoyanceContractDraft[];
  annualBase: number;
  pass: number;
  salaireBrutAnnuel: number;
  onContractsChange: (contracts: PrevoyanceContractDraft[]) => void;
  onOpenFrais: (contract: Extract<PrevoyanceContractDraft, { kind: 'individuel' }>) => void;
}

export function ContractsBlock({
  kind,
  contracts,
  annualBase,
  pass,
  salaireBrutAnnuel,
  onContractsChange,
  onOpenFrais,
}: ContractsBlockProps) {
  const addContract = () => {
    if (contracts.length >= 3) return;
    onContractsChange([
      ...contracts,
      createDefaultContract(kind, contracts.length + 1, annualBase),
    ]);
  };
  const updateContract = (next: PrevoyanceContractDraft) => {
    onContractsChange(contracts.map((contract) => (contract.id === next.id ? next : contract)));
  };
  const removeContract = (id: string) => {
    onContractsChange(contracts.filter((contract) => contract.id !== id));
  };

  return (
    <SectionCard
      title="Contrats de prévoyance"
      subtitle={kind === 'collectif' ? 'Contrats entreprise' : 'Contrats individuels'}
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
      <div className="prevoyance-contract-grid" data-count={contracts.length}>
        {contracts.map((contract, index) =>
          contract.kind === 'collectif' ? (
            <CollectiveContractCard
              key={contract.id}
              contract={contract}
              index={index}
              pass={pass}
              salaireBrutAnnuel={salaireBrutAnnuel}
              onChange={updateContract}
              onRemove={() => removeContract(contract.id)}
              removable={contracts.length > 1}
            />
          ) : (
            <IndividualContractCard
              key={contract.id}
              contract={contract}
              index={index}
              onChange={updateContract}
              onRemove={() => removeContract(contract.id)}
              onOpenFrais={() => onOpenFrais(contract)}
              removable={contracts.length > 1}
            />
          ),
        )}
      </div>
    </SectionCard>
  );
}
