/**
 * SimulatorShell — Wrapper layout partagé pour tous les simulateurs.
 * Fournit le shell de page (.sim-page).
 * Usage : import { SimulatorShell } from '@/components/simulator/SimulatorShell'
 */

import React from 'react';
import './SimulatorShell.css';

export function SimulatorShell({ children, testId }) {
  return (
    <div className="sim-page" data-testid={testId}>
      {children}
    </div>
  );
}

export default SimulatorShell;
