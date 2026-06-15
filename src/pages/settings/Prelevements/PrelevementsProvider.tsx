import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { usePrelevementsSettings } from './usePrelevementsSettings';

type PrelevementsContextValue = ReturnType<typeof usePrelevementsSettings>;

const PrelevementsContext = createContext<PrelevementsContextValue | null>(null);

export function usePrelevementsContext(): PrelevementsContextValue {
  const context = useContext(PrelevementsContext);
  if (!context) {
    throw new Error('usePrelevementsContext doit être utilisé dans PrelevementsProvider.');
  }
  return context;
}

export default function PrelevementsProvider({ children }: { children: ReactNode }): ReactElement {
  const value = usePrelevementsSettings();

  return <PrelevementsContext.Provider value={value}>{children}</PrelevementsContext.Provider>;
}
