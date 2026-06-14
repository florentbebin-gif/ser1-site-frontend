import React from 'react';
import { LegalRefLink } from '@/components/legal/LegalRefLink';
import { numberOrEmpty } from '@/components/settings/settingsHelpers';
import { formatDmtgAmount, formatDmtgYears } from './dmtgDisplay';
import { DONATION_SECTION_LEGAL_REFERENCE_IDS } from './dmtgLegalReferenceIds';

interface DonationSettings {
  rappelFiscalAnnees: number | null;
  donFamilial790G: {
    montant: number | null;
    conditions: string;
  };
}

interface DonationSectionProps {
  donation: DonationSettings;
  updateDonation: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
}

export default function DonationSection({
  donation,
  updateDonation,
  isAdmin,
}: DonationSectionProps): React.ReactElement {
  return (
    <section className="settings-memento-entry-section settings-dmtg-entry-section">
      <h6>Donation & rappel fiscal</h6>
      <p className="dmtg-intro">
        Paramètres de donation entre vifs et rappel fiscal (
        {DONATION_SECTION_LEGAL_REFERENCE_IDS.map((referenceId, index) => (
          <React.Fragment key={referenceId}>
            {index > 0 ? ', ' : null}
            <LegalRefLink id={referenceId} />
          </React.Fragment>
        ))}
        ).
      </p>

      <div className="income-tax-block dmtg-block--mb16">
        <div className="dmtg-block-title">Rappel fiscal</div>
        <div className="dmtg-indent">
          {isAdmin ? (
            <div className="settings-field-row">
              <label htmlFor="donation-rappel-fiscal-annees">Durée du rappel fiscal</label>
              <input
                id="donation-rappel-fiscal-annees"
                type="number"
                value={numberOrEmpty(donation.rappelFiscalAnnees)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  updateDonation(
                    ['rappelFiscalAnnees'],
                    event.target.value === '' ? null : Number(event.target.value),
                  )
                }
              />
              <span>ans</span>
            </div>
          ) : (
            <p className="dmtg-readonly-field">
              <strong>Durée du rappel fiscal</strong>
              <span>{formatDmtgYears(donation.rappelFiscalAnnees)}</span>
            </p>
          )}
        </div>
      </div>

      <div className="income-tax-block">
        <div className="dmtg-block-title">Don familial de sommes d'argent (art. 790 G)</div>
        <div className="dmtg-indent">
          {isAdmin ? (
            <>
              <div className="settings-field-row dmtg-field-row--mb8">
                <label htmlFor="donation-don-familial-montant">Montant exonéré</label>
                <input
                  id="donation-don-familial-montant"
                  type="number"
                  value={numberOrEmpty(donation.donFamilial790G.montant)}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateDonation(
                      ['donFamilial790G', 'montant'],
                      event.target.value === '' ? null : Number(event.target.value),
                    )
                  }
                />
                <span>EUR</span>
              </div>
              <div className="settings-field-row dmtg-field-row--conditions">
                <label htmlFor="donation-don-familial-conditions">Conditions</label>
                <input
                  id="donation-don-familial-conditions"
                  type="text"
                  className="dmtg-input-conditions"
                  value={donation.donFamilial790G.conditions}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateDonation(['donFamilial790G', 'conditions'], event.target.value)
                  }
                />
                <span />
              </div>
            </>
          ) : (
            <>
              <p className="dmtg-readonly-field">
                <strong>Montant exonéré</strong>
                <span>{formatDmtgAmount(donation.donFamilial790G.montant)}</span>
              </p>
              <p className="dmtg-desc--flush">{donation.donFamilial790G.conditions}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
