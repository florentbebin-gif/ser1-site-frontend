import type {
  PrevoyanceContractDraft,
  PrevoyanceContractKind,
  PrevoyanceSituationDraft,
} from '@/domain/prevoyance/types';

export interface FraisProModalState {
  contractId: string;
  chargesExternes: number;
  loyers: number;
  assurances: number;
  salaires: number;
  amortissements: number;
  fraisBancaires: number;
}

export type FraisProNumericKey = Exclude<keyof FraisProModalState, 'contractId'>;

export const DEFAULT_SITUATION: PrevoyanceSituationDraft = {
  birthDate: '',
  familyStatus: 'celibataire',
  childrenCount: 0,
  regimeCode: '',
  kindOverride: null,
  revenuImposable: 0,
  salaireBrutAnnuel: 0,
  salaireNetImposable: 0,
  ancienneteYears: 0,
};

export function createDefaultContract(
  kind: PrevoyanceContractKind,
  index: number,
  _annualBase: number,
): PrevoyanceContractDraft {
  const id = `contrat-${Date.now()}-${index}`;
  if (kind === 'collectif') {
    return {
      id,
      name: `Contrat ${index}`,
      kind,
      acteJuridique: 'due',
      assiette: 'TA-TB',
      arret: { salairePct: 0 },
      invalidite: {
        paliers: [{ fromRate: 0, toRate: null, mode: 'fixed', referencePct: 0, salairePct: 0 }],
      },
      deces: {
        salairePct: 0,
        doublementAccident: false,
        doubleEffet: false,
        renteConjointPct: 0,
        renteEducationPct: 0,
      },
      cotisation: {
        tauxPctSalaire: 0,
        repartition: { employeur: 0, salarie: 0 },
      },
    };
  }

  return {
    id,
    name: `Contrat ${index}`,
    kind,
    indemnisation: 'indemnitaire',
    arret: {
      franchises: { accident: 0, hospitalisation: 0, maladie: 0 },
      paliers: [{ fromDay: 0, toDay: 1095, amount: 0 }],
    },
    invalidite: {
      indemnisation: 'indemnitaire',
      paliers: [
        {
          fromRate: 0,
          toRate: null,
          mode: 'fixed',
          referenceAmount: 0,
          amount: 0,
        },
      ],
    },
    deces: {
      capital: 0,
      doublementAccident: false,
      doubleEffet: false,
      renteConjoint: 0,
      renteEducation: 0,
    },
    fraisPro: {
      enabled: true,
      franchiseDays: 0,
      amount: 0,
      maxDurationYears: 1,
    },
    cotisation: {
      montantAnnuel: 0,
      dontMadelin: 0,
    },
  };
}
