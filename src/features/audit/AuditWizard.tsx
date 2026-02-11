/**
 * AuditWizard - Wizard multi-étapes pour l'audit patrimonial
 */

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import type { DossierAudit, ObjectifClient } from './types';
import { createEmptyDossier, OBJECTIFS_CLIENT_LABELS } from './types';
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
import { SessionGuardContext } from '../../App';
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

// Composants étapes simplifiés (MVP)
interface StepProps {
  dossier: DossierAudit;
  updateDossier: (_updates: Partial<DossierAudit>) => void;
}

function StepFamille({ dossier, updateDossier }: StepProps) {
  const { situationFamiliale } = dossier;

  return (
    <div className="step-form">
      <h2>Situation familiale</h2>
      
      <div className="form-section">
        <h3>Monsieur</h3>
        <div className="form-row">
          <label>Prénom</label>
          <input
            type="text"
            value={situationFamiliale.mr.prenom}
            onChange={(e) => updateDossier({
              situationFamiliale: {
                ...situationFamiliale,
                mr: { ...situationFamiliale.mr, prenom: e.target.value }
              }
            })}
            placeholder="Prénom"
          />
        </div>
        <div className="form-row">
          <label>Nom</label>
          <input
            type="text"
            value={situationFamiliale.mr.nom}
            onChange={(e) => updateDossier({
              situationFamiliale: {
                ...situationFamiliale,
                mr: { ...situationFamiliale.mr, nom: e.target.value }
              }
            })}
            placeholder="Nom"
          />
        </div>
        <div className="form-row">
          <label>Date de naissance</label>
          <input
            type="date"
            value={situationFamiliale.mr.dateNaissance}
            onChange={(e) => updateDossier({
              situationFamiliale: {
                ...situationFamiliale,
                mr: { ...situationFamiliale.mr, dateNaissance: e.target.value }
              }
            })}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Situation</h3>
        <div className="form-row">
          <label>Situation matrimoniale</label>
          <select
            value={situationFamiliale.situationMatrimoniale}
            onChange={(e) => updateDossier({
              situationFamiliale: {
                ...situationFamiliale,
                situationMatrimoniale: e.target.value as typeof situationFamiliale.situationMatrimoniale
              }
            })}
          >
            <option value="celibataire">Célibataire</option>
            <option value="marie">Marié(e)</option>
            <option value="pacse">Pacsé(e)</option>
            <option value="concubinage">Concubinage</option>
            <option value="divorce">Divorcé(e)</option>
            <option value="veuf">Veuf/Veuve</option>
          </select>
        </div>

        {['marie', 'pacse', 'concubinage'].includes(situationFamiliale.situationMatrimoniale) && (
          <div className="form-section">
            <h3>Madame / Partenaire</h3>
            <div className="form-row">
              <label>Prénom</label>
              <input
                type="text"
                value={situationFamiliale.mme?.prenom || ''}
                onChange={(e) => updateDossier({
                  situationFamiliale: {
                    ...situationFamiliale,
                    mme: { 
                      ...situationFamiliale.mme || { nom: '', dateNaissance: '' },
                      prenom: e.target.value 
                    }
                  }
                })}
                placeholder="Prénom"
              />
            </div>
            <div className="form-row">
              <label>Nom</label>
              <input
                type="text"
                value={situationFamiliale.mme?.nom || ''}
                onChange={(e) => updateDossier({
                  situationFamiliale: {
                    ...situationFamiliale,
                    mme: { 
                      ...situationFamiliale.mme || { prenom: '', dateNaissance: '' },
                      nom: e.target.value 
                    }
                  }
                })}
                placeholder="Nom"
              />
            </div>
            <div className="form-row">
              <label>Date de naissance</label>
              <input
                type="date"
                value={situationFamiliale.mme?.dateNaissance || ''}
                onChange={(e) => updateDossier({
                  situationFamiliale: {
                    ...situationFamiliale,
                    mme: { 
                      ...situationFamiliale.mme || { prenom: '', nom: '' },
                      dateNaissance: e.target.value 
                    }
                  }
                })}
              />
            </div>
          </div>
        )}

        <div className="form-row">
          <label>Nombre d'enfants</label>
          <input
            type="number"
            min="0"
            value={situationFamiliale.enfants.length}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 0;
              const current = situationFamiliale.enfants;
              let newEnfants = [...current];
              
              if (count > current.length) {
                for (let i = current.length; i < count; i++) {
                  newEnfants.push({ prenom: '', dateNaissance: '', estCommun: true });
                }
              } else {
                newEnfants = newEnfants.slice(0, count);
              }
              
              updateDossier({
                situationFamiliale: { ...situationFamiliale, enfants: newEnfants }
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StepCivil({ dossier, updateDossier }: StepProps) {
  const { situationCivile, situationFamiliale } = dossier;
  const isMarie = situationFamiliale.situationMatrimoniale === 'marie';

  return (
    <div className="step-form">
      <h2>Situation civile</h2>
      
      {isMarie && (
        <div className="form-section">
          <h3>Régime matrimonial</h3>
          <div className="form-row">
            <label>Régime</label>
            <select
              value={situationCivile.regimeMatrimonial || ''}
              onChange={(e) => updateDossier({
                situationCivile: {
                  ...situationCivile,
                  regimeMatrimonial: e.target.value as typeof situationCivile.regimeMatrimonial
                }
              })}
            >
              <option value="">Sélectionner...</option>
              <option value="communaute_legale">Communauté réduite aux acquêts</option>
              <option value="communaute_universelle">Communauté universelle</option>
              <option value="separation_biens">Séparation de biens</option>
              <option value="participation_acquets">Participation aux acquêts</option>
            </select>
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={situationCivile.contratMariage}
                onChange={(e) => updateDossier({
                  situationCivile: { ...situationCivile, contratMariage: e.target.checked }
                })}
              />
              Contrat de mariage
            </label>
          </div>
        </div>
      )}

      <div className="form-section">
        <h3>Donations antérieures</h3>
        <p className="form-hint">Les donations réalisées au cours des 15 dernières années.</p>
        <button 
          className="chip"
          onClick={() => updateDossier({
            situationCivile: {
              ...situationCivile,
              donations: [...situationCivile.donations, {
                id: crypto.randomUUID(),
                type: 'donation_simple',
                date: '',
                montant: 0,
                beneficiaire: ''
              }]
            }
          })}
        >
          + Ajouter une donation
        </button>
        {situationCivile.donations.map((don, idx) => (
          <div key={don.id} className="form-card">
            <div className="form-row">
              <label>Montant</label>
              <input
                type="number"
                value={don.montant}
                onChange={(e) => {
                  const newDonations = [...situationCivile.donations];
                  newDonations[idx] = { ...don, montant: parseFloat(e.target.value) || 0 };
                  updateDossier({ situationCivile: { ...situationCivile, donations: newDonations } });
                }}
              />
            </div>
            <div className="form-row">
              <label>Bénéficiaire</label>
              <input
                type="text"
                value={don.beneficiaire}
                onChange={(e) => {
                  const newDonations = [...situationCivile.donations];
                  newDonations[idx] = { ...don, beneficiaire: e.target.value };
                  updateDossier({ situationCivile: { ...situationCivile, donations: newDonations } });
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepActifs({ dossier, updateDossier }: StepProps) {
  const { actifs } = dossier;
  const totalActifs = actifs.reduce((sum, a) => sum + a.valeur, 0);

  return (
    <div className="step-form">
      <h2>Actifs</h2>
      <div className="summary-bar">
        Total actifs : <strong>{totalActifs.toLocaleString('fr-FR')} €</strong>
      </div>

      <button 
        className="chip"
        onClick={() => updateDossier({
          actifs: [...actifs, {
            id: crypto.randomUUID(),
            libelle: '',
            valeur: 0,
            proprietaire: 'commun',
            type: 'autre_financier'
          }]
        })}
      >
        + Ajouter un actif
      </button>

      {actifs.map((actif, idx) => (
        <div key={actif.id} className="form-card">
          <div className="form-row">
            <label>Libellé</label>
            <input
              type="text"
              value={actif.libelle}
              onChange={(e) => {
                const newActifs = [...actifs];
                newActifs[idx] = { ...actif, libelle: e.target.value };
                updateDossier({ actifs: newActifs });
              }}
              placeholder="Ex: Résidence principale"
            />
          </div>
          <div className="form-row">
            <label>Valeur (€)</label>
            <input
              type="number"
              value={actif.valeur}
              onChange={(e) => {
                const newActifs = [...actifs];
                newActifs[idx] = { ...actif, valeur: parseFloat(e.target.value) || 0 };
                updateDossier({ actifs: newActifs });
              }}
            />
          </div>
          <div className="form-row">
            <label>Propriétaire</label>
            <select
              value={actif.proprietaire}
              onChange={(e) => {
                const newActifs = [...actifs];
                newActifs[idx] = { ...actif, proprietaire: e.target.value as typeof actif.proprietaire };
                updateDossier({ actifs: newActifs });
              }}
            >
              <option value="mr">Monsieur</option>
              <option value="mme">Madame</option>
              <option value="commun">Communauté</option>
              <option value="indivision">Indivision</option>
            </select>
          </div>
          <button 
            className="chip chip-small chip-danger"
            onClick={() => {
              updateDossier({ actifs: actifs.filter((_, i) => i !== idx) });
            }}
          >
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}

function StepPassif({ dossier, updateDossier }: StepProps) {
  const { passif } = dossier;
  const totalPassif = passif.emprunts.reduce((sum, e) => sum + e.capitalRestantDu, 0);

  return (
    <div className="step-form">
      <h2>Passif</h2>
      <div className="summary-bar">
        Total emprunts CRD : <strong>{totalPassif.toLocaleString('fr-FR')} €</strong>
      </div>

      <button 
        className="chip"
        onClick={() => updateDossier({
          passif: {
            ...passif,
            emprunts: [...passif.emprunts, {
              id: crypto.randomUUID(),
              libelle: '',
              type: 'immobilier',
              capitalInitial: 0,
              capitalRestantDu: 0,
              mensualite: 0,
              tauxInteret: 0,
              dateDebut: '',
              dateFin: ''
            }]
          }
        })}
      >
        + Ajouter un emprunt
      </button>

      {passif.emprunts.map((emprunt, idx) => (
        <div key={emprunt.id} className="form-card">
          <div className="form-row">
            <label>Libellé</label>
            <input
              type="text"
              value={emprunt.libelle}
              onChange={(e) => {
                const newEmprunts = [...passif.emprunts];
                newEmprunts[idx] = { ...emprunt, libelle: e.target.value };
                updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
              }}
              placeholder="Ex: Crédit résidence principale"
            />
          </div>
          <div className="form-row">
            <label>Capital restant dû (€)</label>
            <input
              type="number"
              value={emprunt.capitalRestantDu}
              onChange={(e) => {
                const newEmprunts = [...passif.emprunts];
                newEmprunts[idx] = { ...emprunt, capitalRestantDu: parseFloat(e.target.value) || 0 };
                updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
              }}
            />
          </div>
          <div className="form-row">
            <label>Mensualité (€)</label>
            <input
              type="number"
              value={emprunt.mensualite}
              onChange={(e) => {
                const newEmprunts = [...passif.emprunts];
                newEmprunts[idx] = { ...emprunt, mensualite: parseFloat(e.target.value) || 0 };
                updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
              }}
            />
          </div>
          <div className="form-row">
            <label>Date de fin</label>
            <input
              type="date"
              value={emprunt.dateFin}
              onChange={(e) => {
                const newEmprunts = [...passif.emprunts];
                newEmprunts[idx] = { ...emprunt, dateFin: e.target.value };
                updateDossier({ passif: { ...passif, emprunts: newEmprunts } });
              }}
            />
          </div>
          <button 
            className="chip chip-small chip-danger"
            onClick={() => {
              updateDossier({ 
                passif: { 
                  ...passif, 
                  emprunts: passif.emprunts.filter((_, i) => i !== idx) 
                } 
              });
            }}
          >
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}

function StepFiscalite({ dossier, updateDossier }: StepProps) {
  const { situationFiscale } = dossier;

  return (
    <div className="step-form">
      <h2>Fiscalité</h2>
      
      <div className="form-section">
        <h3>Impôt sur le revenu</h3>
        <div className="form-row">
          <label>Année de référence</label>
          <input
            type="number"
            value={situationFiscale.anneeReference}
            onChange={(e) => updateDossier({
              situationFiscale: { 
                ...situationFiscale, 
                anneeReference: parseInt(e.target.value) || new Date().getFullYear() - 1 
              }
            })}
          />
        </div>
        <div className="form-row">
          <label>Revenu fiscal de référence (€)</label>
          <input
            type="number"
            value={situationFiscale.revenuFiscalReference}
            onChange={(e) => updateDossier({
              situationFiscale: { 
                ...situationFiscale, 
                revenuFiscalReference: parseFloat(e.target.value) || 0 
              }
            })}
          />
        </div>
        <div className="form-row">
          <label>Nombre de parts</label>
          <input
            type="number"
            step="0.5"
            min="1"
            value={situationFiscale.nombreParts}
            onChange={(e) => updateDossier({
              situationFiscale: { 
                ...situationFiscale, 
                nombreParts: parseFloat(e.target.value) || 1 
              }
            })}
          />
        </div>
        <div className="form-row">
          <label>Impôt sur le revenu (€)</label>
          <input
            type="number"
            value={situationFiscale.impotRevenu}
            onChange={(e) => updateDossier({
              situationFiscale: { 
                ...situationFiscale, 
                impotRevenu: parseFloat(e.target.value) || 0 
              }
            })}
          />
        </div>
        <div className="form-row">
          <label>TMI (%)</label>
          <select
            value={situationFiscale.tmi}
            onChange={(e) => updateDossier({
              situationFiscale: { 
                ...situationFiscale, 
                tmi: parseInt(e.target.value) || 0 
              }
            })}
          >
            <option value="0">0%</option>
            <option value="11">11%</option>
            <option value="30">30%</option>
            <option value="41">41%</option>
            <option value="45">45%</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3>Autres impôts</h3>
        <div className="form-row">
          <label>IFI (€)</label>
          <input
            type="number"
            value={situationFiscale.ifi || 0}
            onChange={(e) => updateDossier({
              situationFiscale: { 
                ...situationFiscale, 
                ifi: parseFloat(e.target.value) || 0 
              }
            })}
          />
        </div>
      </div>
    </div>
  );
}

function StepObjectifs({ dossier, updateDossier }: StepProps) {
  const { objectifs, actifs } = dossier;
  
  // Détecte si le client a une entreprise
  const hasEntreprise = actifs.some(a => 'type' in a && a.type === 'entreprise');
  
  const allObjectifs: ObjectifClient[] = [
    'proteger_conjoint',
    'proteger_proches',
    'proteger_revenus_sante',
    ...(hasEntreprise ? ['proteger_entreprise', 'proteger_associes'] as ObjectifClient[] : []),
    'preparer_transmission',
    'developper_patrimoine',
    'revenus_differes',
    'revenus_immediats',
    'reduire_fiscalite',
    'reduire_droits_succession',
  ];

  const toggleObjectif = (obj: ObjectifClient) => {
    const newObjectifs = objectifs.includes(obj)
      ? objectifs.filter(o => o !== obj)
      : [...objectifs, obj];
    updateDossier({ objectifs: newObjectifs });
  };

  return (
    <div className="step-form">
      <h2>Objectifs client</h2>
      <p className="form-hint">Sélectionnez les objectifs prioritaires du client.</p>
      
      <div className="objectifs-grid">
        {allObjectifs.map(obj => (
          <label key={obj} className={`objectif-card ${objectifs.includes(obj) ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={objectifs.includes(obj)}
              onChange={() => toggleObjectif(obj)}
            />
            <span>{OBJECTIFS_CLIENT_LABELS[obj]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
