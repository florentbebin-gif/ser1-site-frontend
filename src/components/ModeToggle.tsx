import React from 'react';
import { useUserMode } from '../settings/userMode';
import './ModeToggle.css';

interface ModeToggleProps {
  value?: boolean;
  onChange?: (_isExpert: boolean) => void;
  testId?: string;
}

export function ModeToggle({ value, onChange, testId }: ModeToggleProps = {}): React.ReactElement {
  const { mode: userMode, setMode: setUserMode, isLoading } = useUserMode();

  const isControlled = value !== undefined;
  const isExpert = isControlled ? value : userMode === 'expert';

  const handleToggle = (): void => {
    if (isControlled && onChange) {
      onChange(!isExpert);
    } else {
      setUserMode(isExpert ? 'simplifie' : 'expert');
    }
  };

  if (!isControlled && isLoading) {
    return (
      <div className="mode-toggle-row" data-testid={testId}>
        <span className="mode-toggle-label">Mode expert</span>
        <div className="mode-toggle-pill mode-toggle-pill--loading" />
      </div>
    );
  }

  return (
    <div className="mode-toggle-row" data-testid={testId}>
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
