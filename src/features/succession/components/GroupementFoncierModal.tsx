/**
 * GroupementFoncierModal - Saisie des groupements fonciers (GFA/GFV/GFF/GF)
 *
 * Art. 793 bis CGI : exoneration 75% DMTG <= 600 000 EUR / beneficiaire (LF 2025),
 * puis 50% au-dela.
 */

import { useState } from 'react';
import type {
  GroupementFoncierType,
  SuccessionAssetPocket,
  SuccessionGroupementFoncierEntry,
} from '../successionDraft';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';
import '../Succession.css';

const SEUIL_EXONERATION = 600_000;

const TYPE_OPTIONS: { value: GroupementFoncierType; label: string }[] = [
  { value: 'GFA', label: 'GFA (Groupement Foncier Agricole)' },
  { value: 'GFV', label: 'GFV (Groupement Foncier Viticole)' },
  { value: 'GFF', label: 'GFF (Groupement Foncier Forestier)' },
  { value: 'GF', label: 'GF (Groupement Forestier)' },
];

const DEFAULT_POCKET_OPTIONS: { value: SuccessionAssetPocket; label: string }[] = [
  { value: 'epoux1', label: 'Epoux 1' },
  { value: 'epoux2', label: 'Epoux 2' },
  { value: 'communaute', label: 'Communaute' },
];

function computeExoneration(valeur: number): { exonere: number; taxable: number } {
  if (valeur <= 0) return { exonere: 0, taxable: 0 };
  if (valeur <= SEUIL_EXONERATION) {
    const exonere = Math.round(valeur * 0.75);
    return { exonere, taxable: valeur - exonere };
  }
  const exonereTranche1 = Math.round(SEUIL_EXONERATION * 0.75);
  const exonereTranche2 = Math.round((valeur - SEUIL_EXONERATION) * 0.50);
  const exonere = exonereTranche1 + exonereTranche2;
  return { exonere, taxable: valeur - exonere };
}

interface GroupementFoncierModalProps {
  entries: SuccessionGroupementFoncierEntry[];
  ownerOptions: { value: SuccessionAssetPocket; label: string }[];
  onClose: () => void;
  onValidate: (_entries: SuccessionGroupementFoncierEntry[]) => void;
}

export function GroupementFoncierModal({
  entries: initialEntries,
  ownerOptions,
  onClose,
  onValidate,
}: GroupementFoncierModalProps) {
  const [draft, setDraft] = useState<SuccessionGroupementFoncierEntry[]>(
    initialEntries.length > 0 ? initialEntries.map((entry) => ({ ...entry })) : [],
  );

  const pocketOptions = ownerOptions.length > 0 ? ownerOptions : DEFAULT_POCKET_OPTIONS;

  const addEntry = () => {
    setDraft((prev) => [...prev, {
      id: `gf-${Date.now()}`,
      type: 'GFA' as GroupementFoncierType,
      valeurTotale: 0,
      pocket: pocketOptions[0].value,
    }]);
  };

  const updateEntry = (id: string, field: keyof SuccessionGroupementFoncierEntry, value: string | number) => {
    setDraft((prev) => prev.map((entry) => (
      entry.id === id ? { ...entry, [field]: value } : entry
    )));
  };

  const removeEntry = (id: string) => {
    setDraft((prev) => prev.filter((entry) => entry.id !== id));
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <div className="sc-modal-overlay" onClick={() => {}}>
      <div className="sc-modal sc-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="sc-modal__header">
          <h3 className="sc-modal__title">Groupements fonciers (art. 793 bis CGI)</h3>
          <button type="button" className="sc-member-modal__close" onClick={onClose}>x</button>
        </div>

        <div className="sc-modal__body">
          <p className="sc-hint" style={{ marginBottom: 16 }}>
            Les parts de GFA/GFV/GFF/GF beneficient d&apos;une exoneration de 75% des DMTG
            jusqu&apos;a 600 000 EUR par beneficiaire (LF 2025 art. 70), puis 50% au-dela.
          </p>

          {draft.length === 0 ? (
            <div className="vcm__empty">
              <p>Aucun groupement foncier declare.</p>
              <button type="button" className="sc-child-add-btn" onClick={addEntry}>
                + Ajouter un groupement
              </button>
            </div>
          ) : (
            <>
              {draft.map((entry) => {
                const { exonere, taxable } = computeExoneration(entry.valeurTotale);
                return (
                  <div key={entry.id} className="sc-asset-row" style={{ marginBottom: 16 }}>
                    <div className="sc-asset-row sc-asset-row--three-cols">
                      <div className="sc-field">
                        <label>Type</label>
                        <ScSelect
                          value={entry.type}
                          onChange={(value) => updateEntry(entry.id, 'type', value)}
                          options={TYPE_OPTIONS}
                        />
                      </div>
                      <div className="sc-field">
                        <label>Valeur totale (EUR)</label>
                        <ScNumericInput
                          value={entry.valeurTotale}
                          min={0}
                          onChange={(value) => updateEntry(entry.id, 'valeurTotale', value)}
                        />
                      </div>
                      <div className="sc-field">
                        <label>Masse de rattachement</label>
                        <ScSelect
                          value={entry.pocket}
                          onChange={(value) => updateEntry(entry.id, 'pocket', value)}
                          options={pocketOptions}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-c9)', marginTop: 6 }}>
                      <span>Exonere : {fmt(exonere)} EUR</span>
                      <span>Taxable : {fmt(taxable)} EUR</span>
                      <button type="button" className="sc-child-remove-btn" onClick={() => removeEntry(entry.id)} aria-label="Supprimer">x</button>
                    </div>
                  </div>
                );
              })}
              <button type="button" className="sc-child-add-btn" onClick={addEntry} style={{ marginTop: 8 }}>
                + Ajouter un groupement
              </button>
            </>
          )}
        </div>

        <div className="sc-modal__footer">
          <button type="button" className="sc-modal__btn sc-modal__btn--secondary" onClick={onClose}>Annuler</button>
          <button type="button" className="sc-modal__btn sc-modal__btn--primary" onClick={() => onValidate(draft)}>Valider</button>
        </div>
      </div>
    </div>
  );
}
