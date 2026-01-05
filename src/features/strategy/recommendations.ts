/**
 * Moteur de recommandations
 * 
 * Génère des recommandations basées sur :
 * - Les objectifs cochés par le client
 * - Les métriques de l'audit (TMI, IFI, patrimoine, etc.)
 */

import type { DossierAudit, ObjectifClient } from '../audit/types';
import type { Recommandation, ProduitType } from './types';

/**
 * Génère les recommandations pour un dossier audit
 */
export function generateRecommendations(dossier: DossierAudit): Recommandation[] {
  const recommandations: Recommandation[] = [];
  const { objectifs, situationFiscale, actifs, passif } = dossier;

  // Métriques clés
  const tmi = situationFiscale.tmi;
  const ifi = situationFiscale.ifi || 0;
  const totalActifs = actifs.reduce((sum, a) => sum + a.valeur, 0);
  const totalPassifs = passif.emprunts.reduce((sum, e) => sum + e.capitalRestantDu, 0);
  const patrimoineNet = totalActifs - totalPassifs;

  // === OBJECTIF : Réduire la fiscalité ===
  if (objectifs.includes('reduire_fiscalite')) {
    if (tmi >= 30) {
      recommandations.push({
        id: 'reco-per-ir',
        titre: 'Optimiser l\'IR via un PER',
        description: `Avec une TMI de ${tmi}%, un Plan Épargne Retraite permet de déduire les versements du revenu imposable et de réduire significativement l'impôt.`,
        objectifsCibles: ['reduire_fiscalite', 'revenus_differes'],
        priorite: 'haute',
        produitsAssocies: ['per'],
        metriquesImpactees: ['IR', 'TMI'],
      });
    }

    if (ifi > 0) {
      recommandations.push({
        id: 'reco-ifi-scpi',
        titre: 'Réduire l\'IFI via des placements financiers',
        description: 'L\'IFI ne porte que sur l\'immobilier. Diversifier vers des SCPI ou des placements financiers peut optimiser la fiscalité patrimoniale.',
        objectifsCibles: ['reduire_fiscalite'],
        priorite: 'moyenne',
        produitsAssocies: ['scpi', 'assurance_vie'],
        metriquesImpactees: ['IFI'],
        warnings: ['À valider : impact global sur le patrimoine'],
      });
    }
  }

  // === OBJECTIF : Protéger le conjoint ===
  if (objectifs.includes('proteger_conjoint')) {
    const hasAV = actifs.some(a => 'type' in a && a.type === 'assurance_vie');
    if (!hasAV || actifs.filter(a => 'type' in a && a.type === 'assurance_vie').length < 2) {
      recommandations.push({
        id: 'reco-av-conjoint',
        titre: 'Souscrire une assurance-vie au profit du conjoint',
        description: 'L\'assurance-vie avec clause bénéficiaire permet de transmettre un capital au conjoint hors succession, avec une fiscalité avantageuse.',
        objectifsCibles: ['proteger_conjoint'],
        priorite: 'haute',
        produitsAssocies: ['assurance_vie'],
        metriquesImpactees: ['Succession'],
      });
    }

    if (dossier.situationFamiliale.situationMatrimoniale === 'marie') {
      recommandations.push({
        id: 'reco-donation-dernier-vivant',
        titre: 'Envisager une donation au dernier vivant',
        description: 'La donation au dernier vivant permet d\'augmenter les droits du conjoint survivant sur la succession.',
        objectifsCibles: ['proteger_conjoint', 'preparer_transmission'],
        priorite: 'haute',
        produitsAssocies: ['donation'],
        metriquesImpactees: ['Succession'],
        warnings: ['Nécessite un acte notarié'],
      });
    }
  }

  // === OBJECTIF : Préparer la transmission ===
  if (objectifs.includes('preparer_transmission')) {
    if (dossier.situationFamiliale.enfants.length > 0) {
      const abattementTotal = dossier.situationFamiliale.enfants.length * 100_000;
      if (patrimoineNet > abattementTotal * 1.5) {
        recommandations.push({
          id: 'reco-donations-graduees',
          titre: 'Mettre en place des donations graduées',
          description: `Avec un patrimoine de ${patrimoineNet.toLocaleString('fr-FR')} €, des donations anticipées permettent d'utiliser les abattements (${abattementTotal.toLocaleString('fr-FR')} € au total) et de réduire les droits de succession.`,
          objectifsCibles: ['preparer_transmission', 'reduire_droits_succession'],
          priorite: 'haute',
          produitsAssocies: ['donation'],
          metriquesImpactees: ['Succession', 'Abattements'],
          warnings: ['Rappel fiscal de 15 ans'],
        });
      }
    }
  }

  // === OBJECTIF : Développer le patrimoine ===
  if (objectifs.includes('developper_patrimoine')) {
    const liquidites = actifs
      .filter(a => 'type' in a && ['compte_courant', 'livret'].includes(a.type))
      .reduce((sum, a) => sum + a.valeur, 0);

    if (liquidites > 50_000) {
      recommandations.push({
        id: 'reco-diversification',
        titre: 'Diversifier les placements',
        description: `Avec ${liquidites.toLocaleString('fr-FR')} € de liquidités, envisager une diversification via PEA, CTO ou SCPI pour optimiser le rendement.`,
        objectifsCibles: ['developper_patrimoine'],
        priorite: 'moyenne',
        produitsAssocies: ['pea', 'cto', 'scpi'],
        metriquesImpactees: ['Rendement', 'Diversification'],
      });
    }
  }

  // === OBJECTIF : Revenus différés (retraite) ===
  if (objectifs.includes('revenus_differes')) {
    recommandations.push({
      id: 'reco-per-retraite',
      titre: 'Préparer la retraite avec un PER',
      description: 'Le PER permet de constituer une épargne retraite tout en bénéficiant d\'une déduction fiscale immédiate.',
      objectifsCibles: ['revenus_differes', 'reduire_fiscalite'],
      priorite: 'haute',
      produitsAssocies: ['per'],
      metriquesImpactees: ['Retraite', 'IR'],
    });
  }

  // === OBJECTIF : Revenus immédiats ===
  if (objectifs.includes('revenus_immediats')) {
    recommandations.push({
      id: 'reco-scpi-revenus',
      titre: 'Générer des revenus via SCPI',
      description: 'Les SCPI permettent de percevoir des revenus fonciers réguliers avec une gestion déléguée.',
      objectifsCibles: ['revenus_immediats'],
      priorite: 'moyenne',
      produitsAssocies: ['scpi', 'immobilier_locatif'],
      metriquesImpactees: ['Revenus'],
    });
  }

  // === OBJECTIF : Réduire droits de succession ===
  if (objectifs.includes('reduire_droits_succession')) {
    recommandations.push({
      id: 'reco-av-succession',
      titre: 'Optimiser la transmission via assurance-vie',
      description: 'L\'assurance-vie bénéficie d\'une fiscalité successorale avantageuse (abattement de 152 500 € par bénéficiaire).',
      objectifsCibles: ['reduire_droits_succession', 'preparer_transmission'],
      priorite: 'haute',
      produitsAssocies: ['assurance_vie'],
      metriquesImpactees: ['Succession'],
    });
  }

  // Tri par priorité
  return recommandations.sort((a, b) => {
    const priorityOrder = { haute: 0, moyenne: 1, basse: 2 };
    return priorityOrder[a.priorite] - priorityOrder[b.priorite];
  });
}

/**
 * Filtre les recommandations par objectif
 */
export function filterRecommendationsByObjectif(
  recommandations: Recommandation[],
  objectif: ObjectifClient
): Recommandation[] {
  return recommandations.filter(r => r.objectifsCibles.includes(objectif));
}

/**
 * Filtre les recommandations par produit
 */
export function filterRecommendationsByProduit(
  recommandations: Recommandation[],
  produit: ProduitType
): Recommandation[] {
  return recommandations.filter(r => r.produitsAssocies.includes(produit));
}
