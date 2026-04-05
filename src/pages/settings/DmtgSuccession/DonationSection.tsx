import React from 'react';
import { numberOrEmpty } from '@/components/settings/settingsHelpers';

interface DonationSettings {
  rappelFiscalAnnees: number | null;
  donFamilial790G: {
    montant: number | null;
    conditions: string;
  };
  donManuel: {
    abattementRenouvellement: number | null;
  };
}

interface DonationSectionProps {
  donation: DonationSettings;
  updateDonation: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function DonationSection({
  donation,
  updateDonation,
  isAdmin,
  openSection,
  setOpenSection,
}: DonationSectionProps): React.ReactElement {
  const isOpen = openSection === 'donation';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={isOpen}
        onClick={() => setOpenSection(isOpen ? null : 'donation')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Donation & rappel fiscal
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p className="dmtg-intro">
            Paramètres de donation entre vifs et rappel fiscal (CGI art. 784).
          </p>

          <div className="income-tax-block dmtg-block--mb16">
            <div className="dmtg-block-title">
              Rappel fiscal
            </div>
            <div className="dmtg-indent">
              <div className="settings-field-row">
                <label>Durée du rappel fiscal</label>
                <input
                  type="number"
                  value={numberOrEmpty(donation.rappelFiscalAnnees)}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateDonation(
                      ['rappelFiscalAnnees'],
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>ans</span>
              </div>
            </div>
          </div>

          <div className="income-tax-block dmtg-block--mb16">
            <div className="dmtg-block-title">
              Don familial de sommes d’argent (art. 790 G)
            </div>
            <div className="dmtg-indent">
              <div className="settings-field-row dmtg-field-row--mb8">
                <label>Montant exonéré</label>
                <input
                  type="number"
                  value={numberOrEmpty(donation.donFamilial790G.montant)}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateDonation(
                      ['donFamilial790G', 'montant'],
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>EUR</span>
              </div>
              <div className="settings-field-row">
                <label>Conditions</label>
                <input
                  type="text"
                  className="dmtg-input-conditions"
                  value={donation.donFamilial790G.conditions}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateDonation(['donFamilial790G', 'conditions'], event.target.value)
                  }
                  disabled={!isAdmin}
                />
                <span />
              </div>
            </div>
          </div>

          <div className="income-tax-block">
            <div className="dmtg-block-title">
              Don manuel
            </div>
            <div className="dmtg-indent">
              <div className="settings-field-row">
                <label>Renouvellement abattement tous les</label>
                <input
                  type="number"
                  value={numberOrEmpty(donation.donManuel.abattementRenouvellement)}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateDonation(
                      ['donManuel', 'abattementRenouvellement'],
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>ans</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
