import { useState } from 'react';
import { SimModalShell } from '@/components/ui/sim';
import { PREVOYANCE_MAX_ARRET_DURATION_DAYS } from '@/domain/prevoyance/helpers';
import type { PrevoyanceArretPalierDraft } from '@/domain/prevoyance/types';
import { NumberInput, SimFieldShell } from './FormPrimitives';

interface ArretPeriodsModalProps {
  paliers: PrevoyanceArretPalierDraft[];
  onClose: () => void;
  onApply: (paliers: PrevoyanceArretPalierDraft[]) => void;
}

function sortPaliers(paliers: PrevoyanceArretPalierDraft[]) {
  return [...paliers].sort((a, b) => a.fromDay - b.fromDay || a.toDay - b.toDay);
}

function validatePaliers(paliers: PrevoyanceArretPalierDraft[]): string {
  const sorted = sortPaliers(paliers);
  if (sorted.length === 0) return 'Ajoutez au moins une période.';
  if (sorted[0]?.fromDay !== 0) return 'La première période doit commencer à 0 jour.';
  if (sorted[sorted.length - 1]?.toDay !== PREVOYANCE_MAX_ARRET_DURATION_DAYS) {
    return `La dernière période doit finir à ${PREVOYANCE_MAX_ARRET_DURATION_DAYS} jours.`;
  }

  for (let index = 0; index < sorted.length; index += 1) {
    const palier = sorted[index];
    if (!palier) continue;
    if (palier.toDay < palier.fromDay) return 'Une période finit avant son début.';
    const next = sorted[index + 1];
    if (next && next.fromDay !== palier.toDay + 1) {
      return 'Les périodes doivent être contiguës, sans trou ni chevauchement.';
    }
  }
  return '';
}

export function ArretPeriodsModal({ paliers, onClose, onApply }: ArretPeriodsModalProps) {
  const [draft, setDraft] = useState(() => sortPaliers(paliers));
  const [error, setError] = useState('');

  const updatePalier = (index: number, patch: Partial<PrevoyanceArretPalierDraft>) => {
    setDraft((prev) =>
      prev.map((palier, currentIndex) =>
        currentIndex === index ? { ...palier, ...patch } : palier,
      ),
    );
  };

  const splitLastPalier = () => {
    setDraft((prev) => {
      const sorted = sortPaliers(prev);
      const last = sorted[sorted.length - 1];
      if (!last || last.fromDay >= last.toDay) return sorted;
      const splitDay = Math.floor((last.fromDay + last.toDay) / 2);
      return [
        ...sorted.slice(0, -1),
        { ...last, toDay: splitDay },
        { fromDay: splitDay + 1, toDay: last.toDay, amount: last.amount },
      ];
    });
  };

  const removePalier = (index: number) => {
    setDraft((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const apply = () => {
    const sorted = sortPaliers(draft);
    const nextError = validatePaliers(sorted);
    if (nextError) {
      setError(nextError);
      return;
    }
    onApply(sorted);
    onClose();
  };

  return (
    <SimModalShell
      title="Découper l’arrêt de travail"
      subtitle="Les périodes doivent couvrir toute la durée de 0 à 1095 jours."
      onClose={onClose}
      modalClassName="prevoyance-periods-modal"
      footer={
        <>
          {error ? <span className="prevoyance-modal-error">{error}</span> : <span />}
          <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={apply}>
            Valider
          </button>
        </>
      }
    >
      <div className="prevoyance-periods-modal__toolbar">
        <button type="button" className="prevoyance-add-button" onClick={splitLastPalier}>
          + Ajouter une période
        </button>
      </div>
      <div className="prevoyance-periods-modal__list">
        {draft.map((palier, index) => (
          <div key={`${index}-${palier.fromDay}-${palier.toDay}`} className="prevoyance-period-row">
            <SimFieldShell label="Début">
              <NumberInput
                value={palier.fromDay}
                onChange={(fromDay) => updatePalier(index, { fromDay })}
                suffix="j"
              />
            </SimFieldShell>
            <SimFieldShell label="Fin">
              <NumberInput
                value={palier.toDay}
                onChange={(toDay) => updatePalier(index, { toDay })}
                suffix="j"
              />
            </SimFieldShell>
            <SimFieldShell label="Montant">
              <NumberInput
                value={palier.amount}
                onChange={(amount) => updatePalier(index, { amount })}
                suffix="€/j"
              />
            </SimFieldShell>
            <button
              type="button"
              className="prevoyance-icon-button"
              onClick={() => removePalier(index)}
              aria-label={`Supprimer la période ${index + 1}`}
              disabled={draft.length === 1}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <p className="prevoyance-side-note">Cliquez × pour retirer une période.</p>
    </SimModalShell>
  );
}
