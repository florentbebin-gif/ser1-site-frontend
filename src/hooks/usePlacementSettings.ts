/**
 * usePlacementSettings.ts - Adaptateur fiscal du simulateur Placement.
 *
 * Source des données : useFiscalContext, point d'entrée standard du dossier fiscal.
 */

import { useMemo } from 'react';
import * as placementEngine from '../engine/placement';
import { useFiscalContext, type FiscalContext } from './useFiscalContext';
import type { FiscalParams } from '../engine/placement/types';

type TaxSettings = FiscalContext['_raw_tax'];
type PsSettings = FiscalContext['_raw_ps'];
type FiscalitySettings = FiscalContext['_raw_fiscality'];
type TaxScale = FiscalContext['irScaleCurrent'];
type TaxBracket = TaxScale[number];

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
  fiscalContext: FiscalContext;
  loading: boolean;
  error: string | null;
}

function buildTmiOptionsFromRates(rates: number[]): PlacementTmiOption[] {
  return rates.map((rate) => ({
    value: rate,
    label: `${Math.round(rate * 100)} %`,
  }));
}

function buildTmiOptionsFromBareme(bareme: TaxScale): PlacementTmiOption[] {
  const uniqueRates = Array.from(
    new Set(
      bareme
        .map((tranche: TaxBracket) => (typeof tranche.rate === 'number' ? tranche.rate / 100 : null))
        .filter((rate): rate is number => rate !== null && !Number.isNaN(rate))
    )
  ).sort((a, b) => a - b);

  return buildTmiOptionsFromRates(uniqueRates);
}

export function derivePlacementSettingsFromFiscalContext(
  fiscalContext: FiscalContext,
): Omit<UsePlacementSettingsResult, 'loading' | 'error' | 'fiscalContext'> {
  const fiscalitySettings = fiscalContext._raw_fiscality;
  const psSettings = fiscalContext._raw_ps;
  const taxSettings = fiscalContext._raw_tax;
  const baremIR = fiscalContext.irScaleCurrent;
  const fiscalParams: FiscalParams = {
    ...placementEngine.extractFiscalParams(fiscalitySettings, psSettings, taxSettings),
    dmtgAbattementLigneDirecte: fiscalContext.dmtgAbattementEnfant,
    dmtgScale: fiscalContext.dmtgScaleLigneDirecte,
  };

  return {
    fiscalParams,
    fiscalitySettings,
    psSettings,
    taxSettings,
    baremIR,
    tmiOptions: buildTmiOptionsFromBareme(baremIR),
  };
}

/**
 * Hook pour exposer les settings fiscaux projetés au format Placement.
 */
export function usePlacementSettings(): UsePlacementSettingsResult {
  const { fiscalContext, loading, error } = useFiscalContext({ strict: false });
  const derived = useMemo(
    () => derivePlacementSettingsFromFiscalContext(fiscalContext),
    [fiscalContext],
  );

  return {
    ...derived,
    fiscalContext,
    loading,
    error,
  };
}

export default usePlacementSettings;
