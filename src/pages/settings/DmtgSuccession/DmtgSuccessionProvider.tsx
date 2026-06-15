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

export default function DmtgSuccessionChapterProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return <DmtgSuccessionProvider>{children}</DmtgSuccessionProvider>;
}
