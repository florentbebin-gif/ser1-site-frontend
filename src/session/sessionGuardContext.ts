import React from 'react';

export interface SessionGuardContextValue {
  sessionExpired: boolean;
  canExport: boolean;
  trackBlobUrl: (_url: string) => void;
  resetInactivity: () => void;
}

export const SessionGuardContext = React.createContext<SessionGuardContextValue>({
  sessionExpired: false,
  canExport: true,
  trackBlobUrl: (_url: string) => {},
  resetInactivity: () => {},
});
