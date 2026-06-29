import type { DonationDernierVivantOption, RegimeMatrimonial } from '../../engine/succession/civil';
import type { DossierContrainte, DossierOperationPrevue } from '@/domain/dossier/patrimonial';

export type AuditAvatarKind = 'homme' | 'femme' | 'garcon' | 'fille';
export type AuditAvatarSkinTone = 'clair' | 'fonce';
export type AuditAvatarAge = 'adulte' | 'senior';
export type PersonCivilite = 'monsieur' | 'madame';
export type ProcheLien =
  | 'enfant_commun'
  | 'enfant_union_precedente_mr'
  | 'enfant_union_precedente_mme'
  | 'petit_enfant'
  | 'parent'
  | 'frere_soeur'
  | 'oncle_tante'
  | 'tierce_personne';
// Liens des proches non-enfants, saisis dans une collection distincte de `enfants`.
export type ProcheLienNonEnfant =
  | 'petit_enfant'
  | 'parent'
  | 'frere_soeur'
  | 'oncle_tante'
  | 'tierce_personne';
export type NiveauScolaire = 'aucun' | 'college' | 'lycee' | 'enseignement_superieur';
export type TypeAdoption = 'pleniere' | 'simple';
export type RenonciationPortee = 'deux_parents' | 'client' | 'conjoint';
export type ProcheRattachement = 'client' | 'conjoint';
export type ProcheRattachementBranche =
  | 'client_paternelle'
  | 'client_maternelle'
  | 'conjoint_paternelle'
  | 'conjoint_maternelle';
export type DdvOption = DonationDernierVivantOption;
export type AvantageMatrimonial = 'partage_inegal' | 'attribution_integrale' | 'preciput';
export type AuditPersonRef = 'client' | 'conjoint' | `enfant:${string}` | `proche:${string}`;
export type DonationQualificationRapport = 'rapportable' | 'hors_part';
export type TestamentDispositionType =
  | 'legs_universel'
  | 'legs_titre_universel'
  | 'legs_particulier';
export type NatureActivite =
  | 'salarie'
  | 'periode_assimilee'
  | 'tns_independant'
  | 'micro_entreprise'
  | 'sans_activite';
export type StatutSocial =
  | 'salarie_non_cadre_prive'
  | 'salarie_cadre_prive'
  | 'salarie_non_cadre_agricole'
  | 'salarie_cadre_agricole'
  | 'salarie_non_titulaire_etat'
  | 'clerc_notaire'
  | 'fonctionnaire'
  | 'expert_comptable_salarie'
  | 'avocat_salarie'
  | 'tns_article_62'
  | 'tns_individuel'
  | 'assimile_salarie'
  | 'micro_entrepreneur'
  | 'chomage'
  | 'maladie_invalidite'
  | 'retraite'
  | 'militaire'
  | 'sans_activite';
export type CaisseRetraite =
  | 'ssi_commercant'
  | 'ssi_artisan'
  | 'carcd'
  | 'carsf'
  | 'carmf'
  | 'carpimko'
  | 'carpv'
  | 'cavamac'
  | 'cavec'
  | 'cavp'
  | 'cipav'
  | 'cnbf'
  | 'crn'
  | 'msa'
  | 'regime_general';
export type StatutConventionnel = 'secteur_1' | 'secteur_2' | 'oui' | 'non_conventionne';
export type ModeExerciceTns = 'entreprise_individuelle_ir' | 'societe_is';
export type ProfessionLiberaleCategorie = 'sante' | 'juridique_judiciaire' | 'technique_cadre_vie';
export type ClassePrevoyance =
  | 'carpv_minimum'
  | 'carpv_medium'
  | 'carpv_maximum'
  | 'cavec_nc'
  | 'cavec_1'
  | 'cavec_2'
  | 'cavec_3'
  | 'cavec_4';
export type ClasseRetraite =
  | 'carpv_nc'
  | 'carpv_ss1'
  | 'carpv_ss2'
  | 'carpv_s1'
  | 'carpv_s2'
  | 'carpv_a'
  | 'carpv_b'
  | 'carpv_c'
  | 'carpv_d'
  | 'carpv_e'
  | 'cavec_nc'
  | 'cavec_a'
  | 'cavec_b'
  | 'cavec_c'
  | 'cavec_d'
  | 'cavec_e'
  | 'cavec_f'
  | 'cavec_g'
  | 'cavec_h'
  | 'cavec_i'
  | 'cavp_3'
  | 'cavp_4'
  | 'cavp_5'
  | 'cavp_6'
  | 'cavp_7'
  | 'cavp_8'
  | 'cavp_9'
  | 'cavp_10'
  | 'cavp_11'
  | 'cavp_12'
  | 'cavp_13'
  | 'cnbf_c1'
  | 'cnbf_c2'
  | 'cnbf_c2_plus'
  | 'crn_nc'
  | 'crn_1'
  | 'crn_2'
  | 'crn_3'
  | 'crn_4'
  | 'crn_5'
  | 'crn_6'
  | 'crn_7'
  | 'crn_8';
