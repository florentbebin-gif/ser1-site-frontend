import type { ReactElement } from 'react';
import type { DossierRailStepView, DossierRailViewModel } from '@/domain/dossier';
import { IconChevronRight, IconLayers } from '@/icons/ui';

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
          <span className="dossier-rail__eyebrow">Dossier</span>
          <strong className="dossier-rail__version">{viewModel.version.versionCode}</strong>
          <span className="dossier-rail__version-note">
            {viewModel.version.isPersisted ? 'Enregistrée' : 'Non persistée'}
          </span>
        </header>

        <section className="dossier-rail__journey" aria-labelledby="dossier-rail-journey-title">
          <div className="dossier-rail__journey-icon" aria-hidden="true">
            <IconLayers className="dossier-rail__icon" />
          </div>
          <div>
            <span className="dossier-rail__eyebrow">Parcours</span>
            <h2 id="dossier-rail-journey-title" data-testid="dossier-rail-journey-label">
              {viewModel.journey.label}
            </h2>
            {viewModel.density === 'full' && (
              <p className="dossier-rail__objective">{viewModel.journey.objective}</p>
            )}
          </div>
        </section>

        <section className="dossier-rail__section" aria-labelledby="dossier-rail-current-title">
          <h3 id="dossier-rail-current-title">Position</h3>
          <StepList
            steps={[viewModel.current]}
            onNavigate={onNavigate}
            resolveRoutePath={resolveRoutePath}
            testId="dossier-rail-current"
          />
        </section>

        {previousSteps.length > 0 && (
          <section className="dossier-rail__section" aria-labelledby="dossier-rail-previous-title">
            <h3 id="dossier-rail-previous-title">Avant</h3>
            <StepList
              steps={previousSteps}
              onNavigate={onNavigate}
              resolveRoutePath={resolveRoutePath}
              testId="dossier-rail-previous"
            />
          </section>
        )}

        {nextSteps.length > 0 && (
          <section className="dossier-rail__section" aria-labelledby="dossier-rail-next-title">
            <h3 id="dossier-rail-next-title">Ensuite</h3>
            <StepList
              steps={nextSteps}
              onNavigate={onNavigate}
              resolveRoutePath={resolveRoutePath}
              testId="dossier-rail-next"
            />
          </section>
        )}

        {branchViews.length > 0 && (
          <section className="dossier-rail__section" aria-labelledby="dossier-rail-branches-title">
            <h3 id="dossier-rail-branches-title">Branches possibles</h3>
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
  onNavigate: (_path: string) => void;
  resolveRoutePath: (_routeId: string | undefined) => string | null;
  testId: string;
}

function StepList({ steps, onNavigate, resolveRoutePath, testId }: StepListProps): ReactElement {
  return (
    <ol className="dossier-rail__steps" data-testid={testId}>
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
  const content = (
    <>
      <span className="dossier-rail__step-label">{step.label}</span>
      <span className="dossier-rail__step-status">{AVAILABILITY_LABELS[step.availability]}</span>
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
          onClick={() => onNavigate(routePath)}
        >
          {content}
          <IconChevronRight className="dossier-rail__step-icon" aria-hidden="true" />
        </button>
      ) : (
        <span
          className="dossier-rail__step-static"
          aria-current={step.isCurrent ? 'step' : undefined}
        >
          {content}
        </span>
      )}
    </li>
  );
}

export default DossierRail;
