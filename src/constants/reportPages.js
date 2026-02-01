/**
 * Constantes pour les signalements de problèmes
 * 
 * NOTE: À mettre à jour lors de l'ajout d'une nouvelle page dans l'application
 * où les utilisateurs peuvent signaler des problèmes.
 */

export const REPORT_PAGE_OPTIONS = [
  { value: '', label: 'Sélectionner une page...' },
  { value: 'ir', label: 'Simulateur IR' },
  { value: 'credit', label: 'Simulateur Crédit' },
  { value: 'placement', label: 'Simulateur Placement' },
  { value: 'audit', label: 'Audit Patrimonial' },
  { value: 'strategy', label: 'Stratégie' },
  { value: 'settings', label: 'Paramètres' },
  { value: 'other', label: 'Autre' },
];

/**
 * Récupère le libellé d'une page à partir de sa valeur
 * @param {string} value - La valeur de la page
 * @returns {string} - Le libellé de la page ou la valeur si non trouvée
 */
export const getPageLabel = (value) => {
  const page = REPORT_PAGE_OPTIONS.find(p => p.value === value);
  return page?.label || value;
};

/**
 * Statuts des signalements avec leurs libellés
 */
export const REPORT_STATUS_LABELS = {
  new: 'Nouveau',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

/**
 * Récupère le libellé d'un statut
 * @param {string} status - Le statut technique
 * @returns {string} - Le libellé du statut ou le statut brut si non trouvé
 */
export const getStatusLabel = (status) => {
  return REPORT_STATUS_LABELS[status] || status;
};
