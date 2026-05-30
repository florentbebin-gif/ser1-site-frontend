import { useState, type ReactNode } from 'react';
import {
  SimAmountInputEuro,
  SimAmountInputNumeric,
  SimAmountInputPercent,
  SimSelect,
} from '@/components/ui/sim';
import {
  primitiveStates,
  selectOptions,
  snippets,
  type PrimitiveState,
} from '../designSystemCatalog';
import { SettingsDesignSystemCodeSnippet } from '../SettingsDesignSystemCodeSnippet';

const ignoreNumberChange = (_value: number) => {};

export function StateCell({
  label,
  state,
  children,
}: {
  label: string;
  state: PrimitiveState;
  children: ReactNode;
}) {
  return (
    <div
      className={`settings-design-system__state-cell settings-design-system__state-cell--${state}`}
    >
      <span className="settings-design-system__state-label">{label}</span>
      {children}
    </div>
  );
}

export function DesignSystemInputPreview() {
  const [montant, setMontant] = useState(250000);
  const [taux, setTaux] = useState(4.5);
  const [parts, setParts] = useState(2.5);
  const [profil, setProfil] = useState('equilibre');

  return (
    <div className="settings-design-system__stack">
      <div className="settings-design-system__input-grid">
        <SimAmountInputEuro label="Montant euro" value={montant} onChange={setMontant} min={0} />
        <SimAmountInputPercent
          label="Taux décimal"
          value={taux}
          onChange={setTaux}
          min={0}
          max={20}
        />
        <SimAmountInputNumeric
          label="Nombre libre"
          unit="parts"
          value={parts}
          onChange={setParts}
          min={0}
        />
        <div className="settings-design-system__field-demo">
          <span className="sim-field__label">Profil investisseur</span>
          <SimSelect
            value={profil}
            onChange={setProfil}
            options={selectOptions}
            ariaLabel="Profil investisseur"
          />
        </div>
      </div>

      <article className="settings-design-system__ui-card">
        <h3>États inputs</h3>
        <div className="settings-design-system__state-grid">
          {primitiveStates.map(({ state, label }) => (
            <StateCell key={state} label={label} state={state}>
              <SimAmountInputEuro
                label={`Montant état ${label.toLowerCase()}`}
                value={125000}
                onChange={ignoreNumberChange}
                disabled={state === 'disabled'}
              />
            </StateCell>
          ))}
        </div>
      </article>

      <SettingsDesignSystemCodeSnippet label="Extrait inputs">
        {snippets.inputs}
      </SettingsDesignSystemCodeSnippet>
    </div>
  );
}
