import { describe, expect, it } from 'vitest';
import {
  computeAnnuityConversion,
  type PerTransfertAnnuityOptions,
  type PerTransfertInsuredInput,
} from '../index';

const insured: PerTransfertInsuredInput = {
  sex: 'M',
  birthYear: 1960,
  currentAge: 60,
  liquidationAge: 64,
};

const options: PerTransfertAnnuityOptions = {
  mortalityTable: 'TGH05',
  technicalRate: 0,
  frequency: 12,
  paymentTiming: 'arrears',
  conversionFeeRate: 0,
  conversionFeeFixed: 0,
  arrearsFeeRate: 0,
  arrearsFeeFixedPerPayment: 0,
  reversion: {
    enabled: false,
    rate: 0,
    spouseSex: 'F',
    spouseBirthYear: 1962,
    spouseAgeAtLiquidation: 62,
    spouseMortalityTable: 'TGF05',
  },
  guaranteedAnnuities: { enabled: false, years: 0 },
  temporaryIncrease: { enabled: false, increaseRate: 0, years: 0 },
};

describe('computeAnnuityConversion', () => {
  it('baisse le capital net quand les frais de conversion augmentent', () => {
    const base = computeAnnuityConversion({ capitalGross: 100_000, insured, options });
    const withFee = computeAnnuityConversion({
      capitalGross: 100_000,
      insured,
      options: { ...options, conversionFeeRate: 0.03 },
    });

    expect(withFee.capitalNet).toBeLessThan(base.capitalNet);
  });

  it('baisse la rente nette quand les frais sur arrérages augmentent', () => {
    const base = computeAnnuityConversion({ capitalGross: 100_000, insured, options });
    const withFee = computeAnnuityConversion({
      capitalGross: 100_000,
      insured,
      options: { ...options, arrearsFeeRate: 0.03 },
    });

    expect(withFee.grossAnnualRent).toBeCloseTo(base.grossAnnualRent);
    expect(withFee.netAnnualRent).toBeLessThan(base.netAnnualRent);
  });

  it('augmente le facteur et baisse la rente brute avec réversion', () => {
    const base = computeAnnuityConversion({ capitalGross: 100_000, insured, options });
    const withReversion = computeAnnuityConversion({
      capitalGross: 100_000,
      insured,
      options: {
        ...options,
        reversion: { ...options.reversion, enabled: true, rate: 0.6 },
      },
    });

    expect(withReversion.annuityFactor).toBeGreaterThan(base.annuityFactor);
    expect(withReversion.grossAnnualRent).toBeLessThan(base.grossAnnualRent);
  });

  it('augmente le facteur avec annuités garanties', () => {
    const base = computeAnnuityConversion({ capitalGross: 100_000, insured, options });
    const guaranteed = computeAnnuityConversion({
      capitalGross: 100_000,
      insured,
      options: { ...options, guaranteedAnnuities: { enabled: true, years: 15 } },
    });

    expect(guaranteed.annuityFactor).toBeGreaterThan(base.annuityFactor);
  });
});
