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
// Product family (legacy V1 — conservé pour compatibilité adapter)
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
// Grande famille (V2)
// ---------------------------------------------------------------------------
export const GRANDE_FAMILLE_OPTIONS = [
  'Assurance',
  'Épargne bancaire',
  'Titres vifs',
  'Fonds/OPC',
  'Immobilier direct',
  'Immobilier indirect',
  'Crypto-actifs',
  'Non coté/PE',
  'Produits structurés',
  'Créances/Droits',
  'Dispositifs fiscaux immo',
  'Métaux précieux',
  'Retraite & épargne salariale',
] as const;

// ---------------------------------------------------------------------------
// Nature du produit (V2)
// ---------------------------------------------------------------------------
export const NATURE_OPTIONS = [
  'Actif / instrument',
  'Contrat / compte / enveloppe',
  'Dispositif fiscal immobilier',
] as const;

// ---------------------------------------------------------------------------
// Éligibilité PM (V2)
// ---------------------------------------------------------------------------
export const ELIGIBLE_PM_LABELS: Record<string, string> = {
  oui: 'Oui',
  non: 'Non',
  parException: 'Par exception',
};

export const ELIGIBLE_PM_OPTIONS = ['oui', 'non', 'parException'] as const;

// ---------------------------------------------------------------------------
// Souscription ouverte (V2)
// ---------------------------------------------------------------------------
export const SOUSCRIPTION_OUVERTE_LABELS: Record<string, string> = {
  oui: 'Oui',
  non: 'Non',
  na: 'N.A.',
};

export const SOUSCRIPTION_OUVERTE_OPTIONS = ['oui', 'non', 'na'] as const;

// ---------------------------------------------------------------------------
// Holders (legacy V1 — conservé pour compatibilité adapter)
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
  newVersion: 'Dupliquer cette version',
  deleteVersion: 'Supprimer cette version',
  closeProduct: 'Clôturer le produit',
  reactivateProduct: 'Rouvrir',
  deleteProduct: 'Supprimer définitivement',
  initCatalogue: 'Initialiser le catalogue',
  completeCatalogue: 'Compléter le catalogue',
  save: 'Enregistrer',
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
  productId: 'Identifiant interne',
  productIdHint: 'Identifiant unique, non modifiable après création (ex : assuranceVie).',
  productLabel: 'Nom du produit',
  productFamily: 'Famille (legacy)',
  productGrandeFamille: 'Grande famille',
  productNature: 'Nature du produit',
  productDetensiblePP: 'Détenable en direct (personne physique)',
  productEligiblePM: 'Éligible personnes morales',
  productEligiblePMPrecision: 'Précision (obligatoire si « Par exception »)',
  productEligiblePMPrecisionHint: 'Ex : « Sous conditions (IS, capital libéré…) »',
  productSouscriptionOuverte: 'Souscription ouverte en 2026',
  productCommentaire: 'Commentaire de qualification',
  productCommentaireHint: 'Optionnel — 2 à 3 lignes max.',
  productHolders: 'Détenteurs (legacy)',
  productEnvelopeType: 'Type d’enveloppe',
  effectiveDate: 'Date d’entrée en vigueur',
  effectiveDateHint: 'Les règles actuelles seront copiées. Vous pourrez ensuite les modifier.',
  templateKey: 'Modèle de règles',
  templateNone: 'Aucun (vide)',
  confirmClose: 'Êtes-vous sûr de vouloir clôturer ce produit ? Il ne sera plus affiché dans le catalogue actif, mais restera récupérable.',
  confirmReactivate: 'Rouvrir ce produit ? Il sera de nouveau affiché dans le catalogue actif.',
  confirmDeleteTitle: 'Suppression définitive',
  confirmDeleteWarning: 'Cette action est irréversible. Le produit et toutes ses versions seront supprimés définitivement.',
  confirmDeleteTypeSUPPRIMER: 'Pour confirmer, saisissez SUPPRIMER en majuscules :',
  /** @deprecated remplacer par confirmDeleteTypeSUPPRIMER */
  confirmDeleteTypeSlug: (slug: string) => `Pour confirmer, tapez "${slug}" ci-dessous :`,
  confirmDeleteVersion: 'Supprimer cette version ? Cette action est irréversible.',
  confirmDeleteVersionActive: 'Cette version est active. Sélectionnez d’abord une autre version ou créez une nouvelle version avant de supprimer celle-ci.',
  confidenceLevel: 'Niveau de confiance',
  confidencePlaceholder: '— Choisir —',
  confidenceHint: 'Choisissez « Confirmé » uniquement si les sources officielles ont été vérifiées.',
};

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------
export const MISC_LABELS = {
  noProducts: 'Aucun produit enregistré.',
  noProductsAdmin: 'Aucun produit enregistré. Initialisez le catalogue ou ajoutez un produit manuellement.',
  noBlocks: 'Aucun bloc défini pour cette phase.',
  phaseNotApplicable: 'Sans objet',
  refTooltip: 'Valeur issue des paramètres Impôts / Prélèvements sociaux',
  calcBadge: 'Calc.',
  activeVersion: 'En vigueur',
  archivedVersions: 'Versions archivées',
  closedProducts: 'Produits clôturés',
  versionCount: (n: number) => `${n} version${n > 1 ? 's' : ''}`,
  // Seed
  initCatalogueHint: 'Charge les produits de référence depuis le fichier catalogue. Les règles fiscales seront à compléter produit par produit.',
  completeCatalogueHint: 'Ajoute les produits manquants sans modifier les produits existants.',
  completeCatalogueResult: (n: number) => `${n} produit${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}.`,
  completeCatalogueUpToDate: 'Le catalogue est déjà à jour.',
  // Gate
  gateWarningNoTests: 'Aucun cas de test enregistré. Ajoutez au moins un test avant de considérer les règles comme publiées.',
  gateWarningNoRules: 'Aucun produit actif ne contient de règles configurées.',
  gateTestGuideTitle: 'Comment ajouter un cas de test ?',
  gateTestGuideSteps: [
    'Ouvrez la fiche d’un produit.',
    'Cliquez « Importer un cas de test ».',
    'Remplissez la situation (capital, durée…) et le résultat attendu.',
  ],
  // Informations produit
  sectionInfos: 'Informations produit',
  sectionTodoToConfirm: 'Points à vérifier',
  sectionReferences: 'Références officielles',
  detensiblePPOui: 'Oui — détenable en direct',
  detensiblePPNon: 'Non',
  // Toggle Sans objet par phase
  phaseMarkNotApplicable: 'Sans objet',
  phaseMarkApplicable: 'Activer',
  phaseNotApplicableHint: 'Cette phase ne s\'applique pas à ce produit (ex : pas de rachat, pas de transmission). Cliquez « Activer » pour configurer des règles.',
  phaseApplicableToggleHint: 'Activer cette phase pour configurer des règles fiscales',
  phaseNotApplicableToggleHint: 'Marquer cette phase comme Sans objet (réversible)',
};
