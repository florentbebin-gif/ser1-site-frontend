/**
 * TresorerieSocietePage.tsx — Orchestrateur de la page /sim/tresorerie-societe
 *
 * Structure : SimPageShell avec colonne gauche (saisie) + colonne droite sticky (KPIs).
 * Section basse : projection comptable (drawer), hypothèses.
 * Mode expert uniquement (pas de toggle en V1).
 */

import '@/styles/sim/index.css';
import './styles/index.css';

import { ExportMenu } from '../../components/ExportMenu';
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

export default function TresorerieSocietePage() {
  const {
    state,
    hydrated,
    setInputsV5,
    setProjectionVisible,
    setProjectionMode,
  } = useTresorerieState();

  const { colors: themeColors, pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const activeProfile = getAssociateProfile(state.inputsV5, getSelectedAssociate(state.inputsV5));
  const { rows, kpis, loading, error, simulationError } = useTresorerieCalculations(state.inputsV5);
  const {
    exportExcel,
    exportPptx,
    exportLoading,
    exportDisabled,
  } = useTresorerieExportHandlers({
    rows,
    kpis,
    inputs: state.inputsV5,
    themeColors,
    pptxColors,
    cabinetLogo,
    logoPlacement,
  });

  const exportOptions = [
    { label: 'PowerPoint', onClick: exportPptx, disabled: exportDisabled },
    { label: 'Excel', onClick: exportExcel, disabled: exportDisabled },
  ];

  // Garde anti-flash : ne pas rendre avant l'hydration sessionStorage
  if (!hydrated) return null;

  return (
    <SimPageShell
      title="Trésorerie société"
      subtitle="Simulateur IS — holding patrimoniale et société de capitalisation"
      pageTestId="tresorerie-societe-page"
      loading={loading}
      error={error}
      notice={simulationError ? <p className="ts-warning" role="alert">{simulationError}</p> : undefined}
      actions={<ExportMenu options={exportOptions} loading={exportLoading} />}
    >
      <SimPageShell.Main>
        {/* Bloc 1 — Société */}
        <TresoSocieteSection inputs={state.inputsV5} onChange={setInputsV5} />

        {/* Bloc 2 — Parcours associé */}
        <TresoTimelineSection inputs={state.inputsV5} onChange={setInputsV5} />

        {/* Bloc 3 — Allocation société */}
        <TresoPlacementSection
          inputs={state.inputsV5}
          projectionRows={rows}
          onChange={setInputsV5}
        />

        {/* Bouton projection */}
        <div className="ts-projection-btn-row">
          <button
            type="button"
            className="ts-projection-btn"
            onClick={() => setProjectionVisible(!state.projectionVisible)}
            aria-expanded={state.projectionVisible}
            data-testid="ts-open-projection"
          >
            {state.projectionVisible
              ? '▲ Masquer la projection comptable'
              : '▼ Voir la projection comptable'}
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
        <TresoAssociateInsights inputs={state.inputsV5} rows={rows} />
        <TresoKPISidebar kpis={kpis} inputs={state.inputsV5} />
      </SimPageShell.Side>
    </SimPageShell>
  );
}
