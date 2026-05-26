/**
 * TresorerieSocietePage.tsx — Orchestrateur de la page /sim/tresorerie-societe
 *
 * Structure : SimPageShell avec colonne gauche (saisie) + colonne droite sticky (KPIs).
 * Section basse : projection comptable (drawer), hypothèses.
 * Repère Mode expert affiché ; le parcours simplifié produit reste à définir.
 */

import '@/styles/sim/index.css';
import './styles/index.css';

import { useCallback, useState } from 'react';
import { ExportMenu } from '../../components/ExportMenu';
import { ModeToggle } from '../../components/ModeToggle';
import {
  SimCollapsibleTable,
  SimEmptyState,
  SimPageStepper,
  SimViewSynthesisCTA,
} from '../../components/ui/sim';
import { SimPageShell } from '../../components/ui/sim/SimPageShell';
import { useTheme } from '../../settings/ThemeProvider';
import { useTresorerieState } from './hooks/useTresorerieState';
import { useTresorerieCalculations } from './hooks/useTresorerieCalculations';
import { useTresorerieExportHandlers } from './hooks/useTresorerieExportHandlers';
import { TresoTimelineSection } from './components/timeline/TresoTimelineSection';
import { TresoSocieteSection } from './components/TresoSocieteSection';
import { TresoPlacementSection } from './components/TresoPlacementSection';
import { TresoAssociateInsights } from './components/TresoAssociateInsights';
import { TresoKPISidebar } from './components/TresoKPISidebar';
import { TresoProjectionDrawer } from './components/TresoProjectionDrawer';
import { TresoHypotheses } from './components/TresoHypotheses';
import { getAssociateProfile, getSelectedAssociate } from './utils/tresorerieSocieteModel';
import { getTresoReadiness } from './utils/tresorerieReadiness';

export default function TresorerieSocietePage() {
  const [openAssociateModal, setOpenAssociateModal] = useState<
    ((associateId: string) => void) | null
  >(null);
  const { state, hydrated, setInputsV6, setProjectionVisible, setProjectionMode } =
    useTresorerieState();

  const { colors: themeColors, pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const activeProfile = getAssociateProfile(state.inputsV6, getSelectedAssociate(state.inputsV6));
  const readiness = getTresoReadiness(state.inputsV6);
  const { rows, kpis, loading, error, simulationError } = useTresorerieCalculations(state.inputsV6);
  const { exportExcel, exportPptx, exportLoading, exportDisabled } = useTresorerieExportHandlers({
    rows,
    kpis,
    inputs: state.inputsV6,
    themeColors,
    pptxColors,
    cabinetLogo,
    logoPlacement,
  });

  const exportOptions = [
    { label: 'PowerPoint', onClick: exportPptx, disabled: exportDisabled },
    { label: 'Excel', onClick: exportExcel, disabled: exportDisabled },
  ];

  const handleAssociateModalOpenerChange = useCallback(
    (open: ((associateId: string) => void) | null) => {
      setOpenAssociateModal(open ? () => open : null);
    },
    [],
  );

  // Garde anti-flash : ne pas rendre avant l'hydration sessionStorage
  if (!hydrated) return null;

  return (
    <SimPageShell
      title="Trésorerie société"
      subtitle="Simulateur IS — holding patrimoniale et société de capitalisation"
      pageTestId="tresorerie-societe-page"
      loading={loading}
      error={error}
      notice={
        simulationError ? (
          <p className="ts-warning" role="alert">
            {simulationError}
          </p>
        ) : undefined
      }
      actions={
        <>
          <ModeToggle
            value
            disabled
            disabledReason="Mode expert affiché comme repère : le parcours simplifié reste à définir."
          />
          <ExportMenu options={exportOptions} loading={exportLoading} />
        </>
      }
      nav={
        <SimPageStepper
          steps={[
            { id: 'treso-societe', label: 'Société' },
            {
              id: 'treso-parcours',
              label: 'Parcours',
              disabled: !readiness.personalTimelineReady,
            },
            {
              id: 'treso-allocation',
              label: 'Allocation',
              disabled: !readiness.personalTimelineReady,
            },
            {
              id: 'treso-synthese',
              label: 'Synthèse',
              disabled: !readiness.synthesisReady,
            },
            { id: 'treso-hypotheses', label: 'Hypothèses' },
          ]}
        />
      }
    >
      <SimPageShell.Main>
        {/* Bloc 1 — Société */}
        <div id="treso-societe" data-sim-step-id="treso-societe">
          <TresoSocieteSection
            inputs={state.inputsV6}
            onChange={setInputsV6}
            onAssociateModalOpenerChange={handleAssociateModalOpenerChange}
          />
        </div>

        {readiness.personalTimelineReady ? (
          <>
            {/* Bloc 2 — Parcours associé */}
            <div id="treso-parcours" data-sim-step-id="treso-parcours">
              <TresoTimelineSection
                inputs={state.inputsV6}
                onChange={setInputsV6}
                onOpenAssociateModal={openAssociateModal ?? undefined}
              />
            </div>

            {/* Bloc 3 — Allocation société */}
            <div id="treso-allocation" data-sim-step-id="treso-allocation">
              <TresoPlacementSection
                inputs={state.inputsV6}
                projectionRows={rows}
                onChange={setInputsV6}
              />
            </div>
          </>
        ) : null}

        <SimViewSynthesisCTA
          ready={readiness.synthesisReady}
          targetId="treso-synthese"
          hint="Revenu cible, CCA et repères de trésorerie."
        />

        <SimCollapsibleTable
          title="projection comptable"
          open={state.projectionVisible}
          onOpenChange={setProjectionVisible}
          labelOpen="Masquer la projection comptable"
          labelClosed="Voir la projection comptable"
          controlsId="ts-projection-drawer"
          className="ts-projection-collapsible"
          toggleClassName="ts-projection-disclosure"
          toggleTestId="ts-open-projection"
          rowCount={rows.length}
        >
          <TresoProjectionDrawer
            rows={rows}
            mode={state.projectionMode}
            onModeChange={setProjectionMode}
            ageActuel={activeProfile.currentAge}
            ageRetraite={activeProfile.retirementAge}
            anneeCivileDebut={activeProfile.projectionStartYear}
          />
        </SimCollapsibleTable>
      </SimPageShell.Main>

      <SimPageShell.Side sticky>
        {readiness.synthesisReady ? (
          <div id="treso-synthese" className="sim-sidebar-reveal" data-sim-step-id="treso-synthese">
            <TresoAssociateInsights inputs={state.inputsV6} rows={rows} />
            <TresoKPISidebar kpis={kpis} inputs={state.inputsV6} />
          </div>
        ) : (
          <SimEmptyState
            variant="sidebar"
            illustration="chart"
            title="Synthèse en attente"
            description="Complétez la société, l’associé personne physique et au moins une phase de revenus."
            cta={
              <span>Les repères de trésorerie, revenu cible et CCA seront calculés ensuite.</span>
            }
          />
        )}
      </SimPageShell.Side>

      <SimPageShell.Section>
        <div id="treso-hypotheses" data-sim-step-id="treso-hypotheses">
          <TresoHypotheses />
        </div>
      </SimPageShell.Section>
    </SimPageShell>
  );
}