export type AncienneteCnbf = '1' | '2' | '3' | '4' | '5' | '6_plus';
export type AtexaClasse = 'a' | 'b' | 'c' | 'd' | 'e';
export type EffectifSalarie = 'moins_11' | 'entre_11_49' | 'a_partir_50';
export type AffiliationCavecAssimile = 'non' | 'classe_c' | 'classe_d';

export interface FichePaieAssimileSalarie {
  tauxActivitePct?: number;
  accidentTravailPct?: number;
  versementTransportPct?: number;
  contributionFormation?: boolean;
  taxeApprentissage?: boolean;
  assuranceChomage?: boolean;
  reductionGenerale?: boolean;
  taxeSalaires?: boolean;
  regimeAlsaceMoselle?: boolean;
  effectifSalarie?: EffectifSalarie;
  affiliationCavec?: AffiliationCavecAssimile;
  affiliationCnbf?: boolean;
  ancienneteCnbf?: AncienneteCnbf;
  classeRetraiteCnbf?: ClasseRetraite;
  avantagesNatureFichePaie?: number;
}

export interface AuditAvatarAppearance {
  skinTone: AuditAvatarSkinTone;
  age: AuditAvatarAge;
}

export interface PersonInfo {
  prenom: string;
  nom: string;
  dateNaissance: string; // ISO date
  civilite?: PersonCivilite;
  nomNaissance?: string;
  lieuNaissance?: string;
  departementNaissance?: string;
  communeNaissance?: string;
  paysNaissance?: string;
  nationalite?: string;
  handicap?: boolean;
  profession?: string;
  natureActivite?: NatureActivite;
  statutSocial?: StatutSocial;
  caisseRetraite?: CaisseRetraite;
  modeExercice?: ModeExerciceTns;
  remunerationMandatPct?: number;
  statutConventionnel?: StatutConventionnel;
  tauxPriseEnChargeCpam?: number;
  classePrevoyance?: ClassePrevoyance;
  classeRetraite?: ClasseRetraite;
  biologisteConventionne?: boolean;
  ancienneteCnbf?: AncienneteCnbf;
  prestationSermentAvant2014?: boolean;
  regimeColmarMetz?: boolean;
  moyenneProduitsEtude?: number;
  commissionsBrutes?: number;
  atexa?: AtexaClasse;
  professionLiberaleReglementee?: boolean;
  professionLiberaleCategorie?: ProfessionLiberaleCategorie;
  fichePaieAssimileSalarie?: FichePaieAssimileSalarie;
  avatarKind?: AuditAvatarKind;
  avatarAppearance?: AuditAvatarAppearance;
}

export interface EnfantInfo {
  id?: string; // Identité stable (clés React + rattachement petit-enfant) ; rétro-comblée à l'ouverture du drawer
  prenom: string;
  nom?: string;
  dateNaissance: string;
  estCommun: boolean; // Enfant commun ou d'une union précédente
  parentPrincipal?: 'mr' | 'mme'; // Si non commun
  lienParente?: ProcheLien;
  civilite?: PersonCivilite;
  lieuNaissance?: string;
  decede?: boolean;
  fiscalementACharge?: boolean;
  ageLimiteCharge?: number;
  anneesSupplementairesCharge?: number;
  niveauScolaire?: NiveauScolaire;
  gardeAlternee?: boolean; // Révélé si fiscalement à charge
  handicap?: boolean;
  adopte?: boolean;
  typeAdoption?: TypeAdoption; // Révélé si adopté
  renoncantSuccession?: boolean;
  renonciationPortee?: RenonciationPortee; // Révélé si renonçant à la succession
  avatarKind?: AuditAvatarKind;
  avatarAppearance?: AuditAvatarAppearance;
}

