import React from 'react';
import { LegalRefLink } from '@/components/legal/LegalRefLink';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import { numberOrEmpty } from '@/components/settings/settingsHelpers';
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
        className="fisc-acc-header fisc-acc-header--with-icon"
        aria-expanded={isOpen}
        onClick={() => setOpenSection(isOpen ? null : 'donation')}
      >
        <SettingsTitleWithIcon
          icon="gift"
          className="settings-premium-title settings-premium-title--flush"
        >
          Donation & rappel fiscal
        </SettingsTitleWithIcon>
        <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p className="dmtg-intro">
            Paramètres de donation entre vifs et rappel fiscal (
            <LegalRefLink id={DONATION_SECTION_LEGAL_REFERENCE_IDS[0]} />
            ).
          </p>

          <div className="income-tax-block dmtg-block--mb16">
            <div className="dmtg-block-title">Rappel fiscal</div>
            <div className="dmtg-indent">
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
                  disabled={!isAdmin}
                />
                <span>ans</span>
              </div>
            </div>
          </div>

          <div className="income-tax-block">
            <div className="dmtg-block-title">Don familial de sommes d'argent (art. 790 G)</div>
            <div className="dmtg-indent">
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
                  disabled={!isAdmin}
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
                  disabled={!isAdmin}
                />
                <span />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
