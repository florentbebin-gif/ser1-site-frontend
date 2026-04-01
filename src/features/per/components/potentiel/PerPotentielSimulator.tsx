/**
 * PerPotentielSimulator - Wizard shell for "Controle du potentiel ER".
 *
 * The engine and state flow stay unchanged. This component only reorganizes the
 * visual shell to match the SER1 simulator baseline and the Excel journey cues.
 */

import React from 'react';
import { ExportMenu } from '../../../../components/ExportMenu';
import { useFiscalContext } from '../../../../hooks/useFiscalContext';
import { useTheme } from '../../../../settings/ThemeProvider';
import '../../../../components/simulator/SimulatorShell.css';
import '../../../../styles/premium-shared.css';
import { usePerPotentiel } from '../../hooks/usePerPotentiel';
import { usePerPotentielExportHandlers } from '../../hooks/usePerPotentielExportHandlers';
import ModeStep from './steps/ModeStep';
import AvisIrStep from './steps/AvisIrStep';
import SituationFiscaleStep from './steps/SituationFiscaleStep';
import SynthesePotentielStep from './steps/SynthesePotentielStep';
import '../../Per.css';

const STEP_META = [
  {
    id: 1 as const,
    shortLabel: 'Mode',
    title: 'Choix du parcours',
  },
  {
    id: 2 as const,
    shortLabel: 'Avis IR',
    title: "Lecture de l'avis",
  },
  {
    id: 3 as const,
    shortLabel: 'Revenus',
    title: 'Situation fiscale et versements',
  },
  {
    id: 4 as const,
    shortLabel: 'Synthèse',
    title: 'Restitution déclarative',
  },
] as const;

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const fmtPercent = (value: number): string =>
  `${(value <= 1 ? value * 100 : value).toFixed(1)} %`;

