import type { AllocationPocketInput } from '../../../../engine/tresorerie/types';
import { getAllocationPocketLabel } from '../../utils/tresorerieV2Migration';
import { fmtEuroInput } from '../../utils/tresorerieFormatters';
import {
  TresoTreasuryStackBar,
  type TresoTreasuryStackSegment,
} from './TresoTreasuryStackBar';

interface Props {
  treasuryInitial: number;
  protectedCash: number;
  availableCash: number;
  segments: TresoTreasuryStackSegment[];
  onEditPocket: (pocketId: string) => void;
}

export function buildTreasuryStackSegments(
  treasuryInitial: number,
  pockets: AllocationPocketInput[],
  totalInitialPct: number,
  protectedCash: number,
): TresoTreasuryStackSegment[] {
  const treasuryBase = Math.max(0, treasuryInitial);
  if (treasuryBase <= 0) {
    return [{
      key: 'bank-empty',
      label: 'Aucune trésorerie initiale',
      amount: 0,
      widthPct: 100,
      className: 'ts-treasury-stack__segment--bank',
    }];
  }

  if (pockets.length === 0) {
    return [{
      key: 'bank-only',
      label: 'Aucun placement, trésorerie sur compte bancaire',
      amount: treasuryBase,
      widthPct: 100,
      className: 'ts-treasury-stack__segment--bank',
    }];
  }

  const allocationScale = totalInitialPct > 100 ? 100 / totalInitialPct : 1;
  const pocketSegments = pockets
    .map(pocket => {
      const amount = treasuryBase * Math.max(0, pocket.initialAllocationPct) * allocationScale / 100;
      return {
        key: pocket.id,
        label: getAllocationPocketLabel(pocket),
        amount,
        widthPct: amount / treasuryBase * 100,
        className: `ts-treasury-stack__segment--${pocket.horizon ?? 'moyen_terme'}`,
        pocketId: pocket.id,
      };
    })
    .filter(segment => segment.amount > 0);
  const investedAmount = pocketSegments.reduce((sum, segment) => sum + segment.amount, 0);
  const bankAmount = Math.max(0, treasuryBase - investedAmount);
  const protectedBankAmount = Math.min(bankAmount, Math.max(0, protectedCash));
  const freeBankAmount = Math.max(0, bankAmount - protectedBankAmount);
  const bankSegments = [
    freeBankAmount > 0
      ? {
        key: 'bank-free',
        label: 'Compte bancaire libre',
        amount: freeBankAmount,
        widthPct: freeBankAmount / treasuryBase * 100,
        className: 'ts-treasury-stack__segment--bank',
      }
      : null,
    protectedBankAmount > 0
      ? {
        key: 'bank-protected',
        label: 'Solde minimum + BFR',
        amount: protectedBankAmount,
        widthPct: protectedBankAmount / treasuryBase * 100,
        className: 'ts-treasury-stack__segment--protected',
      }
      : null,
  ].filter((segment): segment is TresoTreasuryStackSegment => segment !== null);

  const segments = [...bankSegments, ...pocketSegments];
  return segments.length > 0 ? segments : [{
    key: 'bank-fallback',
    label: 'Trésorerie sur compte bancaire',
    amount: treasuryBase,
    widthPct: 100,
    className: 'ts-treasury-stack__segment--bank',
  }];
}

export function TresoPlacementOverview({
  treasuryInitial,
  protectedCash,
  availableCash,
  segments,
  onEditPocket,
}: Props) {
  return (
    <div className="ts-placement-overview">
      <div className="ts-placement-overview__kpis" aria-label="Indicateurs de trésorerie">
        <span>
          <small>Trésorerie initiale</small>
          <strong>{fmtEuroInput(treasuryInitial)} €</strong>
        </span>
        <span>
          <small>Banque protégée</small>
          <strong>{fmtEuroInput(protectedCash)} €</strong>
        </span>
        <span>
          <small>Disponible sur compte bancaire</small>
          <strong>{fmtEuroInput(availableCash)} €</strong>
        </span>
      </div>
      <TresoTreasuryStackBar segments={segments} onEditPocket={onEditPocket} />
    </div>
  );
}
