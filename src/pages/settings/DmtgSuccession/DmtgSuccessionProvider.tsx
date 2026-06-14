import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { useDmtgSuccessionSettings } from './useDmtgSuccessionSettings';

type DmtgSuccessionContextValue = ReturnType<typeof useDmtgSuccessionSettings>;

const DmtgSuccessionContext = createContext<DmtgSuccessionContextValue | null>(null);

export function DmtgSuccessionProvider({ children }: { children: ReactNode }): ReactElement {
  const value = useDmtgSuccessionSettings();

  return <DmtgSuccessionContext.Provider value={value}>{children}</DmtgSuccessionContext.Provider>;
}

export function useDmtgSuccessionContext(): DmtgSuccessionContextValue {
  const context = useContext(DmtgSuccessionContext);
  if (!context) {
    throw new Error('useDmtgSuccessionContext doit être utilisé dans DmtgSuccessionProvider.');
  }
  return context;
}

export function DmtgSuccessionSaveBar(): ReactElement | null {
  const {
    isAdmin,
    loading,
    hasErrors,
    dmtgGoldenCheck,
    saveDisabled,
    saveTitle,
    saving,
    message,
    save,
  } = useDmtgSuccessionContext();

  if (!isAdmin || loading) return null;

  return (
    <div className="settings-memento-entry-section settings-dmtg-save-bar">
      {!hasErrors && !dmtgGoldenCheck.ok ? (
        <div className="settings-feedback-message settings-feedback-message--error">
          {dmtgGoldenCheck.message}
        </div>
      ) : null}

      <button
        type="button"
        className="chip settings-save-btn"
        onClick={save}
        disabled={saveDisabled}
        title={saveTitle}
      >
        {saving
          ? 'Enregistrement...'
          : hasErrors
            ? 'Erreurs de validation'
            : !dmtgGoldenCheck.ok
              ? 'Golden DMTG bloqué'
              : 'Enregistrer les paramètres DMTG & succession'}
      </button>

      {message ? (
        <div
          className={`settings-feedback-message ${message.includes('Erreur') ? 'settings-feedback-message--error' : 'settings-feedback-message--success'}`}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}

export default function DmtgSuccessionChapterProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <DmtgSuccessionProvider>
      {children}
      <DmtgSuccessionSaveBar />
    </DmtgSuccessionProvider>
  );
}
