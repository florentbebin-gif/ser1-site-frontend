/**
 * features/placement/components/FiscalSummaryPanel.tsx
 *
 * PR8 — Panneau de synthèse fiscale pour le simulateur placement.
 *
 * Affiche les règles fiscales (3 phases : constitution / sortie / décès)
 * en colonne par produit. N'affiche rien si aucun des deux profils
 * ne possède de règles.
 */

import React from 'react';
import type { FiscalProfile } from '../../../domain/base-contrat/index';
import type { RuleBlock } from '../../../domain/base-contrat/index';

// ── Sous-composants ───────────────────────────────────────────────────────────

interface RuleBlockViewProps {
  block: RuleBlock;
}

const RuleBlockView = React.memo(function RuleBlockView({ block }: RuleBlockViewProps) {
  return (
    <div className="pl-fiscal-rule-block">
      <div className="pl-fiscal-rule-block__title">{block.title}</div>
      <ul className="pl-fiscal-rule-block__bullets">
        {block.bullets.map((bullet, i) => (
          <li key={i}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
});

// ── Labels de phases ──────────────────────────────────────────────────────────

const PHASE_LABELS = {
  constitution: 'Constitution',
  sortie: 'Sortie / rachat',
  deces: 'Décès / transmission',
} as const;

type PhaseKey = keyof typeof PHASE_LABELS;

// ── Composant principal ───────────────────────────────────────────────────────

export interface FiscalSummaryPanelProps {
  fiscalProfile1: FiscalProfile | null;
  fiscalProfile2: FiscalProfile | null;
}

export const FiscalSummaryPanel = React.memo(function FiscalSummaryPanel({
  fiscalProfile1,
  fiscalProfile2,
}: FiscalSummaryPanelProps) {
  const hasAny =
    (fiscalProfile1?.hasRules ?? false) || (fiscalProfile2?.hasRules ?? false);

  if (!hasAny) return null;

  return (
    <div className="pl-fiscal-panel premium-card">
      <div className="pl-card-title premium-section-title">Fiscalité</div>

      {(['constitution', 'sortie', 'deces'] as PhaseKey[]).map((phase) => {
        const blocks1 = fiscalProfile1?.rules[phase] ?? [];
        const blocks2 = fiscalProfile2?.rules[phase] ?? [];

        if (blocks1.length === 0 && blocks2.length === 0) return null;

        return (
          <div key={phase} className="pl-fiscal-phase">
            <div className="pl-fiscal-phase__label">{PHASE_LABELS[phase]}</div>
            <div className="pl-fiscal-phase__columns">
              {/* Produit 1 */}
              <div className="pl-fiscal-col pl-fiscal-col--p1">
                {blocks1.length > 0 ? (
                  blocks1.map((block, i) => <RuleBlockView key={i} block={block} />)
                ) : (
                  <span className="pl-fiscal-empty">—</span>
                )}
              </div>
              {/* Produit 2 */}
              <div className="pl-fiscal-col pl-fiscal-col--p2">
                {blocks2.length > 0 ? (
                  blocks2.map((block, i) => <RuleBlockView key={i} block={block} />)
                ) : (
                  <span className="pl-fiscal-empty">—</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
