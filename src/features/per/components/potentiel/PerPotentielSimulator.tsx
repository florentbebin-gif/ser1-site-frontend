/**
 * PerPotentielSimulator - Wizard shell for "Controle du potentiel ER".
 *
 * The engine and state flow stay unchanged. This component only reorganizes the
 * visual shell to match the SER1 simulator baseline and the Excel journey cues.
 */

import React from 'react';
import { Link } from 'react-router-dom';
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
    description: 'Definir l objectif et identifier les documents utiles avant de lancer les calculs.',
  },
  {
    id: 2 as const,
    shortLabel: 'Avis IR',
    title: 'Lecture de l avis',
    description: 'Reprendre les reports du plafond epargne retraite pour fiabiliser le potentiel.',
  },
  {
    id: 3 as const,
    shortLabel: 'Revenus',
    title: 'Situation fiscale et versements',
    description: 'Reconstituer le foyer, les revenus imposables et les cotisations retraite par declarant.',
  },
  {
    id: 4 as const,
    shortLabel: 'Synthese',
    title: 'Restitution declarative',
    description: 'Verifier les cases 2042, les plafonds disponibles et l impact fiscal du versement.',
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
    nextStep,
    prevStep,
    goToStep,
    reset,
    canGoNext,
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
          Chargement des parametres fiscaux...
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
    ? 'Declaration 2042 N-1'
    : 'Controle avant versement N';
  const documentLabel = state.mode === 'versement-n'
    ? (state.avisIrConnu ? `Avis IR ${currentYear}` : 'Estimation depuis les revenus')
    : `Declaration des revenus ${currentYear - 1}`;
  const foyerLabel = isCouple
    ? 'Couple marie ou pacse'
    : state.isole
      ? 'Parent isole'
      : 'Personne seule';

  return (
    <div className="sim-page per-potentiel-page">
      <div className="premium-header per-potentiel-header">
        <div className="per-potentiel-header-copy">
          <Link to="/sim/per" className="per-back-link">Retour aux simulateurs PER</Link>
          <p className="per-potentiel-kicker">Epargne retraite</p>
          <h1 className="premium-title">Controle du potentiel epargne retraite</h1>
          <p className="premium-subtitle">
            Parcourez le dossier comme dans le classeur : mode, document fiscal, situation du foyer,
            restitution declarative et estimation d un versement.
          </p>
        </div>
        <div className="sim-header__actions">
          <ExportMenu options={exportOptions} loading={exportLoading} />
        </div>
      </div>

      <div className="per-potentiel-layout">
        <aside className="per-potentiel-rail">
          <div className="premium-card per-potentiel-rail-card">
            <p className="premium-section-title">Parcours</p>
            <div className="per-potentiel-rail-list">
              {visibleSteps.map((stepId, index) => {
                const meta = STEP_META[stepId - 1];
                const isCurrent = state.step === stepId;
                const isDone = stepIndex > index;
                const isLocked = stepIndex < index;

                return (
                  <button
                    key={stepId}
                    type="button"
                    className={[
                      'per-potentiel-rail-item',
                      isCurrent ? 'is-active' : '',
                      isDone ? 'is-done' : '',
                    ].join(' ').trim()}
                    onClick={() => goToStep(stepId)}
                    disabled={isLocked}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span className="per-potentiel-rail-index">{index + 1}</span>
                    <span className="per-potentiel-rail-copy">
                      <span className="per-potentiel-rail-label">{meta.shortLabel}</span>
                      <span className="per-potentiel-rail-desc">{meta.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="premium-card-compact per-potentiel-rail-note">
            <p className="premium-section-title">Regles du dossier</p>
            <ul className="per-potentiel-note-list">
              <li>Les PASS viennent des settings de l application, puis du fallback documente.</li>
              <li>Les calculs se mettent a jour des l etape revenus.</li>
              <li>Les exports restent reserves a la synthese finale.</li>
            </ul>
          </div>
        </aside>

        <main className="per-potentiel-main">
          <div className="premium-card premium-card--guide per-potentiel-stage">
            <div className="per-potentiel-stage-header">
              <div>
                <p className="premium-section-title">Etape active</p>
                <h2 className="per-potentiel-stage-title">{activeStep.title}</h2>
                <p className="per-potentiel-stage-desc">{activeStep.description}</p>
              </div>
              <div className="per-potentiel-stage-badge">
                Etape {stepIndex + 1} / {totalSteps}
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

            <div className="per-potentiel-stage-footer">
              <div className="per-potentiel-stage-actions">
                {state.step > 1 && (
                  <button type="button" className="premium-btn" onClick={prevStep}>
                    Retour
                  </button>
                )}
                {state.step < 4 && (
                  <button
                    type="button"
                    className="premium-btn premium-btn-primary"
                    onClick={nextStep}
                    disabled={!canGoNext}
                  >
                    Continuer
                  </button>
                )}
              </div>
              <button type="button" className="premium-btn" onClick={reset}>
                Reinitialiser
              </button>
            </div>
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
              <p className="premium-section-title">Repere fiscal</p>
              <span className="per-potentiel-pass-chip">PASS {currentYear}</span>
            </div>
            <div className="per-potentiel-pass-value">
              {currentPass ? fmtCurrency(currentPass) : 'Non disponible'}
            </div>
            <p className="per-potentiel-context-note">
              Source de verite : public.pass_history, puis cache fiscal, puis fallback settingsDefaults.
            </p>
          </div>

          {result && (
            <div className="premium-card-compact per-potentiel-context-card">
              <p className="premium-section-title">Apercu en direct</p>
              <div className="per-potentiel-mini-kpis">
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">TMI</span>
                  <strong className="per-potentiel-mini-kpi-value">
                    {fmtPercent(result.situationFiscale.tmi)}
                  </strong>
                </div>
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">IR estime</span>
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
