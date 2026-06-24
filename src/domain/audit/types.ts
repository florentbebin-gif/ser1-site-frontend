/**
 * Types pour l'Audit Patrimonial
 */

import type { RegimeMatrimonial } from '../../engine/succession/civil';
import type { DossierContrainte, DossierOperationPrevue } from '@/domain/dossier/patrimonial';

// Situation familiale
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
export type DdvOption =
  | 'usufruit_total'
  | 'quotite_disponible_pp'
  | 'mixte_quart_pp_trois_quarts_us'
  | 'pleine_propriete_totale';
export type AvantageMatrimonial = 'partage_inegal' | 'attribution_integrale';
export type ProfessionCsp =
  | 'dirigeant'
  | 'salarie_cadre'
  | 'salarie_non_cadre'
  | 'profession_liberale'
  | 'independant'
  | 'retraite'
  | 'sans_activite';
export type NatureActivite =
  | 'salarie'
  | 'periode_assimilee'
  | 'tns_independant'
  | 'micro_entreprise'
  | 'sans_activite';
export type StatutSocial =
  | 'tns_article_62'
  | 'gerant_minoritaire'
  | 'assimile_salarie'
  | 'non_renseigne';
export type CaisseRetraite =
  | 'carmf'
  | 'carpimko'
  | 'cipav'
  | 'cnav'
  | 'msa'
  | 'ircantec'
  | 'non_renseignee';
export type StatutConventionnel = 'secteur_1' | 'secteur_2' | 'non_conventionne' | 'non_applicable';

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
  csp?: ProfessionCsp;
  natureActivite?: NatureActivite;
  statutSocial?: StatutSocial;
  caisseRetraite?: CaisseRetraite;
  statutConventionnel?: StatutConventionnel;
  tauxPriseEnChargeCpam?: number;
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

// Situation civile
export interface SituationCivile {
  regimeMatrimonial?: RegimeMatrimonial;
  contratMariage: boolean;
  dateContrat?: string;
  notaire?: string;
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
  description?: string;
}

export interface TestamentInfo {
  id: string;
  date: string;
  type: 'olographe' | 'authentique' | 'mystique';
  description?: string;
}

// Actifs
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

// Passif
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

// Fiscalité
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
}

// Objectifs client (liste fixe)
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

// Dossier Audit complet
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

// État initial vide
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
      contratMariage: false,
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
