/**
 * useFiscalContext — Hook unifié "dossier fiscal"
 *
 * Point d'entrée unique pour tous les simulateurs qui consomment les paramètres fiscaux.
 * Expose un `fiscalContext` normalisé (clés stables), `loading`, `error`, `meta`.
 *
 * Deux modes :
 *  - strict: true  → attend Supabase avant de retourner (IR, Succession)
 *  - strict: false → stale-while-revalidate, retourne cache/defaults immédiatement (défaut).
 *    Le fetch arrière-plan met le cache à jour pour les appels suivants, mais ne force pas
 *    un re-render cold start hors invalidation explicite.
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
  DEFAULT_PASS_HISTORY,
} from '../utils/cache/fiscalSettingsCache';
import type { CacheMeta } from '../utils/cache/fiscalSettingsCache';
import { getFiscalityRules } from '../utils/cache/fiscalitySettingsAccess';
import type { FiscalitySettingsV2 } from '../utils/cache/fiscalitySettings';
import { DEFAULT_PER_INDIVIDUEL_RULES } from '../constants/settingsDefaults';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FiscalContextMeta {
  /** Les données viennent du cache localStorage (pas de fetch réseau) */
  fromCache: boolean;
  /** Timestamp de la dernière mise à jour connue (ms epoch, 0 si inconnu) */
  updatedAt: number;
  /** updated_at Supabase pour tax_settings (ISO string ou null) */
  taxUpdatedAt: string | null;
  /** updated_at Supabase pour ps_settings (ISO string ou null) */
  psUpdatedAt: string | null;
  /** updated_at Supabase pour fiscality_settings (ISO string ou null) */
  fiscalityUpdatedAt: string | null;
  /** updated_at Supabase max connu pour pass_history (ISO string ou null) */
  passUpdatedAt: string | null;
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
  /** Taux PS patrimoine année courante - cas general */
  psRateGeneral: number;
  /** Taux PS patrimoine année courante - regime d'exception */
  psRateException: number;
  /** Fractions RVTO par âge au premier versement de rente */
  rvtoTaxableFractionByAge: typeof DEFAULT_PER_INDIVIDUEL_RULES.rente.rvtoTaxableFractionByAgeAtFirstPayment;
  /** Taux PS sur la quote-part intérêts des rentes PER */
  psRateRenteInterests: number;
  /** Taux CASA sur la quote-part capital des rentes PER déductibles */
  psRateRenteCapitalCASA: number;
  /** Taux d'abattement pension/retraite applicable aux RVTG */
  abat10Rate: number;
  /** Bornes de l'abattement pensions/retraites année courante */
  abat10RetireesCurrent: typeof DEFAULT_TAX_SETTINGS.incomeTax.abat10.retireesCurrent;
  /** Barèmes PS retraite année courante */
  psRetirementBrackets: typeof DEFAULT_PS_SETTINGS.retirement.current.brackets;
  /** Taux PS retraite maximal, utilisé en hypothèse prudente de simulation */
  psRateRetirementDefault: number;
  /** Seuil mensuel de sortie en capital pour petite rente */
  smallAnnuityMonthlyCapitalExitThreshold: number;
  /** Seuil annuel de sortie en capital pour petite rente */
  smallAnnuityAnnualCapitalExitThreshold: number;
  /** Taux IR forfaitaire optionnel pour petite rente */
  smallAnnuityCapitalExitFlatTaxRate: number;
  /** Taux d'abattement avant forfait petite rente */
  smallAnnuityCapitalExitFlatTaxAbatementRate: number;

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

  // ── IS (Impôt sur les sociétés) ───────────────────────────────────────────
  /**
   * Paramètres IS normalisés — avec fallback sur DEFAULT_TAX_SETTINGS.
   * Inclut motherDaughterQpfc pour le régime mère-fille.
   */
  corporateTax: typeof DEFAULT_TAX_SETTINGS.corporateTax;

  // ── IFI (Impôt sur la fortune immobilière) ────────────────────────────────
  /** Paramètres IFI normalisés — seuil, abattement RP et barème courant. */
  ifi: typeof DEFAULT_TAX_SETTINGS.ifi;
  /** Paramètres CDHR normalisés — seuils foyer et taux effectif minimal. */
  cdhr: typeof DEFAULT_TAX_SETTINGS.cdhr;

  // ── Charges sociales dirigeant ───────────────────────────────────────────
  /** Paramètres sociaux dirigeant normalisés depuis ps_settings. */
  socialDirigeant: typeof DEFAULT_PS_SETTINGS.socialDirigeant;

  // ── PASS (historique plafond sécurité sociale) ──────────────────────────────
  /** Historique PASS par année (ex: { 2024: 46368, 2025: 47100 }) */
  passHistoryByYear: Record<number, number>;

  // ── Bruts (pour les simulateurs qui en ont besoin) ────────────────────────
  /** Données brutes tax_settings (accès exceptionnel — préférer les clés normalisées) */
  _raw_tax: typeof DEFAULT_TAX_SETTINGS;
  /** Données brutes ps_settings */
  _raw_ps: typeof DEFAULT_PS_SETTINGS;
  /** Données brutes fiscality_settings */
  _raw_fiscality: FiscalitySettingsV2;
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

