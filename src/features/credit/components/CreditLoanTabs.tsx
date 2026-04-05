/**
 * CreditLoanTabs.tsx - Navigation par onglets Prêt 1/2/3
 */

import type { CreditLoanTabsProps } from '../types';

export function CreditLoanTabs({
  activeTab,
  onChangeTab,
  hasPret2,
  hasPret3,
  onAddPret2,
  onAddPret3,
  onRemovePret2,
  onRemovePret3,
  isExpert = true,
}: CreditLoanTabsProps) {
  const tabs = [
    { idx: 0, label: 'Prêt 1', available: true, addable: false },
    { idx: 1, label: 'Prêt 2', available: hasPret2, addable: isExpert && !hasPret2 },
    { idx: 2, label: 'Prêt 3', available: hasPret3, addable: isExpert && hasPret2 && !hasPret3 },
  ];

  return (
    <nav className="cv-tabs" aria-label="Navigation prêts" data-testid="credit-tabs">
      <div className="cv-tabs__list">
        {tabs.map((tab) => {
          if (tab.idx === 2 && !hasPret2) return null;
          if (!isExpert && tab.idx === 2) return null;
          if (!isExpert && tab.idx === 1 && !hasPret2) return null;

          const isActive = activeTab === tab.idx;
          const showRemove = tab.available && tab.idx > 0 && isExpert;

          return (
            <div key={tab.idx} className="cv-tabs__tab-wrapper">
              <button
                type="button"
                className={[
                  'cv-tabs__tab',
                  isActive && 'is-active',
                  tab.addable && 'is-addable',
                  !tab.available && !tab.addable && 'is-disabled',
                ].filter(Boolean).join(' ')}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  if (tab.available) {
                    onChangeTab(tab.idx);
                  } else if (tab.addable) {
                    if (tab.idx === 1) onAddPret2();
                    else onAddPret3();
                  }
                }}
                data-testid={`credit-tab-${tab.idx}`}
              >
                {tab.label}
                {tab.addable && <span className="cv-tabs__add-badge" aria-hidden="true">+</span>}
              </button>
              {showRemove && (
                <button
                  type="button"
                  className="cv-tabs__tab-remove"
                  aria-label={`Supprimer ${tab.label}`}
                  data-testid={`credit-tab-remove-${tab.idx}`}
                  onClick={() => {
                    tab.idx === 1 ? onRemovePret2() : onRemovePret3();
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
