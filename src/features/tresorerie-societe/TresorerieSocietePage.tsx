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

  const projectionChevronClass = state.projectionVisible
    ? 'ts-accordion-chevron is-open'
    : 'ts-accordion-chevron';

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

        {/* Bouton projection */}
        <div className="ts-projection-btn-row">
          <button
            type="button"
            className="ts-projection-btn"
            onClick={() => setProjectionVisible(!state.projectionVisible)}
            aria-expanded={state.projectionVisible}
            data-testid="ts-open-projection"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={projectionChevronClass}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span>
              {state.projectionVisible
                ? 'Masquer la projection comptable'
                : 'Voir la projection comptable'}
            </span>
          </button>
        </div>

        {/* Projection comptable (ouverte) */}
        {state.projectionVisible && (
          <TresoProjectionDrawer
            rows={rows}
            mode={state.projectionMode}
            onModeChange={setProjectionMode}
            ageActuel={activeProfile.currentAge}
            ageRetraite={activeProfile.retirementAge}
            anneeCivileDebut={activeProfile.projectionStartYear}
          />
        )}

        {/* Hypothèses */}
        <TresoHypotheses />
      </SimPageShell.Main>

      <SimPageShell.Side sticky>
        {readiness.personalTimelineReady ? (
          <>
            <TresoAssociateInsights inputs={state.inputsV6} rows={rows} />
            <TresoKPISidebar kpis={kpis} inputs={state.inputsV6} />
          </>
        ) : (
          <div className="premium-card sim-summary-card sim-sidebar-empty-state">
            <h2>Synthèse</h2>
            <p>Complétez la société et l’associé personne physique pour afficher la synthèse.</p>
            <span>Les repères de trésorerie, revenu cible et CCA seront calculés ensuite.</span>
          </div>
        )}
      </SimPageShell.Side>
    </SimPageShell>
  );
}
