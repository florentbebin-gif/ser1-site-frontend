/// <reference types="vite/client" />

/**
 * Déclarations de types globaux pour SER1
 */

/** Tokens de couleurs C1-C10 */
interface ThemeColors {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    /** Bootstrap thème injecté avant le rendu React pour éviter le FOUC */
    __ser1ThemeBootstrap?: {
      colors: ThemeColors;
      userId?: string;
    };
  }
}

export {};
