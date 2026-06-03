import type { BaseCgRetraiteContract, BaseCgRetraiteContractType } from '@/data/base-cg-retraite';
import {
  COMPARTMENT_LABELS,
  COMPARTMENT_OPTIONS,
  TYPE_LABELS,
  TYPE_OPTIONS,
} from '../baseCgRetraiteOptions';
import { BaseCgSelectField, BaseCgTextField } from './BaseCgRetraiteModalFields';

type RootSetter = <K extends keyof BaseCgRetraiteContract>(
  _key: K,
  _value: BaseCgRetraiteContract[K],
) => void;

interface Props {
  draft: BaseCgRetraiteContract;
  onRootChange: RootSetter;
}

const TYPE_SELECT_OPTIONS = TYPE_OPTIONS.map((type) => ({
  value: type,
  label: TYPE_LABELS[type],
}));

const COMPARTMENT_SELECT_OPTIONS = [
  { value: '', label: 'Déduit du type' },
  ...COMPARTMENT_OPTIONS.map((compartment) => ({
    value: compartment,
    label: COMPARTMENT_LABELS[compartment],
  })),
];

export function BaseCgRetraiteIdentityTab({ draft, onRootChange }: Props) {
  return (
    <>
      <BaseCgTextField
        label="Compagnie"
        value={draft.compagnie}
        onChange={(value) => onRootChange('compagnie', value)}
      />
      <BaseCgTextField
        label="Nom du contrat"
        value={draft.nomContrat}
        onChange={(value) => onRootChange('nomContrat', value)}
      />
      <BaseCgSelectField
        label="Type"
        value={draft.typeContrat}
        options={TYPE_SELECT_OPTIONS}
        onChange={(value) => onRootChange('typeContrat', value as BaseCgRetraiteContractType)}
      />
      <BaseCgSelectField
        label="Compartiment PER cible"
        value={draft.perCompartment ?? ''}
        options={COMPARTMENT_SELECT_OPTIONS}
        onChange={(value) =>
          onRootChange(
            'perCompartment',
            (value || null) as BaseCgRetraiteContract['perCompartment'],
          )
        }
      />
    </>
  );
}
