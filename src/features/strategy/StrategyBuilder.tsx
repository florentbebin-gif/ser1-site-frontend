/**
 * StrategyBuilder - Interface de construction de stratégie
 */

import React, { useId, useState, useEffect } from 'react';
import { ExportMenu } from '../../components/ExportMenu';
import type { ExportOption } from '../../components/export/exportTypes';
import { SimFieldShell, SimModalShell } from '../../components/ui/sim';
import type { DossierAudit } from '../audit/types';
import type { Strategie, ProduitConfig, ProduitType, Recommandation } from './types';
import { createEmptyStrategie, PRODUIT_LABELS } from './types';
import { generateRecommendations } from './recommendations';
import { calculateBaselineProjection, calculateStrategyProjection, compareScenarios } from './calculations';
import { useFiscalContext } from '../../hooks/useFiscalContext';
import type { ComparaisonScenarios } from './types';
import { exportStrategyPptx } from './exportStrategy';
import { onResetEvent } from '../../utils/reset';
import './StrategyBuilder.css';

interface StrategyBuilderProps {
  dossier: DossierAudit;
}

interface StrategyNumericFieldProps {
  label: string;
  value: number | undefined;
  unit?: string;
  step?: number | string;
  fallbackValue: number;
  integer?: boolean;
  onChange: (value: number) => void;
}

