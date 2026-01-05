/**
 * Types pour l'Audit Patrimonial
 */

import type { RegimeMatrimonial } from '../../engine/civil';

// Situation familiale
export interface PersonInfo {
  prenom: string;
  nom: string;
  dateNaissance: string; // ISO date
  profession?: string;
}

export interface EnfantInfo {
  prenom: string;
  dateNaissance: string;
  estCommun: boolean; // Enfant commun ou d'une union précédente
  parentPrincipal?: 'mr' | 'mme'; // Si non commun
}

export interface SituationFamiliale {
  mr: PersonInfo;
  mme?: PersonInfo; // Optionnel si célibataire
  situationMatrimoniale: 'marie' | 'pacse' | 'concubinage' | 'celibataire' | 'divorce' | 'veuf';
  dateUnion?: string;
  enfants: EnfantInfo[];
}

// Situation civile
export interface SituationCivile {
  regimeMatrimonial?: RegimeMatrimonial;
  contratMariage: boolean;
  dateContrat?: string;
  notaire?: string;
  donations: DonationInfo[];
  testaments: TestamentInfo[];
}

export interface DonationInfo {
  id: string;
  type: 'donation_partage' | 'donation_simple' | 'donation_temporaire_usufruit';
  date: string;
  montant: number;
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
  categorie: 'salaires' | 'tns' | 'fonciers' | 'capitaux_mobiliers' | 'plus_values' | 'pensions' | 'autres';
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
  notes?: string;
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
  };
}
