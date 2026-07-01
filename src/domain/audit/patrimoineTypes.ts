export type ProprietaireType = 'mr' | 'mme' | 'commun';
export type ModeDetentionActif = 'pp' | 'np' | 'usf';
export type HorizonPlacement = 'ct' | 'mt' | 'lt';
export type ProfilRisque = 'sans_risque' | 'defensif' | 'equilibre' | 'dynamique';
export type DelaiRealisation = 'immediat' | 'differe';

export interface ActifBase {
  id: string;
  libelle: string;
  valeur: number;
  proprietaire: ProprietaireType;
  modeDetention?: ModeDetentionActif;
  horizonPlacement?: HorizonPlacement;
  profilRisque?: ProfilRisque;
  delaiRealisation?: DelaiRealisation;
  tauxRevalorisation?: number;
  tauxRevenu?: number;
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
  proprietaire?: ProprietaireType;
  capitalInitial: number;
  capitalRestantDu: number;
  mensualite: number;
  tauxInteret: number;
  dateDebut: string;
  dateFin: string;
  assuranceEmprunteur?: {
    quotiteMr: number;
    quotiteMme: number;
    primeMensuelle?: number;
    taea?: number;
  };
  echeanceAssuranceComprise?: number;
  taeg?: number;
  coutGlobalCredit?: number;
  coutGlobalAssurance?: number;
  bienFinance?: string; // ID de l'actif
}

export interface Passif {
  emprunts: PassifEmprunt[];
  autresDettes: Array<{
    id: string;
    libelle: string;
    proprietaire?: ProprietaireType;
    montant: number;
    description?: string;
  }>;
}