type TaxSettings = typeof DEFAULT_TAX_SETTINGS;
type PsSettings = typeof DEFAULT_PS_SETTINGS;
type FiscalitySettings = FiscalitySettingsV2;
type LegacyDmtgSettings = TaxSettings['dmtg'] & {
  abattementLigneDirecte?: number;
  scale?: TaxSettings['dmtg']['ligneDirecte']['scale'];
};

function percentToRate(value: number | null | undefined): number {
  return (value ?? 0) / 100;
}

function resolveRetirementPsDefault(ps: PsSettings): number {
  return (
    ps?.retirement?.current?.brackets ?? DEFAULT_PS_SETTINGS.retirement.current.brackets
  ).reduce((maxRate, bracket) => Math.max(maxRate, bracket.totalRate ?? 0), 0);
}

function resolveSocialDirigeant(ps: PsSettings): typeof DEFAULT_PS_SETTINGS.socialDirigeant {
  const defaults = DEFAULT_PS_SETTINGS.socialDirigeant;
  const current = ps?.socialDirigeant?.current;

  return {
    current: {
      ...defaults.current,
      ...current,
      remuneration: {
        tns: {
          ...defaults.current.remuneration.tns,
          ...current?.remuneration?.tns,
        },
        assimileSalarie: {
          ...defaults.current.remuneration.assimileSalarie,
          ...current?.remuneration?.assimileSalarie,
        },
      },
      dividends: {
        ...defaults.current.dividends,
        ...current?.dividends,
      },
      passTranches: {
        ...defaults.current.passTranches,
        ...current?.passTranches,
      },
      madelin: {
        ...defaults.current.madelin,
        ...current?.madelin,
      },
    },
  };
}

// ─── Normalisation ────────────────────────────────────────────────────────────

