/**
 * Theme Settings - Gestion des couleurs et de la charte graphique
 *
 * Source de vérité unique pour les tokens C1-C10
 * Tous les consommateurs doivent importer depuis ce fichier
 */

/** Tokens C1-C10 (format plat pour compatibilité existante) */
export interface ThemeColors {
  c1: string; // Ancrage
  c2: string; // Action primaire
  c3: string; // Marqueur actif
  c4: string; // Fill doux
  c5: string; // Données secondaires
  c6: string; // Signature
  c7: string; // Surface page
  c8: string; // Bordures et séparateurs
  c9: string; // Texte secondaire
  c10: string; // Texte primaire
}

/** Valeurs par défaut SER1 Cuivre tranché - SOURCE DE VÉRITÉ */
export const DEFAULT_COLORS: ThemeColors = {
  c1: '#0E1426',
  c2: '#1F3056',
  c3: '#5B73A0',
  c4: '#C6CFE2',
  c5: '#475061',
  c6: '#C2733A',
  c7: '#F2EEE8',
  c8: '#C9CCDA',
  c9: '#424659',
  c10: '#060A18',
};
