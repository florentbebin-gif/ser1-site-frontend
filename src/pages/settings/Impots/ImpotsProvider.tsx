import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { useImpotsSettings } from './useImpotsSettings';

type ImpotsContextValue = ReturnType<typeof useImpotsSettings>;

const ImpotsContext = createContext<ImpotsContextValue | null>(null);

export function ImpotsProvider({ children }: { children: ReactNode }): ReactElement {
  const value = useImpotsSettings();

  return <ImpotsContext.Provider value={value}>{children}</ImpotsContext.Provider>;
}

export function useImpotsContext(): ImpotsContextValue {
  const context = useContext(ImpotsContext);
  if (!context) {
    throw new Error('useImpotsContext doit être utilisé dans ImpotsProvider.');
  }
  return context;
}

export default function ImpotsChapterProvider({ children }: { children: ReactNode }): ReactElement {
  return <ImpotsProvider>{children}</ImpotsProvider>;
}
