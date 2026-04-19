/**
 * AuditWizard - Wizard multi-étapes pour l'audit patrimonial
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExportMenu } from '../../components/ExportMenu';
import type { ExportOption } from '../../components/export/exportTypes';
import type { DossierAudit } from './types';
import { createEmptyDossier } from './types';
import {
  exportDossierToFile,
  importDossierFromFile,
  saveDraftToSession,
  loadDraftFromSession,
  clearDraftFromSession,
  setupBeforeUnloadWarning,
} from './utils/storage';
import { exportAuditPptx } from './export/exportAudit';
import { useTheme } from '../../settings/ThemeProvider';
import { onResetEvent } from '../../utils/reset';
import StepActifs from './components/steps/StepActifs';
import StepCivil from './components/steps/StepCivil';
import StepFamille from './components/steps/StepFamille';
import StepFiscalite from './components/steps/StepFiscalite';
import StepObjectifs from './components/steps/StepObjectifs';
import StepPassif from './components/steps/StepPassif';
import '@/styles/sim/index.css';
import './styles/index.css';

// Événements globaux pour Save/Load depuis la Topbar
const SAVE_EVENT = 'ser1:save';
const LOAD_EVENT = 'ser1:load';

// Étapes du wizard (icônes sobres numérotées)
const STEPS = [
  { id: 'famille', label: 'Situation familiale', num: 1 },
  { id: 'civil', label: 'Situation civile', num: 2 },
  { id: 'actifs', label: 'Actifs', num: 3 },
  { id: 'passif', label: 'Passif', num: 4 },
  { id: 'fiscalite', label: 'Fiscalité', num: 5 },
  { id: 'objectifs', label: 'Objectifs', num: 6 },
] as const;

type StepId = typeof STEPS[number]['id'];

export default function AuditWizard(): React.ReactElement {
  const { colors } = useTheme();
  const [dossier, setDossier] = useState<DossierAudit>(() => {
    const draft = loadDraftFromSession();
    return draft || createEmptyDossier();
  });
  const [currentStep, setCurrentStep] = useState<StepId>('famille');
  const [hasChanges, setHasChanges] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sauvegarde automatique en session
  useEffect(() => {
    if (hasChanges) {
      saveDraftToSession(dossier);
    }
  }, [dossier, hasChanges]);

  // Alerte avant de quitter
  useEffect(() => {
    const cleanup = setupBeforeUnloadWarning(() => hasChanges);
    return cleanup;
  }, [hasChanges]);

  // Écoute de l'événement reset depuis la topbar
  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId: string }) => {
      if (simId === 'audit') {
        // Reset complet : state + storage
        clearDraftFromSession();
        setDossier(createEmptyDossier());
        setHasChanges(false);
        setCurrentStep('famille');
      }
    });
    return off || (() => {});
  }, []);

  const handleExport = useCallback(() => {
    exportDossierToFile(dossier);
    setHasChanges(false);
  }, [dossier]);

  // Écoute de l'événement Save depuis la Topbar
  useEffect(() => {
    const handler = () => {
      if (window.location.pathname === '/audit') {
        handleExport();
      }
    };
    window.addEventListener(SAVE_EVENT, handler);
    return () => window.removeEventListener(SAVE_EVENT, handler);
  }, [handleExport]);

  // Écoute de l'événement Load depuis la Topbar
  useEffect(() => {
    const handler = () => {
      if (window.location.pathname === '/audit') {
        fileInputRef.current?.click();
      }
    };
    window.addEventListener(LOAD_EVENT, handler);
    return () => window.removeEventListener(LOAD_EVENT, handler);
  }, []);

  const updateDossier = useCallback((updates: Partial<DossierAudit>) => {
    setDossier(prev => ({
      ...prev,
      ...updates,
      dateModification: new Date().toISOString(),
    }));
    setHasChanges(true);
  }, []);

  const handleExportPptx = async () => {
    try {
      setIsExportingPptx(true);
      await exportAuditPptx({ dossier, colors });
    } catch (error) {
      console.error('Erreur export PPTX:', error);
      alert('Erreur lors de l\'export PPTX');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importDossierFromFile(file);
      setDossier(imported);
      setHasChanges(false);
      alert('Dossier importé avec succès');
    } catch (error) {
      alert((error as Error).message);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const canGoNext = currentStepIndex < STEPS.length - 1;
  const canGoPrev = currentStepIndex > 0;
  const exportOptions: ExportOption[] = [
    {
      label: 'PowerPoint (.pptx)',
      onClick: handleExportPptx,
      disabled: isExportingPptx,
    },
  ];

  return (
    <div className="audit-wizard premium-page">
      <header className="audit-header premium-header">
        <div className="audit-header-copy">
          <p className="premium-section-title">Workflow privé P6</p>
          <h1 className="premium-title">Audit patrimonial</h1>
          <p className="premium-subtitle audit-subtitle">
            Dossier guidé, persistant en session, exportable et utilisé comme point d’entrée de la stratégie.
          </p>
        </div>
        <div className="audit-header-actions">
          <ExportMenu
            options={exportOptions}
            loading={isExportingPptx}
            loadingLabel="Export PPTX..."
          />
        </div>
      </header>

      <div className="audit-shell">
        {/* Input file caché pour l'import via Topbar */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="audit-hidden-input"
        />

        {/* Indicateur de changements non sauvegardés */}
        {hasChanges && (
          <div className="audit-unsaved-warning" role="status">
            <span aria-hidden="true">⚠️</span>
            <span>Modifications non exportées</span>
          </div>
        )}

        {/* Barre de progression sobre */}
        <div className="audit-progress">
          <div className="audit-progress__bar">
            <div
              className="audit-progress__fill"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <span className="audit-progress__text">Étape {currentStepIndex + 1} sur {STEPS.length}</span>
        </div>

        {/* Navigation étapes sobre */}
        <div className="audit-steps-nav" aria-label="Étapes de l'audit">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`audit-step-pill ${currentStep === step.id ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
              onClick={() => setCurrentStep(step.id)}
            >
              <span className="audit-step-num">{step.num}</span>
              <span className="audit-step-label">{step.label}</span>
            </button>
          ))}
        </div>

        {/* Contenu étape */}
        <div className="audit-step-content premium-card">
          {currentStep === 'famille' && (
            <StepFamille dossier={dossier} updateDossier={updateDossier} />
          )}
          {currentStep === 'civil' && (
            <StepCivil dossier={dossier} updateDossier={updateDossier} />
          )}
          {currentStep === 'actifs' && (
            <StepActifs dossier={dossier} updateDossier={updateDossier} />
          )}
          {currentStep === 'passif' && (
            <StepPassif dossier={dossier} updateDossier={updateDossier} />
          )}
          {currentStep === 'fiscalite' && (
            <StepFiscalite dossier={dossier} updateDossier={updateDossier} />
          )}
          {currentStep === 'objectifs' && (
            <StepObjectifs dossier={dossier} updateDossier={updateDossier} />
          )}
        </div>

        {/* Navigation bas */}
        <div className="audit-step-navigation">
          <button
            type="button"
            className="premium-btn"
            onClick={() => setCurrentStep(STEPS[currentStepIndex - 1].id)}
            disabled={!canGoPrev}
          >
            Précédent
          </button>
          <button
            type="button"
            className="premium-btn premium-btn-primary"
            onClick={() => setCurrentStep(STEPS[currentStepIndex + 1].id)}
            disabled={!canGoNext}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
