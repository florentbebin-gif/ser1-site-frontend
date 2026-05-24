export type PrevoyanceContractKind = 'individuel' | 'collectif';
export type PrevoyancePopulation = 'salarie' | 'tns' | 'liberal' | 'exploitant_agricole' | 'avocat';

export type PrevoyanceAssiette = 'TA' | 'TA-TB' | 'TA-TB-TC';
export type PrevoyanceActeJuridique = 'due' | 'referendum' | 'accord';
export type PrevoyanceIndemnisation = 'forfaitaire' | 'indemnitaire';

export interface PrevoyanceAmountRule {
  mode:
    | 'fixed_eur_day'
    | 'fixed_eur_month'
    | 'fixed_eur_year'
    | 'percent_income'
    | 'percent_salary'
    | 'formula';
  value: number | null;
  label?: string;
  unit?: string;
  assiette?: PrevoyanceAssiette;
}

export interface PrevoyanceArretSettings {
  carences: {
    maladie: number;
    accident: number;
    hospitalisation: number;
  };
  maxDurationDays: number;
  paliers: Array<{
    fromDay: number;
    toDay: number | null;
    label: string;
    amount: PrevoyanceAmountRule;
  }>;
  notes?: string[];
}

export interface PrevoyanceInvaliditeSettings {
  paliers: Array<{
    fromRate: number;
    toRate: number | null;
    label: string;
    amount: PrevoyanceAmountRule;
    category?: string;
  }>;
  notes?: string[];
}

export interface PrevoyanceDecesSettings {
  capital: PrevoyanceAmountRule;
  doublementAccident: boolean;
  doubleEffet: boolean;
  renteConjoint?: PrevoyanceAmountRule | null;
  renteEducation?: PrevoyanceAmountRule | null;
  notes?: string[];
}

export interface PrevoyanceCotisationsSettings {
  mode: 'fixed_eur' | 'percent_income' | 'percent_salary' | 'formula' | 'none';
  value: number | null;
  assiette?: PrevoyanceAssiette;
  min?: number | null;
  max?: number | null;
  repartition?: {
    employeur: number;
    salarie: number;
  } | null;
  madelinEligible?: boolean;
  notes?: string[];
}

export interface PrevoyanceRegimeComposition {
  componentCodes: string[];
}

export interface PrevoyanceSources {
  fiche: string;
  pagesPdf: number[];
  noteValidation: string;
}

export interface PrevoyanceRegimeData {
  arret: PrevoyanceArretSettings;
  invalidite: PrevoyanceInvaliditeSettings;
  deces: PrevoyanceDecesSettings;
  cotisations: PrevoyanceCotisationsSettings;
  composition?: PrevoyanceRegimeComposition;
}

export interface PrevoyanceRegimeSettings {
  code: string;
  label: string;
  caisse: string;
  population: PrevoyancePopulation;
  defaultContractKind: PrevoyanceContractKind;
  year: number;
  data: PrevoyanceRegimeData;
  sources: PrevoyanceSources;
  updatedAt?: string | null;
}

export interface PrevoyanceMaintienEmployeurSettings {
  code: string;
  label: string;
  year: number;
  data: {
    maintienEmployeur: {
      carenceDays: number;
      minAncienneteYears: number;
      paliers: Array<{
        fromAncienneteYears: number;
        toAncienneteYears: number | null;
        firstPeriodDays: number;
        firstPeriodRate: number;
        secondPeriodDays: number;
        secondPeriodRate: number;
      }>;
      notes?: string[];
    };
  };
  sources: PrevoyanceSources;
  updatedAt?: string | null;
}

export interface PrevoyanceSituationDraft {
  birthDate: string;
  familyStatus: 'celibataire' | 'couple' | 'marie' | 'pacs' | 'divorce' | 'veuf';
  childrenCount: number;
  regimeCode: string;
  kindOverride?: PrevoyanceContractKind | null;
  revenuImposable: number;
  salaireBrutAnnuel: number;
  salaireNetImposable: number;
  ancienneteYears: number;
}

export interface PrevoyanceArretPalierDraft {
  fromDay: number;
  toDay: number;
  amount: number;
}

export interface PrevoyanceInvaliditePalierDraft {
  fromRate: number;
  toRate: number | null;
  mode: 'fixed' | 'proportional_66';
  referenceAmount: number;
  amount: number;
}

export interface PrevoyanceDecesDraft {
  capital: number;
  doublementAccident: boolean;
  doubleEffet: boolean;
  renteConjoint: number;
  renteEducation: number;
}

export interface PrevoyanceFraisProDraft {
  enabled: boolean;
  franchiseDays: number;
  amount: number;
  maxDurationYears: 1 | 2 | 3;
}

export type PrevoyanceContractDraft =
  | {
      id: string;
      name: string;
      kind: 'individuel';
      indemnisation: PrevoyanceIndemnisation;
      arret: {
        franchises: {
          accident: number;
          hospitalisation: number;
          maladie: number;
        };
        paliers: PrevoyanceArretPalierDraft[];
      };
      invalidite: {
        paliers: PrevoyanceInvaliditePalierDraft[];
      };
      deces: PrevoyanceDecesDraft;
      fraisPro: PrevoyanceFraisProDraft;
      cotisation: {
        montantAnnuel: number;
        dontMadelin: number;
      };
    }
  | {
      id: string;
      name: string;
      kind: 'collectif';
      acteJuridique: PrevoyanceActeJuridique;
      assiette: PrevoyanceAssiette;
      arret: {
        salairePct: number;
      };
      invalidite: {
        paliers: Array<{
          fromRate: number;
          toRate?: number | null;
          mode?: 'fixed' | 'proportional_66';
          referencePct?: number;
          salairePct: number;
        }>;
      };
      deces: {
        salairePct: number;
        doublementAccident: boolean;
        doubleEffet: boolean;
        renteConjointPct: number;
        renteEducationPct: number;
      };
      cotisation: {
        tauxPctSalaire: number;
        repartition: {
          employeur: number;
          salarie: number;
        };
      };
    };

export interface PrevoyanceTranches {
  ta: number;
  tb: number;
  tc: number;
  totalRetenu: number;
}

export type PrevoyanceContractAggregationMode = 'compare' | 'cumulate';

export interface PrevoyanceDeathTargetDraft {
  mode: 'multiple' | 'manual';
  multiple: 1 | 3 | 5;
  manualAmount: number;
}
