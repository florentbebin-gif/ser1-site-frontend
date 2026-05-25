import { SimAmountInputEuro } from '@/components/ui/sim';
import type { SuccessionDonationEntry, SuccessionDonationPartageAct } from '../successionDraft';
import { summarizeDonationPartageActs } from '../successionDonationPartage';
import { DONATION_TYPE_OPTIONS } from '../successionSimulator.constants';
import { fmt } from '../successionSimulator.helpers';
import { ScSelect } from './ScSelect';

interface ScDonationsCardProps {
  donationsContext: SuccessionDonationEntry[];
  donationTotals: {
    rapportable: number;
    horsPart: number;
    partagees: number;
    legsParticuliers: number;
  };
  donationPartageActs: SuccessionDonationPartageAct[];
  donateurOptions: { value: string; label: string }[];
  donatairesOptions: { value: string; label: string }[];
  canUseUsufruitSuccessif: boolean;
  onAddDonationEntry: () => void;
  onOpenDonationPartageAct: (_id: string) => void;
  onOpenDonationPartageFromEntry: (_id: string) => void;
  onRemoveDonationPartageAct: (_id: string) => void;
  onUpdateDonationEntry: (
    _id: string,
    _field: keyof SuccessionDonationEntry,
    _value: string | number | boolean,
  ) => void;
  onRemoveDonationEntry: (_id: string) => void;
}

