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
import { TresoSocieteSection } from './components/TresoSocieteSection';
import { TresoFoyerSection } from './components/TresoFoyerSection';
import { TresoPlacementSection } from './components/TresoPlacementSection';
import { TresoFoyerInsights } from './components/TresoFoyerInsights';
import { TresoKPISidebar } from './components/TresoKPISidebar';
import { TresoProjectionDrawer } from './components/TresoProjectionDrawer';
import { TresoHypotheses } from './components/TresoHypotheses';

export default function TresorerieSocietePage() {
  const {
    state,
    hydrated,
    setInputsV2,
    setProjectionVisible,
    setProjectionMode,
  } = useTresorerieState();

  const { colors: themeColors, pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const { rows, kpis, loading, error } = useTresorerieCalculations(state.inputsV2);
  const {
    exportExcel,
    exportPptx,
    exportLoading,
    exportDisabled,
  } = useTresorerieExportHandlers({
    rows,
    kpis,
    inputs: state.inputsV2,
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
      actions={<ExportMenu options={exportOptions} loading={exportLoading} />}
    >
      <SimPageShell.Main>
        {/* Bloc 1 — Société */}
        <TresoSocieteSection inputs={state.inputsV2} onChange={setInputsV2} />

        {/* Bloc 2 — Foyer */}
        <TresoFoyerSection inputs={state.inputsV2} onChange={setInputsV2} />

        {/* Bloc 3 — Allocation société */}
        <TresoPlacementSection
          inputs={state.inputsV2}
          onChange={setInputsV2}
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
            ageActuel={state.inputsV2.foyer.currentAge}
            ageRetraite={state.inputsV2.foyer.retirementAge}
            anneeCivileDebut={state.inputsV2.foyer.projectionStartYear}
          />
        )}

        {/* Hypothèses */}
        <TresoHypotheses />
      </SimPageShell.Main>

      <SimPageShell.Side sticky>
        <TresoFoyerInsights inputs={state.inputsV2} rows={rows} />
        <TresoKPISidebar kpis={kpis} inputs={state.inputsV2} />
      </SimPageShell.Side>
    </SimPageShell>
  );
}
