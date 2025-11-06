import React, { createContext, useContext, useState } from "react";

const ResetContext = createContext({
  pageReset: null,           // fonction reset de la page courante (ou null)
  setPageReset: () => {},    // setter pour que la page enregistre sa fonction
});

export function ResetProvider({ children }) {
  const [pageReset, setPageReset] = useState(null);
  return (
    <ResetContext.Provider value={{ pageReset, setPageReset }}>
      {children}
    </ResetContext.Provider>
  );
}

export function useReset() {
  return useContext(ResetContext);
}
