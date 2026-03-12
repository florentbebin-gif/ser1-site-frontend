export const DEFAULT_DONATION = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
  donManuel: {
    abattementRenouvellement: 15,
  },
};

export const RESERVE_HEREDITAIRE = [
  { enfants: 1, reserve: '1/2', quotiteDisponible: '1/2' },
  { enfants: 2, reserve: '2/3', quotiteDisponible: '1/3' },
  { enfants: '3+', reserve: '3/4', quotiteDisponible: '1/4' },
];

export const DROITS_CONJOINT = [
  { situation: 'Sans enfant', droits: 'Pleine propriété ou 1/4 PP + 3/4 usufruit (selon option)' },
  { situation: 'Enfants communs', droits: '1/4 en PP ou usufruit sur totalité (option)' },
  { situation: 'Enfants non communs', droits: '1/4 en PP uniquement' },
];

export const SITUATIONS_FAMILIALES_SUCCESSION = [
  {
    id: 'celibataire',
    label: 'Célibataire',
    cadre: 'Aucun régime matrimonial',
    incidence: 'Pas de droits successoraux automatiques pour un partenaire non marié.',
  },
  {
    id: 'marie',
    label: 'Marié(e)',
    cadre: 'Régime matrimonial (légal ou conventionnel)',
    incidence: 'Liquidation du régime avant partage successoral.',
  },
  {
    id: 'pacse',
    label: 'Pacsé(e)',
    cadre: 'Séparation de biens par défaut ; indivision conventionnelle possible',
    incidence: 'Pas de vocation successorale légale sans testament ; exonération fiscale spécifique si successible.',
  },
  {
    id: 'union_libre',
    label: 'Union libre',
    cadre: 'Aucun régime matrimonial',
    incidence: 'Pas de vocation successorale légale ; transmission seulement via libéralité.',
  },
  {
    id: 'divorce',
    label: 'Divorcé(e)',
    cadre: 'Régime matrimonial dissous',
    incidence: 'Ex-conjoint sans droits successoraux légaux.',
  },
  {
    id: 'veuf',
    label: 'Veuf / veuve',
    cadre: 'Succession antérieure ouverte',
    incidence: 'Nécessite vérifier les droits déjà recueillis et remploi des biens.',
  },
];

