/**
 * StrategyBuilder - Interface de construction de stratégie
 */

import React, { useState, useEffect } from 'react';
import type { DossierAudit } from '../audit/types';
import type { Strategie, ProduitConfig, ProduitType, Recommandation } from './types';
import { createEmptyStrategie, PRODUIT_LABELS } from './types';
import { generateRecommendations } from './recommendations';
import { calculateBaselineProjection, calculateStrategyProjection, compareScenarios } from './calculations';
import type { ComparaisonScenarios } from './types';
import { generateStrategyPptx } from '../../pptx/strategyPptx';
import { onResetEvent } from '../../utils/reset';
import './StrategyBuilder.css';

interface StrategyBuilderProps {
  dossier: DossierAudit;
}

export default function StrategyBuilder({ dossier }: StrategyBuilderProps): React.ReactElement {
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

  // Calcul des projections quand les produits changent
  useEffect(() => {
    const baseline = calculateBaselineProjection(dossier);
    const strategieProj = calculateStrategyProjection(dossier, strategie.produitsSelectionnes);
    const comp = compareScenarios(baseline, strategieProj);
    setComparaison(comp);
  }, [dossier, strategie.produitsSelectionnes]);

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
      await generateStrategyPptx({ dossier, strategie, comparaison });
    } catch (error) {
      console.error('Erreur export PPTX:', error);
      alert('Erreur lors de l\'export PPTX');
    } finally {
      setIsExportingPptx(false);
    }
  };

  return (
    <div className="strategy-builder">
      {/* Header avec titre et actions */}
      <div className="strategy-header">
        <div>
          <h1>Stratégie Patrimoniale</h1>
          <div className="client-info">
            Client : {dossier.situationFamiliale.mr.prenom} {dossier.situationFamiliale.mr.nom}
          </div>
        </div>
        <button 
          className="chip" 
          onClick={handleExportPptx}
          disabled={isExportingPptx || !comparaison}
          title="Exporter la stratégie en PowerPoint"
        >
          {isExportingPptx ? '⏳ Export...' : '📊 Exporter PPTX'}
        </button>
      </div>

      {/* Recommandations */}
      <div className="section-card">
        <h2>Recommandations</h2>
        {recommandations.length === 0 && (
          <p className="empty-state">Aucune recommandation générée. Vérifiez les objectifs du client.</p>
        )}
        <div className="recommandations-list">
          {recommandations.map(reco => (
            <div key={reco.id} className={`reco-card priority-${reco.priorite}`}>
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
            </div>
          ))}
        </div>
      </div>

      {/* Builder produits */}
      <div className="section-card">
        <div className="section-header">
          <h2>Produits sélectionnés</h2>
          <button className="chip" onClick={() => setShowAddProduit(true)}>
            + Ajouter un produit
          </button>
        </div>

        {strategie.produitsSelectionnes.length === 0 && (
          <p className="empty-state">Aucun produit sélectionné. Cliquez sur "Ajouter un produit" pour commencer.</p>
        )}

        <div className="produits-list">
          {strategie.produitsSelectionnes.map(produit => (
            <div key={produit.id} className="produit-card">
              <div className="produit-header">
                <h3>{produit.libelle}</h3>
                <button 
                  className="btn-remove"
                  onClick={() => handleRemoveProduit(produit.id)}
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
              <div className="produit-form">
                <div className="form-row">
                  <label>Montant initial (€)</label>
                  <input
                    type="number"
                    value={produit.montantInitial || 0}
                    onChange={(e) => handleUpdateProduit(produit.id, { 
                      montantInitial: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div className="form-row">
                  <label>Versements mensuels (€)</label>
                  <input
                    type="number"
                    value={produit.versementsProgrammes || 0}
                    onChange={(e) => handleUpdateProduit(produit.id, { 
                      versementsProgrammes: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div className="form-row">
                  <label>Durée (années)</label>
                  <input
                    type="number"
                    value={produit.dureeAnnees || 10}
                    onChange={(e) => handleUpdateProduit(produit.id, { 
                      dureeAnnees: parseInt(e.target.value) || 10 
                    })}
                  />
                </div>
                <div className="form-row">
                  <label>Rendement estimé (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={produit.tauxRendementEstime || 3}
                    onChange={(e) => handleUpdateProduit(produit.id, { 
                      tauxRendementEstime: parseFloat(e.target.value) || 3 
                    })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparaison scénarios */}
      {comparaison && (
        <div className="section-card">
          <h2>Comparaison des scénarios</h2>
          
          <div className="scenarios-grid">
            <div className="scenario-card">
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

            <div className="scenario-card scenario-strategy">
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

          <div className="ecarts-summary">
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
        </div>
      )}

      {/* Modal ajout produit */}
      {showAddProduit && (
        <div className="modal-overlay" onClick={() => setShowAddProduit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Ajouter un produit</h3>
            <div className="produits-grid">
              {(Object.keys(PRODUIT_LABELS) as ProduitType[]).map(type => (
                <button
                  key={type}
                  className="produit-option"
                  onClick={() => handleAddProduit(type)}
                >
                  {PRODUIT_LABELS[type]}
                </button>
              ))}
            </div>
            <button className="chip" onClick={() => setShowAddProduit(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
