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
import { SimCollapsibleTable, SimEmptyState } from '../../components/ui/sim';
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
    >
      <SimPageShell.Main>
        {/* Bloc 1 — Société */}
        <TresoSocieteSection
          inputs={state.inputsV6}
          onChange={setInputsV6}
          onAssociateModalOpenerChange={handleAssociateModalOpenerChange}
        />

        {readiness.personalTimelineReady ? (
          <>
            {/* Bloc 2 — Parcours associé */}
            <TresoTimelineSection
              inputs={state.inputsV6}
              onChange={setInputsV6}
              onOpenAssociateModal={openAssociateModal ?? undefined}
            />

            {/* Bloc 3 — Allocation société */}
            <TresoPlacementSection
              inputs={state.inputsV6}
              projectionRows={rows}
              onChange={setInputsV6}
            />
          </>
        ) : null}

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
        {readiness.personalTimelineReady ? (
          <>
            <TresoAssociateInsights inputs={state.inputsV6} rows={rows} />
            <TresoKPISidebar kpis={kpis} inputs={state.inputsV6} />
          </>
        ) : (
          <SimEmptyState
            illustration="chart"
            title="Synthèse"
            description="Complétez la société et l’associé personne physique pour afficher la synthèse."
            cta={
              <span>Les repères de trésorerie, revenu cible et CCA seront calculés ensuite.</span>
            }
          />
        )}
      </SimPageShell.Side>

      <SimPageShell.Section>
        <TresoHypotheses />
      </SimPageShell.Section>
    </SimPageShell>
  );
}