export function buildFiscalContext(
  tax: TaxSettings,
  ps: PsSettings,
  fiscality: FiscalitySettings,
  passHistory?: Record<number, number>,
): FiscalContext {
  const dmtg: LegacyDmtgSettings = tax?.dmtg ?? DEFAULT_TAX_SETTINGS.dmtg;
  const perRules = getFiscalityRules(fiscality, 'perIndividuel');
  const perRente = perRules.rente ?? DEFAULT_PER_INDIVIDUEL_RULES.rente;
  const petiteRente =
    perRules.sortieCapital?.retraite?.petiteRente ??
    DEFAULT_PER_INDIVIDUEL_RULES.sortieCapital.retraite.petiteRente;
  const smallAnnuityMonthlyThreshold = petiteRente.monthlyThreshold;

  // Normalisation DMTG : supporte les deux anciennes structures (legacy + nouvelle)
  const ligneDirecte = dmtg.ligneDirecte ?? {
    abattement: dmtg.abattementLigneDirecte ?? DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.abattement,
    scale: dmtg.scale ?? DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale,
  };

  return {
    // IR
    irScaleCurrent: tax?.incomeTax?.scaleCurrent ?? DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
    irScalePrevious: tax?.incomeTax?.scalePrevious ?? DEFAULT_TAX_SETTINGS.incomeTax.scalePrevious,
    irCurrentYearLabel:
      tax?.incomeTax?.currentYearLabel ?? DEFAULT_TAX_SETTINGS.incomeTax.currentYearLabel,
    irPreviousYearLabel:
      tax?.incomeTax?.previousYearLabel ?? DEFAULT_TAX_SETTINGS.incomeTax.previousYearLabel,

    // PFU / PS
    pfuRateIR: tax?.pfu?.current?.rateIR ?? DEFAULT_TAX_SETTINGS.pfu.current.rateIR,
    psRateGeneral:
      ps?.patrimony?.current?.generalRate ?? DEFAULT_PS_SETTINGS.patrimony.current.generalRate,
    psRateException:
      ps?.patrimony?.current?.exceptionRate ?? DEFAULT_PS_SETTINGS.patrimony.current.exceptionRate,
    rvtoTaxableFractionByAge:
      perRente.rvtoTaxableFractionByAgeAtFirstPayment ??
      DEFAULT_PER_INDIVIDUEL_RULES.rente.rvtoTaxableFractionByAgeAtFirstPayment,
    psRateRenteInterests: percentToRate(
      perRente.deduits?.interestsQuotePart?.psRatePercent ??
        DEFAULT_PER_INDIVIDUEL_RULES.rente.deduits.interestsQuotePart.psRatePercent,
    ),
    psRateRenteCapitalCASA: percentToRate(
      perRente.deduits?.capitalQuotePart?.psRatePercent ??
        DEFAULT_PER_INDIVIDUEL_RULES.rente.deduits.capitalQuotePart.psRatePercent,
    ),
    abat10Rate: percentToRate(
      perRente.pensionAbatementRatePercent ??
        DEFAULT_PER_INDIVIDUEL_RULES.rente.pensionAbatementRatePercent,
    ),
    abat10RetireesCurrent:
      tax?.incomeTax?.abat10?.retireesCurrent ??
      DEFAULT_TAX_SETTINGS.incomeTax.abat10.retireesCurrent,
    psRetirementBrackets:
      ps?.retirement?.current?.brackets ?? DEFAULT_PS_SETTINGS.retirement.current.brackets,
    psRateRetirementDefault: percentToRate(resolveRetirementPsDefault(ps)),
    smallAnnuityMonthlyCapitalExitThreshold: smallAnnuityMonthlyThreshold,
    smallAnnuityAnnualCapitalExitThreshold: smallAnnuityMonthlyThreshold * 12,
    smallAnnuityCapitalExitFlatTaxRate: percentToRate(
      petiteRente.forfaitIrRatePercent ??
        DEFAULT_PER_INDIVIDUEL_RULES.sortieCapital.retraite.petiteRente.forfaitIrRatePercent,
    ),
    smallAnnuityCapitalExitFlatTaxAbatementRate: percentToRate(
      petiteRente.forfaitAbatementRatePercent ??
        DEFAULT_PER_INDIVIDUEL_RULES.sortieCapital.retraite.petiteRente.forfaitAbatementRatePercent,
    ),

    // DMTG normalisé
    dmtgScaleLigneDirecte: ligneDirecte.scale ?? DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale,
    dmtgAbattementEnfant:
      ligneDirecte.abattement ?? DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.abattement,
    dmtgSettings: {
      ligneDirecte,
      frereSoeur: dmtg.frereSoeur ?? DEFAULT_TAX_SETTINGS.dmtg.frereSoeur,
      neveuNiece: dmtg.neveuNiece ?? DEFAULT_TAX_SETTINGS.dmtg.neveuNiece,
      autre: dmtg.autre ?? DEFAULT_TAX_SETTINGS.dmtg.autre,
    },

    // IS normalisé (avec fallback profond sur motherDaughterQpfc)
    corporateTax: {
      current: {
        ...DEFAULT_TAX_SETTINGS.corporateTax.current,
        ...tax?.corporateTax?.current,
        motherDaughterQpfc: {
          ...DEFAULT_TAX_SETTINGS.corporateTax.current.motherDaughterQpfc,
          ...tax?.corporateTax?.current?.motherDaughterQpfc,
        },
      },
      previous: {
        ...DEFAULT_TAX_SETTINGS.corporateTax.previous,
        ...tax?.corporateTax?.previous,
        motherDaughterQpfc: {
          ...DEFAULT_TAX_SETTINGS.corporateTax.previous.motherDaughterQpfc,
          ...tax?.corporateTax?.previous?.motherDaughterQpfc,
        },
      },
    },

    // IFI normalisé
    ifi: {
      current: {
        ...DEFAULT_TAX_SETTINGS.ifi.current,
        ...tax?.ifi?.current,
        scale: tax?.ifi?.current?.scale ?? DEFAULT_TAX_SETTINGS.ifi.current.scale,
      },
    },
    cdhr: {
      current: {
        ...DEFAULT_TAX_SETTINGS.cdhr.current,
        ...tax?.cdhr?.current,
      },
      previous: {
        ...DEFAULT_TAX_SETTINGS.cdhr.previous,
        ...tax?.cdhr?.previous,
      },
    },

    // Charges sociales dirigeant
    socialDirigeant: resolveSocialDirigeant(ps),

    // PASS
    passHistoryByYear: passHistory ?? DEFAULT_PASS_HISTORY,

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
export function useFiscalContext({
  strict = false,
}: UseFiscalContextOptions = {}): UseFiscalContextResult {
  const [fiscalContext, setFiscalContext] = useState<FiscalContext>(DEFAULT_FISCAL_CONTEXT);
  const [loading, setLoading] = useState<boolean>(strict);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<FiscalContextMeta>({
    fromCache: false,
    updatedAt: 0,
    taxUpdatedAt: null,
    psUpdatedAt: null,
    fiscalityUpdatedAt: null,
    passUpdatedAt: null,
  });

  const applySettings = useCallback(
    (
      tax: TaxSettings,
      ps: PsSettings,
      fiscality: FiscalitySettings,
      fromCache = false,
      settingsMeta?: CacheMeta,
      passHistory?: Record<number, number>,
    ) => {
      setFiscalContext(buildFiscalContext(tax, ps, fiscality, passHistory));
      setMeta({
        fromCache,
        updatedAt: Date.now(),
        taxUpdatedAt: settingsMeta?.taxUpdatedAt ?? null,
        psUpdatedAt: settingsMeta?.psUpdatedAt ?? null,
        fiscalityUpdatedAt: settingsMeta?.fiscalityUpdatedAt ?? null,
        passUpdatedAt: settingsMeta?.passUpdatedAt ?? null,
      });
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
          applySettings(
            result.tax,
            result.ps,
            result.fiscality,
            result.fromCache,
            result.meta,
            result.passHistory,
          );
          if (result.error) setError(result.error);
        } else {
          // Mode stale : retourne immédiatement cache/defaults. Le fetch background hydrate
          // le cache pour le prochain appel, sans second rendu automatique au cold start.
          const result = await getFiscalSettings();
          if (!mounted) return;
          applySettings(
            result.tax,
            result.ps,
            result.fiscality,
            false,
            result.meta,
            result.passHistory,
          );
        }
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Erreur chargement paramètres fiscaux');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [strict, applySettings]);

  // Invalidation cache après mise à jour admin (broadcast événement)
  useEffect(() => {
    const remove = addInvalidationListener(() => {
      (async () => {
        try {
          if (strict) {
            const result = await loadFiscalSettingsStrict();
            applySettings(
              result.tax,
              result.ps,
              result.fiscality,
              result.fromCache,
              result.meta,
              result.passHistory,
            );
          } else {
            const result = await getFiscalSettings({ force: true });
            applySettings(
              result.tax,
              result.ps,
              result.fiscality,
              false,
              result.meta,
              result.passHistory,
            );
          }
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : 'Erreur rechargement paramètres');
        }
      })();
    });
    return remove;
  }, [strict, applySettings]);

  return { fiscalContext, loading, error, meta };
}
