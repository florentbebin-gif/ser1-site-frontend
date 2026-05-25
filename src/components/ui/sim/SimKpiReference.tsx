import { useFiscalContext } from '@/hooks/useFiscalContext';
import {
  buildSimKpiReferenceLabel,
  type SimKpiReferenceKind,
} from '@/utils/fiscalKpiReferenceLabels';

export type { SimKpiReferenceKind };

export interface SimKpiReferenceProps {
  kind: SimKpiReferenceKind;
  className?: string;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimKpiReference({ kind, className }: SimKpiReferenceProps) {
  const { fiscalContext } = useFiscalContext({ strict: false });
  const text = buildSimKpiReferenceLabel(kind, fiscalContext);

  return <span className={cx('sim-kpi-reference', className)}>{text}</span>;
}