export default function PerPotentielSimulator(): React.ReactElement {
  const { fiscalContext, loading, error } = useFiscalContext({ strict: true });
  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const currentYear = new Date().getFullYear();

  const {
    state,
    result,
    setMode,
    setAvisIrConnu,
    updateAvisIr,
    updateSituation,
    updateDeclarant,
    setVersementEnvisage,
    prevStep,
    goToStep,
    showAvisStep,
    isCouple,
  } = usePerPotentiel(fiscalContext);

  const { exportExcel, exportPowerPoint, exportLoading } = usePerPotentielExportHandlers({
    state,
    result,
    pptxColors,
    cabinetLogo,
    logoPlacement,
  });

  if (loading) {
    return (
      <div className="sim-page per-potentiel-page">
        <p style={{ color: 'var(--color-c9)', textAlign: 'center', padding: '3rem' }}>
          Chargement des paramètres fiscaux...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sim-page per-potentiel-page">
        <p style={{ color: 'var(--color-c1)', textAlign: 'center', padding: '3rem' }}>
          Erreur : {error}
        </p>
      </div>
    );
  }

  const visibleSteps: readonly (1 | 2 | 3 | 4)[] = showAvisStep
    ? [1, 2, 3, 4]
    : [1, 3, 4];
  const stepIndex = visibleSteps.indexOf(state.step);
  const totalSteps = visibleSteps.length;
  const activeStep = STEP_META[state.step - 1];
  const currentPass = fiscalContext.passHistoryByYear[currentYear] ?? null;

  const exportOptions = [
    { label: 'Excel', onClick: exportExcel, disabled: !result || state.step !== 4 },
    { label: 'PowerPoint', onClick: exportPowerPoint, disabled: !result || state.step !== 4 },
  ];

  const pathLabel = state.mode === 'declaration-n1'
    ? 'Déclaration 2042 N-1'
    : 'Contrôle avant versement N';
  const documentLabel = state.mode === 'versement-n'
    ? (state.avisIrConnu ? `Avis IR ${currentYear}` : 'Estimation depuis les revenus')
    : `Déclaration des revenus ${currentYear - 1}`;
  const foyerLabel = isCouple
    ? 'Couple marié ou pacsé'
    : state.isole
      ? 'Parent isolé'
      : 'Personne seule';

  return (
    <div className="sim-page per-potentiel-page">
      <div className="premium-header per-potentiel-header">
        <div className="per-potentiel-header-copy">
          <h1 className="premium-title">Contrôle du potentiel épargne retraite</h1>
          <p className="premium-subtitle">
            Mode, document fiscal, situation du foyer et restitution déclarative.
          </p>
        </div>
        <div className="sim-header__actions">
          <ExportMenu options={exportOptions} loading={exportLoading} />
        </div>
      </div>

      <nav className="per-potentiel-tabs" aria-label="Étapes du parcours">
        {visibleSteps.map((stepId, index) => {
          const meta = STEP_META[stepId - 1];
          const isCurrent = state.step === stepId;
          const isDone = stepIndex > index;
          return (
            <button
              key={stepId}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              className={[
                'per-potentiel-tab',
                isCurrent ? 'is-active' : '',
                isDone ? 'is-done' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => goToStep(stepId)}
            >
              {meta.shortLabel}
            </button>
          );
        })}
      </nav>

      <div className="per-potentiel-layout">
        <main className="per-potentiel-main">
          <div className="premium-card premium-card--guide per-potentiel-stage">
            <div className="per-potentiel-stage-header">
              <h2 className="per-potentiel-stage-title">{activeStep.title}</h2>
              <div className="per-potentiel-stage-badge">
                {stepIndex + 1} / {totalSteps}
              </div>
            </div>

            <div className="per-potentiel-stage-body">
              {state.step === 1 && (
                <ModeStep
                  mode={state.mode}
                  avisIrConnu={state.avisIrConnu}
                  onSelectMode={setMode}
                  onSetAvisIrConnu={setAvisIrConnu}
                />
              )}

              {state.step === 2 && showAvisStep && (
                <AvisIrStep
                  avisIr={state.avisIr}
                  avisIr2={state.avisIr2}
                  isCouple={isCouple}
                  onUpdate={updateAvisIr}
                />
              )}

              {state.step === 3 && (
                <SituationFiscaleStep
                  situationFamiliale={state.situationFamiliale}
                  nombreParts={state.nombreParts}
                  isole={state.isole}
                  isCouple={isCouple}
                  mutualisationConjoints={state.mutualisationConjoints}
                  declarant1={state.declarant1}
                  declarant2={state.declarant2}
                  result={result}
                  onUpdateSituation={updateSituation}
                  onUpdateDeclarant={updateDeclarant}
                />
              )}

              {state.step === 4 && (
                <SynthesePotentielStep
                  result={result}
                  isCouple={isCouple}
                  modeVersement={state.mode === 'versement-n'}
                  versementEnvisage={state.versementEnvisage}
                  onSetVersement={setVersementEnvisage}
                />
              )}
            </div>

            {state.step > 1 && (
              <div className="per-potentiel-stage-footer">
                <button type="button" className="premium-btn" onClick={prevStep}>
                  Retour
                </button>
              </div>
            )}
          </div>
        </main>

        <aside className="per-potentiel-context">
          <div className="premium-card-compact per-potentiel-context-card">
            <p className="premium-section-title">Lecture du dossier</p>
            <div className="per-potentiel-context-list">
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">Parcours</span>
                <span className="per-potentiel-context-value">{pathLabel}</span>
              </div>
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">Source</span>
                <span className="per-potentiel-context-value">{documentLabel}</span>
              </div>
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">Foyer</span>
                <span className="per-potentiel-context-value">{foyerLabel}</span>
              </div>
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">Parts</span>
                <span className="per-potentiel-context-value">{state.nombreParts}</span>
              </div>
            </div>
          </div>

          <div className="premium-card per-potentiel-context-card per-potentiel-context-card--accent">
            <div className="per-potentiel-context-title-row">
              <p className="premium-section-title">Repère fiscal</p>
              <span className="per-potentiel-pass-chip">PASS {currentYear}</span>
            </div>
            <div className="per-potentiel-pass-value">
              {currentPass ? fmtCurrency(currentPass) : 'Non disponible'}
            </div>
            <p className="per-potentiel-context-note">
              Source de vérité : public.pass_history, puis cache fiscal, puis fallback settingsDefaults.
            </p>
          </div>

          {result && (
            <div className="premium-card-compact per-potentiel-context-card">
              <p className="premium-section-title">Aperçu en direct</p>
              <div className="per-potentiel-mini-kpis">
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">TMI</span>
                  <strong className="per-potentiel-mini-kpi-value">
                    {fmtPercent(result.situationFiscale.tmi)}
                  </strong>
                </div>
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">IR estimé</span>
                  <strong className="per-potentiel-mini-kpi-value">
                    {fmtCurrency(result.situationFiscale.irEstime)}
                  </strong>
                </div>
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">Disponible D1</span>
                  <strong className="per-potentiel-mini-kpi-value">
                    {fmtCurrency(result.plafond163Q.declarant1.disponibleRestant)}
                  </strong>
                </div>
                {isCouple && result.plafond163Q.declarant2 && (
                  <div className="per-potentiel-mini-kpi">
                    <span className="per-potentiel-mini-kpi-label">Disponible D2</span>
                    <strong className="per-potentiel-mini-kpi-value">
                      {fmtCurrency(result.plafond163Q.declarant2.disponibleRestant)}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
