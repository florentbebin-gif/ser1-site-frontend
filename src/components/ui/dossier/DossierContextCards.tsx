import { type ReactElement } from 'react';

import { DossierLoadedCard } from './DossierLoadedCard';
import { ModeUserCard } from './ModeUserCard';

/**
 * Composition réservée à la Home : le parcours /audit, /strategy et /sim/*
 * réutilise DossierLoadedCard sans dupliquer le pilotage du mode.
 * Conserve les data-testid historiques attendus par le smoke e2e.
 */
export function DossierContextCards(): ReactElement {
  return (
    <>
      <DossierLoadedCard />
      <ModeUserCard />
    </>
  );
}

export default DossierContextCards;
