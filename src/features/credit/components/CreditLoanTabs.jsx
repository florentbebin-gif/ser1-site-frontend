/**
 * CreditLoanTabs.jsx - Navigation par onglets Prêt 1/2/3
 *
 * Inspiré du pattern settings-tab (SettingsShell.jsx).
 * - Prêt 1 : toujours visible et actif
 * - Prêt 2 : visible si créé, sinon "muted" avec "+" (expert) ou absent (simplifié)
 * - Prêt 3 : visible si Prêt 2 existe (expert uniquement)
 *
 * PR2: Prop isExpert → en simplifié les onglets d'ajout sont masqués.
 * La parenté Credit.jsx fournit le lien discret pour ajouter un prêt en simplifié.
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
  isExpert = true,
}) {
  // Simplifié sans prêts additionnels : pas de tabs à afficher
  // (le lien discret est géré par Credit.jsx)
  if (!isExpert && !hasPret2 && !hasPret3) return null;

  const tabs = [
    { idx: 0, label: 'Prêt 1', available: true, addable: false },
    {
      idx: 1,
      label: 'Prêt 2',
      available: hasPret2,
      // En simplifié : pas de bouton +, l'ajout passe par le lien discret
      addable: isExpert && !hasPret2,
    },
    {
      idx: 2,
      label: 'Prêt 3',
      available: hasPret3,
      // Expert uniquement : onglet Prêt 3 avec +
      addable: isExpert && hasPret2 && !hasPret3,
    },
  ];

  return (
    <nav className="cv2-tabs" aria-label="Navigation prêts" data-testid="credit-tabs">
      <div className="cv2-tabs__list">
        {tabs.map((tab) => {
          // Prêt 3 caché si Prêt 2 n'existe pas
          if (tab.idx === 2 && !hasPret2) return null;
          // En simplifié : Prêt 3 pas du tout proposé
          if (!isExpert && tab.idx === 2) return null;

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
