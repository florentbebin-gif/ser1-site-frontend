import React from 'react';
import IrSimulatorPage from './components/IrSimulatorPage';

/**
 * IR Feature Entry (PR-1 strangler scaffold)
 *
 * Intentionally delegates 1:1 to legacy page to guarantee
 * zero functional change in this PR.
 */
export default function IrPage(): React.ReactElement {
  return <IrSimulatorPage />;
}
