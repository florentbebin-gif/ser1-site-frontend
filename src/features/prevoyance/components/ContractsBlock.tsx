import { useState } from 'react';
import { SimModalShell, SimSegmentedControl } from '@/components/ui/sim';
import {
  computeCollectiveAssietteBase,
  computeInvaliditePalierAmount,
  computeTranchesFromPass,
  PREVOYANCE_MAX_ARRET_DURATION_DAYS,
} from '@/domain/prevoyance/helpers';
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

type ContractEditorSection =
  | 'arret'
  | 'frais'
  | 'invalidite'
  | 'deces'
  | 'cotisation'
  | 'juridique';

const INDIVIDUAL_EDITOR_SECTIONS: Array<{ id: ContractEditorSection; label: string }> = [
  { id: 'arret', label: 'Arrêt de travail' },
  { id: 'frais', label: 'Frais généraux' },
  { id: 'invalidite', label: 'Invalidité' },
  { id: 'deces', label: 'Décès' },
  { id: 'cotisation', label: 'Cotisation' },
];

const COLLECTIVE_EDITOR_SECTIONS: Array<{ id: ContractEditorSection; label: string }> = [
  { id: 'arret', label: 'Arrêt de travail' },
  { id: 'invalidite', label: 'Invalidité' },
  { id: 'deces', label: 'Décès' },
  { id: 'cotisation', label: 'Cotisation' },
  { id: 'juridique', label: 'Acte juridique' },
];

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="12"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 16V6a2 2 0 0 1 2-2h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseGlyph() {
  return <span aria-hidden="true">×</span>;
}

function arretPalierDuration(
  palier: Extract<PrevoyanceContractDraft, { kind: 'individuel' }>['arret']['paliers'][number],
) {
  return Math.max(0, (palier.toDay ?? palier.fromDay) - palier.fromDay);
}

function getArretSummary(contract: PrevoyanceContractDraft, salaireBrutAnnuel: number): string {
  if (contract.kind === 'collectif') {
    const palier =
      [...(contract.arret.paliers?.length ? contract.arret.paliers : [])].sort(
        (a, b) =>
          Math.max(0, (b.toDay ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS) - b.fromDay) -
          Math.max(0, (a.toDay ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS) - a.fromDay),
      )[0] ?? null;
    const pct = palier?.salairePct ?? contract.arret.salairePct;
    return `${euro(Math.round((salaireBrutAnnuel * pct) / 100 / 12))}/mois`;
  }

  const palier =
    [...contract.arret.paliers].sort(
      (a, b) => arretPalierDuration(b) - arretPalierDuration(a),
    )[0] ?? null;
  return `${euro(palier?.amount ?? 0)}/j`;
}

function getFraisSummary(
  contract: Extract<PrevoyanceContractDraft, { kind: 'individuel' }>,
): string {
  if (!contract.fraisPro.enabled) return 'Non activés';
  return `${euro(contract.fraisPro.amount)}/mois`;
}

function getInvaliditeSummary(
  contract: PrevoyanceContractDraft,
  salaireBrutAnnuel: number,
): string {
  if (contract.kind === 'collectif') {
    const maxPct = Math.max(0, ...contract.invalidite.paliers.map((palier) => palier.salairePct));
    return `${euro(Math.round((salaireBrutAnnuel * maxPct) / 100))}/an`;
  }

  const maxAmount = Math.max(
    0,
    ...contract.invalidite.paliers.map((palier) =>
      computeInvaliditePalierAmount(palier, palier.toRate ?? 100),
    ),
  );
  return `${euro(maxAmount)}/an`;
}

function getDecesSummary(
  contract: PrevoyanceContractDraft,
  pass: number,
  salaireBrutAnnuel: number,
): string {
  if (contract.kind === 'individuel') return euro(contract.deces.capital);

  const tranches = computeTranchesFromPass(salaireBrutAnnuel, pass);
  const assietteBase = computeCollectiveAssietteBase(contract.assiette, tranches);
  return euro(Math.round((assietteBase * contract.deces.salairePct) / 100));
}

