import SettingsModalShell from './components/SettingsModalShell';

export function SettingsDesignSystemInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <SettingsModalShell
      title="À quoi sert cette page ?"
      subtitle="Aide admin"
      onClose={onClose}
      bodyClassName="sim-info-modal-content"
      footer={
        <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={onClose}>
          Compris
        </button>
      }
    >
      <p>
        Cette page permet de vérifier rapidement les composants communs des simulateurs : champs,
        boutons, modales, tableaux, états et affichages mobiles. Elle sert de référence pour garder
        les pages sim/* cohérentes après une évolution du design system.
      </p>
    </SettingsModalShell>
  );
}
