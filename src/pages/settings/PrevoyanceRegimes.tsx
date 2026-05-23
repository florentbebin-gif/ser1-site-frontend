import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import { SimModalShell } from '@/components/ui/sim';
import {
  formatPrevoyanceSchemaError,
  prevoyanceMaintienEmployeurSettingsSchema,
  prevoyanceRegimeDataSchema,
  prevoyanceRegimeSettingsSchema,
  prevoyanceSourcesSchema,
} from '@/domain/prevoyance/schema';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import {
  getPrevoyanceMaintienEmployeurSettings,
  getPrevoyanceRegimeSettings,
  upsertPrevoyanceMaintienEmployeurSettings,
  upsertPrevoyanceRegimeSettings,
} from '@/utils/cache/prevoyanceSettingsCache';
import './styles/prevoyance-regimes.css';

type EditorTarget =
  | { type: 'regime'; value: PrevoyanceRegimeSettings }
  | { type: 'maintien'; value: PrevoyanceMaintienEmployeurSettings };

interface EditorState {
  code: string;
  label: string;
  caisse: string;
  population: PrevoyanceRegimeSettings['population'];
  defaultContractKind: PrevoyanceRegimeSettings['defaultContractKind'];
  year: string;
  dataJson: string;
  sourcesJson: string;
}

const POPULATION_OPTIONS: Array<PrevoyanceRegimeSettings['population']> = [
  'salarie',
  'tns',
  'liberal',
  'exploitant_agricole',
  'avocat',
];

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function parseJson(raw: string): unknown {
  return raw.trim() ? JSON.parse(raw) : {};
}

function formatRegimeType(regime: PrevoyanceRegimeSettings): string {
  return regime.defaultContractKind === 'collectif'
    ? 'Salarié collectif'
    : 'Individuel TNS/libéral';
}

function formatAmountLabel(value: { label?: string; value?: number | null } | null | undefined) {
  if (!value) return 'Non prévu';
  if (value.label) return value.label;
  return value.value === null || value.value === undefined ? 'Formule régime' : `${value.value}`;
}

function RegimeColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="prevoyance-settings-column">
      <div className="prevoyance-settings-column__title">{title}</div>
      <div className="prevoyance-settings-column__body">{children}</div>
    </div>
  );
}