// Proche non-enfant du foyer (petit-enfant, parent, fratrie, oncle/tante, tierce personne).
// Collection distincte de `enfants` pour ne pas polluer les compteurs/avatars enfants.
export interface ProcheInfo {
  id: string;
  lienParente: ProcheLienNonEnfant;
  prenom: string;
  nom?: string;
  dateNaissance: string;
  decede?: boolean;
  handicap?: boolean;
  parentEnfantId?: string; // petit-enfant → EnfantInfo.id rattaché
  rattachement?: ProcheRattachement; // parent, frère/sœur
  rattachementBranche?: ProcheRattachementBranche; // oncle/tante
  vivantSousMemeToit?: boolean; // frère/sœur
  fiscalementACharge?: boolean; // petit-enfant
  niveauScolaire?: NiveauScolaire; // petit-enfant, si à charge
  gardeAlternee?: boolean; // petit-enfant, si à charge
  adopte?: boolean; // petit-enfant
  typeAdoption?: TypeAdoption; // petit-enfant, si adopté
  avatarKind?: AuditAvatarKind;
  avatarAppearance?: AuditAvatarAppearance;
}

export interface SituationFamiliale {
  mr: PersonInfo;
  mme?: PersonInfo; // Optionnel si célibataire
  situationMatrimoniale: 'marie' | 'pacse' | 'concubinage' | 'celibataire' | 'divorce' | 'veuf';
  dateUnion?: string;
  lieuUnion?: string;
  impositionSepareeAnneeUnion?: boolean;
  nonResidentFiscal?: boolean;
  dureeMariagesPrecedents?: number;
  enfants: EnfantInfo[];
  proches: ProcheInfo[];
}

export interface SituationCivile {
  regimeMatrimonial?: RegimeMatrimonial;
  donationDernierVivantMr?: boolean;
  donationDernierVivantMme?: boolean;
  ddvOptionMr?: DdvOption;
  ddvOptionMme?: DdvOption;
  avantagesMatrimoniaux?: AvantageMatrimonial[];
  donations: DonationInfo[];
  testaments: TestamentInfo[];
}

export interface DonationInfo {
  id: string;
  type: 'donation_partage' | 'donation_simple' | 'donation_temporaire_usufruit';
  date: string;
  montant?: number;
  beneficiaire: string;
  donateur?: AuditPersonRef;
  donataire?: AuditPersonRef;
  qualificationRapport?: DonationQualificationRapport;
  valeurActuelle?: number;
  avecReserveUsufruit?: boolean;
  usufruitSuccessif?: boolean;
  usufruitSuccessifBeneficiaire?: AuditPersonRef;
  donSommeArgentExonere?: boolean;
}

export interface TestamentInfo {
  id: string;
  date: string;
  type: 'olographe' | 'authentique' | 'mystique';
  testateur?: AuditPersonRef;
  actif?: boolean;
  dispositionType?: TestamentDispositionType;
  beneficiaire?: AuditPersonRef;
  quotePartPct?: number;
  description?: string;
}

export type ProprietaireType = 'mr' | 'mme' | 'commun' | 'indivision';

export interface ActifBase {
  id: string;
  libelle: string;
  valeur: number;
  proprietaire: ProprietaireType;
  quotiteMr?: number; // % si indivision
  quotiteMme?: number;
}

export interface ActifImmobilier extends ActifBase {
  type: 'residence_principale' | 'residence_secondaire' | 'locatif' | 'scpi' | 'autre_immo';
  adresse?: string;
  surfaceM2?: number;
  dateAcquisition?: string;
  prixAcquisition?: number;
  revenus?: number; // Loyers annuels
}

export interface ActifFinancier extends ActifBase {
  type: 'compte_courant' | 'livret' | 'pea' | 'cto' | 'assurance_vie' | 'per' | 'autre_financier';
  etablissement?: string;
  tauxRendement?: number;
  clauseBeneficiaire?: string; // Pour AV
  dateOuverture?: string;
}

export interface ActifProfessionnel extends ActifBase {
  type: 'entreprise' | 'parts_sociales' | 'fonds_commerce';
  formeJuridique?: string;
  activite?: string;
  chiffreAffaires?: number;
}

export interface ActifDivers extends ActifBase {
  type: 'vehicule' | 'mobilier' | 'oeuvre_art' | 'bijoux' | 'autre';
}

export type Actif = ActifImmobilier | ActifFinancier | ActifProfessionnel | ActifDivers;

export interface PassifEmprunt {
  id: string;
  libelle: string;
  type: 'immobilier' | 'consommation' | 'professionnel' | 'autre';
  capitalInitial: number;
  capitalRestantDu: number;
  mensualite: number;
  tauxInteret: number;
  dateDebut: string;
  dateFin: string;
  assuranceEmprunteur?: {
    quotiteMr: number;
    quotiteMme: number;
  };
  bienFinance?: string; // ID de l'actif
}

