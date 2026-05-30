import { SimAmountInputNumeric } from '@/components/ui/sim';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import type { PerTransfertResult } from '@/engine/per';
import { Panel } from './PerTransfertLayoutPrimitives';
import { PerTransfertAttentionPoints } from './PerTransfertAttentionPoints';

export type PerTransfertSecondaryPanelId = 'target' | 'horizons' | 'attention';
export type PerTransfertSecondaryPanelsExpanded = Record<PerTransfertSecondaryPanelId, boolean>;

interface PerTransfertSidebarSecondaryProps {
  result: PerTransfertResult;
  selectedContract: BaseCgRetraiteContract | null;
  subscriptionDate: string;
  horizonAgeShort: number;
  horizonAgeLong: number;
  expandedPanels: PerTransfertSecondaryPanelsExpanded;
  onTogglePanel: (_panelId: PerTransfertSecondaryPanelId) => void;
  onHorizonChange: (_short: number, _long: number) => void;
}

const COMPARTMENT_SHORT_LABELS: Record<PerTransfertResult['compartment'], string> = {
  C0: 'C0',
  C1: 'C1',
  C1_BIS: 'C1 bis',
  C2: 'C2',
  C3: 'C3',
};

function normalizeHorizonAge(value: number, fallback: number): number {
  const nextValue = Number.isFinite(value) && value > 0 ? value : fallback;
  return Math.min(100, Math.max(60, Math.round(nextValue)));
}

export function PerTransfertSidebarSecondary({
  result,
  selectedContract,
  subscriptionDate,
  horizonAgeShort,
  horizonAgeLong,
  expandedPanels,
  onTogglePanel,
  onHorizonChange,
}: PerTransfertSidebarSecondaryProps) {
  return (
    <>
      <Panel
        title="Compartiment cible"
        subtitle="Lecture fiscale du compartiment repris après transfert."
        className="sim-summary-card sim-summary-card--secondary per-transfert-sidebar-panel"
        contentId="per-transfert-sidebar-target"
        collapsible
        expanded={expandedPanels.target}
        onToggleExpand={() => onTogglePanel('target')}
      >
        <CompartmentMiniBar active={result.compartment} />
      </Panel>

      <Panel
        title="Horizons projection"
        subtitle="Âges de référence pour les sorties fractionnées."
        className="sim-summary-card sim-summary-card--secondary per-transfert-sidebar-panel"
        contentId="per-transfert-sidebar-horizons"
        collapsible
        expanded={expandedPanels.horizons}
        onToggleExpand={() => onTogglePanel('horizons')}
      >
        <section className="per-transfert-horizons-inline" aria-label="Horizons de projection">
          <div className="per-transfert-horizons-inline__inputs">
            <SimAmountInputNumeric
              label="Court"
              value={horizonAgeShort}
              unit="ans"
              onChange={(value) => onHorizonChange(normalizeHorizonAge(value, 80), horizonAgeLong)}
            />
            <SimAmountInputNumeric
              label="Long"
              value={horizonAgeLong}
              unit="ans"
              onChange={(value) => onHorizonChange(horizonAgeShort, normalizeHorizonAge(value, 90))}
            />
          </div>
        </section>
      </Panel>

      <Panel
        title="Points d’attention"
        subtitle="Alertes contrat et moteur à contrôler avant restitution."
        className="sim-summary-card sim-summary-card--secondary per-transfert-sidebar-panel"
        contentId="per-transfert-sidebar-attention"
        collapsible
        expanded={expandedPanels.attention}
        onToggleExpand={() => onTogglePanel('attention')}
      >
        <PerTransfertAttentionPoints
          contract={selectedContract}
          subscriptionDate={subscriptionDate}
          extraWarnings={result.warnings}
          showTitle={false}
        />
      </Panel>
    </>
  );
}

function CompartmentMiniBar({ active }: { active: PerTransfertResult['compartment'] }) {
  const segments: Array<PerTransfertResult['compartment']> = ['C1', 'C1_BIS', 'C2', 'C3'];
  return (
    <section className="per-transfert-mini-bar" aria-label="Compartiment cible">
      <div className="per-transfert-mini-bar__track">
        {segments.map((segment) => (
          <span
            key={segment}
            className={`per-transfert-mini-bar__segment${segment === active ? ' is-active' : ''}`}
          >
            {COMPARTMENT_SHORT_LABELS[segment]}
          </span>
        ))}
      </div>
    </section>
  );
}