function RegimePanel({
  regime,
  isOpen,
  onToggle,
  onEdit,
  canEdit,
}: {
  regime: PrevoyanceRegimeSettings;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const firstArret = regime.data.arret.paliers[0];
  const firstInvalidite = regime.data.invalidite.paliers[1] ?? regime.data.invalidite.paliers[0];

  return (
    <article className="prevoyance-settings-regime">
      <button
        type="button"
        className="prevoyance-settings-regime__header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>
          <strong>{regime.label}</strong>
          <span>{regime.caisse}</span>
        </span>
        <span className="prevoyance-settings-regime__meta">
          <span className="prevoyance-settings-badge">{formatRegimeType(regime)}</span>
          <span className="prevoyance-settings-badge prevoyance-settings-badge--muted">
            {regime.year}
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="prevoyance-settings-regime__body">
          <div className="prevoyance-settings-grid">
            <RegimeColumn title="Arrêt de travail">
              <p>{firstArret?.label ?? 'Aucun palier renseigné.'}</p>
              <dl>
                <div>
                  <dt>Carence maladie</dt>
                  <dd>{regime.data.arret.carences.maladie} j</dd>
                </div>
                <div>
                  <dt>Durée max</dt>
                  <dd>{regime.data.arret.maxDurationDays} j</dd>
                </div>
              </dl>
            </RegimeColumn>
            <RegimeColumn title="Invalidité">
              <p>{firstInvalidite?.label ?? 'Aucun seuil renseigné.'}</p>
              <dl>
                {regime.data.invalidite.paliers.slice(0, 3).map((palier) => (
                  <div key={`${palier.fromRate}-${palier.toRate ?? 'plus'}`}>
                    <dt>
                      {palier.fromRate} % à {palier.toRate ?? '+'} %
                    </dt>
                    <dd>{formatAmountLabel(palier.amount)}</dd>
                  </div>
                ))}
              </dl>
            </RegimeColumn>
            <RegimeColumn title="Décès">
              <p>{formatAmountLabel(regime.data.deces.capital)}</p>
              <dl>
                <div>
                  <dt>Doublement accident</dt>
                  <dd>{regime.data.deces.doublementAccident ? 'Oui' : 'Non'}</dd>
                </div>
                <div>
                  <dt>Double effet</dt>
                  <dd>{regime.data.deces.doubleEffet ? 'Oui' : 'Non'}</dd>
                </div>
              </dl>
            </RegimeColumn>
            <RegimeColumn title="Cotisations & maintien">
              <p>{regime.data.cotisations.notes?.[0] ?? 'Cotisations non documentées.'}</p>
              <dl>
                <div>
                  <dt>Mode</dt>
                  <dd>{regime.data.cotisations.mode}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{regime.sources.fiche}</dd>
                </div>
              </dl>
            </RegimeColumn>
          </div>

          <div className="prevoyance-settings-regime__footer">
            <span>{regime.sources.noteValidation}</span>
            {canEdit ? (
              <button type="button" className="settings-action-button" onClick={onEdit}>
                Modifier
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function createEditorState(target: EditorTarget): EditorState {
  const base = target.value;
  return {
    code: base.code,
    label: base.label,
    caisse: target.type === 'regime' ? target.value.caisse : '',
    population: target.type === 'regime' ? target.value.population : 'salarie',
    defaultContractKind: target.type === 'regime' ? target.value.defaultContractKind : 'collectif',
    year: String(base.year),
    dataJson: toJson(base.data),
    sourcesJson: toJson(base.sources),
  };
}

function EditModal({
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
      const data = parseJson(state.dataJson);
      const sources = parseJson(state.sourcesJson);
      const sourceParse = prevoyanceSourcesSchema.safeParse(sources);
      if (!sourceParse.success) {
        setError(formatPrevoyanceSchemaError(sourceParse));
        return;
      }

      if (target.type === 'regime') {
        const dataParse = prevoyanceRegimeDataSchema.safeParse(data);
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
          data,
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
    <SimModalShell
      title={target.type === 'regime' ? 'Modifier le régime' : 'Modifier le maintien employeur'}
      subtitle="Les clés JSON restent sans accents pour conserver des requêtes Supabase lisibles."
      onClose={onClose}
      modalClassName="prevoyance-settings-modal"
      footer={
        <>
          {error ? <span className="prevoyance-settings-modal__error">{error}</span> : <span />}
          <button type="button" className="settings-action-button" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <div className="prevoyance-settings-modal__grid">
        <label>
          Code
          <input
            value={state.code}
            onChange={(event) => setField('code', event.target.value)}
            className="prevoyance-settings-input"
          />
        </label>
        <label>
          Libellé
          <input
            value={state.label}
            onChange={(event) => setField('label', event.target.value)}
            className="prevoyance-settings-input"
          />
        </label>
        <label>
          Année
          <input
            value={state.year}
            onChange={(event) => setField('year', event.target.value)}
            className="prevoyance-settings-input"
            inputMode="numeric"
          />
        </label>

        {target.type === 'regime' ? (
          <>
            <label>
              Caisse
              <input
                value={state.caisse}
                onChange={(event) => setField('caisse', event.target.value)}
                className="prevoyance-settings-input"
              />
            </label>
            <label>
              Population
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
            </label>
            <label>
              Type contrat
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
            </label>
          </>
        ) : null}
      </div>

      <div className="prevoyance-settings-modal__json-grid">
        <label>
          Données RO / maintien
          <textarea
            value={state.dataJson}
            onChange={(event) => setField('dataJson', event.target.value)}
            className="prevoyance-settings-textarea"
            spellCheck={false}
          />
        </label>
        <label>
          Sources
          <textarea
            value={state.sourcesJson}
            onChange={(event) => setField('sourcesJson', event.target.value)}
            className="prevoyance-settings-textarea"
            spellCheck={false}
          />
        </label>
      </div>
    </SimModalShell>
  );
}

export default function PrevoyanceRegimes() {
  const { isAdmin } = useUserRole();
  const [regimes, setRegimes] = useState<PrevoyanceRegimeSettings[]>([]);
  const [maintien, setMaintien] = useState<PrevoyanceMaintienEmployeurSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);

  const reload = () => {
    setLoading(true);
    Promise.all([getPrevoyanceRegimeSettings(), getPrevoyanceMaintienEmployeurSettings()])
      .then(([nextRegimes, nextMaintien]) => {
        setRegimes(nextRegimes);
        setMaintien(nextMaintien);
        setOpenCode((current) => current ?? nextRegimes[0]?.code ?? null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredRegimes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return regimes;
    return regimes.filter(
      (regime) =>
        regime.label.toLowerCase().includes(needle) ||
        regime.caisse.toLowerCase().includes(needle) ||
        regime.code.toLowerCase().includes(needle),
    );
  }, [regimes, search]);

  return (
    <div className="prevoyance-settings-page">
      <div className="premium-card prevoyance-settings-header-card">
        <div className="prevoyance-settings-header">
          <div>
            <h1 className="premium-title">
              <SettingsTitleWithIcon icon="umbrella">Prévoyance — régimes</SettingsTitleWithIcon>
            </h1>
            <p className="premium-subtitle">
              Référentiel des régimes obligatoires, des règles décès et du maintien employeur.
            </p>
          </div>
          <div className="prevoyance-settings-kpis" aria-label="Synthèse référentiel">
            <span>{regimes.length} régimes</span>
            <span>{maintien.length} maintien légal</span>
          </div>
        </div>
      </div>

      {!isAdmin ? <UserInfoBanner /> : null}

      <div className="prevoyance-settings-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un régime, une caisse ou un code"
          className="prevoyance-settings-input"
        />
        {maintien[0] && isAdmin ? (
          <button
            type="button"
            className="settings-action-button"
            onClick={() => {
              const firstMaintien = maintien[0];
              if (firstMaintien) setEditorTarget({ type: 'maintien', value: firstMaintien });
            }}
          >
            Maintien employeur
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="premium-card prevoyance-settings-state">Chargement...</div>
      ) : (
        <div className="prevoyance-settings-list">
          {filteredRegimes.map((regime) => (
            <RegimePanel
              key={regime.code}
              regime={regime}
              isOpen={openCode === regime.code}
              onToggle={() => setOpenCode(openCode === regime.code ? null : regime.code)}
              onEdit={() => setEditorTarget({ type: 'regime', value: regime })}
              canEdit={isAdmin}
            />
          ))}
        </div>
      )}

      {editorTarget ? (
        <EditModal target={editorTarget} onClose={() => setEditorTarget(null)} onSaved={reload} />
      ) : null}
    </div>
  );
}
