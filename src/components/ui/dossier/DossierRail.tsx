import type { ReactElement } from 'react';
import { DOSSIER_CHAIN_LABELS } from '@/domain/dossier';
import type { DossierRailStepView, DossierRailViewModel } from '@/domain/dossier';

interface DossierRailProps {
  viewModel: DossierRailViewModel;
  onNavigate: (_path: string) => void;
  resolveRoutePath: (_routeId: string | undefined) => string | null;
}

const AVAILABILITY_LABELS: Record<DossierRailStepView['availability'], string> = {
  available: 'Disponible',
  future: 'À venir',
  internal: 'Interne',
  conceptual: 'Parcours',
};

export function DossierRail({
  viewModel,
  onNavigate,
  resolveRoutePath,
}: DossierRailProps): ReactElement {
  const previousSteps =
    viewModel.density === 'compact' ? viewModel.previous.slice(-3) : viewModel.previous;
  const nextSteps = viewModel.density === 'compact' ? viewModel.next.slice(0, 4) : viewModel.next;
  const branchViews =
    viewModel.density === 'compact' ? viewModel.branches.slice(0, 2) : viewModel.branches;

  const versionNote = viewModel.version.isPersisted ? 'Enregistrée' : 'Non persistée';

  return (
    <aside
      className={`dossier-rail dossier-rail--${viewModel.density}`}
      data-density={viewModel.density}
      data-testid="dossier-rail"
      aria-label="Contexte dossier"
    >
      <div className="dossier-rail__mobile-pill" data-testid="dossier-rail-mobile-pill">
        <span>{viewModel.version.versionCode}</span>
        <strong>{viewModel.current.label}</strong>
      </div>

      <nav
        className="dossier-rail__panel"
        data-testid="dossier-rail-panel"
        aria-label="Parcours dossier"
      >
        <header className="dossier-rail__header">
          <span className="dossier-rail__eyebrow">Parcours</span>
          <h2 className="dossier-rail__journey" data-testid="dossier-rail-journey-label">
            {viewModel.journey.label}
          </h2>
          {viewModel.density === 'full' && (
            <p className="dossier-rail__objective">{viewModel.journey.objective}</p>
          )}
          <span className="dossier-rail__version">
            {viewModel.version.versionCode} · {versionNote}
          </span>
        </header>

        <div className="dossier-rail__timeline">
          <StepList
            steps={previousSteps}
            ariaLabel={DOSSIER_CHAIN_LABELS.upstream}
            onNavigate={onNavigate}
            resolveRoutePath={resolveRoutePath}
            testId="dossier-rail-previous"
          />
          <StepList
            steps={[viewModel.current]}
            ariaLabel={DOSSIER_CHAIN_LABELS.current}
            onNavigate={onNavigate}
            resolveRoutePath={resolveRoutePath}
            testId="dossier-rail-current"
          />
          <StepList
            steps={nextSteps}
            ariaLabel={DOSSIER_CHAIN_LABELS.downstream}
            onNavigate={onNavigate}
            resolveRoutePath={resolveRoutePath}
            testId="dossier-rail-next"
          />
        </div>

        {branchViews.length > 0 && (
          <section className="dossier-rail__branches-section" aria-label="Branches possibles">
            <span className="dossier-rail__eyebrow">Branches</span>
            <div className="dossier-rail__branches" data-testid="dossier-rail-branches">
              {branchViews.map((branch) => (
                <div className="dossier-rail__branch" key={branch.condition}>
                  <span>{branch.condition}</span>
                  <small>{branch.steps.map((step) => step.label).join(' puis ')}</small>
                </div>
              ))}
            </div>
          </section>
        )}
      </nav>
    </aside>
  );
}

interface StepListProps {
  steps: DossierRailStepView[];
  ariaLabel: string;
  onNavigate: (_path: string) => void;
  resolveRoutePath: (_routeId: string | undefined) => string | null;
  testId: string;
}

function StepList({
  steps,
  ariaLabel,
  onNavigate,
  resolveRoutePath,
  testId,
}: StepListProps): ReactElement | null {
  if (steps.length === 0) return null;

  return (
    <ol className="dossier-rail__steps" aria-label={ariaLabel} data-testid={testId}>
      {steps.map((step) => (
        <StepItem
          key={`${step.kind}-${step.id}-${step.isCurrent ? 'current' : 'linked'}`}
          step={step}
          onNavigate={onNavigate}
          resolveRoutePath={resolveRoutePath}
        />
      ))}
    </ol>
  );
}

interface StepItemProps {
  step: DossierRailStepView;
  onNavigate: (_path: string) => void;
  resolveRoutePath: (_routeId: string | undefined) => string | null;
}

function StepItem({ step, onNavigate, resolveRoutePath }: StepItemProps): ReactElement {
  const routePath = resolveRoutePath(step.routeId);
  const canNavigate = Boolean(routePath && !step.isCurrent && step.availability === 'available');
  const availabilityLabel = AVAILABILITY_LABELS[step.availability];
  const content = (
    <>
      <span className="dossier-rail__step-dot" aria-hidden="true" />
      <span className="dossier-rail__step-label">{step.label}</span>
    </>
  );

  return (
    <li
      className={`dossier-rail__step dossier-rail__step--${step.availability}${
        step.isCurrent ? ' is-current' : ''
      }`}
    >
      {canNavigate && routePath ? (
        <button
          className="dossier-rail__step-button"
          type="button"
          title={availabilityLabel}
          onClick={() => onNavigate(routePath)}
        >
          {content}
        </button>
      ) : (
        <span
          className="dossier-rail__step-static"
          title={availabilityLabel}
          aria-current={step.isCurrent ? 'step' : undefined}
        >
          {content}
        </span>
      )}
    </li>
  );
}

export default DossierRail;
