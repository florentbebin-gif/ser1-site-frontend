/**
 * Labels FR pour le référentiel contrats (base_contrat_settings).
 * Source unique pour toutes les chaînes affichées dans l'UI.
 */

// ---------------------------------------------------------------------------
// Phase names
// ---------------------------------------------------------------------------
export const PHASE_LABELS: Record<string, string> = {
  constitution: 'Constitution',
  sortie: 'Sortie / Rachat',
  deces: 'Décès / Transmission',
};

// ---------------------------------------------------------------------------
// Product family
// ---------------------------------------------------------------------------
export const FAMILY_LABELS: Record<string, string> = {
  Assurance: 'Assurance',
  Bancaire: 'Bancaire',
  Titres: 'Titres',
  Immobilier: 'Immobilier',
  'Défiscalisation': 'Défiscalisation',
  Autres: 'Autres',
};

export const FAMILY_OPTIONS = Object.keys(FAMILY_LABELS);

// ---------------------------------------------------------------------------
// Holders
// ---------------------------------------------------------------------------
export const HOLDERS_LABELS: Record<string, string> = {
  PP: 'Personne physique',
  PM: 'Personne morale',
  'PP+PM': 'PP + PM',
};

// ---------------------------------------------------------------------------
// Confidence level
// ---------------------------------------------------------------------------
export const CONFIDENCE_LABELS: Record<string, string> = {
  confirmed: 'Confirmé',
  provisional: 'Provisoire',
  toVerify: 'À vérifier',
};

export const CONFIDENCE_ICONS: Record<string, string> = {
  confirmed: '✓',
  provisional: '⚠',
  toVerify: '?',
};

// ---------------------------------------------------------------------------
// Field types
// ---------------------------------------------------------------------------
export const FIELD_TYPE_LABELS: Record<string, string> = {
  number: 'Nombre',
  boolean: 'Oui / Non',
  enum: 'Liste',
  date: 'Date',
  string: 'Texte',
  ref: 'Référence externe',
  brackets: 'Barème',
};

// ---------------------------------------------------------------------------
// Block kind
// ---------------------------------------------------------------------------
export const BLOCK_KIND_LABELS: Record<string, string> = {
  data: 'Données',
  note: 'Note',
  ref: 'Référence',
};

// ---------------------------------------------------------------------------
// Modal / action labels
// ---------------------------------------------------------------------------
export const ACTION_LABELS = {
  addProduct: 'Ajouter un produit',
  editProduct: 'Modifier le produit',
  newVersion: 'Nouvelle version',
  closeProduct: 'Clôturer le produit',
  save: 'Enregistrer les paramètres',
  saving: 'Enregistrement…',
  cancel: 'Annuler',
  confirm: 'Confirmer',
  create: 'Créer',
  delete: 'Supprimer',
};

// ---------------------------------------------------------------------------
// Form field labels (modals)
// ---------------------------------------------------------------------------
export const FORM_LABELS = {
  productId: 'Identifiant technique',
  productIdHint: 'Slug unique (ex : assuranceVie). Non modifiable après création.',
  productLabel: 'Nom du produit',
  productFamily: 'Famille',
  productHolders: 'Détenteurs',
  productEnvelopeType: 'Type d\u2019enveloppe',
  effectiveDate: 'Date d\u2019entrée en vigueur',
  effectiveDateHint: 'Les règles actuelles seront copiées. Vous pourrez ensuite les modifier.',
  templateKey: 'Template de pré-remplissage',
  templateNone: 'Aucun (vide)',
  confirmClose: 'Êtes-vous sûr de vouloir clôturer ce produit ? Il ne sera plus affiché dans le catalogue actif.',
};

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------
export const MISC_LABELS = {
  noProducts: 'Aucun produit enregistré.',
  noProductsAdmin: 'Aucun produit enregistré. Utilisez le bouton ci-dessous pour ajouter un produit.',
  noBlocks: 'Aucun bloc défini pour cette phase.',
  phaseNotApplicable: 'Sans objet',
  refTooltip: 'Valeur issue des paramètres Impôts / Prélèvements sociaux',
  calcBadge: 'Calc.',
  activeVersion: 'En vigueur',
  archivedVersions: 'Versions archivées',
  closedProducts: 'Produits clôturés',
  versionCount: (n: number) => `${n} version${n > 1 ? 's' : ''}`,
};
