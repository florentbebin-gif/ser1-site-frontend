import React from 'react';
import { PlacementPage } from '@/features/placement';

/**
 * Legacy thin wrapper kept for backward compatibility.
 * Functional implementation now lives under src/features/placement.
 */
export default function PlacementLegacyWrapper() {
  return <PlacementPage />;
}
