import React from 'react';
import PlacementSimulatorPage from './components/PlacementSimulatorPage';

/**
 * Placement Feature Entry (PR-1 strangler scaffold)
 *
 * Intentionally delegates 1:1 to legacy page to guarantee
 * zero functional change in this PR.
 */
export default function PlacementPage(): React.ReactElement {
  return <PlacementSimulatorPage />;
}
