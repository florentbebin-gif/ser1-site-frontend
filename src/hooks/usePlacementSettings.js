/**
 * usePlacementSettings.js - Hook pour charger les paramètres fiscaux du simulateur Placement
 * 
 * Charge les settings depuis Supabase :
 * - fiscality_settings (AV, PER, barèmes)
 * - ps_settings (prélèvements sociaux)
 * - tax_settings (barème IR, TMI)
 */

import { useState, useEffect, useMemo } from 'react';
import { extractFiscalParams } from '../engine/placementEngine';
import { getFiscalSettings, addInvalidationListener } from '../utils/fiscalSettingsCache.js';
import {
  DEFAULT_TAX_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
} from '../constants/settingsDefaults';


const DEFAULT_TMI_OPTIONS = [
  { value: 0, label: '0 %' },
  { value: 0.11, label: '11 %' },
  { value: 0.30, label: '30 %' },
  { value: 0.41, label: '41 %' },
  { value: 0.45, label: '45 %' },
  { value: 0.50, label: '50 %' },
];

function buildTmiOptionsFromBareme(bareme) {
  const effectiveBareme = Array.isArray(bareme) && bareme.length
    ? bareme
    : DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent;

  if (!effectiveBareme || !effectiveBareme.length) {
    return DEFAULT_TMI_OPTIONS;
  }

  const uniqueRates = Array.from(
    new Set(
      effectiveBareme
        .map((tranche) => (typeof tranche.rate === 'number' ? tranche.rate / 100 : null))
        .filter((rate) => rate !== null && !Number.isNaN(rate))
    )
  ).sort((a, b) => a - b);

  if (!uniqueRates.length) {
    return DEFAULT_TMI_OPTIONS;
  }

  return uniqueRates.map((rate) => ({
    value: rate,
    label: `${Math.round(rate * 100)} %`,
  }));
}

/**
 * Hook pour charger et gérer les settings du simulateur Placement
 * @returns {Object} { fiscalParams, taxSettings, loading, error }
 */
export function usePlacementSettings() {
  const [fiscalitySettings, setFiscalitySettings] = useState(DEFAULT_FISCALITY_SETTINGS);
  const [psSettings, setPsSettings] = useState(DEFAULT_PS_SETTINGS);
  const [taxSettings, setTaxSettings] = useState(DEFAULT_TAX_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const settings = await getFiscalSettings();
        if (!mounted) return;
        setFiscalitySettings(settings.fiscality);
        setPsSettings(settings.ps);
        setTaxSettings(settings.tax);

        setLoading(false);
      } catch (e) {
        if (mounted) {
          console.error('[Placement] Erreur critique chargement settings:', e);
          setError('Erreur lors du chargement des paramètres fiscaux.');
          setLoading(false);
        }
      }
    }

    loadSettings();
    return () => { mounted = false; };
  }, []);

  // Invalidation cache après mise à jour admin
  useEffect(() => {
    const remove = addInvalidationListener((kind) => {
      if (['tax', 'ps', 'fiscality'].includes(kind)) {
        getFiscalSettings({ force: true }).then((settings) => {
          setFiscalitySettings(settings.fiscality);
          setPsSettings(settings.ps);
          setTaxSettings(settings.tax);
        });
      }
    });
    return remove;
  }, []);

  // Extraire les paramètres normalisés pour le moteur de calcul
  const fiscalParams = useMemo(() => {
    const params = extractFiscalParams(fiscalitySettings, psSettings);
    // Ajouter les paramètres DMTG depuis tax_settings
    const dmtg = taxSettings?.dmtg || DEFAULT_TAX_SETTINGS.dmtg;
    const dmtgLD = dmtg.ligneDirecte || DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte;
    params.dmtgAbattementLigneDirecte = dmtgLD.abattement || dmtg.abattementLigneDirecte || 100000;
    params.dmtgScale = dmtgLD.scale || dmtg.scale || DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale;
    return params;
  }, [fiscalitySettings, psSettings, taxSettings]);

  // Extraire le barème IR pour calculer la TMI
  const baremIR = useMemo(() => {
    return taxSettings?.incomeTax?.scaleCurrent || DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent;
  }, [taxSettings]);

  const tmiOptions = useMemo(() => buildTmiOptionsFromBareme(baremIR), [baremIR]);

  return {
    fiscalParams,
    fiscalitySettings,
    psSettings,
    taxSettings,
    baremIR,
    tmiOptions,
    loading,
    error,
  };
}

/**
 * Calcule la TMI à partir d'un revenu imposable et du barème
 * @param {number} revenuImposable - Revenu net imposable
 * @param {number} parts - Nombre de parts fiscales
 * @param {Array} bareme - Barème IR
 * @returns {number} TMI en décimal (ex: 0.30 pour 30%)
 */
export function calculTMI(revenuImposable, parts = 1, bareme) {
  let effectiveBareme = bareme;
  if (!effectiveBareme || !effectiveBareme.length) {
    effectiveBareme = DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent;
  }
  if (!effectiveBareme || !effectiveBareme.length) {
    return 0.30; // ultime filet
  }

  const quotient = revenuImposable / parts;
  let tmi = 0;

  for (const tranche of effectiveBareme) {
    if (tranche.to === null || quotient <= tranche.to) {
      tmi = tranche.rate / 100;
      break;
    }
  }

  return tmi;
}

export default usePlacementSettings;
