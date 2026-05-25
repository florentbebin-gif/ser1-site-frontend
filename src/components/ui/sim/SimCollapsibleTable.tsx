import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { SimDisclosureButton } from './SimDisclosureButton';

type LabelBuilder = (_title: string, _rowCount: number | null) => string;

export interface SimCollapsibleTableProps<Row> {
  title: string;
  rows?: Row[] | null;
  columns?: ReactNode[];
  renderRow?: (_row: Row, _index: number) => ReactElement;
  children?: ReactNode;
  rowCount?: number;
  rowCountLabel?: (_count: number) => string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (_open: boolean) => void;
  labelClosed?: string | LabelBuilder;
  labelOpen?: string | LabelBuilder;
  className?: string;
  toggleClassName?: string;
  tableClassName?: string;
  scrollClassName?: string;
  topScrollClassName?: string;
  panelClassName?: string;
  showTopScroll?: boolean;
  tableAriaLabel?: string;
  controlsId?: string;
  testId?: string;
  toggleTestId?: string;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function resolveLabel(
  label: string | LabelBuilder | undefined,
  fallbackVerb: 'Afficher' | 'Masquer',
  title: string,
  rowCount: number | null,
  rowCountLabel: (_count: number) => string,
) {
  if (typeof label === 'function') return label(title, rowCount);
  if (label) return label;

  const countSuffix = rowCount == null ? '' : ` (${rowCountLabel(rowCount)})`;
  return `${fallbackVerb} ${title}${countSuffix}`;
}

export function SimCollapsibleTable<Row>({
  title,
  rows,
  columns,
  renderRow,
  children,
  rowCount,
  rowCountLabel = (count) => `${count} lignes`,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  labelClosed,
  labelOpen,
  className,
  toggleClassName,
  tableClassName,
  scrollClassName,
  topScrollClassName,
  panelClassName,
  showTopScroll,
  tableAriaLabel,
  controlsId,
  testId,
  toggleTestId,
}: SimCollapsibleTableProps<Row>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const generatedPanelId = useId();
  const panelId = controlsId ?? generatedPanelId;
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const hasRows = Boolean(rows && rows.length > 0 && columns && renderRow);
  const shouldShowTopScroll = showTopScroll ?? hasRows;
  const resolvedRowCount = rowCount ?? rows?.length ?? null;

  useEffect(() => {
    if (!open || !shouldShowTopScroll) return;
    const wrap = scrollRef.current;
    const top = topRef.current;
    if (!wrap || !top) return;
    const spacer = top.firstElementChild as HTMLElement | null;
    if (spacer) spacer.style.width = `${wrap.scrollWidth}px`;

    const onTop = () => {
      wrap.scrollLeft = top.scrollLeft;
    };
    const onWrap = () => {
      top.scrollLeft = wrap.scrollLeft;
    };
    top.addEventListener('scroll', onTop);
    wrap.addEventListener('scroll', onWrap);
    return () => {
      top.removeEventListener('scroll', onTop);
      wrap.removeEventListener('scroll', onWrap);
    };
  }, [open, shouldShowTopScroll]);

  if (!children && !hasRows) return null;

  const handleToggle = () => {
    const next = !open;
    if (controlledOpen === undefined) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <div className={cx('sim-collapsible-table', className)} data-testid={testId}>
      <SimDisclosureButton
        expanded={open}
        onToggle={handleToggle}
        labelClosed={resolveLabel(labelClosed, 'Afficher', title, resolvedRowCount, rowCountLabel)}
        labelOpen={resolveLabel(labelOpen, 'Masquer', title, resolvedRowCount, rowCountLabel)}
        className={cx('sim-collapsible-table__toggle', toggleClassName)}
        controls={panelId}
        data-testid={toggleTestId}
      />

      {open && (
        <div id={panelId} className={cx('sim-collapsible-table__panel', panelClassName)}>
          {shouldShowTopScroll && (
            <div
              ref={topRef}
              className={cx('sim-collapsible-table__top-scroll', topScrollClassName)}
            >
              <div />
            </div>
          )}
          <div ref={scrollRef} className={cx('sim-collapsible-table__scroll', scrollClassName)}>
            {children ?? (
              <table
                className={cx('sim-collapsible-table__table', tableClassName)}
                aria-label={tableAriaLabel ?? title}
              >
                <thead>
                  <tr>
                    {columns?.map((column, index) => (
                      <th key={index}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{rows?.map((row, index) => renderRow?.(row, index))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
