/**
 * Libellés canoniques de la chaîne d'un dossier : amont / étape actuelle / aval.
 *
 * Source unique consommée à la fois par le rail de parcours (`DossierRail`,
 * via les `aria-label` des listes d'étapes) et par le panneau de détail Home
 * (`HomeSimulatorPanel`, via les titres de sections « amont » / « suivantes »).
 * Centraliser la paire évite toute divergence de vocabulaire entre les deux
 * surfaces (cf. GOUVERNANCE — section Home).
 */
export const DOSSIER_CHAIN_LABELS = {
  upstream: 'Données en amont',
  current: 'Étape actuelle',
  downstream: 'Étapes suivantes',
} as const;

export type DossierChainDirection = keyof typeof DOSSIER_CHAIN_LABELS;
