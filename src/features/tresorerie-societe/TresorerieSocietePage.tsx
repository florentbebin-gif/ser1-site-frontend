/**
 * TresorerieSocietePage.tsx — Orchestrateur de la page /sim/tresorerie-societe
 *
 * Structure : SimPageShell avec colonne gauche (saisie) + colonne droite sticky (KPIs).
 * Section basse : projection comptable (drawer), hypothèses.
 * Mode expert uniquement (pas de toggle en V1).
 */

import '@/styles/sim/index.css';
import './styles/index.css';

import { SimPageShell } from '../../components/ui/sim/SimPageShell';
import { useTresorerieState } from './hooks/useTresorerieState';
import { useTresorerieCalculations } from './hooks/useTresorerieCalculations';
import { TresoSocieteSection } from './components/TresoSocieteSection';
import { TresoCCASection } from './components/TresoCCASection';
import { TresoPlacementSection } from './components/TresoPlacementSection';
import { TresoCreditSection } from './components/TresoCreditSection';
import { TresoHoldingSection } from './components/TresoHoldingSection';
import { TresoKPISidebar } from './components/TresoKPISidebar';
import { TresoProjectionDrawer } from './components/TresoProjectionDrawer';
import { TresoHypotheses } from './components/TresoHypotheses';

export default function TresorerieSocietePage() {
  const {
    state,
    hydrated,
    setInputs,
    setProjectionVisible,
    setProjectionMode,
    setDistribution,
    setCapitalisation,
    setCreditIS,
    setCreditIR,
    setHolding,
  } = useTresorerieState();

  const { rows, kpis, loading, error } = useTresorerieCalculations(state.inputs);

  // Garde anti-flash : ne pas rendre avant l'hydration sessionStorage
  if (!hydrated) return null;

  return (
    <SimPageShell
      title="Trésorerie société"
      subtitle="Simulateur IS — holding patrimoniale et société de capitalisation"
      pageTestId="tresorerie-societe-page"
      loading={loading}
      error={error}
    >
      <SimPageShell.Main>
        {/* Bloc 1 — Société et foyer */}
        <TresoSocieteSection inputs={state.inputs} onChange={setInputs} />

        {/* Bloc 2 — CCA */}
        <TresoCCASection inputs={state.inputs} onChange={setInputs} />

        {/* Bloc 3 — Allocation société */}
        <TresoPlacementSection
          inputs={state.inputs}
          onDistribution={setDistribution}
          onCapitalisation={setCapitalisation}
        />

        {/* Bloc 4 — Crédits */}
        <TresoCreditSection
          inputs={state.inputs}
          onCreditIR={setCreditIR}
          onCreditIS={setCreditIS}
        />

        {/* Bloc 5 — Holding */}
        <TresoHoldingSection inputs={state.inputs} onHolding={setHolding} />

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
            ageActuel={state.inputs.ageActuel}
            ageRetraite={state.inputs.ageRetraite}
            anneeCivileDebut={state.inputs.anneeCivileDebut}
          />
        )}

        {/* Hypothèses */}
        <TresoHypotheses />
      </SimPageShell.Main>

      <SimPageShell.Side sticky>
        <TresoKPISidebar kpis={kpis} inputs={state.inputs} />
      </SimPageShell.Side>
    </SimPageShell>
  );
}
