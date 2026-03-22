/**
 * AuditWizard - Wizard multi-étapes pour l'audit patrimonial
 */

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import type { DossierAudit } from './types';
import { createEmptyDossier } from './types';
import {
  exportDossierToFile,
  importDossierFromFile,
  saveDraftToSession,
  loadDraftFromSession,
  clearDraftFromSession,
  setupBeforeUnloadWarning,
} from './storage';
import { generateAuditPptx } from '../../pptx/auditPptx';
import { useTheme } from '../../settings/ThemeProvider';
import { onResetEvent } from '../../utils/reset';
import { SessionGuardContext } from '../../session/sessionGuardContext';
import StepActifs from './steps/StepActifs';
import StepCivil from './steps/StepCivil';
import StepFamille from './steps/StepFamille';
import StepFiscalite from './steps/StepFiscalite';
import StepObjectifs from './steps/StepObjectifs';
import StepPassif from './steps/StepPassif';
import './AuditWizard.css';

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
  const { canExport } = useContext(SessionGuardContext);
  const [dossier, setDossier] = useState<DossierAudit>(() => {
    const draft = loadDraftFromSession();
    return draft || createEmptyDossier();
  });
  const [currentStep, setCurrentStep] = useState<StepId>('famille');
  const [hasChanges, setHasChanges] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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

  // Fermeture menu export au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!exportRef.current) return;
      if (!exportRef.current.contains(e.target as Node)) setExportMenuOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
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
      await generateAuditPptx({ dossier, colors });
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

  return (
    <div className="audit-wizard">
      {/* Header sobre */}
      <div className="audit-header">
        <h1>Audit Patrimonial</h1>
        
        {/* Menu export harmonisé (style /sim/ir) */}
        <div ref={exportRef} className="export-menu-container">
          <button
            type="button"
            className="chip"
            aria-haspopup="menu"
            aria-expanded={exportMenuOpen}
            onClick={() => setExportMenuOpen(v => !v)}
            disabled={!canExport}
            title={!canExport ? 'Session expirée — export indisponible' : undefined}
          >
            Exporter ▾
          </button>
          {exportMenuOpen && (
            <div role="menu" className="export-dropdown">
              <button
                type="button"
                role="menuitem"
                className="export-dropdown-item"
                onClick={() => {
                  setExportMenuOpen(false);
                  handleExportPptx();
                }}
                disabled={isExportingPptx}
              >
                {isExportingPptx ? 'Export en cours...' : 'PowerPoint (.pptx)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input file caché pour l'import via Topbar */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />

      {/* Indicateur de changements non sauvegardés */}
      {hasChanges && (
        <div className="unsaved-warning">
          ⚠️ Modifications non exportées
        </div>
      )}

      {/* Barre de progression sobre */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span className="progress-text">Étape {currentStepIndex + 1} sur {STEPS.length}</span>
      </div>

      {/* Navigation étapes sobre */}
      <div className="steps-nav">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            className={`step-pill ${currentStep === step.id ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
            onClick={() => setCurrentStep(step.id)}
          >
            <span className="step-num">{step.num}</span>
            <span className="step-label">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu étape */}
      <div className="step-content">
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
      <div className="step-navigation">
        <button 
          className="chip chip-secondary" 
          onClick={() => setCurrentStep(STEPS[currentStepIndex - 1].id)}
          disabled={!canGoPrev}
        >
          Précédent
        </button>
        <button 
          className="chip chip-primary" 
          onClick={() => setCurrentStep(STEPS[currentStepIndex + 1].id)}
          disabled={!canGoNext}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
