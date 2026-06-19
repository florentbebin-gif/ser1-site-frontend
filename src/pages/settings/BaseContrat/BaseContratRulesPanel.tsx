import type { ReactElement } from 'react';

import type { Confidence, ProductRules, RuleBlock } from '@/domain/base-contrat/rules/index';
import type { MementoReferenceValue } from '@/domain/settings-memento/referenceValues';

import { PHASE_LABELS } from '../baseContratLabels';
import { RuleSourcesList } from '../BaseContratRuleSources';
import ReferenceValuesRow from './ReferenceValuesRow';

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  elevee: 'C1 - Source qualité : vérifiée',
  moyenne: 'C1 - Source qualité : à vérifier',
  faible: 'C1 - Source qualité : non vérifiée',
};

function RuleBlockCard({ block, showAdminMeta }: { block: RuleBlock; showAdminMeta: boolean }) {
  const hasSources = Boolean(block.sources && block.sources.length > 0);

  return (
    <div className="settings-reference-rule-card">
      <div className="settings-reference-rule-card__title">{block.title}</div>
      <ul className="settings-reference-rule-card__list">
        {block.bullets.map((bullet, index) => (
          <li key={index}>{bullet}</li>
        ))}
      </ul>
      {(showAdminMeta || hasSources) && (
        <div
          className="settings-reference-rule-meta"
          aria-label={showAdminMeta ? 'Métadonnées admin' : 'Sources'}
        >
          {showAdminMeta && (
            <span
              className={`settings-reference-confidence settings-reference-confidence--${block.confidence}`}
            >
              {CONFIDENCE_LABELS[block.confidence]}
            </span>
          )}
          {hasSources && block.sources && (
            <div className="settings-reference-rule-meta__group">
              <span className="settings-reference-rule-meta__label">Sources</span>
              <RuleSourcesList sources={block.sources} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyRuleCard() {
  return (
    <div className="settings-reference-empty-card">
      <div className="settings-reference-empty-card__title">Aucune règle renseignée</div>
      <div className="settings-reference-empty-card__body">
        Ce produit ne possède pas de règles fiscales spécifiques pour cette phase.
      </div>
    </div>
  );
}

function PhaseColumn({
  phaseKey,
  blocks,
  showAdminMeta,
}: {
  phaseKey: 'constitution' | 'sortie' | 'deces';
  blocks: RuleBlock[];
  showAdminMeta: boolean;
}) {
  return (
    <div className="settings-reference-phase">
      <div
        className={`settings-reference-phase__title settings-reference-phase__title--${phaseKey}`}
      >
        {PHASE_LABELS[phaseKey]}
      </div>
      {blocks.length === 0 ? (
        <EmptyRuleCard />
      ) : (
        blocks.map((block, index) => (
          <RuleBlockCard key={index} block={block} showAdminMeta={showAdminMeta} />
        ))
      )}
    </div>
  );
}

interface BaseContratRulesPanelProps {
  rules: ProductRules;
  closed: boolean;
  showAdminMeta: boolean;
  referenceValues: readonly MementoReferenceValue[];
  referenceValuesError: string | null;
  onReferenceNumericChange: (key: string, field: 'value_numeric' | 'year', value: string) => void;
  onReferenceTextChange: (key: string, field: 'value_text' | 'note', value: string) => void;
}

export default function BaseContratRulesPanel({
  rules,
  closed,
  showAdminMeta,
  referenceValues,
  referenceValuesError,
  onReferenceNumericChange,
  onReferenceTextChange,
}: BaseContratRulesPanelProps): ReactElement {
  return (
    <div className={`settings-reference-rules${closed ? ' settings-reference-rules--closed' : ''}`}>
      <ReferenceValuesRow
        values={referenceValues}
        isAdmin={showAdminMeta}
        error={referenceValuesError}
        onNumericChange={onReferenceNumericChange}
        onTextChange={onReferenceTextChange}
      />
      <div className="settings-reference-rules__grid">
        {(['constitution', 'sortie', 'deces'] as const).map((phaseKey) => (
          <PhaseColumn
            key={phaseKey}
            phaseKey={phaseKey}
            blocks={rules[phaseKey]}
            showAdminMeta={showAdminMeta}
          />
        ))}
      </div>
    </div>
  );
}
