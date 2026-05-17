import type { BaseCgRetraiteContractType, PerTransfertCompartment } from '@/data/basecg';
import { TYPE_LABELS, COMPARTMENT_LABELS } from '@/data/basecg';

export const TYPE_OPTIONS = Object.keys(TYPE_LABELS) as BaseCgRetraiteContractType[];

export const COMPARTMENT_OPTIONS = Object.keys(COMPARTMENT_LABELS) as PerTransfertCompartment[];
export { TYPE_LABELS, COMPARTMENT_LABELS };
