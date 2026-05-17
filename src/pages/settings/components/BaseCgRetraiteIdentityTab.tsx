import type { BaseCgRetraiteContract, BaseCgRetraiteContractType } from '@/data/basecg';
import { COMPARTMENT_LABELS, COMPARTMENT_OPTIONS, TYPE_LABELS, TYPE_OPTIONS } from '../baseCgRetraiteOptions';

type RootSetter = <K extends keyof BaseCgRetraiteContract>(
  _key: K,
  _value: BaseCgRetraiteContract[K],
) => void;

interface Props {
  draft: BaseCgRetraiteContract;
  onRootChange: RootSetter;
}

export function BaseCgRetraiteIdentityTab({ draft, onRootChange }: Props) {
  return (
    <>
      <label>
        Compagnie
        <input value={draft.compagnie} onChange={(event) => onRootChange('compagnie', event.target.value)} />
      </label>
      <label>
        Nom du contrat
        <input value={draft.nomContrat} onChange={(event) => onRootChange('nomContrat', event.target.value)} />
      </label>
      <label>
        Type
        <select
          value={draft.typeContrat}
          onChange={(event) => onRootChange('typeContrat', event.target.value as BaseCgRetraiteContractType)}
        >
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>{TYPE_LABELS[type]}</option>
          ))}
        </select>
      </label>
      <label>
        Compartiment PER cible
        <select
          value={draft.perCompartment ?? ''}
          onChange={(event) => onRootChange(
            'perCompartment',
            (event.target.value || null) as BaseCgRetraiteContract['perCompartment'],
          )}
        >
          <option value="">Déduit du type</option>
          {COMPARTMENT_OPTIONS.map((compartment) => (
            <option key={compartment} value={compartment}>{COMPARTMENT_LABELS[compartment]}</option>
          ))}
        </select>
      </label>
    </>
  );
}