export default function ScDonationsCard({
  donationsContext,
  donationTotals,
  donationPartageActs,
  donateurOptions,
  donatairesOptions,
  canUseUsufruitSuccessif,
  onAddDonationEntry,
  onOpenDonationPartageAct,
  onOpenDonationPartageFromEntry,
  onRemoveDonationPartageAct,
  onUpdateDonationEntry,
  onRemoveDonationEntry,
}: ScDonationsCardProps) {
  return (
    <div className="premium-card sc-card sc-card--guide sim-card--guide">
      <header className="sc-card__header sim-card__header sim-card__header--bleed">
        <div className="sc-card__title-row sim-card__title sim-card__title-row">
          <div className="sim-card__icon">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <h2 className="sc-card__title">Donations</h2>
        </div>
      </header>
      <div className="sc-card__divider sc-card__divider--tight sim-divider sim-divider--tight" />
      {donationPartageActs.length > 0 && (
        <div className="sc-donations-list sc-donations-list--partage">
          {donationPartageActs.map((act, idx) => (
            <div key={act.id} className="sc-donation-card sc-donation-card--partage">
              <div className="sc-donation-card__header">
                <div className="sc-donation-card__heading">
                  <strong className="sc-donation-card__title">Donation-partage {idx + 1}</strong>
                  <span className="sc-donation-card__subtitle">
                    {summarizeDonationPartageActs([act]) ?? 'Acte à compléter'}
                  </span>
                </div>
                <div className="sc-donation-card__actions">
                  <button
                    type="button"
                    className="sc-child-add-btn"
                    onClick={() => onOpenDonationPartageAct(act.id)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="sc-remove-btn sc-remove-btn--quiet"
                    onClick={() => onRemoveDonationPartageAct(act.id)}
                    title="Supprimer cette donation-partage"
                    aria-label="Supprimer cette donation-partage"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {donationsContext.length > 0 ? (
        <div className="sc-donations-list">
          {donationsContext.map((entry, idx) => {
            const donationTypeLabel =
              DONATION_TYPE_OPTIONS.find((option) => option.value === entry.type)?.label ??
              'Donation détaillée';

            return (
              <div key={entry.id} className="sc-donation-card">
                <div className="sc-donation-card__header">
                  <div className="sc-donation-card__heading">
                    <strong className="sc-donation-card__title">Donation {idx + 1}</strong>
                    <span className="sc-donation-card__subtitle">{donationTypeLabel}</span>
                  </div>
                  <button
                    type="button"
                    className="sc-remove-btn sc-remove-btn--quiet"
                    onClick={() => onRemoveDonationEntry(entry.id)}
                    title="Supprimer cette donation"
                    aria-label="Supprimer cette donation"
                  >
                    ×
                  </button>
                </div>
                <div className="sc-donation-grid">
                  <div className="sc-field sc-field--span-2">
                    <label htmlFor={`sc-donation-type-${entry.id}`}>Type</label>
                    <ScSelect
                      id={`sc-donation-type-${entry.id}`}
                      className="sc-donation-select"
                      value={entry.type}
                      onChange={(value) => {
                        if (value === 'donation_partage') {
                          onOpenDonationPartageFromEntry(entry.id);
                          return;
                        }
                        onUpdateDonationEntry(entry.id, 'type', value);
                      }}
                      options={DONATION_TYPE_OPTIONS}
                    />
                    <p className="sc-hint sc-hint--compact">
                      Avance de part successorale : sera rapportée au partage entre héritiers. Hors
                      part successorale : s&apos;ajoute aux libéralités et peut entamer la réserve.
                    </p>
                  </div>
                  <div className="sc-field">
                    <label htmlFor={`sc-donation-date-${entry.id}`}>Date</label>
                    <input
                      id={`sc-donation-date-${entry.id}`}
                      type="month"
                      className="sc-input-month"
                      value={entry.date ?? ''}
                      onChange={(e) => onUpdateDonationEntry(entry.id, 'date', e.target.value)}
                    />
                  </div>
                  <div className="sc-field">
                    <label htmlFor={`sc-donation-donateur-${entry.id}`}>Donateur</label>
                    <ScSelect
                      id={`sc-donation-donateur-${entry.id}`}
                      className="sc-donation-select"
                      value={entry.donateur ?? ''}
                      onChange={(value) => onUpdateDonationEntry(entry.id, 'donateur', value)}
                      options={donateurOptions}
                    />
                  </div>
                  <div className="sc-field">
                    <label htmlFor={`sc-donation-donataire-${entry.id}`}>Donataire</label>
                    <ScSelect
                      id={`sc-donation-donataire-${entry.id}`}
                      className="sc-donation-select"
                      value={entry.donataire ?? ''}
                      onChange={(value) => onUpdateDonationEntry(entry.id, 'donataire', value)}
                      options={donatairesOptions}
                    />
                  </div>
                  <div className="sc-field">
                    <label htmlFor={`sc-donation-valeur-${entry.id}`}>Valeur à la donation</label>
                    <SimAmountInputEuro
                      id={`sc-donation-valeur-${entry.id}`}
                      value={entry.valeurDonation ?? entry.montant ?? 0}
                      min={0}
                      onChange={(val) => onUpdateDonationEntry(entry.id, 'valeurDonation', val)}
                    />
                  </div>
                  <div className="sc-field">
                    <label htmlFor={`sc-donation-valeur-actuelle-${entry.id}`}>
                      Valeur actuelle
                    </label>
                    <SimAmountInputEuro
                      id={`sc-donation-valeur-actuelle-${entry.id}`}
                      value={entry.valeurActuelle || 0}
                      min={0}
                      onChange={(val) => onUpdateDonationEntry(entry.id, 'valeurActuelle', val)}
                    />
                  </div>
                  <div className="sc-field sc-field--span-2 sc-field--donation-toggles">
                    <div
                      className="sc-donation-checkbox-row"
                      role="group"
                      aria-label="Options de donation"
                    >
                      <label className="sc-checkbox-label sc-checkbox-label--compact">
                        <input
                          type="checkbox"
                          checked={entry.donSommeArgentExonere ?? false}
                          disabled={entry.avecReserveUsufruit ?? false}
                          onChange={(e) =>
                            onUpdateDonationEntry(
                              entry.id,
                              'donSommeArgentExonere',
                              e.target.checked,
                            )
                          }
                        />
                        Don 790 G
                      </label>
                      <label className="sc-checkbox-label sc-checkbox-label--compact">
                        <input
                          type="checkbox"
                          checked={entry.avecReserveUsufruit ?? false}
                          disabled={entry.donSommeArgentExonere ?? false}
                          onChange={(e) =>
                            onUpdateDonationEntry(entry.id, 'avecReserveUsufruit', e.target.checked)
                          }
                        />
                        Réserve d&apos;usufruit
                      </label>
                      <label className="sc-checkbox-label sc-checkbox-label--compact">
                        <input
                          type="checkbox"
                          checked={entry.usufruitSuccessif ?? false}
                          disabled={!entry.avecReserveUsufruit || !canUseUsufruitSuccessif}
                          onChange={(e) =>
                            onUpdateDonationEntry(entry.id, 'usufruitSuccessif', e.target.checked)
                          }
                        />
                        Usufruit successif
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="sc-hint sc-hint--compact">Aucune donation détaillée pour l&apos;instant.</p>
      )}

      <div className="sc-inline-actions">
        <button type="button" className="sc-child-add-btn" onClick={onAddDonationEntry}>
          + Ajouter une donation
        </button>
      </div>

      <div className="sc-donations-totals">
        <div className="sc-summary-row">
          <span>Donations rapportables</span>
          <strong>{fmt(donationTotals.rapportable)}</strong>
        </div>
        <div className="sc-summary-row">
          <span>Donations hors part</span>
          <strong>{fmt(donationTotals.horsPart)}</strong>
        </div>
        {donationTotals.partagees > 0 && (
          <div className="sc-summary-row">
            <span>Donations-partage</span>
            <strong>{fmt(donationTotals.partagees)}</strong>
          </div>
        )}
        <div className="sc-summary-row">
          <span>Legs particuliers</span>
          <strong>{fmt(donationTotals.legsParticuliers)}</strong>
        </div>
      </div>
    </div>
  );
}
