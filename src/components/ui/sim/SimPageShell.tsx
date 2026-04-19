import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

type SimPageShellSlotName = 'main' | 'side' | 'section';

interface SimPageShellSharedSlotProps {
  children: ReactNode;
  className?: string;
}

interface SimPageShellSideProps extends SimPageShellSharedSlotProps {
  sticky?: boolean;
}

interface SimPageShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  nav?: ReactNode;
  notice?: ReactNode;
  controls?: ReactNode;
  loading?: boolean;
  loadingContent?: ReactNode;
  error?: string | null;
  errorContent?: ReactNode;
  pageClassName?: string;
  pageTestId?: string;
  headerTestId?: string;
  titleTestId?: string;
  statusTestId?: string;
  mobileSideFirst?: boolean;
  children?: ReactNode;
}

interface SimPageShellSlotComponent<P extends SimPageShellSharedSlotProps> {
  (props: P): ReactElement | null;
  simPageShellSlot: SimPageShellSlotName;
  displayName: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function createSlot<P extends SimPageShellSharedSlotProps>(
  slotName: SimPageShellSlotName,
  displayName: string,
) {
  const Slot = ({ children }: P) => <>{children}</>;
  const typedSlot = Slot as SimPageShellSlotComponent<P>;
  typedSlot.simPageShellSlot = slotName;
  typedSlot.displayName = displayName;
  return typedSlot;
}

const SimPageShellMain = createSlot<SimPageShellSharedSlotProps>('main', 'SimPageShell.Main');
const SimPageShellSide = createSlot<SimPageShellSideProps>('side', 'SimPageShell.Side');
const SimPageShellSection = createSlot<SimPageShellSharedSlotProps>('section', 'SimPageShell.Section');

function isSlotElement<P extends SimPageShellSharedSlotProps>(
  node: ReactNode,
  slotName: SimPageShellSlotName,
): node is ReactElement<P> {
  if (!isValidElement<P>(node)) {
    return false;
  }

  const elementType = node.type as { simPageShellSlot?: SimPageShellSlotName };
  return elementType.simPageShellSlot === slotName;
}

interface SimPageShellSectionSlot extends SimPageShellSharedSlotProps {
  key: ReactElement['key'];
}

function collectSlots(children: ReactNode): {
  main: SimPageShellSharedSlotProps | null;
  side: SimPageShellSideProps | null;
  sections: SimPageShellSectionSlot[];
} {
  let main: SimPageShellSharedSlotProps | null = null;
  let side: SimPageShellSideProps | null = null;
  const sections: SimPageShellSectionSlot[] = [];

  Children.forEach(children, (child) => {
    if (isSlotElement<SimPageShellSharedSlotProps>(child, 'main')) {
      main = child.props;
      return;
    }

    if (isSlotElement<SimPageShellSideProps>(child, 'side')) {
      side = child.props;
      return;
    }

    if (isSlotElement<SimPageShellSharedSlotProps>(child, 'section')) {
      sections.push({
        ...child.props,
        key: child.key,
      });
    }
  });

  return { main, side, sections };
}

function renderStatusBlock(
  content: ReactNode,
  statusTestId: string | undefined,
  className?: string,
) {
  return (
    <div className={joinClasses('premium-card', 'sim-state-card', className)} data-testid={statusTestId}>
      {content}
    </div>
  );
}

function SimPageShellRoot({
  title,
  subtitle,
  actions,
  nav,
  notice,
  controls,
  loading = false,
  loadingContent,
  error,
  errorContent,
  pageClassName,
  pageTestId,
  headerTestId,
  titleTestId,
  statusTestId,
  mobileSideFirst = false,
  children,
}: SimPageShellProps) {
  const { main, side, sections } = collectSlots(children);
  const hasGrid = Boolean(main || side);
  const shouldRenderStatus = Boolean(error || loading);

  let statusNode: ReactNode = null;
  if (error) {
    statusNode = errorContent
      ? <div data-testid={statusTestId}>{errorContent}</div>
      : renderStatusBlock(error, statusTestId, 'sim-state-card--error');
  } else if (loading) {
    statusNode = loadingContent
      ? <div data-testid={statusTestId}>{loadingContent}</div>
      : renderStatusBlock('Chargement…', statusTestId);
  }

  return (
    <div className={joinClasses('sim-page', pageClassName)} data-testid={pageTestId}>
      <header className="premium-header sim-header sim-header--stacked" data-testid={headerTestId}>
        <h1 className="premium-title" data-testid={titleTestId}>{title}</h1>

        {(subtitle || actions) ? (
          <div className="sim-header__subtitle-row">
            {subtitle ? <p className="premium-subtitle">{subtitle}</p> : <div />}
            {actions ? <div className="sim-header__actions">{actions}</div> : null}
          </div>
        ) : null}

        {nav ? <nav className="sim-header__nav">{nav}</nav> : null}
      </header>

      {shouldRenderStatus ? statusNode : (
        <>
          {notice ? <div className="sim-notice">{notice}</div> : null}
          {controls ? <div className="sim-controls-row">{controls}</div> : null}

          {hasGrid ? (
            <main className={joinClasses(
              'sim-grid',
              !side && 'sim-grid--single',
              side && mobileSideFirst && 'sim-grid--side-first-mobile',
            )}
            >
              {main ? (
                <section className={joinClasses('sim-grid__col', 'sim-grid__col--main', main.className)}>
                  {main.children}
                </section>
              ) : null}

              {side ? (
                <aside className={joinClasses(
                  'sim-grid__col',
                  'sim-grid__col--side',
                  side.sticky !== false && 'sim-grid__col--sticky',
                  side.className,
                )}
                >
                  {side.children}
                </aside>
              ) : null}
            </main>
          ) : null}

          {sections.map((section, index) => (
            <section
              key={section.key ?? `sim-page-shell-section-${index}`}
              className={joinClasses('sim-section', section.className)}
            >
              {section.children}
            </section>
          ))}
        </>
      )}
    </div>
  );
}

export const SimPageShell = Object.assign(SimPageShellRoot, {
  Main: SimPageShellMain,
  Side: SimPageShellSide,
  Section: SimPageShellSection,
});
