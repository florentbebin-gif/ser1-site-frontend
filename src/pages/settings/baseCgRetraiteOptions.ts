import type { BaseCgRetraiteContractType, PerTransfertCompartment } from '@/data/base-cg-retraite';
import { TYPE_LABELS, COMPARTMENT_LABELS } from '@/data/base-cg-retraite';

export const TYPE_OPTIONS = Object.keys(TYPE_LABELS) as BaseCgRetraiteContractType[];

export const COMPARTMENT_OPTIONS = Object.keys(COMPARTMENT_LABELS) as PerTransfertCompartment[];
export { TYPE_LABELS, COMPARTMENT_LABELS };
