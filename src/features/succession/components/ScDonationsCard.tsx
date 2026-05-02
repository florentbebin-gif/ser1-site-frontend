import type { SuccessionDonationEntry } from '../successionDraft';
import { DONATION_TYPE_OPTIONS } from '../successionSimulator.constants';
import { fmt } from '../successionSimulator.helpers';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';

interface ScDonationsCardProps {
  donationsContext: SuccessionDonationEntry[];
  donationTotals: {
    rapportable: number;
    horsPart: number;
    partagees: number;
    legsParticuliers: number;
  };
  donateurOptions: { value: string; label: string }[];
  donatairesOptions: { value: string; label: string }[];
  onAddDonationEntry: () => void;
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
  donateurOptions,
  donatairesOptions,
  onAddDonationEntry,
  onUpdateDonationEntry,
  onRemoveDonationEntry,
}: ScDonationsCardProps) {
  return (
    <div className="premium-card sc-card sc-card--guide sim-card--guide">
      <header className="sc-card__header sim-card__header sim-card__header--bleed">
        <div className="sc-card__title-row sim-card__title sim-card__title-row">
          <div className="sim-card__icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      {donationsContext.length > 0 ? (
        <div className="sc-donations-list">
          {donationsContext.map((entry, idx) => {
            const donationTypeLabel = DONATION_TYPE_OPTIONS.find((option) => option.value === entry.type)?.label
              ?? 'Donation détaillée';

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
                    <label>Type</label>
                    <ScSelect
                      className="sc-donation-select"
                      value={entry.type}
                      onChange={(value) => onUpdateDonationEntry(entry.id, 'type', value)}
                      options={DONATION_TYPE_OPTIONS}
                    />
                    <p className="sc-hint sc-hint--compact">
                      Avance de part successorale : sera rapportée au partage entre héritiers.
                      Hors part successorale : s&apos;ajoute aux libéralités et peut entamer la réserve.
                    </p>
                  </div>
                  <div className="sc-field">
                    <label>Date</label>
                    <input
                      type="month"
                      className="sc-input-month"
                      value={entry.date ?? ''}
                      onChange={(e) => onUpdateDonationEntry(entry.id, 'date', e.target.value)}
                    />
                  </div>
                  <div className="sc-field">
                    <label>Donateur</label>
                    <ScSelect
                      className="sc-donation-select"
                      value={entry.donateur ?? ''}
                      onChange={(value) => onUpdateDonationEntry(entry.id, 'donateur', value)}
                      options={donateurOptions}
                    />
                  </div>
                  <div className="sc-field">
                    <label>Donataire</label>
                    <ScSelect
                      className="sc-donation-select"
                      value={entry.donataire ?? ''}
                      onChange={(value) => onUpdateDonationEntry(entry.id, 'donataire', value)}
                      options={donatairesOptions}
                    />
                  </div>
                  <div className="sc-field">
                    <label>Valeur à la donation (EUR)</label>
                    <ScNumericInput
                      value={entry.valeurDonation ?? entry.montant ?? 0}
                      min={0}
                      onChange={(val) => onUpdateDonationEntry(entry.id, 'valeurDonation', val)}
                    />
                  </div>
                  <div className="sc-field">
                    <label>Valeur actuelle (EUR)</label>
                    <ScNumericInput
                      value={entry.valeurActuelle || 0}
                      min={0}
                      onChange={(val) => onUpdateDonationEntry(entry.id, 'valeurActuelle', val)}
                    />
                  </div>
                  <div className="sc-field sc-field--span-2 sc-field--donation-toggles">
                    <div className="sc-donation-toggle-row" role="group" aria-label="Options de donation">
                      <button
                        type="button"
                        className={`sc-donation-toggle${entry.donSommeArgentExonere ? ' is-active' : ''}`}
                        onClick={() => onUpdateDonationEntry(entry.id, 'donSommeArgentExonere', !(entry.donSommeArgentExonere ?? false))}
                        aria-pressed={entry.donSommeArgentExonere ?? false}
                      >
                        Don de somme d&apos;argent exonéré
                      </button>
                      <button
                        type="button"
                        className={`sc-donation-toggle${entry.avecReserveUsufruit ? ' is-active' : ''}`}
                        onClick={() => onUpdateDonationEntry(entry.id, 'avecReserveUsufruit', !(entry.avecReserveUsufruit ?? false))}
                        aria-pressed={entry.avecReserveUsufruit ?? false}
                      >
                        Avec réserve d&apos;usufruit
                      </button>
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
        <button
          type="button"
          className="sc-child-add-btn"
          onClick={onAddDonationEntry}
        >
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
