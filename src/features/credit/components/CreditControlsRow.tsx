import { SimSegmentedControl } from '@/components/ui/sim';
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
      <div className="sim-controls-row__side" data-testid="credit-view-toggle">
        <SimSegmentedControl<CreditViewMode>
          value={viewMode}
          onChange={onChangeViewMode}
          ariaLabel="Période d’affichage"
          options={[
            { value: 'mensuel', label: 'Mensuel' },
            { value: 'annuel', label: 'Annuel' },
          ]}
        />
      </div>
    </>
  );
}
