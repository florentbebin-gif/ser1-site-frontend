/**
 * CreditLoanTabs.jsx - Navigation par onglets Prêt 1/2/3
 * 
 * Inspiré du pattern settings-tab (SettingsShell.jsx).
 * - Prêt 1 : toujours visible et actif
 * - Prêt 2 : visible si créé, sinon "muted" avec "+"
 * - Prêt 3 : visible si Prêt 2 existe, sinon caché
 */

import React from 'react';
import './CreditV2.css';

export function CreditLoanTabs({
  activeTab,
  onChangeTab,
  hasPret2,
  hasPret3,
  onAddPret2,
  onAddPret3,
}) {
  const tabs = [
    { idx: 0, label: 'Prêt 1', available: true, addable: false },
    { idx: 1, label: 'Prêt 2', available: hasPret2, addable: !hasPret2 },
    { idx: 2, label: 'Prêt 3', available: hasPret3, addable: hasPret2 && !hasPret3 },
  ];

  return (
    <nav className="cv2-tabs" aria-label="Navigation prêts" data-testid="credit-tabs">
      <div className="cv2-tabs__list">
        {tabs.map((tab) => {
          // Prêt 3 caché si Prêt 2 n'existe pas
          if (tab.idx === 2 && !hasPret2) return null;

          const isActive = activeTab === tab.idx;

          return (
            <button
              key={tab.idx}
              type="button"
              className={[
                'cv2-tabs__tab',
                isActive && 'is-active',
                tab.addable && 'is-addable',
                !tab.available && !tab.addable && 'is-disabled',
              ].filter(Boolean).join(' ')}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                if (tab.available) {
                  onChangeTab(tab.idx);
                } else if (tab.addable) {
                  tab.idx === 1 ? onAddPret2() : onAddPret3();
                }
              }}
              data-testid={`credit-tab-${tab.idx}`}
            >
              {tab.label}
              {tab.addable && <span className="cv2-tabs__add-icon">+</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