export const LIBERALITES_REFERENCE = [
  {
    id: 'donation_simple',
    family: 'Donations entre vifs',
    label: 'Donation simple (pleine propriété)',
    definition: 'Transmission immédiate et irrévocable d\'un bien au donataire.',
    impact: 'Peut être rapportable à la succession et potentiellement réductible en cas d\'atteinte à la réserve.',
    minimumFields: ['Date de l\'acte', 'Donateur / donataire', 'Valeur retenue', 'Bien transmis', 'Hors part successorale (oui/non)'],
    legalRefs: 'C. civ. art. 894, 843, 920',
  },
  {
    id: 'donation_reserve_usufruit',
    family: 'Donations entre vifs',
    label: 'Donation avec réserve d\'usufruit',
    definition: 'Le donateur conserve l\'usufruit et transmet la nue-propriété.',
    impact: 'Réduit l\'assiette transmise immédiatement ; à réintégrer civilement selon règles de rapport/réduction.',
    minimumFields: ['Date', 'Valorisation usufruit/nue-propriété', 'Âge de l\'usufruitier', 'Bien donné'],
    legalRefs: 'C. civ. art. 894, 578, 843, 922',
  },
  {
    id: 'donation_partage',
    family: 'Donations entre vifs',
    label: 'Donation-partage',
    definition: 'Donation avec répartition organisée entre héritiers présomptifs.',
    impact: 'Fige en principe les valeurs au jour de l\'acte pour les biens allotis, utile pour limiter les conflits de rapport.',
    minimumFields: ['Date', 'Bénéficiaires', 'Lots attribués', 'Valeur par lot', 'Soulte éventuelle'],
    legalRefs: 'C. civ. art. 1075, 1078',
  },
  {
    id: 'donation_graduelle_residuelle',
    family: 'Donations entre vifs',
    label: 'Donation graduelle / résiduelle',
    definition: 'Transmission en deux temps avec charge de conserver (graduelle) ou de transmettre le reliquat (résiduelle).',
    impact: 'Organise la transmission intergénérationnelle ; nécessite un suivi précis des charges et du reliquat.',
    minimumFields: ['Date', 'Premier gratifié', 'Second gratifié', 'Biens concernés', 'Nature de la charge'],
    legalRefs: 'C. civ. art. 1048, 1057',
  },
  {
    id: 'legs_universel',
    family: 'Dispositions testamentaires',
    label: 'Legs universel',
    definition: 'Le testateur lègue l\'universalité de ses biens.',
    impact: 'S\'exécute dans la limite de la réserve héréditaire et peut être réduit si la quotité disponible est dépassée.',
    minimumFields: ['Type de testament', 'Date', 'Légataire', 'Clause de quotité / cantonnement'],
    legalRefs: 'C. civ. art. 1002, 1003, 912, 913, 920',
  },
  {
    id: 'legs_titre_universel',
    family: 'Dispositions testamentaires',
    label: 'Legs à titre universel',
    definition: 'Le testateur lègue une quote-part (ex. moitié) ou une catégorie de biens.',
    impact: 'S\'impute sur la quotité disponible ; contrôle de réduction nécessaire en présence d\'héritiers réservataires.',
    minimumFields: ['Type de testament', 'Quote-part / catégorie léguée', 'Légataire', 'Date'],
    legalRefs: 'C. civ. art. 1002, 1010, 912, 920',
  },
  {
    id: 'legs_particulier',
    family: 'Dispositions testamentaires',
    label: 'Legs particulier',
    definition: 'Le testateur lègue un ou plusieurs biens déterminés.',
    impact: 'Priorité d\'analyse sur valorisation du bien légué et respect de la réserve des héritiers.',
    minimumFields: ['Type de testament', 'Bien légué', 'Valeur estimée', 'Légataire', 'Date'],
    legalRefs: 'C. civ. art. 1002, 1010, 912, 920',
  },
  {
    id: 'donation_entre_epoux',
    family: 'Donation entre époux',
    label: 'Donation au dernier vivant',
    definition: 'Libéralité entre époux visant à étendre les droits du conjoint survivant.',
    impact: 'Augmente les options civiles du conjoint survivant, sous réserve des droits réservataires des descendants.',
    minimumFields: ['Date de l\'acte', 'Époux donateur', 'Étendue des options (usufruit/pleine propriété)', 'Présence d\'enfants non communs'],
    legalRefs: 'C. civ. art. 1094-1',
  },
];

export const AVANTAGES_MATRIMONIAUX_REFERENCE = [
  {
    id: 'preciput',
    label: 'Clause de préciput',
    definition: 'Autorise le conjoint survivant à prélever certains biens communs avant partage.',
    impact: 'Améliore la protection du conjoint sans passer par une libéralité successorale classique.',
    minimumFields: ['Date du contrat de mariage ou avenant', 'Biens/somme concernés', 'Valeur estimée', 'Condition d\'application au décès'],
    legalRefs: 'C. civ. art. 1515 à 1519',
  },
  {
    id: 'parts_inegales',
    label: 'Stipulation de parts inégales',
    definition: 'Prévoit une répartition conventionnelle de la communauté différente du 50/50.',
    impact: 'Modifie la masse revenant à chaque époux avant l\'ouverture de la succession.',
    minimumFields: ['Quote-part convenue par époux', 'Date du contrat', 'Base de calcul (actif et dettes)', 'Eventuelles limites prévues'],
    legalRefs: 'C. civ. art. 1520 à 1525',
  },
  {
    id: 'attribution_integrale',
    label: 'Attribution intégrale de la communauté',
    definition: 'Attribue au survivant la totalité de la communauté en cas de décès.',
    impact: 'Retarde en pratique la transmission aux enfants au second décès ; effet majeur sur la liquidité successorale du premier décès.',
    minimumFields: ['Existence de la clause (oui/non)', 'Date du contrat', 'Perimètre des biens communs', 'Présence d\'enfants non communs'],
    legalRefs: 'C. civ. art. 1524 et 1525',
  },
  {
    id: 'usufruit_part_prededece',
    label: 'Usufruit conventionnel sur la part du prédécédé',
    definition: 'Accorde au survivant, en plus de sa moitié, l\'usufruit de la part du prédécédé.',
    impact: 'Renforce les droits d\'usage et de revenus du survivant avant partage définitif en nue-propriété.',
    minimumFields: ['Existence de la clause', 'Biens concernés', 'Valeur usufruit / nue-propriété', 'Regles de contribution aux dettes'],
    legalRefs: 'C. civ. art. 1524, al. 2',
  },
];
