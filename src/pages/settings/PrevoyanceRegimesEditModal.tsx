import { useState } from 'react';
import {
  formatPrevoyanceSchemaError,
  prevoyanceMaintienEmployeurSettingsSchema,
  prevoyanceRegimeDataSchema,
  prevoyanceRegimeSettingsSchema,
  prevoyanceSourcesSchema,
} from '@/domain/prevoyance/schema';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeData,
  PrevoyanceRegimeSettings,
  PrevoyanceSources,
} from '@/domain/prevoyance/types';
import {
  upsertPrevoyanceMaintienEmployeurSettings,
  upsertPrevoyanceRegimeSettings,
} from '@/utils/cache/prevoyanceSettingsCache';
import { MaintienDataEditor } from './PrevoyanceMaintienDataEditor';
import { RegimeDataEditor } from './PrevoyanceRegimeDataEditor';
import { Field, SourceReferencesEditor } from './PrevoyanceRegimesEditorFields';
import SettingsModalShell from './components/SettingsModalShell';

export type EditorTarget =
  | { type: 'regime'; value: PrevoyanceRegimeSettings }
  | { type: 'maintien'; value: PrevoyanceMaintienEmployeurSettings };

type EditorData = PrevoyanceRegimeData | PrevoyanceMaintienEmployeurSettings['data'];

interface EditorState {
  code: string;
  label: string;
  caisse: string;
  population: PrevoyanceRegimeSettings['population'];
  defaultContractKind: PrevoyanceRegimeSettings['defaultContractKind'];
  year: string;
  data: EditorData;
  sources: PrevoyanceSources;
}

const POPULATION_OPTIONS: Array<PrevoyanceRegimeSettings['population']> = [
  'salarie',
  'tns',
  'liberal',
  'exploitant_agricole',
  'avocat',
];
function createEditorState(target: EditorTarget): EditorState {
  const base = target.value;
  return {
    code: base.code,
    label: base.label,
    caisse: target.type === 'regime' ? target.value.caisse : '',
    population: target.type === 'regime' ? target.value.population : 'salarie',
    defaultContractKind: target.type === 'regime' ? target.value.defaultContractKind : 'collectif',
    year: String(base.year),
    data: structuredClone(base.data),
    sources: structuredClone(base.sources),
  };
}
export function EditModal({
  target,
  onClose,
  onSaved,
}: {
  target: EditorTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, setState] = useState<EditorState>(() => createEditorState(target));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      const sourceParse = prevoyanceSourcesSchema.safeParse(state.sources);
      if (!sourceParse.success) {
        setError(formatPrevoyanceSchemaError(sourceParse));
        return;
      }

      if (target.type === 'regime') {
        const dataParse = prevoyanceRegimeDataSchema.safeParse(state.data);
        if (!dataParse.success) {
          setError(formatPrevoyanceSchemaError(dataParse));
          return;
        }
        const payload = prevoyanceRegimeSettingsSchema.parse({
          code: state.code,
          label: state.label,
          caisse: state.caisse,
          population: state.population,
          defaultContractKind: state.defaultContractKind,
          year: Number(state.year),
          data: dataParse.data,
          sources: sourceParse.data,
        });
        await upsertPrevoyanceRegimeSettings(payload);
      } else {
        const payload = prevoyanceMaintienEmployeurSettingsSchema.parse({
          code: state.code,
          label: state.label,
          year: Number(state.year),
          data: state.data,
          sources: sourceParse.data,
        });
        await upsertPrevoyanceMaintienEmployeurSettings(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsModalShell
      title={target.type === 'regime' ? 'Modifier le régime' : 'Modifier le maintien employeur'}
      subtitle="Formulaire admin structuré avec références traçables par champ."
      onClose={onClose}
      modalClassName="prevoyance-settings-modal"
      footer={
        <>
          {error ? <span className="prevoyance-settings-modal__error">{error}</span> : <span />}
          <button type="button" className="settings-action-btn" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <div className="prevoyance-settings-modal__grid">
        <Field label="Code">
          <input
            value={state.code}
            onChange={(event) => setField('code', event.target.value)}
            className="prevoyance-settings-input"
          />
        </Field>
        <Field label="Libellé">
          <input
            value={state.label}
            onChange={(event) => setField('label', event.target.value)}
            className="prevoyance-settings-input"
          />
        </Field>
        <Field label="Année">
          <input
            value={state.year}
            onChange={(event) => setField('year', event.target.value)}
            className="prevoyance-settings-input"
            inputMode="numeric"
          />
        </Field>

        {target.type === 'regime' ? (
          <>
            <Field label="Caisse">
              <input
                value={state.caisse}
                onChange={(event) => setField('caisse', event.target.value)}
                className="prevoyance-settings-input"
              />
            </Field>
            <Field label="Population">
              <select
                value={state.population}
                onChange={(event) =>
                  setField('population', event.target.value as EditorState['population'])
                }
                className="prevoyance-settings-input"
              >
                {POPULATION_OPTIONS.map((population) => (
                  <option key={population} value={population}>
                    {population}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Type contrat">
              <select
                value={state.defaultContractKind}
                onChange={(event) =>
                  setField(
                    'defaultContractKind',
                    event.target.value as EditorState['defaultContractKind'],
                  )
                }
                className="prevoyance-settings-input"
              >
                <option value="collectif">collectif</option>
                <option value="individuel">individuel</option>
              </select>
            </Field>
          </>
        ) : null}
      </div>

      {target.type === 'regime' ? (
        <RegimeDataEditor
          data={state.data as PrevoyanceRegimeData}
          onChange={(data) => setField('data', data)}
        />
      ) : (
        <MaintienDataEditor
          data={state.data as PrevoyanceMaintienEmployeurSettings['data']}
          onChange={(data) => setField('data', data)}
        />
      )}

      <SourceReferencesEditor
        sources={state.sources}
        onChange={(sources) => setField('sources', sources)}
      />
    </SettingsModalShell>
  );
}
