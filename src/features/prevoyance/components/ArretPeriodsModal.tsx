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

function clampDay(value: number): number {
  return Math.min(PREVOYANCE_MAX_ARRET_DURATION_DAYS, Math.max(0, Math.round(value || 0)));
}

export function ArretPeriodsModal({ paliers, onClose, onApply }: ArretPeriodsModalProps) {
  const [draft, setDraft] = useState(() => sortPaliers(paliers));
  const [error, setError] = useState('');

  const updatePalier = (index: number, patch: Partial<PrevoyanceArretPalierDraft>) => {
    setDraft((prev) => {
      const next = prev.map((palier) => ({ ...palier }));
      const current = next[index];
      if (!current) return prev;

      if (patch.amount !== undefined) {
        current.amount = patch.amount;
      }

      if (patch.fromDay !== undefined) {
        const previous = next[index - 1];
        const minFromDay = previous ? previous.fromDay + 1 : 0;
        const fromDay =
          index === 0 ? 0 : Math.min(Math.max(clampDay(patch.fromDay), minFromDay), current.toDay);
        current.fromDay = fromDay;
        if (previous) previous.toDay = fromDay - 1;
      }

      if (patch.toDay !== undefined) {
        const following = next[index + 1];
        const maxToDay = following ? following.toDay - 1 : PREVOYANCE_MAX_ARRET_DURATION_DAYS;
        const toDay =
          index === next.length - 1
            ? PREVOYANCE_MAX_ARRET_DURATION_DAYS
            : Math.max(current.fromDay, Math.min(clampDay(patch.toDay), maxToDay));
        current.toDay = toDay;
        if (following) following.fromDay = toDay + 1;
      }

      return next;
    });
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
    setDraft((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.map((palier) => ({ ...palier }));
      const removed = next[index];
      if (!removed) return prev;
      next.splice(index, 1);

      if (index === 0 && next[0]) {
        next[0].fromDay = 0;
      } else if (index >= next.length) {
        const last = next[next.length - 1];
        if (last) last.toDay = PREVOYANCE_MAX_ARRET_DURATION_DAYS;
      } else {
        const previous = next[index - 1];
        if (previous) previous.toDay = removed.toDay;
      }

      return next;
    });
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
        <button
          type="button"
          className="sim-modal-btn sim-modal-btn--ghost prevoyance-periods-modal__add"
          onClick={splitLastPalier}
        >
          + Ajouter une période
        </button>
      </div>
      <p className="prevoyance-periods-modal__hint">
        Ajuster un début recale la période précédente ; ajuster une fin recale la période suivante.
      </p>
      <div className="prevoyance-periods-modal__list">
        {draft.map((palier, index) => (
          <div key={index} className="prevoyance-period-row">
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
