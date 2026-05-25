import React from 'react';
import { useUserMode } from '../settings/userMode';
import './ModeToggle.css';

interface ModeToggleProps {
  value?: boolean;
  onChange?: (_isExpert: boolean) => void;
  testId?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface ModeToggleViewProps {
  isExpert: boolean;
  isLoading?: boolean;
  onToggle?: () => void;
  testId?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function ModeToggleView({
  isExpert,
  isLoading = false,
  onToggle,
  testId,
  disabled = false,
  disabledReason,
}: ModeToggleViewProps): React.ReactElement {
  if (isLoading) {
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
        className={[
          'mode-toggle-pill',
          isExpert ? 'mode-toggle-pill--active' : '',
          disabled ? 'mode-toggle-pill--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={disabled ? undefined : onToggle}
        aria-pressed={isExpert}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={disabled ? 'Mode expert indisponible' : 'Activer le mode expert'}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
      >
        <span className="mode-toggle-pill__knob" />
      </button>
    </div>
  );
}

export function ModeToggle({
  value,
  onChange,
  testId,
  disabled = false,
  disabledReason,
}: ModeToggleProps = {}): React.ReactElement {
  const { mode: userMode, setMode: setUserMode, isLoading } = useUserMode();

  const isControlled = value !== undefined;
  const isExpert = isControlled ? value : userMode === 'expert';

  const handleToggle = (): void => {
    if (disabled) return;
    if (isControlled && onChange) {
      onChange(!isExpert);
    } else {
      setUserMode(isExpert ? 'simplifie' : 'expert');
    }
  };

  return (
    <ModeToggleView
      isExpert={isExpert}
      isLoading={!isControlled && isLoading}
      onToggle={handleToggle}
      testId={testId}
      disabled={disabled}
      disabledReason={disabledReason}
    />
  );
}
