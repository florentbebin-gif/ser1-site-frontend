import { CreditPeriodsTable } from './CreditPeriodsTable';
import { CreditScheduleTable } from './CreditScheduleTable';
import type { CreditCalcResult } from '../types';

interface CreditSchedulePanelsProps {
  calc: CreditCalcResult;
  startYM: string;
  isAnnual: boolean;
  isExpert: boolean;
}

function isDefinedRow<T>(row: T | null): row is T {
  return row !== null;
}

export function CreditSchedulePanels({
  calc,
  startYM,
  isAnnual,
  isExpert,
}: CreditSchedulePanelsProps) {
  return (
    <>
      <CreditPeriodsTable
        synthesePeriodes={calc.synthesePeriodes}
        hasPret3={calc.pret3Rows.length > 0}
      />

      <CreditScheduleTable
        rows={calc.agrRows}
        startYM={startYM}
        isAnnual={isAnnual}
        defaultCollapsed={true}
        hideInsurance={!isExpert}
      />

      {calc.hasPretsAdditionnels && (
        <>
          <CreditScheduleTable
            rows={calc.pret1Rows}
            startYM={startYM}
            isAnnual={isAnnual}
            title="Détail — Prêt 1"
            defaultCollapsed={true}
            hideInsurance={!isExpert}
          />
          {calc.pret2Rows.length > 0 && (
            <CreditScheduleTable
              rows={calc.pret2Rows.filter(isDefinedRow)}
              startYM={startYM}
              isAnnual={isAnnual}
              title="Détail — Prêt 2"
              defaultCollapsed={true}
              hideInsurance={!isExpert}
            />
          )}
          {calc.pret3Rows.length > 0 && (
            <CreditScheduleTable
              rows={calc.pret3Rows.filter(isDefinedRow)}
              startYM={startYM}
              isAnnual={isAnnual}
              title="Détail — Prêt 3"
              defaultCollapsed={true}
              hideInsurance={!isExpert}
            />
          )}
        </>
      )}
    </>
  );
}
