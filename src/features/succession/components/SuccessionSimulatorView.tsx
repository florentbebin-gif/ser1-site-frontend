import type { ComponentProps } from 'react';
import { ExportMenu } from '../../../components/ExportMenu';
import { ModeToggle } from '../../../components/ModeToggle';
import {
  SimEmptyState,
  SimPageShell,
  SimPageStepper,
  SimViewSynthesisCTA,
} from '@/components/ui/sim';
import type { ExportOption } from '../../../components/export/exportTypes';
import {
  SuccessionFamilyOverview,
  SuccessionHypotheses,
  SuccessionPageContent,
  SuccessionPageSidebar,
} from './SuccessionPageSections';

type SuccessionPageSectionsProps = ComponentProps<typeof SuccessionPageContent>;
type SuccessionDerivedValues = SuccessionPageSectionsProps['derived'];

interface SuccessionSimulatorViewProps {
  settingsLoading: boolean;
  sessionExpired: boolean;
  isExpert: boolean;
  exportOptions: ExportOption[];
  exportLoading: boolean;
  onToggleMode: () => void;
  pageSectionsProps: SuccessionPageSectionsProps;
  derived: SuccessionDerivedValues;
  successionSynthesisReady: boolean;
  hypothesesOpen: boolean;
  onToggleHypotheses: () => void;
}

export function SuccessionSimulatorView({
  settingsLoading,
  sessionExpired,
  isExpert,
  exportOptions,
  exportLoading,
  onToggleMode,
  pageSectionsProps,
  derived,
  successionSynthesisReady,
  hypothesesOpen,
  onToggleHypotheses,
}: SuccessionSimulatorViewProps) {
  if (settingsLoading) {
    return (
      <SimPageShell
        title="Succession"
        subtitle="Estimez les impacts civils d'une succession à partir du contexte familial, du patrimoine et des dispositions saisies."
        pageClassName="sc-page"
        pageTestId="succession-page"
        statusTestId="succession-settings-loading"
        loading
        loadingContent={
          <div className="sc-settings-loading">Chargement des paramètres fiscaux…</div>
        }
      />
    );
  }

  return (
    <SimPageShell
      title="Succession"
      subtitle="Estimez les impacts civils d'une succession à partir du contexte familial, du patrimoine et des dispositions saisies."
      pageClassName="sc-page"
      pageTestId="succession-page"
      actions={
        <>
          <ModeToggle value={isExpert} onChange={onToggleMode} />
          <ExportMenu options={exportOptions} loading={exportLoading} />
        </>
      }
      nav={
        <SimPageStepper
          steps={[
            { id: 'succession-famille', label: 'Famille' },
            {
              id: 'succession-patrimoine',
              label: 'Patrimoine',
              disabled: !derived.shouldRenderSuccessionComputationSections,
            },
            {
              id: 'succession-synthese',
              label: 'Synthèse',
              disabled: !successionSynthesisReady,
            },
            { id: 'succession-hypotheses', label: 'Hypothèses' },
          ]}
        />
      }
      notice={
        <div
          id="succession-famille"
          className="sc-page-notice"
          data-sim-step-id="succession-famille"
        >
          {sessionExpired ? (
            <p className="sc-session-msg">Session expirée — reconnectez-vous pour exporter.</p>
          ) : null}
          <SuccessionFamilyOverview {...pageSectionsProps} />
        </div>
      }
    >
      {derived.shouldRenderSuccessionComputationSections ? (
        <>
          <SimPageShell.Main className="sc-left">
            <div id="succession-patrimoine" data-sim-step-id="succession-patrimoine">
              <SuccessionPageContent {...pageSectionsProps} />
            </div>
            <SimViewSynthesisCTA
              ready={successionSynthesisReady}
              targetId="succession-synthese"
              hint="Droits, masse transmise et chronologie décès."
            />
          </SimPageShell.Main>

          <SimPageShell.Side className="sc-right">
            {successionSynthesisReady ? (
              <div
                id="succession-synthese"
                className="sim-sidebar-reveal"
                data-sim-step-id="succession-synthese"
              >
                <SuccessionPageSidebar {...pageSectionsProps} />
              </div>
            ) : (
              <SimEmptyState
                variant="sidebar"
                illustration="chart"
                title="Synthèse en attente"
                description="Renseignez un patrimoine significatif pour afficher les droits et la chronologie."
              />
            )}
          </SimPageShell.Side>
        </>
      ) : null}

      <SimPageShell.Section>
        <div id="succession-hypotheses" data-sim-step-id="succession-hypotheses">
          <SuccessionHypotheses
            hypothesesOpen={hypothesesOpen}
            assumptions={derived.assumptions}
            onToggle={onToggleHypotheses}
          />
        </div>
      </SimPageShell.Section>
    </SimPageShell>
  );
}
