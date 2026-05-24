import type { PrevoyanceRegimeData } from '@/domain/prevoyance/types';
import {
  AmountRuleEditor,
  Field,
  NotesEditor,
  formatNullable,
  nullableNumberFromInput,
  numberFromInput,
} from './PrevoyanceRegimesEditorFields';

const COTISATION_MODE_OPTIONS: PrevoyanceRegimeData['cotisations']['mode'][] = [
  'fixed_eur',
  'percent_income',
  'percent_salary',
  'formula',
  'none',
];
export function RegimeDataEditor({
  data,
  onChange,
}: {
  data: PrevoyanceRegimeData;
  onChange: (data: PrevoyanceRegimeData) => void;
}) {
  const updateArretPalier = (
    index: number,
    patch: Partial<PrevoyanceRegimeData['arret']['paliers'][number]>,
  ) => {
    onChange({
      ...data,
      arret: {
        ...data.arret,
        paliers: data.arret.paliers.map((palier, palierIndex) =>
          palierIndex === index ? { ...palier, ...patch } : palier,
        ),
      },
    });
  };
  const updateInvaliditePalier = (
    index: number,
    patch: Partial<PrevoyanceRegimeData['invalidite']['paliers'][number]>,
  ) => {
    onChange({
      ...data,
      invalidite: {
        ...data.invalidite,
        paliers: data.invalidite.paliers.map((palier, palierIndex) =>
          palierIndex === index ? { ...palier, ...patch } : palier,
        ),
      },
    });
  };

  return (
    <div className="prevoyance-settings-modal__sections">
      <section className="prevoyance-settings-form-section">
        <h3>Arrêt de travail</h3>
        <div className="prevoyance-settings-form-grid">
          <Field label="Carence maladie">
            <input
              value={data.arret.carences.maladie}
              onChange={(event) =>
                onChange({
                  ...data,
                  arret: {
                    ...data.arret,
                    carences: {
                      ...data.arret.carences,
                      maladie: numberFromInput(event.target.value),
                    },
                  },
                })
              }
              className="prevoyance-settings-input"
              inputMode="numeric"
            />
          </Field>
          <Field label="Carence accident">
            <input
              value={data.arret.carences.accident}
              onChange={(event) =>
                onChange({
                  ...data,
                  arret: {
                    ...data.arret,
                    carences: {
                      ...data.arret.carences,
                      accident: numberFromInput(event.target.value),
                    },
                  },
                })
              }
              className="prevoyance-settings-input"
              inputMode="numeric"
            />
          </Field>
          <Field label="Carence hospitalisation">
            <input
              value={data.arret.carences.hospitalisation}
              onChange={(event) =>
                onChange({
                  ...data,
                  arret: {
                    ...data.arret,
                    carences: {
                      ...data.arret.carences,
                      hospitalisation: numberFromInput(event.target.value),
                    },
                  },
                })
              }
              className="prevoyance-settings-input"
              inputMode="numeric"
            />
          </Field>
          <Field label="Durée max">
            <input
              value={data.arret.maxDurationDays}
              onChange={(event) =>
                onChange({
                  ...data,
                  arret: { ...data.arret, maxDurationDays: numberFromInput(event.target.value) },
                })
              }
              className="prevoyance-settings-input"
              inputMode="numeric"
            />
          </Field>
        </div>
        <div className="prevoyance-settings-palier-list">
          {data.arret.paliers.map((palier, index) => (
            <div key={`${palier.fromDay}-${index}`} className="prevoyance-settings-palier-card">
              <div className="prevoyance-settings-form-grid">
                <Field label="Début jour">
                  <input
                    value={palier.fromDay}
                    onChange={(event) =>
                      updateArretPalier(index, { fromDay: numberFromInput(event.target.value) })
                    }
                    className="prevoyance-settings-input"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Fin jour">
                  <input
                    value={formatNullable(palier.toDay)}
                    onChange={(event) =>
                      updateArretPalier(index, {
                        toDay: nullableNumberFromInput(event.target.value),
                      })
                    }
                    className="prevoyance-settings-input"
                    inputMode="numeric"
                    placeholder="Illimité"
                  />
                </Field>
                <Field label="Libellé">
                  <input
                    value={palier.label}
                    onChange={(event) => updateArretPalier(index, { label: event.target.value })}
                    className="prevoyance-settings-input"
                  />
                </Field>
              </div>
              <AmountRuleEditor
                value={palier.amount}
                onChange={(amount) => updateArretPalier(index, { amount })}
              />
            </div>
          ))}
        </div>
        <NotesEditor
          value={data.arret.notes}
          onChange={(notes) => onChange({ ...data, arret: { ...data.arret, notes } })}
        />
      </section>

      <section className="prevoyance-settings-form-section">
        <h3>Invalidité</h3>
        <div className="prevoyance-settings-palier-list">
          {data.invalidite.paliers.map((palier, index) => (
            <div key={`${palier.fromRate}-${index}`} className="prevoyance-settings-palier-card">
              <div className="prevoyance-settings-form-grid">
                <Field label="Taux début">
                  <input
                    value={palier.fromRate}
                    onChange={(event) =>
                      updateInvaliditePalier(index, {
                        fromRate: numberFromInput(event.target.value),
                      })
                    }
                    className="prevoyance-settings-input"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Taux fin">
                  <input
                    value={formatNullable(palier.toRate)}
                    onChange={(event) =>
                      updateInvaliditePalier(index, {
                        toRate: nullableNumberFromInput(event.target.value),
                      })
                    }
                    className="prevoyance-settings-input"
                    inputMode="decimal"
                    placeholder="Et plus"
                  />
                </Field>
                <Field label="Catégorie">
                  <input
                    value={palier.category ?? ''}
                    onChange={(event) =>
                      updateInvaliditePalier(index, { category: event.target.value || undefined })
                    }
                    className="prevoyance-settings-input"
                  />
                </Field>
                <Field label="Libellé">
                  <input
                    value={palier.label}
                    onChange={(event) =>
                      updateInvaliditePalier(index, { label: event.target.value })
                    }
                    className="prevoyance-settings-input"
                  />
                </Field>
              </div>
              <AmountRuleEditor
                value={palier.amount}
                onChange={(amount) => updateInvaliditePalier(index, { amount })}
              />
            </div>
          ))}
        </div>
        <NotesEditor
          value={data.invalidite.notes}
          onChange={(notes) => onChange({ ...data, invalidite: { ...data.invalidite, notes } })}
        />
      </section>

      <section className="prevoyance-settings-form-section">
        <h3>Décès</h3>
        <AmountRuleEditor
          value={data.deces.capital}
          onChange={(capital) => onChange({ ...data, deces: { ...data.deces, capital } })}
        />
        <div className="prevoyance-settings-check-row">
          <label>
            <input
              type="checkbox"
              checked={data.deces.doublementAccident}
              onChange={(event) =>
                onChange({
                  ...data,
                  deces: { ...data.deces, doublementAccident: event.target.checked },
                })
              }
            />
            Doublement accident
          </label>
          <label>
            <input
              type="checkbox"
              checked={data.deces.doubleEffet}
              onChange={(event) =>
                onChange({ ...data, deces: { ...data.deces, doubleEffet: event.target.checked } })
              }
            />
            Double effet
          </label>
        </div>
        <NotesEditor
          value={data.deces.notes}
          onChange={(notes) => onChange({ ...data, deces: { ...data.deces, notes } })}
        />
      </section>

      <section className="prevoyance-settings-form-section">
        <h3>Cotisations</h3>
        <div className="prevoyance-settings-form-grid">
          <Field label="Mode">
            <select
              value={data.cotisations.mode}
              onChange={(event) =>
                onChange({
                  ...data,
                  cotisations: {
                    ...data.cotisations,
                    mode: event.target.value as PrevoyanceRegimeData['cotisations']['mode'],
                  },
                })
              }
              className="prevoyance-settings-input"
            >
              {COTISATION_MODE_OPTIONS.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valeur">
            <input
              value={formatNullable(data.cotisations.value)}
              onChange={(event) =>
                onChange({
                  ...data,
                  cotisations: {
                    ...data.cotisations,
                    value: nullableNumberFromInput(event.target.value),
                  },
                })
              }
              className="prevoyance-settings-input"
              inputMode="decimal"
            />
          </Field>
          <Field label="Assiette">
            <select
              value={data.cotisations.assiette ?? ''}
              onChange={(event) =>
                onChange({
                  ...data,
                  cotisations: {
                    ...data.cotisations,
                    assiette: (event.target.value ||
                      undefined) as PrevoyanceRegimeData['cotisations']['assiette'],
                  },
                })
              }
              className="prevoyance-settings-input"
            >
              <option value="">Non renseignée</option>
              <option value="TA">TA</option>
              <option value="TA-TB">TA-TB</option>
              <option value="TA-TB-TC">TA-TB-TC</option>
            </select>
          </Field>
          <Field label="Minimum">
            <input
              value={formatNullable(data.cotisations.min)}
              onChange={(event) =>
                onChange({
                  ...data,
                  cotisations: {
                    ...data.cotisations,
                    min: nullableNumberFromInput(event.target.value),
                  },
                })
              }
              className="prevoyance-settings-input"
              inputMode="decimal"
            />
          </Field>
          <Field label="Maximum">
            <input
              value={formatNullable(data.cotisations.max)}
              onChange={(event) =>
                onChange({
                  ...data,
                  cotisations: {
                    ...data.cotisations,
                    max: nullableNumberFromInput(event.target.value),
                  },
                })
              }
              className="prevoyance-settings-input"
              inputMode="decimal"
            />
          </Field>
        </div>
        <NotesEditor
          value={data.cotisations.notes}
          onChange={(notes) => onChange({ ...data, cotisations: { ...data.cotisations, notes } })}
        />
      </section>
    </div>
  );
}
