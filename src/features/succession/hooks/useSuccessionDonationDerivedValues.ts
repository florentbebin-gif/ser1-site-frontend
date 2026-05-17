import { useMemo } from 'react';
import type {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  SuccessionDonationEntry,
  SuccessionDonationPartageAct,
} from '../successionDraft';
import { buildDonationPartageFiscalLines } from '../successionDonationPartage';
import {
  getDonationEffectiveAmount,
  getTestamentParticularLegaciesTotal,
} from '../successionSimulator.helpers';

interface UseSuccessionDonationDerivedValuesInput {
  donationsContext: SuccessionDonationEntry[];
  donationPartageActs: SuccessionDonationPartageAct[];
  devolutionContext: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT;
}

export function useSuccessionDonationDerivedValues({
  donationsContext,
  donationPartageActs,
  devolutionContext,
}: UseSuccessionDonationDerivedValuesInput) {
  const donationPartageFiscalLines = useMemo(
    () => buildDonationPartageFiscalLines(donationPartageActs),
    [donationPartageActs],
  );
  const donationsFiscalContext = useMemo(
    () => [...donationsContext, ...donationPartageFiscalLines],
    [donationsContext, donationPartageFiscalLines],
  );
  const donationTotals = useMemo(
    () =>
      donationsFiscalContext.reduce(
        (totals, entry) => {
          const amount = getDonationEffectiveAmount(entry);
          if (entry.type === 'rapportable') totals.rapportable += amount;
          if (entry.type === 'hors_part') totals.horsPart += amount;
          if (entry.type === 'donation_partage') totals.partagees += amount;
          return totals;
        },
        {
          rapportable: 0,
          horsPart: 0,
          partagees: 0,
          legsParticuliers: getTestamentParticularLegaciesTotal(devolutionContext.testamentsBySide),
        },
      ),
    [donationsFiscalContext, devolutionContext.testamentsBySide],
  );

  return {
    donationPartageFiscalLines,
    donationsFiscalContext,
    donationTotals,
  };
}
