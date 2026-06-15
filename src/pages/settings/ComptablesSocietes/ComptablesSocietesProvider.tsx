import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { useComptablesSocietesSettings } from './useComptablesSocietesSettings';

type ComptablesSocietesContextValue = ReturnType<typeof useComptablesSocietesSettings>;

const ComptablesSocietesContext = createContext<ComptablesSocietesContextValue | null>(null);

export function ComptablesSocietesProvider({ children }: { children: ReactNode }): ReactElement {
  const value = useComptablesSocietesSettings();

  return (
    <ComptablesSocietesContext.Provider value={value}>
      {children}
    </ComptablesSocietesContext.Provider>
  );
}

export function useComptablesSocietesContext(): ComptablesSocietesContextValue {
  const context = useContext(ComptablesSocietesContext);
  if (!context) {
    throw new Error(
      'useComptablesSocietesContext doit être utilisé dans ComptablesSocietesProvider.',
    );
  }
  return context;
}

export default function ComptablesSocietesChapterProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return <ComptablesSocietesProvider>{children}</ComptablesSocietesProvider>;
}
