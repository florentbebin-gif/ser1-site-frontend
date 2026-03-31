/**
 * PerPotentielSimulator — Wizard orchestrator for "Contrôle du potentiel ER".
 *
 * 4-step wizard with conditional steps based on mode and avisIrConnu.
 * Uses useFiscalContext({ strict: true }) for live fiscal params.
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

const STEP_LABELS = ['Mode', 'Avis IR', 'Revenus', 'Synthèse'] as const;

export default function PerPotentielSimulator(): React.ReactElement {
  const { fiscalContext, loading, error } = useFiscalContext({ strict: true });
  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();

  const {
    state, result,
    setMode, setAvisIrConnu, updateAvisIr,
    updateSituation, updateDeclarant,
    setVersementEnvisage,
    nextStep, prevStep, reset,
    canGoNext, showAvisStep, isCouple,
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
      <div className="per-page">
        <p style={{ color: 'var(--color-c9)', textAlign: 'center', padding: '3rem' }}>
          Chargement des paramètres fiscaux...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="per-page">
        <p style={{ color: 'var(--color-c1)', textAlign: 'center', padding: '3rem' }}>
          Erreur : {error}
        </p>
      </div>
    );
  }

  const visibleSteps: readonly number[] = showAvisStep
    ? [1, 2, 3, 4]
    : [1, 3, 4];

  const stepIndex = visibleSteps.indexOf(state.step);
  const exportOptions = [
    { label: 'Excel', onClick: exportExcel, disabled: !result || state.step !== 4 },
    { label: 'PowerPoint', onClick: exportPowerPoint, disabled: !result || state.step !== 4 },
  ];

  return (
    <div className="per-page">
      <div className="premium-header per-potentiel-header">
        <div>
          <Link to="/sim/per" className="per-back-link">← Retour aux simulateurs PER</Link>
          <h1 className="premium-title">Contrôle du potentiel épargne retraite</h1>
          <p className="premium-subtitle">
            Analysez les plafonds PER, les cases 2042 et l'impact fiscal d'un versement.
          </p>
        </div>
        <div className="sim-header__actions">
          <ExportMenu options={exportOptions} loading={exportLoading} />
        </div>
      </div>

      {/* Stepper */}
      <div className="per-stepper">
        {visibleSteps.map((s, i) => {
          const label = STEP_LABELS[s - 1];
          const isCurrent = s === state.step;
          const isDone = stepIndex > i;
          return (
            <div key={s} className={`per-stepper-item ${isCurrent ? 'per-stepper-item--active' : ''} ${isDone ? 'per-stepper-item--done' : ''}`}>
              <span className="per-stepper-num">{i + 1}</span>
              <span className="per-stepper-label">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Step content */}
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

      {/* Navigation */}
      <div className="per-actions" style={{ marginTop: '1.5rem' }}>
        {state.step > 1 && (
          <button type="button" className="per-btn per-btn--secondary" onClick={prevStep}>
            Retour
          </button>
        )}
        {state.step < 4 && (
          <button type="button" className="per-btn per-btn--primary" onClick={nextStep} disabled={!canGoNext}>
            Continuer
          </button>
        )}
        <button type="button" className="per-btn per-btn--secondary" onClick={reset} style={{ marginLeft: 'auto' }}>
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
