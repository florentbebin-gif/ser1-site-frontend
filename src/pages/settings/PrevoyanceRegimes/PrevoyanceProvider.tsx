import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { usePrevoyanceMementoSettings } from './usePrevoyanceMementoSettings';

type PrevoyanceContextValue = ReturnType<typeof usePrevoyanceMementoSettings>;

const PrevoyanceContext = createContext<PrevoyanceContextValue | null>(null);

export function usePrevoyanceContext(): PrevoyanceContextValue {
  const context = useContext(PrevoyanceContext);
  if (!context) {
    throw new Error('usePrevoyanceContext doit être utilisé dans PrevoyanceProvider.');
  }
  return context;
}

export default function PrevoyanceProvider({ children }: { children: ReactNode }): ReactElement {
  const value = usePrevoyanceMementoSettings();

  return <PrevoyanceContext.Provider value={value}>{children}</PrevoyanceContext.Provider>;
}
