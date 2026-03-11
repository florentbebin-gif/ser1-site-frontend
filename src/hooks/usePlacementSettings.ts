/**
 * usePlacementSettings.ts - Hook pour charger les paramètres fiscaux du simulateur Placement
 * 
 * Charge les settings depuis Supabase :
 * - fiscality_settings (AV, PER, barèmes)
 * - ps_settings (prélèvements sociaux)
 * - tax_settings (barème IR, TMI)
 */

import { useState, useEffect, useMemo } from 'react';
import { extractFiscalParams } from '../engine/placement';
import { getFiscalSettings, addInvalidationListener } from '../utils/cache/fiscalSettingsCache';
import {
  DEFAULT_TAX_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
} from '../constants/settingsDefaults';
import type { FiscalParams } from '../engine/placement/types';
import type { GetFiscalSettingsResult } from '../utils/cache/fiscalSettingsCache';

type TaxSettings = typeof DEFAULT_TAX_SETTINGS;
type PsSettings = typeof DEFAULT_PS_SETTINGS;
type FiscalitySettings = typeof DEFAULT_FISCALITY_SETTINGS;
type TaxBracket = TaxSettings['incomeTax']['scaleCurrent'][number];
type TaxScale = TaxSettings['incomeTax']['scaleCurrent'];
type LegacyDmtgConfig = TaxSettings['dmtg'] & {
  abattementLigneDirecte?: number;
  scale?: TaxSettings['dmtg']['ligneDirecte']['scale'];
};

export interface PlacementTmiOption {
  value: number;
  label: string;
}

export interface UsePlacementSettingsResult {
  fiscalParams: FiscalParams;
  fiscalitySettings: FiscalitySettings;
  psSettings: PsSettings;
  taxSettings: TaxSettings;
  baremIR: TaxScale;
  tmiOptions: PlacementTmiOption[];
  loading: boolean;
  error: string | null;
}

const DEFAULT_TMI_OPTIONS = [
  { value: 0, label: '0 %' },
  { value: 0.11, label: '11 %' },
  { value: 0.30, label: '30 %' },
  { value: 0.41, label: '41 %' },
  { value: 0.45, label: '45 %' },
  { value: 0.50, label: '50 %' },
] as PlacementTmiOption[];

function buildTmiOptionsFromBareme(bareme?: TaxScale | null): PlacementTmiOption[] {
  const effectiveBareme = Array.isArray(bareme) && bareme.length
    ? bareme
    : DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent;

  if (!effectiveBareme || !effectiveBareme.length) {
    return DEFAULT_TMI_OPTIONS;
  }

  const uniqueRates = Array.from(
    new Set(
      effectiveBareme
        .map((tranche: TaxBracket) => (typeof tranche.rate === 'number' ? tranche.rate / 100 : null))
        .filter((rate): rate is number => rate !== null && !Number.isNaN(rate))
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
export function usePlacementSettings(): UsePlacementSettingsResult {
  const [fiscalitySettings, setFiscalitySettings] = useState<FiscalitySettings>(DEFAULT_FISCALITY_SETTINGS);
  const [psSettings, setPsSettings] = useState<PsSettings>(DEFAULT_PS_SETTINGS);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const settings: GetFiscalSettingsResult = await getFiscalSettings();
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
        void getFiscalSettings({ force: true }).then((settings) => {
          setFiscalitySettings(settings.fiscality);
          setPsSettings(settings.ps);
          setTaxSettings(settings.tax);
        });
      }
    });
    return remove;
  }, []);

  // Extraire les paramètres normalisés pour le moteur de calcul
  const fiscalParams = useMemo<FiscalParams>(() => {
    const params = extractFiscalParams(fiscalitySettings, psSettings);
    // Ajouter les paramètres DMTG depuis tax_settings
    const dmtg = (taxSettings?.dmtg || DEFAULT_TAX_SETTINGS.dmtg) as LegacyDmtgConfig;
    const dmtgLD = dmtg.ligneDirecte || DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte;
    return {
      ...params,
      dmtgAbattementLigneDirecte: dmtgLD.abattement || dmtg.abattementLigneDirecte || 100000,
      dmtgScale: dmtgLD.scale || dmtg.scale || DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale,
    };
  }, [fiscalitySettings, psSettings, taxSettings]);

  // Extraire le barème IR pour calculer la TMI
  const baremIR = useMemo<TaxScale>(() => {
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
export function calculTMI(
  revenuImposable: number,
  parts: number = 1,
  bareme?: Array<{ to: number | null; rate: number }> | null,
): number {
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
