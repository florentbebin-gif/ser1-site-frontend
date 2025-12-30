import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import SettingsNav from "../SettingsNav";
import "./SettingsImpots.css";
import "./SettingsFiscalites.css";

const SETTINGS_KEY = "fiscalites_v1";

// =======================
// DEFAULT SETTINGS
// =======================
export const DEFAULT_FISCALITES_SETTINGS = {
  meta: {
    title: "Synthèse fiscalité des enveloppes (paramétrable)",
    assumptions: [
      "Résident fiscal France",
      "Chaque cellule peut contenir des tokens {{...}} remplacés par des seuils/taux éditables",
      "Régime par défaut + Sur option systématiques",
      "SCPI uniquement en direct (revenus fonciers)"
    ],
    lastReview: "2025-12-30",

    // ✅ Paramètres chiffrés éditables (Admin)
    parameters: [
      // --- Assurance-vie : prélèvements sociaux (capture épargne)
      { key: "av_ps_total", label: "Assurance-vie - PS total", value: 17.2, unit: "%", format: "percent", help: "Taux global PS sur produits (CSG/CRDS etc.)." },
      { key: "av_ps_csg", label: "AV - CSG", value: 9.9, unit: "%", format: "percent", help: "Détail informatif (optionnel)." },
      { key: "av_ps_crds", label: "AV - CRDS", value: 0.5, unit: "%", format: "percent", help: "Détail informatif (optionnel)." },
      { key: "av_ps_prelev_social", label: "AV - Prélèvement social", value: 6.8, unit: "%", format: "percent", help: "Détail informatif (optionnel)." },
      { key: "av_ps_contrib_add", label: "AV - Contributions additionnelles", value: 0.3, unit: "%", format: "percent", help: "Détail informatif (optionnel)." },

      // --- Assurance-vie : retraits (capture rachat)
      { key: "av_date_pfu", label: "AV - Date seuil PFU", value: "2017-09-27", unit: "", format: "date", help: "Versements avant/après cette date." },
      { key: "av_pfl_0_4_ir", label: "AV - PFL 0-4 ans (IR)", value: 35, unit: "%", format: "percent", help: "Versements jusqu’au 27/09/2017 : option PFL 35%." },
      { key: "av_pfl_4_8_ir", label: "AV - PFL 4-8 ans (IR)", value: 15, unit: "%", format: "percent", help: "Versements jusqu’au 27/09/2017 : option PFL 15%." },
      { key: "av_pfl_8p_ir", label: "AV - PFL >8 ans (IR)", value: 7.5, unit: "%", format: "percent", help: "Versements jusqu’au 27/09/2017 : option PFL 7,5%." },
      { key: "av_pfu_ir", label: "AV - PFU (IR) après 27/09/2017", value: 12.8, unit: "%", format: "percent", help: "Taux IR du PFU." },
      { key: "av_abattement_8y_single", label: "AV - Abattement annuel >8 ans (personne seule)", value: 4600, unit: "€", format: "currency", help: "Abattement sur la part d’intérêts rachetée." },
      { key: "av_abattement_8y_couple", label: "AV - Abattement annuel >8 ans (couple)", value: 9200, unit: "€", format: "currency", help: "Couple marié/PACS." },
      { key: "av_seuil_150k", label: "AV - Seuil des 150 000 €", value: 150000, unit: "€", format: "currency", help: "Seuil sur versements (règles post-2017) pour taux 7,5% vs 12,8%." },
      { key: "av_pf_8y_taux_reduit", label: "AV - PF après 8 ans (taux réduit IR)", value: 7.5, unit: "%", format: "percent", help: "Après 8 ans : IR 7,5% dans la limite des règles (ex: premiers 150k)."},
      { key: "av_pf_8y_taux_plein", label: "AV - PF après 8 ans (taux plein IR)", value: 12.8, unit: "%", format: "percent", help: "Après 8 ans : IR 12,8% au-delà du seuil." },

      // --- Assurance-vie : décès (capture décès)
      { key: "av_deces_cut_1991", label: "AV Décès - date souscription 1", value: "1991-11-20", unit: "", format: "date", help: "Avant / après." },
      { key: "av_deces_cut_1998", label: "AV Décès - date seuil 2", value: "1998-10-13", unit: "", format: "date", help: "Primes versées avant/après." },
      { key: "av_deces_abatt_990i", label: "AV Décès - abattement 990 I / bénéficiaire", value: 152500, unit: "€", format: "currency", help: "Abattement par bénéficiaire (primes <70 ans selon cas)." },
      { key: "av_deces_tranche_20_limite", label: "AV Décès - limite tranche 20%", value: 852500, unit: "€", format: "currency", help: "20% jusqu’à ce montant (après abattement)." },
      { key: "av_deces_taux_20", label: "AV Décès - taux 20%", value: 20, unit: "%", format: "percent", help: "Taxation spécifique AV (990 I)." },
      { key: "av_deces_taux_3125", label: "AV Décès - taux 31,25%", value: 31.25, unit: "%", format: "percent", help: "Au-delà de la tranche." },
      { key: "av_deces_abatt_757b", label: "AV Décès - abattement 757 B global", value: 30500, unit: "€", format: "currency", help: "Primes versées après 70 ans : abattement global." },

      // --- PER (minimal chiffré, extensible)
      { key: "per_pfu_ir", label: "PER - PFU IR sur gains", value: 12.8, unit: "%", format: "percent", help: "IR du PFU sur produits (gains) lorsque applicable." },
      { key: "per_ps_total", label: "PER - PS total", value: 17.2, unit: "%", format: "percent", help: "PS sur gains lorsque applicable." }
    ]
  },

  devices: [
    // ==============================
    // ASSURANCE-VIE (refait + seuils)
    // ==============================
    {
      id: "assurance_vie",
      label: "Assurance-vie",
      subtitle: "Seuils (rachats) + prélèvements sociaux + transmission (captures)",
      table: {
        columns: ["Phase", "Régime par défaut", "Sur option", "Notes / points d’attention"],
        rows: [
          {
            phase: "Épargne",
            default:
              "Versement déductible des revenus (économie d’IR sur les versements) : **Non**\n" +
              "Fiscalité en cours de constitution sur les intérêts : **Non**\n" +
              "Prélèvements sociaux : **{{av_ps_total}}** sur les intérêts (fonds € prélevés au fil de l’eau)",
            option:
              "UC : PS dus **au rachat ou au décès** (pas d’IR pendant la phase d’épargne)\n" +
              "Détail PS (informatif) : CSG {{av_ps_csg}} / CRDS {{av_ps_crds}} / Prélèvement social {{av_ps_prelev_social}} / Add. {{av_ps_contrib_add}}",
            notes:
              "Pendant l’épargne : pas d’IR sur intérêts tant qu’il n’y a pas de rachat.\n" +
              "PS : timing différent Fonds € vs UC."
          },
          {
            phase: "Retraits",
            default:
              "Assiette : **uniquement la part d’intérêts** comprise dans le rachat (prorata).\n\n" +
              "Versements effectués **à partir du {{av_date_pfu}}** :\n" +
              "• Par défaut : **PFU** = IR {{av_pfu_ir}} + PS {{av_ps_total}} (soit **30%** au total).\n\n" +
              "Après 8 ans : abattement annuel sur intérêts rachetés :\n" +
              "• {{av_abattement_8y_single}} (personne seule) / {{av_abattement_8y_couple}} (couple). \n" +
              "• Puis IR : {{av_pf_8y_taux_reduit}} dans la limite des règles (ex : premiers {{av_seuil_150k}} de versements), sinon {{av_pf_8y_taux_plein}}.",
            option:
              "Versements effectués **jusqu’au {{av_date_pfu}}** : option PFL selon ancienneté du contrat :\n" +
              "• <4 ans : IR {{av_pfl_0_4_ir}} + PS {{av_ps_total}} (≈ 52,20%)\n" +
              "• 4-8 ans : IR {{av_pfl_4_8_ir}} + PS {{av_ps_total}} (≈ 32,20%)\n" +
              "• >8 ans : IR {{av_pfl_8p_ir}} + PS {{av_ps_total}} (≈ 24,70%)\n\n" +
              "Option barème IR : possible (au lieu PFU/PFL) + PS {{av_ps_total}}",
            notes:
              "Toujours vérifier : date des versements (avant/après {{av_date_pfu}}), ancienneté du contrat, et abattement annuel >8 ans.\n" +
              "Rachat = taxation sur **produits** uniquement (pas sur capital)."
          },
          {
            phase: "Décès",
            default:
              "Règles de transmission (résumé des seuils) :\n\n" +
              "• Contrat souscrit **avant {{av_deces_cut_1991}}** :\n" +
              "  - Primes versées jusqu’au 12/10/1998 : exonération totale\n" +
              "  - Primes versées après {{av_deces_cut_1998}} : abattement {{av_deces_abatt_990i}} / bénéficiaire puis {{av_deces_taux_20}} jusqu’à {{av_deces_tranche_20_limite}}, puis {{av_deces_taux_3125}} au-delà\n\n" +
              "• Contrat souscrit du {{av_deces_cut_1991}} au 12/10/1998 :\n" +
              "  - Versements <70 ans : mêmes règles ({{av_deces_abatt_990i}} puis {{av_deces_taux_20}}/{{av_deces_taux_3125}})\n" +
              "  - Versements ≥70 ans : abattement global {{av_deces_abatt_757b}} puis droits de succession",
            option:
              "• Contrat souscrit **après {{av_deces_cut_1998}}** :\n" +
              "  - Versements <70 ans : abattement {{av_deces_abatt_990i}} / bénéficiaire puis {{av_deces_taux_20}} jusqu’à {{av_deces_tranche_20_limite}}, puis {{av_deces_taux_3125}} au-delà\n" +
              "  - Versements ≥70 ans : abattement {{av_deces_abatt_757b}} (tous contrats et bénéficiaires confondus) puis droits de succession",
            notes:
              "Le décès est piloté par : (1) date de souscription, (2) âge au versement (<70 / ≥70), (3) date des primes (jusqu’au 12/10/1998 / après {{av_deces_cut_1998}}).\n" +
              "Les produits attachés aux primes ≥70 ans ne sont pas traités comme les primes (règles spécifiques à rappeler au besoin)."
          }
        ]
      }
    },

    // ==============================
    // PER INDIVIDUEL (refait notion)
    // ==============================
    {
      id: "per_individuel",
      label: "PER individuel (PERIN)",
      subtitle: "Déductibilité à l’entrée + sortie capital/rente",
      table: {
        columns: ["Phase", "Régime par défaut", "Sur option", "Notes / points d’attention"],
        rows: [
          {
            phase: "Épargne",
            default:
              "Versement déductible des revenus (économie d’IR sur les versements) : **Oui** (dans la limite du plafond épargne retraite)\n" +
              "Fiscalité en cours de constitution sur les intérêts : **Non**",
            option:
              "Renoncer à la déductibilité : **Oui possible** (versements « non déduits ») → sortie du capital moins taxée sur la part « capital »",
            notes:
              "Choix clé : déduire aujourd’hui (gain TMI) vs ne pas déduire (mieux à la sortie)."
          },
          {
            phase: "Retraits",
            default:
              "Sortie en capital (cas courant) :\n" +
              "• **Capital (versements déduits)** : imposé au **barème IR (TMI)**\n" +
              "• **Intérêts / gains** : **PFU** = IR {{per_pfu_ir}} + PS {{per_ps_total}}\n\n" +
              "Sortie en rente : imposée au barème IR (pensions) + prélèvements sociaux selon règles en vigueur",
            option:
              "Si versements **non déduits** :\n" +
              "• Capital = non imposé (déjà « fiscalisé » à l’entrée)\n" +
              "• Gains = PFU (IR {{per_pfu_ir}} + PS {{per_ps_total}})\n\n" +
              "Lissage : sorties fractionnées pour piloter la TMI",
            notes:
              "Toujours dissocier : part « capital/versements » vs « gains ». Point critique : une sortie en capital importante peut faire monter la tranche."
          },
          {
            phase: "Décès",
            default:
              "Traitement dépend de la forme du PER (assurantiel/titres) et des options contractuelles.\n" +
              "En pratique : liquidation au décès au profit des ayants droit, avec régime de mutation souvent de nature successorale.",
            option:
              "Options contractuelles : rente de réversion, bénéficiaires, modalités de liquidation.\n" +
              "À paramétrer en fonction de l’objectif (retraite vs transmission).",
            notes:
              "À détailler/paramétrer si tu veux une grille chiffrée similaire à l’AV (selon le type de PER retenu dans ton app)."
          }
        ]
      }
    },

    // Les autres enveloppes peuvent rester “texte” pour l’instant,
    // et tu ajoutes leurs paramètres chiffrés au fur et à mesure.
    // (CTO / PEA / SCPI / Livrets)
    {
      id: "cto",
      label: "Compte-titres ordinaire (CTO)",
      subtitle: "PFU vs barème, PV/MV, succession",
      table: {
        columns: ["Phase", "Régime par défaut", "Sur option", "Notes / points d’attention"],
        rows: [
          { phase: "Épargne", default: "Revenus/cessions taxés au fil de l’eau (PFU par défaut).", option: "Option barème IR (annuelle, globale).", notes: "À enrichir en seuils/taux via paramètres si besoin." },
          { phase: "Retraits", default: "Le retrait en soi n’est pas taxable : c’est la cession qui déclenche l’impôt.", option: "Pilotage PV/MV.", notes: "" },
          { phase: "Décès", default: "Droits de mutation (successions).", option: "Donation/démembrement/pactes.", notes: "" }
        ]
      }
    },
    {
      id: "pea",
      label: "PEA",
      subtitle: "Durée de détention = clé",
      table: {
        columns: ["Phase", "Régime par défaut", "Sur option", "Notes / points d’attention"],
        rows: [
          { phase: "Épargne", default: "Capitalisation sans IR tant qu’il n’y a pas de retrait.", option: "—", notes: "" },
          { phase: "Retraits", default: "Seuils de durée (exonération IR selon régime en vigueur) + PS.", option: "—", notes: "Tu peux ajouter des paramètres (durées, taux) si tu veux." },
          { phase: "Décès", default: "Clôture au décès + succession.", option: "—", notes: "" }
        ]
      }
    },
    {
      id: "scpi_direct",
      label: "SCPI en direct",
      subtitle: "Revenus fonciers + PV immo (direct uniquement)",
      table: {
        columns: ["Phase", "Régime par défaut", "Sur option", "Notes / points d’attention"],
        rows: [
          { phase: "Épargne", default: "Revenus fonciers au barème IR + PS.", option: "Micro-foncier vs réel.", notes: "Direct uniquement." },
          { phase: "Retraits", default: "PV immobilière des particuliers + abattements durée.", option: "—", notes: "" },
          { phase: "Décès", default: "Succession (droits de mutation).", option: "—", notes: "" }
        ]
      }
    },
    {
      id: "livret_bancaire",
      label: "Livret bancaire (fiscalisé)",
      subtitle: "Intérêts taxés, pas le retrait",
      table: {
        columns: ["Phase", "Régime par défaut", "Sur option", "Notes / points d’attention"],
        rows: [
          { phase: "Épargne", default: "Intérêts au PFU par défaut.", option: "Option barème IR.", notes: "Livret A/LDDS : intérêts exonérés (note), capital successoral." },
          { phase: "Retraits", default: "Retrait non taxable (impôt sur intérêts).", option: "—", notes: "" },
          { phase: "Décès", default: "Actif successoral.", option: "—", notes: "" }
        ]
      }
    }
  ],

  disclaimer: [
    "Contenu informatif, non constitutif de conseil.",
    "Taux/seuils modifiables dans l’admin : vérifier la réglementation en vigueur (LF/doctrine).",
    "Adapter au cas client (RFR, TMI, situation familiale, dates exactes de versement, etc.)."
  ]
};


