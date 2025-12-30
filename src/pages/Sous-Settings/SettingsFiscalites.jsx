import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import SettingsNav from "../SettingsNav";
import "./SettingsImpots.css";
import "./SettingsFiscalites.css";

const SETTINGS_KEY = "fiscalites_v1";

// =======================
// DEFAULT SETTINGS
// =======================
export const DEFAULT_FISCALITES_SETTINGS = /* colle ici l'objet JSON de la section 2 */ null;

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