function contractModeLabel(contract: PrevoyanceContractDraft): string {
  if (contract.kind === 'individuel') {
    if (contract.indemnisation === contract.invalidite.indemnisation) return contract.indemnisation;
    return `Arrêt ${contract.indemnisation} · Invalidité ${contract.invalidite.indemnisation}`;
  }
  return `Entreprise · ${contract.assiette}`;
}

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
  const [activeEditorSection, setActiveEditorSection] = useState<ContractEditorSection>('arret');
  const editingContract = contracts.find((contract) => contract.id === editingContractId) ?? null;
  const editorSections =
    editingContract?.kind === 'collectif' ? COLLECTIVE_EDITOR_SECTIONS : INDIVIDUAL_EDITOR_SECTIONS;

  const openContractEditor = (contractId: string) => {
    setActiveEditorSection('arret');
    setEditingContractId(contractId);
  };
  const addContract = () => {
    if (contracts.length >= 3) return;
    const next = createDefaultContract(kind, contracts.length + 1, annualBase);
    onContractsChange([...contracts, next]);
    openContractEditor(next.id);
  };
  const updateContract = (next: PrevoyanceContractDraft) => {
    onContractsChange(contracts.map((contract) => (contract.id === next.id ? next : contract)));
  };
  const removeContract = (id: string) => {
    if (contracts.length <= 1) return;
    onContractsChange(contracts.filter((contract) => contract.id !== id));
    if (editingContractId === id) setEditingContractId(null);
  };
  const duplicateContract = (contract: PrevoyanceContractDraft) => {
    if (contracts.length >= 3) return;
    const duplicate = structuredClone(contract) as PrevoyanceContractDraft;
    duplicate.id = `contrat-${Date.now()}-${contracts.length + 1}`;
    duplicate.name = `Contrat ${contracts.length + 1}`;
    onContractsChange([...contracts, duplicate]);
    openContractEditor(duplicate.id);
  };

  return (
    <SectionCard
      title="Contrats de prévoyance"
      subtitle="Garanties souscrites hors régime obligatoire"
      icon="contracts"
      actions={
        <button
          type="button"
          className="prevoyance-add-icon-button"
          onClick={addContract}
          disabled={contracts.length >= 3}
          aria-label="Ajouter un contrat"
          title="Ajouter un contrat"
        >
          +
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
            <div className="prevoyance-contract-summary__header">
              <div>
                <h3>{contract.name}</h3>
                <p>{contractModeLabel(contract)}</p>
              </div>
              <div className="prevoyance-contract-summary__actions">
                <button
                  type="button"
                  className="prevoyance-summary-icon-button"
                  onClick={() => openContractEditor(contract.id)}
                  aria-label={`Modifier ${contract.name}`}
                  title={`Modifier ${contract.name}`}
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  className="prevoyance-summary-icon-button"
                  onClick={() => duplicateContract(contract)}
                  disabled={contracts.length >= 3}
                  aria-label={`Dupliquer ${contract.name}`}
                  title={`Dupliquer ${contract.name}`}
                >
                  <DuplicateIcon />
                </button>
                <button
                  type="button"
                  className="prevoyance-summary-icon-button prevoyance-summary-icon-button--remove"
                  onClick={() => removeContract(contract.id)}
                  disabled={contracts.length <= 1}
                  aria-label={`Supprimer ${contract.name}`}
                  title={`Supprimer ${contract.name}`}
                >
                  <CloseGlyph />
                </button>
              </div>
            </div>
            <dl className="prevoyance-contract-summary__rows">
              <div>
                <dt>Arrêt de travail</dt>
                <dd>{getArretSummary(contract, salaireBrutAnnuel)}</dd>
              </div>
              {contract.kind === 'individuel' ? (
                <div>
                  <dt>Frais généraux</dt>
                  <dd>{getFraisSummary(contract)}</dd>
                </div>
              ) : null}
              <div>
                <dt>Invalidité</dt>
                <dd>{getInvaliditeSummary(contract, salaireBrutAnnuel)}</dd>
              </div>
              <div>
                <dt>Décès</dt>
                <dd>{getDecesSummary(contract, pass, salaireBrutAnnuel)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      {editingContract ? (
        <SimModalShell
          title={`Modifier ${editingContract.name}`}
          subtitle="Sélectionnez une garantie, puis ajustez les paramètres utiles."
          onClose={() => setEditingContractId(null)}
          modalClassName="prevoyance-contract-modal"
          bodyClassName="prevoyance-contract-modal__body"
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
          <div className="prevoyance-contract-modal__layout">
            <nav className="prevoyance-contract-modal__nav" aria-label="Garanties du contrat">
              {editorSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={
                    activeEditorSection === section.id
                      ? 'prevoyance-contract-modal__nav-item is-active'
                      : 'prevoyance-contract-modal__nav-item'
                  }
                  aria-current={activeEditorSection === section.id ? 'step' : undefined}
                  onClick={() => setActiveEditorSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </nav>
            <div className="prevoyance-contract-modal__panel">
              {editingContract.kind === 'collectif' ? (
                <CollectiveContractCard
                  contract={editingContract}
                  index={contracts.findIndex((contract) => contract.id === editingContract.id)}
                  pass={pass}
                  salaireBrutAnnuel={salaireBrutAnnuel}
                  activeSection={activeEditorSection}
                  onChange={updateContract}
                  hasConjoint={hasConjoint}
                  hasChildren={hasChildren}
                />
              ) : (
                <IndividualContractCard
                  contract={editingContract}
                  index={contracts.findIndex((contract) => contract.id === editingContract.id)}
                  activeSection={activeEditorSection}
                  onChange={updateContract}
                  onOpenFrais={() => onOpenFrais(editingContract)}
                  hasConjoint={hasConjoint}
                  hasChildren={hasChildren}
                />
              )}
            </div>
          </div>
        </SimModalShell>
      ) : null}
    </SectionCard>
  );
}
