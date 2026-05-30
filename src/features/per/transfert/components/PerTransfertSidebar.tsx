import { useState } from 'react';
import { SimEmptyState } from '@/components/ui/sim';
import type { BaseCgRetraiteContract, BaseCgRetraiteContractType } from '@/data/base-cg-retraite';
import type { PerTransfertResult } from '@/engine/per';
import {
  PerTransfertSidebarSecondary,
  type PerTransfertSecondaryPanelId,
  type PerTransfertSecondaryPanelsExpanded,
} from './PerTransfertSidebarSecondary';
import { PerTransfertSidebarSummary } from './PerTransfertSidebarSummary';

interface PerTransfertSidebarProps {
  result: PerTransfertResult;
  selectedContract: BaseCgRetraiteContract | null;
  typeContrat: BaseCgRetraiteContractType;
  subscriptionDate: string;
  step2Done: boolean;
  contractReady?: boolean;
  horizonAgeShort: number;
  horizonAgeLong: number;
  onHorizonChange: (_short: number, _long: number) => void;
  onOpenQuotientInfo: () => void;
  onOpenFractionalInfo: () => void;
}

const COMPACT_SIDEBAR_QUERY = '(max-width: 1024px)';

function shouldExpandSecondaryPanelsByDefault(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return !window.matchMedia(COMPACT_SIDEBAR_QUERY).matches;
}

function createInitialExpandedPanels(): PerTransfertSecondaryPanelsExpanded {
  const expanded = shouldExpandSecondaryPanelsByDefault();
  return {
    target: expanded,
    horizons: expanded,
    attention: expanded,
  };
}

export function PerTransfertSidebar({
  result,
  selectedContract,
  typeContrat,
  subscriptionDate,
  step2Done,
  contractReady = true,
  horizonAgeShort,
  horizonAgeLong,
  onHorizonChange,
  onOpenQuotientInfo,
  onOpenFractionalInfo,
}: PerTransfertSidebarProps) {
  const [expandedPanels, setExpandedPanels] = useState(createInitialExpandedPanels);

  function togglePanel(panelId: PerTransfertSecondaryPanelId) {
    setExpandedPanels((current) => ({ ...current, [panelId]: !current[panelId] }));
  }

  if (!contractReady) {
    return (
      <SimEmptyState
        variant="sidebar"
        illustration="docs"
        title="Synthèse en attente"
        description="Sélectionnez un contrat Base CG ou complétez le relevé pour afficher les scénarios."
      />
    );
  }

  return (
    <>
      <PerTransfertSidebarSummary
        result={result}
        selectedContract={selectedContract}
        typeContrat={typeContrat}
        step2Done={step2Done}
        horizonAgeShort={horizonAgeShort}
        horizonAgeLong={horizonAgeLong}
        onOpenQuotientInfo={onOpenQuotientInfo}
        onOpenFractionalInfo={onOpenFractionalInfo}
      />

      <PerTransfertSidebarSecondary
        result={result}
        selectedContract={selectedContract}
        subscriptionDate={subscriptionDate}
        horizonAgeShort={horizonAgeShort}
        horizonAgeLong={horizonAgeLong}
        expandedPanels={expandedPanels}
        onTogglePanel={togglePanel}
        onHorizonChange={onHorizonChange}
      />
    </>
  );
}
