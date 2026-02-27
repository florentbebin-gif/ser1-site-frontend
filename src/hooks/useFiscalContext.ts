/**
 * useFiscalContext — Hook unifié "dossier fiscal"
 *
 * Point d'entrée unique pour tous les simulateurs qui consomment les paramètres fiscaux.
 * Expose un `fiscalContext` normalisé (clés stables), `loading`, `error`, `meta`.
 *
 * Deux modes :
 *  - strict: true  → attend Supabase avant de retourner (IR, Succession)
 *  - strict: false → stale-while-revalidate, retourne cache/defaults immédiatement (défaut)
 *
 * Invalidation : écoute l'événement `ser1:fiscal-settings-updated` pour se rafraîchir.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  getFiscalSettings,
  loadFiscalSettingsStrict,
  addInvalidationListener,
  DEFAULT_TAX_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
} from '../utils/fiscalSettingsCache.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FiscalContextMeta {
  /** Les données viennent du cache localStorage (pas de fetch réseau) */
  fromCache: boolean;
  /** Timestamp de la dernière mise à jour connue (ms epoch, 0 si inconnu) */
  updatedAt: number;
}

/**
 * Dossier fiscal normalisé — clés stables pour tous les simulateurs.
 *
 * Règle : les simulateurs lisent uniquement `fiscalContext`, jamais les tables brutes.
 */
export interface FiscalContext {
  // ── IR ────────────────────────────────────────────────────────────────────
  /** Barème IR année courante */
  irScaleCurrent: Array<{ from: number; to: number | null; rate: number; deduction: number }>;
  /** Barème IR année précédente */
  irScalePrevious: Array<{ from: number; to: number | null; rate: number; deduction: number }>;
  /** Label année courante (ex: "2025 (revenus 2024)") */
  irCurrentYearLabel: string;
  /** Label année précédente */
  irPreviousYearLabel: string;

  // ── PFU / PS ──────────────────────────────────────────────────────────────
  /** Taux IR du PFU pour l'année courante (ex: 12.8) */
  pfuRateIR: number;
  /** Taux PS patrimoine année courante (ex: 17.2) */
  psRateGlobal: number;

  // ── DMTG ─────────────────────────────────────────────────────────────────
  /**
   * Barème DMTG ligne directe (format moteur).
   * Clé normalisée — toujours `dmtgScaleLigneDirecte`, quelle que soit la structure Supabase.
   */
  dmtgScaleLigneDirecte: Array<{ from: number; to: number | null; rate: number }>;
  /** Abattement DMTG ligne directe (ex: 100000) */
  dmtgAbattementEnfant: number;
  /**
   * Objet DMTG complet (format moteur) — utilisable directement par calculateSuccession.
   * Structure : { ligneDirecte, frereSoeur, neveuNiece, autre }
   */
  dmtgSettings: typeof DEFAULT_TAX_SETTINGS.dmtg;

  // ── Bruts (pour les simulateurs qui en ont besoin) ────────────────────────
  /** Données brutes tax_settings (accès exceptionnel — préférer les clés normalisées) */
  _raw_tax: typeof DEFAULT_TAX_SETTINGS;
  /** Données brutes ps_settings */
  _raw_ps: typeof DEFAULT_PS_SETTINGS;
  /** Données brutes fiscality_settings */
  _raw_fiscality: typeof DEFAULT_FISCALITY_SETTINGS;
}

interface UseFiscalContextOptions {
  /** Si true, attend Supabase avant de résoudre (ne calcule jamais sur defaults silencieux) */
  strict?: boolean;
}

