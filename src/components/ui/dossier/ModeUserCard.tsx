import { type ReactElement } from 'react';

import { ModeToggleView } from '@/components/ModeToggle';
import { useUserMode } from '@/settings/userMode';
import './DossierContextCards.css';

interface ModeUserCardProps {
  testId?: string;
  toggleTestId?: string;
}

export function ModeUserCard({
  testId = 'home-mode-card',
  toggleTestId = 'home-mode-toggle',
}: ModeUserCardProps): ReactElement {
  const { mode, setMode, isLoading } = useUserMode();
  const isExpert = mode === 'expert';

  const handleModeToggle = (): void => {
    void setMode(isExpert ? 'simplifie' : 'expert');
  };

  return (
    <section className="dossier-context-card dossier-context-card--mode" data-testid={testId}>
      <span className="dossier-context-card__label">Mode utilisateur</span>
      <ModeToggleView
        isExpert={isExpert}
        isLoading={isLoading}
        onToggle={handleModeToggle}
        testId={toggleTestId}
      />
    </section>
  );
}

export default ModeUserCard;
