import { TARGET_DECES_MULTIPLE } from './constants';
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
  revenuImposable: 80_000,
  salaireBrutAnnuel: 70_000,
  salaireNetImposable: 56_000,
  ancienneteYears: 5,
};

export function createDefaultContract(
  kind: PrevoyanceContractKind,
  index: number,
  annualBase: number,
): PrevoyanceContractDraft {
  const id = `contrat-${Date.now()}-${index}`;
  if (kind === 'collectif') {
    return {
      id,
      name: `Contrat ${index}`,
      kind,
      acteJuridique: 'due',
      assiette: 'TA-TB',
      arret: { salairePct: 80 },
      invalidite: {
        paliers: [
          { fromRate: 33, toRate: 65, mode: 'proportional_66', referencePct: 80, salairePct: 50 },
          { fromRate: 66, toRate: null, mode: 'fixed', referencePct: 80, salairePct: 80 },
        ],
      },
      deces: {
        salairePct: 300,
        doublementAccident: true,
        doubleEffet: false,
        renteConjointPct: 0,
        renteEducationPct: 0,
      },
      cotisation: {
        tauxPctSalaire: 1.5,
        repartition: { employeur: 60, salarie: 40 },
      },
    };
  }

  return {
    id,
    name: `Contrat ${index}`,
    kind,
    indemnisation: 'indemnitaire',
    arret: {
      franchises: { accident: 0, hospitalisation: 0, maladie: 7 },
      paliers: [{ fromDay: 0, toDay: 1095, amount: Math.round(annualBase / 365) }],
    },
    invalidite: {
      paliers: [
        {
          fromRate: 16,
          toRate: 65,
          mode: 'proportional_66',
          referenceAmount: Math.round(annualBase * 0.6),
          amount: Math.round(annualBase * 0.6),
        },
        {
          fromRate: 66,
          toRate: null,
          mode: 'fixed',
          referenceAmount: Math.round(annualBase * 0.6),
          amount: Math.round(annualBase * 0.6),
        },
      ],
    },
    deces: {
      capital: annualBase * TARGET_DECES_MULTIPLE,
      doublementAccident: true,
      doubleEffet: false,
      renteConjoint: 0,
      renteEducation: 0,
    },
    fraisPro: {
      enabled: true,
      franchiseDays: 30,
      amount: Math.round(annualBase * 0.25),
      maxDurationYears: 1,
    },
    cotisation: {
      montantAnnuel: Math.round(annualBase * 0.018),
      madelin: true,
    },
  };
}
