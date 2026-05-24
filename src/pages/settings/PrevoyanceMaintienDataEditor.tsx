import type { PrevoyanceMaintienEmployeurSettings } from '@/domain/prevoyance/types';
import {
  Field,
  NotesEditor,
  formatNullable,
  nullableNumberFromInput,
  numberFromInput,
} from './PrevoyanceRegimesEditorFields';
export function MaintienDataEditor({
  data,
  onChange,
}: {
  data: PrevoyanceMaintienEmployeurSettings['data'];
  onChange: (data: PrevoyanceMaintienEmployeurSettings['data']) => void;
}) {
  const maintien = data.maintienEmployeur;
  const updatePalier = (
    index: number,
    patch: Partial<
      PrevoyanceMaintienEmployeurSettings['data']['maintienEmployeur']['paliers'][number]
    >,
  ) => {
    onChange({
      maintienEmployeur: {
        ...maintien,
        paliers: maintien.paliers.map((palier, palierIndex) =>
          palierIndex === index ? { ...palier, ...patch } : palier,
        ),
      },
    });
  };

  return (
    <div className="prevoyance-settings-modal__sections">
      <section className="prevoyance-settings-form-section">
        <h3>Maintien employeur</h3>
        <div className="prevoyance-settings-form-grid">
          <Field label="Carence">
            <input
              value={maintien.carenceDays}
              onChange={(event) =>
                onChange({
                  maintienEmployeur: {
                    ...maintien,
                    carenceDays: numberFromInput(event.target.value),
                  },
                })
              }
              className="prevoyance-settings-input"
              inputMode="numeric"
            />
          </Field>
          <Field label="Ancienneté minimale">
            <input
              value={maintien.minAncienneteYears}
              onChange={(event) =>
                onChange({
                  maintienEmployeur: {
                    ...maintien,
                    minAncienneteYears: numberFromInput(event.target.value),
                  },
                })
              }
              className="prevoyance-settings-input"
              inputMode="decimal"
            />
          </Field>
        </div>
        <div className="prevoyance-settings-palier-list">
          {maintien.paliers.map((palier, index) => (
            <div
              key={`${palier.fromAncienneteYears}-${palier.toAncienneteYears ?? 'plus'}`}
              className="prevoyance-settings-palier-card"
            >
              <div className="prevoyance-settings-form-grid">
                <Field label="Ancienneté début">
                  <input
                    value={palier.fromAncienneteYears}
                    onChange={(event) =>
                      updatePalier(index, {
                        fromAncienneteYears: numberFromInput(event.target.value),
                      })
                    }
                    className="prevoyance-settings-input"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Ancienneté fin">
                  <input
                    value={formatNullable(palier.toAncienneteYears)}
                    onChange={(event) =>
                      updatePalier(index, {
                        toAncienneteYears: nullableNumberFromInput(event.target.value),
                      })
                    }
                    className="prevoyance-settings-input"
                    inputMode="decimal"
                    placeholder="Et plus"
                  />
                </Field>
                <Field label="Première période jours">
                  <input
                    value={palier.firstPeriodDays}
                    onChange={(event) =>
                      updatePalier(index, { firstPeriodDays: numberFromInput(event.target.value) })
                    }
                    className="prevoyance-settings-input"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Première période taux">
                  <input
                    value={palier.firstPeriodRate}
                    onChange={(event) =>
                      updatePalier(index, { firstPeriodRate: numberFromInput(event.target.value) })
                    }
                    className="prevoyance-settings-input"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Seconde période jours">
                  <input
                    value={palier.secondPeriodDays}
                    onChange={(event) =>
                      updatePalier(index, { secondPeriodDays: numberFromInput(event.target.value) })
                    }
                    className="prevoyance-settings-input"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Seconde période taux">
                  <input
                    value={palier.secondPeriodRate}
                    onChange={(event) =>
                      updatePalier(index, { secondPeriodRate: numberFromInput(event.target.value) })
                    }
                    className="prevoyance-settings-input"
                    inputMode="decimal"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <NotesEditor
          value={maintien.notes}
          onChange={(notes) => onChange({ maintienEmployeur: { ...maintien, notes } })}
        />
      </section>
    </div>
  );
}
