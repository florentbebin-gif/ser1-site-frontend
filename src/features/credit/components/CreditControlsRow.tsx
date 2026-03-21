import { CreditLoanTabs } from './CreditLoanTabs';
import type { CreditLoanTabsProps, CreditViewMode } from '../types';

interface CreditControlsRowProps extends CreditLoanTabsProps {
  viewMode: CreditViewMode;
  onChangeViewMode: (_viewMode: CreditViewMode) => void;
}

export function CreditControlsRow({
  activeTab,
  onChangeTab,
  hasPret1,
  hasPret2,
  hasPret3,
  onAddPret1,
  onAddPret2,
  onAddPret3,
  onRemovePret2,
  onRemovePret3,
  isExpert = true,
  viewMode,
  onChangeViewMode,
}: CreditControlsRowProps) {
  return (
    <div className="cv2-controls-row">
      <div className="cv2-controls-row__left">
        <CreditLoanTabs
          activeTab={activeTab}
          onChangeTab={onChangeTab}
          hasPret1={hasPret1}
          hasPret2={hasPret2}
          hasPret3={hasPret3}
          onAddPret1={onAddPret1}
          onAddPret2={onAddPret2}
          onAddPret3={onAddPret3}
          onRemovePret2={onRemovePret2}
          onRemovePret3={onRemovePret3}
          isExpert={isExpert}
        />
      </div>
      <div className="cv2-controls-row__right">
        <div className="cv2-pill-toggle" data-testid="credit-view-toggle">
          <button
            className={`cv2-pill-toggle__btn ${viewMode === 'mensuel' ? 'is-active' : ''}`}
            onClick={() => onChangeViewMode('mensuel')}
            data-testid="credit-view-mensuel"
          >
            Mensuel
          </button>
          <button
            className={`cv2-pill-toggle__btn ${viewMode === 'annuel' ? 'is-active' : ''}`}
            onClick={() => onChangeViewMode('annuel')}
            data-testid="credit-view-annuel"
          >
            Annuel
          </button>
        </div>
      </div>
    </div>
  );
}
