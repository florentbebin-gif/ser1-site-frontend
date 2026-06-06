import type { ReactNode } from 'react';
import type {
  PrevoyanceAmountRule,
  PrevoyanceSourceReference,
  PrevoyanceSources,
} from '@/domain/prevoyance/types';

const AMOUNT_MODE_OPTIONS: PrevoyanceAmountRule['mode'][] = [
  'fixed_eur_day',
  'fixed_eur_month',
  'fixed_eur_year',
  'percent_income',
  'percent_salary',
  'formula',
];

const CONFIDENCE_OPTIONS: PrevoyanceSourceReference['confiance'][] = ['haute', 'moyenne', 'faible'];

export function numberFromInput(value: string, fallback = 0): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function nullableNumberFromInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = numberFromInput(trimmed, 0);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatNullable(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function emptyReference(): PrevoyanceSourceReference {
  const today = new Date().toISOString().slice(0, 10);
  return {
    organisme: '',
    titre: '',
    url: '',
    dateConsultation: today,
    valeursCouvertes: [''],
    confiance: 'moyenne',
    relevanceNote: '',
    verifiedAt: today,
  };
}
export function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      {label}
      {children}
    </label>
  );
}

export function AmountRuleEditor({
  value,
  onChange,
}: {
  value: PrevoyanceAmountRule;
  onChange: (value: PrevoyanceAmountRule) => void;
}) {
  return (
    <div className="prevoyance-settings-amount-editor">
      <select
        value={value.mode}
        onChange={(event) =>
          onChange({ ...value, mode: event.target.value as PrevoyanceAmountRule['mode'] })
        }
        className="prevoyance-settings-input"
      >
        {AMOUNT_MODE_OPTIONS.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
      <input
        value={formatNullable(value.value)}
        onChange={(event) =>
          onChange({ ...value, value: nullableNumberFromInput(event.target.value) })
        }
        className="prevoyance-settings-input"
        inputMode="decimal"
        placeholder="Valeur"
      />
      <input
        value={value.label ?? ''}
        onChange={(event) => onChange({ ...value, label: event.target.value || undefined })}
        className="prevoyance-settings-input prevoyance-settings-amount-editor__label"
        placeholder="Libellé affiché"
      />
    </div>
  );
}

export function NotesEditor({
  value,
  onChange,
}: {
  value: string[] | undefined;
  onChange: (value: string[] | undefined) => void;
}) {
  return (
    <textarea
      value={(value ?? []).join('\n')}
      onChange={(event) => {
        const notes = event.target.value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        onChange(notes.length ? notes : undefined);
      }}
      className="prevoyance-settings-textarea prevoyance-settings-textarea--compact"
      placeholder="Une note métier par ligne"
    />
  );
}
export function SourceReferencesEditor({
  sources,
  onChange,
}: {
  sources: PrevoyanceSources;
  onChange: (sources: PrevoyanceSources) => void;
}) {
  const noReferenceMode = sources.references.length === 0 && Boolean(sources.noRefReason);
  const references = noReferenceMode
    ? []
    : sources.references.length
      ? sources.references
      : [emptyReference()];
  const updateReference = (index: number, patch: Partial<PrevoyanceSourceReference>) => {
    onChange({
      ...sources,
      noRefReason: undefined,
      references: references.map((reference, referenceIndex) =>
        referenceIndex === index ? { ...reference, ...patch } : reference,
      ),
    });
  };

  return (
    <section className="prevoyance-settings-form-section">
      <h3>Références</h3>
      <div className="prevoyance-settings-source-card__actions">
        {references.length === 0 ? (
          <button
            type="button"
            className="settings-action-btn"
            onClick={() =>
              onChange({
                ...sources,
                noRefReason: undefined,
                references: [emptyReference()],
              })
            }
          >
            Ajouter une référence
          </button>
        ) : null}
        <button
          type="button"
          className="settings-action-btn"
          onClick={() =>
            onChange({
              ...sources,
              references: [],
              noRefReason:
                sources.noRefReason ??
                "Aucune source institutionnelle stable et pertinente n'a été validée pour ce régime.",
            })
          }
        >
          Aucune source
        </button>
      </div>
      <div className="prevoyance-settings-palier-list">
        {references.map((reference, index) => (
          <div key={`${reference.organisme}-${index}`} className="prevoyance-settings-source-card">
            <div className="prevoyance-settings-form-grid">
              <Field label="Organisme">
                <input
                  value={reference.organisme}
                  onChange={(event) => updateReference(index, { organisme: event.target.value })}
                  className="prevoyance-settings-input"
                />
              </Field>
              <Field label="Titre">
                <input
                  value={reference.titre}
                  onChange={(event) => updateReference(index, { titre: event.target.value })}
                  className="prevoyance-settings-input"
                />
              </Field>
              <Field label="URL">
                <input
                  value={reference.url ?? ''}
                  onChange={(event) => updateReference(index, { url: event.target.value })}
                  className="prevoyance-settings-input"
                />
              </Field>
              <Field label="Date publication">
                <input
                  value={reference.datePublication ?? ''}
                  onChange={(event) =>
                    updateReference(index, { datePublication: event.target.value || undefined })
                  }
                  className="prevoyance-settings-input"
                  type="date"
                />
              </Field>
              <Field label="Date consultation">
                <input
                  value={reference.dateConsultation}
                  onChange={(event) =>
                    updateReference(index, { dateConsultation: event.target.value })
                  }
                  className="prevoyance-settings-input"
                  type="date"
                />
              </Field>
              <Field label="Vérifié le">
                <input
                  value={reference.verifiedAt ?? ''}
                  onChange={(event) =>
                    updateReference(index, { verifiedAt: event.target.value || undefined })
                  }
                  className="prevoyance-settings-input"
                  type="date"
                />
              </Field>
              <Field label="Rubrique">
                <input
                  value={reference.rubrique ?? ''}
                  onChange={(event) =>
                    updateReference(index, { rubrique: event.target.value || undefined })
                  }
                  className="prevoyance-settings-input"
                />
              </Field>
              <Field label="Article">
                <input
                  value={reference.articleCode ?? ''}
                  onChange={(event) =>
                    updateReference(index, { articleCode: event.target.value || undefined })
                  }
                  className="prevoyance-settings-input"
                />
              </Field>
              <Field label="Page PDF">
                <input
                  value={formatNullable(reference.pagePdf)}
                  onChange={(event) =>
                    updateReference(index, {
                      pagePdf: nullableNumberFromInput(event.target.value) ?? undefined,
                    })
                  }
                  className="prevoyance-settings-input"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Confiance">
                <select
                  value={reference.confiance}
                  onChange={(event) =>
                    updateReference(index, {
                      confiance: event.target.value as PrevoyanceSourceReference['confiance'],
                    })
                  }
                  className="prevoyance-settings-input"
                >
                  {CONFIDENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Champs couverts">
              <input
                value={reference.valeursCouvertes.join(', ')}
                onChange={(event) =>
                  updateReference(index, {
                    valeursCouvertes: event.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
                className="prevoyance-settings-input"
                placeholder="arret, invalidite, deces, cotisations"
              />
            </Field>
            <Field label="Pertinence">
              <textarea
                value={reference.relevanceNote ?? ''}
                onChange={(event) =>
                  updateReference(index, { relevanceNote: event.target.value || undefined })
                }
                className="prevoyance-settings-textarea prevoyance-settings-textarea--compact"
              />
            </Field>
            <Field label="Note admin">
              <textarea
                value={reference.noteAdmin ?? ''}
                onChange={(event) =>
                  updateReference(index, { noteAdmin: event.target.value || undefined })
                }
                className="prevoyance-settings-textarea prevoyance-settings-textarea--compact"
              />
            </Field>
            <div className="prevoyance-settings-source-card__actions">
              <button
                type="button"
                className="settings-action-btn"
                onClick={() =>
                  onChange({
                    ...sources,
                    noRefReason: undefined,
                    references: [...references, emptyReference()],
                  })
                }
              >
                Ajouter une référence
              </button>
              {references.length > 1 ? (
                <button
                  type="button"
                  className="settings-action-btn"
                  onClick={() =>
                    onChange({
                      ...sources,
                      references: references.filter(
                        (_, referenceIndex) => referenceIndex !== index,
                      ),
                    })
                  }
                >
                  Retirer
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {references.length === 0 ? (
        <Field label="Raison si aucune source">
          <textarea
            value={sources.noRefReason ?? ''}
            onChange={(event) =>
              onChange({ ...sources, noRefReason: event.target.value || undefined })
            }
            className="prevoyance-settings-textarea prevoyance-settings-textarea--compact"
          />
        </Field>
      ) : null}
      <Field label="Note admin globale">
        <textarea
          value={sources.noteAdmin ?? ''}
          onChange={(event) => onChange({ ...sources, noteAdmin: event.target.value || undefined })}
          className="prevoyance-settings-textarea prevoyance-settings-textarea--compact"
        />
      </Field>
    </section>
  );
}