function parseStrategyNumericValue(rawValue: string, fallbackValue: number, integer = false): number {
  const parsedValue = integer
    ? Number.parseInt(rawValue, 10)
    : Number.parseFloat(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function StrategyNumericField({
  label,
  value,
  unit,
  step,
  fallbackValue,
  integer = false,
  onChange,
}: StrategyNumericFieldProps): React.ReactElement {
  const controlId = useId();

  return (
    <SimFieldShell
      label={label}
      controlId={controlId}
      className="strategy-field"
      rowClassName="strategy-field__row"
    >
      <input
        id={controlId}
        type="number"
        inputMode={integer ? 'numeric' : 'decimal'}
        min="0"
        step={step}
        value={value ?? fallbackValue}
        className="strategy-field__control sim-field__control"
        onChange={(event) => onChange(parseStrategyNumericValue(event.target.value, fallbackValue, integer))}
      />
      {unit ? <span className="strategy-field__unit sim-field__unit">{unit}</span> : null}
    </SimFieldShell>
  );
}

export default function StrategyBuilder({ dossier }: StrategyBuilderProps): React.ReactElement {
  const { fiscalContext } = useFiscalContext();
  const [strategie, setStrategie] = useState<Strategie>(() => createEmptyStrategie(dossier.id));
  const [recommandations, setRecommandations] = useState<Recommandation[]>([]);
  const [comparaison, setComparaison] = useState<ComparaisonScenarios | null>(null);
  const [showAddProduit, setShowAddProduit] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);

  // Génération des recommandations au montage
  useEffect(() => {
    const recos = generateRecommendations(dossier);
    setRecommandations(recos);
    setStrategie(prev => ({ ...prev, recommandations: recos }));
  }, [dossier]);

  // Calcul des projections quand les produits ou les paramètres fiscaux changent
  useEffect(() => {
    const baseline = calculateBaselineProjection(dossier, fiscalContext);
    const strategieProj = calculateStrategyProjection(dossier, strategie.produitsSelectionnes, fiscalContext);
    const comp = compareScenarios(baseline, strategieProj);
    setComparaison(comp);
  }, [dossier, strategie.produitsSelectionnes, fiscalContext]);

  // Écoute de l'événement reset depuis la topbar
  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId: string }) => {
      if (simId === 'strategy') {
        setStrategie(createEmptyStrategie(dossier.id));
      }
    });
    return off || (() => {});
  }, [dossier.id]);

  const handleAddProduit = (type: ProduitType) => {
    const newProduit: ProduitConfig = {
      id: crypto.randomUUID(),
      type,
      libelle: PRODUIT_LABELS[type],
      montantInitial: 0,
      versementsProgrammes: 0,
      dureeAnnees: 10,
      tauxRendementEstime: 3,
    };

    setStrategie(prev => ({
      ...prev,
      produitsSelectionnes: [...prev.produitsSelectionnes, newProduit],
      dateModification: new Date().toISOString(),
    }));
    setShowAddProduit(false);
  };

  const handleUpdateProduit = (id: string, updates: Partial<ProduitConfig>) => {
    setStrategie(prev => ({
      ...prev,
      produitsSelectionnes: prev.produitsSelectionnes.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
      dateModification: new Date().toISOString(),
    }));
  };

  const handleRemoveProduit = (id: string) => {
    setStrategie(prev => ({
      ...prev,
      produitsSelectionnes: prev.produitsSelectionnes.filter(p => p.id !== id),
      dateModification: new Date().toISOString(),
    }));
  };

  const handleExportPptx = async () => {
    if (!comparaison) return;
    try {
      setIsExportingPptx(true);
      await exportStrategyPptx({ dossier, strategie, comparaison });
    } catch (error) {
      console.error('Erreur export PPTX:', error);
      alert('Erreur lors de l\'export PPTX');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const exportOptions: ExportOption[] = [
    {
      label: 'PowerPoint (.pptx)',
      onClick: handleExportPptx,
      disabled: isExportingPptx || !comparaison,
      tooltip: !comparaison ? 'Ajoutez au moins un produit avant d’exporter.' : undefined,
    },
  ];

  return (
    <div className="strategy-builder premium-page" data-testid="strategy-page">
      {/* Header avec titre et actions */}
      <header className="strategy-header premium-header">
        <div className="strategy-header-copy">
          <p className="premium-section-title">Workflow privé P7</p>
          <h1 className="premium-title">Stratégie patrimoniale</h1>
          <p className="premium-subtitle strategy-subtitle">
            Recommandations et scénarios construits à partir du dossier d&apos;audit courant.
          </p>
          <div className="client-info">
            Client : {dossier.situationFamiliale.mr.prenom} {dossier.situationFamiliale.mr.nom}
          </div>
        </div>
        <div className="strategy-header-actions">
          <ExportMenu
            options={exportOptions}
            loading={isExportingPptx}
            loadingLabel="Export PPTX..."
          />
        </div>
      </header>

      {/* Recommandations */}
      <section className="strategy-section premium-card">
        <div className="strategy-section-heading">
          <div>
            <p className="premium-section-title">Pistes</p>
            <h2>Recommandations</h2>
          </div>
        </div>
        {recommandations.length === 0 && (
          <p className="empty-state">Aucune recommandation générée. Vérifiez les objectifs du client.</p>
        )}
        <div className="recommandations-list">
          {recommandations.map(reco => (
            <article key={reco.id} className={`reco-card premium-card-compact priority-${reco.priorite}`}>
              <div className="reco-header">
                <h3>{reco.titre}</h3>
                <span className={`badge badge-${reco.priorite}`}>{reco.priorite}</span>
              </div>
              <p>{reco.description}</p>
              <div className="reco-meta">
                <div className="reco-tags">
                  {reco.produitsAssocies.map(p => (
                    <span key={p} className="tag">{PRODUIT_LABELS[p]}</span>
                  ))}
                </div>
                {reco.warnings && reco.warnings.length > 0 && (
                  <div className="reco-warnings">
                    {reco.warnings.map((w, idx) => (
                      <div key={idx} className="warning">⚠️ {w}</div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Builder produits */}
      <section className="strategy-section premium-card">
        <div className="strategy-section-heading">
          <div>
            <p className="premium-section-title">Scénario cible</p>
            <h2>Produits sélectionnés</h2>
          </div>
          <button type="button" className="premium-btn" onClick={() => setShowAddProduit(true)}>
            + Ajouter un produit
          </button>
        </div>

        {strategie.produitsSelectionnes.length === 0 && (
          <p className="empty-state">Aucun produit sélectionné. Cliquez sur « Ajouter un produit » pour commencer.</p>
        )}

        <div className="produits-list">
          {strategie.produitsSelectionnes.map(produit => (
            <article key={produit.id} className="produit-card premium-card-compact">
              <div className="produit-header">
                <h3>{produit.libelle}</h3>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveProduit(produit.id)}
                  title="Supprimer ce produit"
                >
                  ×
                </button>
              </div>
              <div className="produit-form">
                <StrategyNumericField
                  label="Montant initial"
                  value={produit.montantInitial}
                  unit="€"
                  fallbackValue={0}
                  onChange={(montantInitial) => handleUpdateProduit(produit.id, { montantInitial })}
                />
                <StrategyNumericField
                  label="Versements mensuels"
                  value={produit.versementsProgrammes}
                  unit="€"
                  fallbackValue={0}
                  onChange={(versementsProgrammes) => handleUpdateProduit(produit.id, { versementsProgrammes })}
                />
                <StrategyNumericField
                  label="Durée"
                  value={produit.dureeAnnees}
                  unit="ans"
                  fallbackValue={10}
                  integer
                  onChange={(dureeAnnees) => handleUpdateProduit(produit.id, { dureeAnnees })}
                />
                <StrategyNumericField
                  label="Rendement estimé"
                  value={produit.tauxRendementEstime}
                  unit="%"
                  step="0.1"
                  fallbackValue={3}
                  onChange={(tauxRendementEstime) => handleUpdateProduit(produit.id, { tauxRendementEstime })}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Comparaison scénarios */}
      {comparaison && (
        <section className="strategy-section premium-card">
          <div className="strategy-section-heading">
            <div>
              <p className="premium-section-title">Comparatif</p>
              <h2>Comparaison des scénarios</h2>
            </div>
          </div>

          <div className="scenarios-grid">
            <div className="scenario-card premium-card-compact">
              <h3>Situation actuelle</h3>
              <div className="scenario-metric">
                <span className="metric-label">Patrimoine dans 10 ans</span>
                <span className="metric-value">
                  {comparaison.baseline.projections[10].patrimoineTotal.toLocaleString('fr-FR')} €
                </span>
              </div>
              <div className="scenario-metric">
                <span className="metric-label">IR cumulé sur 10 ans</span>
                <span className="metric-value">
                  {comparaison.baseline.projections.reduce((s, p) => s + p.impotRevenu, 0).toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>

            <div className="scenario-card premium-card-compact scenario-strategy">
              <h3>Avec stratégie CGP</h3>
              <div className="scenario-metric">
                <span className="metric-label">Patrimoine dans 10 ans</span>
                <span className="metric-value">
                  {comparaison.strategie.projections[10].patrimoineTotal.toLocaleString('fr-FR')} €
                </span>
              </div>
              <div className="scenario-metric">
                <span className="metric-label">IR cumulé sur 10 ans</span>
                <span className="metric-value">
                  {comparaison.strategie.projections.reduce((s, p) => s + p.impotRevenu, 0).toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>
          </div>

          <div className="ecarts-summary premium-card-compact">
            <h3>Gains de la stratégie</h3>
            <div className="ecart-item">
              <span>Gain patrimonial :</span>
              <strong className={comparaison.ecarts.patrimoineTotal > 0 ? 'positive' : 'negative'}>
                {comparaison.ecarts.patrimoineTotal > 0 ? '+' : ''}
                {comparaison.ecarts.patrimoineTotal.toLocaleString('fr-FR')} €
              </strong>
            </div>
            <div className="ecart-item">
              <span>Économie d'impôts :</span>
              <strong className={comparaison.ecarts.economieImpots > 0 ? 'positive' : 'negative'}>
                {comparaison.ecarts.economieImpots > 0 ? '+' : ''}
                {comparaison.ecarts.economieImpots.toLocaleString('fr-FR')} €
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* Modal ajout produit */}
      {showAddProduit && (
        <SimModalShell
          title="Ajouter un produit"
          subtitle="Complétez d’abord le dossier d’audit, puis sélectionnez les produits à projeter."
          modalClassName="strategy-modal"
          bodyClassName="strategy-modal__body"
          footerClassName="strategy-modal__footer"
          onClose={() => setShowAddProduit(false)}
          footer={(
            <button type="button" className="premium-btn" onClick={() => setShowAddProduit(false)}>
              Annuler
            </button>
          )}
        >
          <div className="strategy-modal__copy">
            <p className="premium-section-title">Catalogue MVP</p>
          </div>
          <div className="produits-grid">
            {(Object.keys(PRODUIT_LABELS) as ProduitType[]).map(type => (
              <button
                key={type}
                type="button"
                className="produit-option"
                onClick={() => handleAddProduit(type)}
              >
                {PRODUIT_LABELS[type]}
              </button>
            ))}
          </div>
        </SimModalShell>
      )}
    </div>
  );
}