// -----------------------
// Helpers
// -----------------------
function getParamMap(parameters = []) {
  const map = {};
  for (const p of parameters) map[p.key] = p;
  return map;
}

function formatParamValue(param) {
  if (!param) return "";
  const v = param.value;

  if (param.format === "currency") {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return String(v ?? "");
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  }

  if (param.format === "percent") {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return String(v ?? "");
    // On garde 2 décimales si besoin (31.25)
    const digits = Number.isInteger(n) ? 0 : 2;
    return `${n.toFixed(digits)}%`;
  }

  if (param.format === "date") {
    return String(v ?? "");
  }

  return String(v ?? "");
}

// Remplace {{param_key}} par sa valeur formatée
function interpolate(text, paramMap) {
  if (!text) return "";
  return String(text).replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (_, key) => {
    const p = paramMap[key];
    if (!p) return `{{${key}}}`; // token inconnu => on laisse visible
    return formatParamValue(p);
  });
}

export default function SettingsFiscalites() {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState("User");
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(DEFAULT_FISCALITES_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = useMemo(() => roleLabel === "Admin", [roleLabel]);
  const paramMap = useMemo(() => getParamMap(settings?.meta?.parameters || []), [settings]);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        setLoading(true);

        // 1) user
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error(userErr);
          if (mounted) setLoading(false);
          return;
        }
        const u = userData?.user || null;
        if (!mounted) return;

        setUser(u);
        setRoleLabel("User");

        if (!u) {
          setLoading(false);
          return;
        }

        // 2) role
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single();

        if (!profErr) {
          const r = String(profile?.role || "").toLowerCase();
          setRoleLabel(r === "admin" ? "Admin" : "User");
        } else {
          console.warn("profiles.role error:", profErr);
        }

        // 3) settings row
        const { data: row, error: setErr } = await supabase
          .from("settings_fiscalites")
          .select("data")
          .eq("key", SETTINGS_KEY)
          .maybeSingle();

        if (setErr) {
          console.error("settings_fiscalites load error:", setErr);
        } else if (row?.data) {
          // Merge robuste : si ancienne version sans meta.parameters, fallback aux defaults
          setSettings((prev) => {
            const incoming = row.data;

            const mergedMeta = {
              ...(prev?.meta || {}),
              ...(incoming?.meta || {}),
              parameters: Array.isArray(incoming?.meta?.parameters)
                ? incoming.meta.parameters
                : (prev?.meta?.parameters || []),
            };

            return {
              ...prev,
              ...incoming,
              meta: mergedMeta,
              devices: Array.isArray(incoming?.devices) ? incoming.devices : prev.devices,
              disclaimer: Array.isArray(incoming?.disclaimer) ? incoming.disclaimer : prev.disclaimer,
            };
          });
        }

        if (mounted) setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  const updateParamValue = (key, rawValue) => {
    setSettings((prev) => {
      const clone = structuredClone(prev);
      const params = clone?.meta?.parameters || [];
      const idx = params.findIndex((p) => p.key === key);
      if (idx === -1) return prev;

      const p = params[idx];
      // cast selon format
      let nextValue = rawValue;
      if (p.format === "currency" || p.format === "percent") {
        const n = Number(rawValue);
        nextValue = Number.isFinite(n) ? n : rawValue;
      }
      p.value = nextValue;
      clone.meta.parameters = params;
      return clone;
    });
    setMessage("");
  };

  const updateCell = (deviceId, rowIndex, field, value) => {
    setSettings((prev) => {
      const clone = structuredClone(prev);
      const dev = clone.devices?.find((d) => d.id === deviceId);
      if (!dev?.table?.rows?.[rowIndex]) return prev;
      dev.table.rows[rowIndex][field] = value;
      return clone;
    });
    setMessage("");
  };

  const handleSave = async () => {
    if (!isAdmin || !user) return;

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        key: SETTINGS_KEY,
        data: settings,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("settings_fiscalites")
        .upsert(payload, { onConflict: "key" });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setMessage("Fiscalités enregistrées.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (!isAdmin) return;
    setSettings(DEFAULT_FISCALITES_SETTINGS);
    setMessage("Valeurs par défaut restaurées (non enregistrées).");
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <SettingsNav />
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <SettingsNav />
          <p>Aucun utilisateur connecté.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>
        <SettingsNav />

        <div style={{ fontSize: 15, marginTop: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="tax-user-banner">
            <strong>Utilisateur :</strong> {user.email} — <strong>Statut :</strong> {roleLabel}
          </div>

          {/* META */}
          <section>
            <h3>{settings?.meta?.title || "Synthèse fiscalité"}</h3>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
              Les cellules peuvent contenir des tokens <code>{"{{...}}"}</code> remplacés par les paramètres chiffrés ci-dessous.
              (Ex : <code>{"{{av_ps_total}}"}</code>).
            </p>
          </section>

          {/* PARAMÈTRES CHIFFRÉS (Admin only edit) */}
          <section>
            <h3>Paramètres chiffrés (taux / montants / dates)</h3>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
              Ici l’Admin peut modifier les valeurs numériques. Les tableaux utilisent ces valeurs via interpolation.
            </p>

            <table className="settings-table fiscalites-params-table">
              <thead>
                <tr>
                  <th style={{ width: 280, textAlign: "left" }}>Paramètre</th>
                  <th style={{ width: 160, textAlign: "left" }}>Valeur</th>
                  <th style={{ width: 80, textAlign: "left" }}>Unité</th>
                  <th style={{ textAlign: "left" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {(settings?.meta?.parameters || []).map((p) => (
                  <tr key={p.key}>
                    <td style={{ textAlign: "left", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 600 }}>{p.label}</div>
                      <div className="param-key">key: {p.key}</div>
                    </td>
                    <td style={{ textAlign: "left", verticalAlign: "top" }}>
                      {p.format === "date" ? (
                        <input
                          className="settings-input"
                          type="text"
                          value={p.value ?? ""}
                          onChange={(e) => updateParamValue(p.key, e.target.value)}
                          disabled={!isAdmin}
                          placeholder="YYYY-MM-DD"
                        />
                      ) : (
                        <input
                          className="settings-input"
                          type="number"
                          step={p.format === "percent" ? "0.01" : "1"}
                          value={p.value ?? ""}
                          onChange={(e) => updateParamValue(p.key, e.target.value)}
                          disabled={!isAdmin}
                        />
                      )}
                      <div className="param-preview">Aperçu : {formatParamValue(p)}</div>
                    </td>
                    <td style={{ textAlign: "left", verticalAlign: "top" }}>{p.unit || ""}</td>
                    <td style={{ textAlign: "left", verticalAlign: "top", fontSize: 13, color: "#555" }}>
                      {p.help || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* DEVICES TABLES */}
          {(settings?.devices || []).map((dev) => (
            <section key={dev.id}>
              <h3>{dev.label}</h3>
              {dev.subtitle && <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>{dev.subtitle}</p>}

              <table className="settings-table fiscalites-table">
                <thead>
                  <tr>
                    <th style={{ width: 120, textAlign: "left" }}>Phase</th>
                    <th>Régime par défaut</th>
                    <th>Sur option</th>
                    <th>Notes / points d’attention</th>
                  </tr>
                </thead>
                <tbody>
                  {(dev?.table?.rows || []).map((row, idx) => (
                    <tr key={`${dev.id}_${idx}`}>
                      <td style={{ textAlign: "left", verticalAlign: "top", fontWeight: 600 }}>{row.phase}</td>

                      {/* Default */}
                      <td style={{ textAlign: "left", verticalAlign: "top" }}>
                        {isAdmin ? (
                          <textarea
                            className="settings-textarea"
                            value={row.default || ""}
                            onChange={(e) => updateCell(dev.id, idx, "default", e.target.value)}
                            disabled={!isAdmin}
                            rows={8}
                          />
                        ) : (
                          <div className="cell-readonly">
                            {interpolate(row.default || "", paramMap).split("\n").map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Option */}
                      <td style={{ textAlign: "left", verticalAlign: "top" }}>
                        {isAdmin ? (
                          <textarea
                            className="settings-textarea"
                            value={row.option || ""}
                            onChange={(e) => updateCell(dev.id, idx, "option", e.target.value)}
                            disabled={!isAdmin}
                            rows={8}
                          />
                        ) : (
                          <div className="cell-readonly">
                            {interpolate(row.option || "", paramMap).split("\n").map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Notes */}
                      <td style={{ textAlign: "left", verticalAlign: "top" }}>
                        {isAdmin ? (
                          <textarea
                            className="settings-textarea"
                            value={row.notes || ""}
                            onChange={(e) => updateCell(dev.id, idx, "notes", e.target.value)}
                            disabled={!isAdmin}
                            rows={8}
                          />
                        ) : (
                          <div className="cell-readonly">
                            {interpolate(row.notes || "", paramMap).split("\n").map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {isAdmin && (
                <div className="hint-tokens">
                  Astuce : tu peux insérer des tokens comme <code>{"{{av_ps_total}}"}</code> dans les cellules.
                </div>
              )}
            </section>
          ))}

          {/* DISCLAIMER */}
          <section>
            <h3>Disclaimer</h3>
            {(settings?.disclaimer || []).map((d, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                {isAdmin ? (
                  <textarea
                    className="settings-textarea"
                    value={d}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSettings((prev) => {
                        const clone = structuredClone(prev);
                        clone.disclaimer[idx] = v;
                        return clone;
                      });
                      setMessage("");
                    }}
                    disabled={!isAdmin}
                    rows={2}
                  />
                ) : (
                  <div style={{ fontSize: 13, color: "#555" }}>• {d}</div>
                )}
              </div>
            ))}
          </section>

          {/* ACTIONS */}
          {isAdmin && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" className="chip" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>

              <button type="button" className="chip" onClick={handleResetDefault} disabled={saving}>
                Réinitialiser aux valeurs par défaut
              </button>
            </div>
          )}

          {message && <div style={{ fontSize: 13, marginTop: 8 }}>{message}</div>}
        </div>
      </div>
    </div>
  );
}