interface UseFiscalContextResult {
  fiscalContext: FiscalContext;
  loading: boolean;
  error: string | null;
  meta: FiscalContextMeta;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function buildFiscalContext(
  tax: typeof DEFAULT_TAX_SETTINGS,
  ps: typeof DEFAULT_PS_SETTINGS,
  fiscality: typeof DEFAULT_FISCALITY_SETTINGS,
): FiscalContext {
  const dmtg = tax?.dmtg ?? DEFAULT_TAX_SETTINGS.dmtg;

  // Normalisation DMTG : supporte les deux anciennes structures (legacy + nouvelle)
  const ligneDirecte = dmtg.ligneDirecte ?? {
    abattement: (dmtg as any).abattementLigneDirecte ?? 100000,
    scale: (dmtg as any).scale ?? DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale,
  };

  return {
    // IR
    irScaleCurrent:
      tax?.incomeTax?.scaleCurrent ?? DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
    irScalePrevious:
      tax?.incomeTax?.scalePrevious ?? DEFAULT_TAX_SETTINGS.incomeTax.scalePrevious,
    irCurrentYearLabel:
      tax?.incomeTax?.currentYearLabel ?? DEFAULT_TAX_SETTINGS.incomeTax.currentYearLabel,
    irPreviousYearLabel:
      tax?.incomeTax?.previousYearLabel ?? DEFAULT_TAX_SETTINGS.incomeTax.previousYearLabel,

    // PFU / PS
    pfuRateIR: tax?.pfu?.current?.rateIR ?? DEFAULT_TAX_SETTINGS.pfu.current.rateIR,
    psRateGlobal:
      ps?.patrimony?.current?.totalRate ?? DEFAULT_PS_SETTINGS.patrimony.current.totalRate,

    // DMTG normalisé
    dmtgScaleLigneDirecte:
      ligneDirecte.scale ?? DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale,
    dmtgAbattementEnfant:
      ligneDirecte.abattement ?? DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.abattement,
    dmtgSettings: {
      ligneDirecte,
      frereSoeur: dmtg.frereSoeur ?? DEFAULT_TAX_SETTINGS.dmtg.frereSoeur,
      neveuNiece: dmtg.neveuNiece ?? DEFAULT_TAX_SETTINGS.dmtg.neveuNiece,
      autre: dmtg.autre ?? DEFAULT_TAX_SETTINGS.dmtg.autre,
    },

    // Bruts
    _raw_tax: tax ?? DEFAULT_TAX_SETTINGS,
    _raw_ps: ps ?? DEFAULT_PS_SETTINGS,
    _raw_fiscality: fiscality ?? DEFAULT_FISCALITY_SETTINGS,
  };
}

const DEFAULT_FISCAL_CONTEXT = buildFiscalContext(
  DEFAULT_TAX_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
);

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook unifié pour obtenir le dossier fiscal normalisé.
 *
 * @example
 * // Mode strict (IR, Succession) — attend Supabase
 * const { fiscalContext, loading, error } = useFiscalContext({ strict: true });
 * if (loading) return <p>Chargement des paramètres…</p>;
 *
 * @example
 * // Mode stale (autres pages) — retourne immédiatement
 * const { fiscalContext } = useFiscalContext();
 */
export function useFiscalContext({ strict = false }: UseFiscalContextOptions = {}): UseFiscalContextResult {
  const [fiscalContext, setFiscalContext] = useState<FiscalContext>(DEFAULT_FISCAL_CONTEXT);
  const [loading, setLoading] = useState<boolean>(strict);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<FiscalContextMeta>({ fromCache: false, updatedAt: 0 });

  const applySettings = useCallback(
    (tax: any, ps: any, fiscality: any, fromCache = false) => {
      setFiscalContext(buildFiscalContext(tax, ps, fiscality));
      setMeta({ fromCache, updatedAt: Date.now() });
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (strict) {
          // Mode strict : attend Supabase
          setLoading(true);
          setError(null);
          const result = await loadFiscalSettingsStrict();
          if (!mounted) return;
          applySettings(result.tax, result.ps, result.fiscality, result.fromCache);
          if (result.error) setError(result.error);
        } else {
          // Mode stale : retourne immédiatement cache/defaults
          const result = await getFiscalSettings();
          if (!mounted) return;
          applySettings(result.tax, result.ps, result.fiscality, false);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Erreur chargement paramètres fiscaux');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [strict, applySettings]);

  // Invalidation cache après mise à jour admin (broadcast événement)
  useEffect(() => {
    const remove = addInvalidationListener((_kind: string) => {
      (async () => {
        try {
          if (strict) {
            const result = await loadFiscalSettingsStrict();
            applySettings(result.tax, result.ps, result.fiscality, result.fromCache);
          } else {
            const result = await getFiscalSettings({ force: true });
            applySettings(result.tax, result.ps, result.fiscality, false);
          }
        } catch (e: any) {
          setError(e?.message ?? 'Erreur rechargement paramètres');
        }
      })();
    });
    return remove;
  }, [strict, applySettings]);

  return { fiscalContext, loading, error, meta };
}
