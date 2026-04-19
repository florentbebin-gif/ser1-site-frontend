import { CreditLoanTabs } from './CreditLoanTabs';
import type { CreditLoanTabsProps, CreditViewMode } from '../types';

interface CreditControlsRowProps extends CreditLoanTabsProps {
  viewMode: CreditViewMode;
  onChangeViewMode: (_viewMode: CreditViewMode) => void;
}

export function CreditControlsRow({
  activeTab,
  onChangeTab,
  hasPret2,
  hasPret3,
  onAddPret2,
  onAddPret3,
  onRemovePret2,
  onRemovePret3,
  isExpert = true,
  viewMode,
  onChangeViewMode,
}: CreditControlsRowProps) {
  return (
    <>
      <div className="sim-controls-row__main">
        <CreditLoanTabs
          activeTab={activeTab}
          onChangeTab={onChangeTab}
          hasPret2={hasPret2}
          hasPret3={hasPret3}
          onAddPret2={onAddPret2}
          onAddPret3={onAddPret3}
          onRemovePret2={onRemovePret2}
          onRemovePret3={onRemovePret3}
          isExpert={isExpert}
        />
      </div>
      <div className="sim-controls-row__side">
        <div className="cv-pill-toggle" data-testid="credit-view-toggle">
          <button
            className={`cv-pill-toggle__btn ${viewMode === 'mensuel' ? 'is-active' : ''}`}
            onClick={() => onChangeViewMode('mensuel')}
            data-testid="credit-view-mensuel"
          >
            Mensuel
          </button>
          <button
            className={`cv-pill-toggle__btn ${viewMode === 'annuel' ? 'is-active' : ''}`}
            onClick={() => onChangeViewMode('annuel')}
            data-testid="credit-view-annuel"
          >
            Annuel
          </button>
        </div>
      </div>
    </>
  );
}
