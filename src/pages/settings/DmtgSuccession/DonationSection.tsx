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
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Parametres de donation entre vifs et rappel fiscal (CGI art. 784).
          </p>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div
              className="income-tax-block-title"
              style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}
            >
              Rappel fiscal
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row">
                <label>Duree du rappel fiscal</label>
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

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div
              className="income-tax-block-title"
              style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}
            >
              Don familial de sommes d'argent (art. 790 G)
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Montant exonere</label>
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
                  style={{ width: 280 }}
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
            <div
              className="income-tax-block-title"
              style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}
            >
              Don manuel
            </div>
            <div style={{ paddingLeft: 8 }}>
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
