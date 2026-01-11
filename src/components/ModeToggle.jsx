import React from 'react';
import { useUserMode } from '../services/userModeService';

export function ModeToggle() {
  const { mode: userMode, setMode: setUserMode, isLoading } = useUserMode();

  const isExpert = userMode === 'expert';

  const handleToggle = () => {
    setUserMode(isExpert ? 'simplifie' : 'expert');
  };

  if (isLoading) {
    return (
      <div className="mode-toggle-row">
        <span className="mode-toggle-label">Mode expert</span>
        <div className="mode-toggle-pill mode-toggle-pill--loading" />
      </div>
    );
  }

  return (
    <div className="mode-toggle-row">
      <span className="mode-toggle-label">Mode expert</span>
      <button
        type="button"
        className={`mode-toggle-pill ${isExpert ? 'mode-toggle-pill--active' : ''}`}
        onClick={handleToggle}
        aria-pressed={isExpert}
        aria-label="Activer le mode expert"
      >
        <span className="mode-toggle-pill__knob" />
      </button>
    </div>
  );
}
