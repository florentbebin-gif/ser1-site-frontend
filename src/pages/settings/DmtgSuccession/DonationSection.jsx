import React from 'react';
import { numberOrEmpty } from '@/utils/settingsHelpers.js';

export default function DonationSection({
  donation,
  updateDonation,
  isAdmin,
  openSection,
  setOpenSection,
}) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={openSection === 'donation'}
        onClick={() => setOpenSection(openSection === 'donation' ? null : 'donation')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Donation & rappel fiscal
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'donation' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'donation' && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Paramètres de donation entre vifs et rappel fiscal (CGI art. 784).
          </p>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Rappel fiscal
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row">
                <label>Durée du rappel fiscal</label>
                <input
                  type="number"
                  value={numberOrEmpty(donation.rappelFiscalAnnees)}
                  onChange={(e) =>
                    updateDonation(
                      ['rappelFiscalAnnees'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>ans</span>
              </div>
            </div>
          </div>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Don familial de sommes d'argent (art. 790 G)
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Montant exonéré</label>
                <input
                  type="number"
                  value={numberOrEmpty(donation.donFamilial790G?.montant)}
                  onChange={(e) =>
                    updateDonation(
                      ['donFamilial790G', 'montant'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Conditions</label>
                <input
                  type="text"
                  style={{ width: 280 }}
                  value={donation.donFamilial790G?.conditions || ''}
                  onChange={(e) =>
                    updateDonation(['donFamilial790G', 'conditions'], e.target.value)
                  }
                  disabled={!isAdmin}
                />
                <span />
              </div>
            </div>
          </div>

          <div className="income-tax-block">
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Don manuel
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row">
                <label>Renouvellement abattement tous les</label>
                <input
                  type="number"
                  value={numberOrEmpty(donation.donManuel?.abattementRenouvellement)}
                  onChange={(e) =>
                    updateDonation(
                      ['donManuel', 'abattementRenouvellement'],
                      e.target.value === '' ? null : Number(e.target.value)
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