export interface Passif {
  emprunts: PassifEmprunt[];
  autresDettes: Array<{
    id: string;
    libelle: string;
    montant: number;
    description?: string;
  }>;
}

export interface RevenuCategorie {
  id: string;
  categorie:
    | 'salaires'
    | 'tns'
    | 'fonciers'
    | 'capitaux_mobiliers'
    | 'plus_values'
    | 'pensions'
    | 'autres';
  montantBrut: number;
  montantNet: number;
  beneficiaire: 'mr' | 'mme' | 'foyer';
}

export interface SituationFiscale {
  anneeReference: number;
  revenus: RevenuCategorie[];
  revenuFiscalReference: number;
  nombreParts: number;
  impotRevenu: number;
  tmi: number;
  cehr?: number;
  ifi?: number;
  taxeFonciere?: number;
  // Saisie « 2042 » consommée par l'estimation IR de /audit (optionnels :
  // rétro-compatibles avec les consommateurs partagés PER / Strategy / exports).
  chargesDeductibles?: number; // déductions du revenu (PER, pensions alim., CSG)
  reductionsCredits?: number; // réductions et crédits d'impôt
  rcmOption?: 'pfu' | 'bareme'; // option d'imposition des capitaux mobiliers
}

// Synthèse budgétaire déclarative du foyer, capturée depuis la page Fiscalité
// (pas d'étape dédiée) pour dériver la capacité d'épargne après impôts.
export interface BudgetSynthese {
  ressourcesAnnuelles: number; // ressources/train de vie entrant (net perçu)
  chargesAnnuelles: number; // dépenses courantes hors impôts
}

export type ObjectifClient =
  | 'proteger_conjoint'
  | 'proteger_proches'
  | 'proteger_revenus_sante'
  | 'proteger_entreprise'
  | 'proteger_associes'
  | 'preparer_transmission'
  | 'developper_patrimoine'
  | 'revenus_differes'
  | 'revenus_immediats'
  | 'reduire_fiscalite'
  | 'reduire_droits_succession';

export const OBJECTIFS_CLIENT_LABELS: Record<ObjectifClient, string> = {
  proteger_conjoint: 'Protéger mon conjoint',
  proteger_proches: 'Protéger mes proches',
  proteger_revenus_sante: 'Protéger mes revenus en cas de problème de santé',
  proteger_entreprise: 'Protéger mon entreprise',
  proteger_associes: 'Protéger mes associés',
  preparer_transmission: 'Préparer la transmission',
  developper_patrimoine: 'Développer mon patrimoine',
  revenus_differes: 'Préparer des revenus différés',
  revenus_immediats: 'Générer des revenus immédiats',
  reduire_fiscalite: 'Réduire la fiscalité',
  reduire_droits_succession: 'Réduire les droits de succession',
};

export interface DossierAudit {
  id: string;
  version: string;
  dateCreation: string;
  dateModification: string;
  situationFamiliale: SituationFamiliale;
  situationCivile: SituationCivile;
  actifs: Actif[];
  passif: Passif;
  situationFiscale: SituationFiscale;
  budget?: BudgetSynthese;
  objectifs: ObjectifClient[];
  contraintes?: DossierContrainte[];
  operationsPrevues?: DossierOperationPrevue[];
  notes?: string;
}

const DOSSIER_AUDIT_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ensureDossierAuditUuid(dossier: DossierAudit): DossierAudit {
  if (DOSSIER_AUDIT_UUID_PATTERN.test(dossier.id)) return dossier;
  return {
    ...dossier,
    id: crypto.randomUUID(),
    dateModification: new Date().toISOString(),
  };
}

export function createEmptyDossier(): DossierAudit {
  return {
    id: crypto.randomUUID(),
    version: '1.0.0',
    dateCreation: new Date().toISOString(),
    dateModification: new Date().toISOString(),
    situationFamiliale: {
      mr: { prenom: '', nom: '', dateNaissance: '' },
      situationMatrimoniale: 'celibataire',
      enfants: [],
      proches: [],
    },
    situationCivile: {
      donations: [],
      testaments: [],
    },
    actifs: [],
    passif: {
      emprunts: [],
      autresDettes: [],
    },
    situationFiscale: {
      anneeReference: new Date().getFullYear() - 1,
      revenus: [],
      revenuFiscalReference: 0,
      nombreParts: 1,
      impotRevenu: 0,
      tmi: 0,
    },
    objectifs: [],
    contraintes: [],
    operationsPrevues: [],
  };
}
