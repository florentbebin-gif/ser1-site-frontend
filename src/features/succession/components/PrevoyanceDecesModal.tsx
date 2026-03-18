/**
 * PrevoyanceDecesModal — Saisie des contrats de prévoyance décès
 *
 * Le capital est transmis selon la clause bénéficiaire (hors succession civile).
 * Seule la dernière prime d'assurance entre dans le seuil de 152 500 €
 * (art. 990 I CGI — même régime que l'assurance-vie).
 */

import { useState } from 'react';
import type { SuccessionPrevoyanceDecesEntry } from '../successionDraft';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';
import '../Succession.css';

interface PrevoyanceDecesModalProps {
  entries: SuccessionPrevoyanceDecesEntry[];
  ownerOptions: { value: 'epoux1' | 'epoux2'; label: string }[];
  onClose: () => void;
  onValidate: (_entries: SuccessionPrevoyanceDecesEntry[]) => void;
}

export function PrevoyanceDecesModal({
  entries: initialEntries,
  ownerOptions,
  onClose,
  onValidate,
}: PrevoyanceDecesModalProps) {
  const [draft, setDraft] = useState<SuccessionPrevoyanceDecesEntry[]>(
    initialEntries.length > 0 ? initialEntries.map((e) => ({ ...e })) : [],
  );

  const partyOptions = ownerOptions.length > 0 ? ownerOptions : [
    { value: 'epoux1' as const, label: 'Époux 1' },
    { value: 'epoux2' as const, label: 'Époux 2' },
  ];

  const addEntry = () => {
    setDraft((prev) => [...prev, {
      id: `prev-${Date.now()}`,
      souscripteur: partyOptions[0].value,
      assure: partyOptions[0].value,
      capitalDeces: 0,
      dernierePrime: 0,
    }]);
  };

  const updateEntry = (id: string, field: keyof SuccessionPrevoyanceDecesEntry, value: string | number) => {
    setDraft((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEntry = (id: string) => {
    setDraft((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="sc-modal-overlay" onClick={() => {}}>
      <div className="sc-modal sc-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="sc-modal__header">
          <h3 className="sc-modal__title">Contrats de prévoyance décès</h3>
          <button type="button" className="sc-member-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="sc-modal__body">
          <p className="sc-hint" style={{ marginBottom: 16 }}>
            Le capital décès est transmis selon la clause bénéficiaire (hors succession civile).
            Seule la dernière prime d&apos;assurance entre dans le seuil de 152 500 € (art. 990 I CGI).
          </p>

          {draft.length === 0 ? (
            <div className="vcm__empty">
              <p>Aucun contrat de prévoyance décès déclaré.</p>
              <button type="button" className="sc-child-add-btn" onClick={addEntry}>
                + Ajouter un contrat
              </button>
            </div>
          ) : (
            <>
              {draft.map((entry) => (
                <div key={entry.id} className="sc-asset-row" style={{ marginBottom: 16 }}>
                  <div className="sc-asset-row sc-asset-row--three-cols">
                    <div className="sc-field">
                      <label>Souscripteur</label>
                      <ScSelect
                        value={entry.souscripteur}
                        onChange={(v) => updateEntry(entry.id, 'souscripteur', v)}
                        options={partyOptions}
                      />
                    </div>
                    <div className="sc-field">
                      <label>Assuré</label>
                      <ScSelect
                        value={entry.assure}
                        onChange={(v) => updateEntry(entry.id, 'assure', v)}
                        options={partyOptions}
                      />
                    </div>
                    <div className="sc-field">
                      <label>Capital décès (€)</label>
                      <ScNumericInput
                        value={entry.capitalDeces}
                        min={0}
                        onChange={(v) => updateEntry(entry.id, 'capitalDeces', v)}
                      />
                    </div>
                  </div>
                  <div className="sc-asset-row sc-asset-row--three-cols" style={{ marginTop: 8 }}>
                    <div className="sc-field">
                      <label>Dernière prime (€)</label>
                      <ScNumericInput
                        value={entry.dernierePrime}
                        min={0}
                        onChange={(v) => updateEntry(entry.id, 'dernierePrime', v)}
                      />
                    </div>
                    <div className="sc-field">
                      <label>Clause bénéficiaire</label>
                      <input
                        type="text"
                        value={entry.clauseBeneficiaire ?? ''}
                        onChange={(e) => updateEntry(entry.id, 'clauseBeneficiaire', e.target.value)}
                        placeholder="Conjoint + enfants par parts égales"
                      />
                    </div>
                    <div className="sc-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button type="button" className="sc-child-remove-btn" onClick={() => removeEntry(entry.id)} aria-label="Supprimer">✕</button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="sc-child-add-btn" onClick={addEntry} style={{ marginTop: 8 }}>
                + Ajouter un contrat
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
