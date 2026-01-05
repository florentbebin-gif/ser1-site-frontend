/**
 * usePlacementSettings.js - Hook pour charger les paramètres fiscaux du simulateur Placement
 * 
 * Charge les settings depuis Supabase :
 * - fiscality_settings (AV, PER, barèmes)
 * - ps_settings (prélèvements sociaux)
 * - tax_settings (barème IR, TMI)
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { extractFiscalParams } from '../engine/placementEngine';
import { getFiscalSettings, addInvalidationListener } from '../utils/fiscalSettingsCache.js';


// Timeout pour éviter les blocages Supabase
const SUPABASE_TIMEOUT = 8000; // 8 secondes

function createTimeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout Supabase')), ms);
  });
}

const DEFAULT_TMI_OPTIONS = [
  { value: 0, label: '0 %' },
  { value: 0.11, label: '11 %' },
  { value: 0.30, label: '30 %' },
  { value: 0.41, label: '41 %' },
  { value: 0.45, label: '45 %' },
  { value: 0.50, label: '50 %' },
];

// Valeurs par défaut si Supabase ne répond pas (importées depuis fiscalSettingsCache.js pour éviter la duplication)
const DEFAULT_FISCALITY_SETTINGS = {
  assuranceVie: {
    retraitsCapital: {
      psRatePercent: 17.2,
      depuis2017: {
        moins8Ans: { irRatePercent: 12.8 },
        plus8Ans: {
          abattementAnnuel: { single: 4600, couple: 9200 },
          primesNettesSeuil: 150000,
          irRateUnderThresholdPercent: 7.5,
          irRateOverThresholdPercent: 12.8,
        },
      },
    },
    deces: {
      primesApres1998: {
        allowancePerBeneficiary: 152500,
        brackets: [
          { upTo: 852500, ratePercent: 20 },
          { upTo: null, ratePercent: 31.25 },
        ],
      },
      apres70ans: { globalAllowance: 30500 },
    },
  },
  perIndividuel: {
    sortieCapital: {
      pfu: { irRatePercent: 12.8, psRatePercent: 17.2 },
    },
  },
  dividendes: {
    abattementBaremePercent: 40,
  },
};

const DEFAULT_PS_SETTINGS = {
  patrimony: {
    current: { totalRate: 17.2, csgDeductibleRate: 6.8 },
  },
};

const DEFAULT_TAX_SETTINGS = {
  incomeTax: {
    scaleCurrent: [
      { from: 0, to: 11294, rate: 0 },
      { from: 11295, to: 28797, rate: 11 },
      { from: 28798, to: 82341, rate: 30 },
      { from: 82342, to: 177106, rate: 41 },
      { from: 177107, to: null, rate: 45 },
    ],
  },
  dmtg: {
    abattementLigneDirecte: 100000,
    scale: [
      { from: 0, to: 8072, rate: 5 },
      { from: 8072, to: 12109, rate: 10 },
      { from: 12109, to: 15932, rate: 15 },
      { from: 15932, to: 552324, rate: 20 },
      { from: 552324, to: 902838, rate: 30 },
      { from: 902838, to: 1805677, rate: 40 },
      { from: 1805677, to: null, rate: 45 },
    ],
  },
};

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
    params.dmtgAbattementLigneDirecte = dmtg.abattementLigneDirecte || 100000;
    params.dmtgScale = dmtg.scale || DEFAULT_TAX_SETTINGS.dmtg.scale;
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
