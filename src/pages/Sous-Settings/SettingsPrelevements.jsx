import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SettingsNav from '../SettingsNav';
import './SettingsImpots.css';

// ----------------------
// Valeurs par défaut
// ----------------------
// Les taux viennent de ton fichier Excel PS.xlsx + bases officielles :
//  - 17,2 % de prélèvements sociaux sur le patrimoine / capital
//    (9,2 % CSG, 0,5 % CRDS, 7,5 % prélèvement de solidarité) :contentReference[oaicite:1]{index=1}
//  - CSG retraites à 0 / 3,8 / 6,6 / 8,3 % + CRDS 0,5 % + CASA 0,3 % devant s'appliquer selon le RFR. :contentReference[oaicite:2]{index=2}
//
// Pour l’instant, on met les mêmes chiffres en 2025 et 2024 : tu pourras
// les ajuster plus finement directement dans l’interface.

const DEFAULT_PS_SETTINGS = {
  labels: {
    currentYearLabel: '2025 (revenus 2024)',
    previousYearLabel: '2024 (revenus 2023)',
  },

  // PS sur patrimoine / capital (revenus du patrimoine, placements…)
  patrimony: {
    current: {
      totalRate: 17.2, // taux global PS
      csgDeductibleRate: 6.8, // part de CSG déductible si imposition au barème
    },
    previous: {
      totalRate: 17.2,
      csgDeductibleRate: 6.8,
    },
  },

  // PS sur les retraites (barème par tranche de RFR pour 1 part)
  retirement: {
    current: {
      brackets: [
        {
          label: 'Exonération',
          rfrMin1Part: 0,
          rfrMax1Part: 11432,
          csgRate: 0,
          crdsRate: 0,
          casaRate: 0,
          maladieRate: 0,
          totalRate: 0,
          csgDeductibleRate: 0,
        },
        {
          label: 'Taux réduit',
          rfrMin1Part: 11433,
          rfrMax1Part: 14944,
          csgRate: 3.8,
          crdsRate: 0.5,
          casaRate: 0,
          maladieRate: 0,
          totalRate: 4.3,
          csgDeductibleRate: 3.8,
        },
        {
          label: 'Taux médian',
          rfrMin1Part: 14945,
          rfrMax1Part: 23193,
          csgRate: 6.6,
          crdsRate: 0.5,
          casaRate: 0.3,
          maladieRate: 1.0,
          totalRate: 8.4,
          csgDeductibleRate: 4.2,
        },
        {
          label: 'Taux normal',
          rfrMin1Part: 23193,
          rfrMax1Part: null, // "plus"
          csgRate: 8.3,
          crdsRate: 0.5,
          casaRate: 0.3,
          maladieRate: 1.0,
          totalRate: 10.1,
          csgDeductibleRate: 5.9,
        },
      ],
    },
    previous: {
      // Par défaut on clone les mêmes valeurs que "current"
      brackets: [
        {
          label: 'Exonération',
          rfrMin1Part: 0,
          rfrMax1Part: 11432,
          csgRate: 0,
          crdsRate: 0,
          casaRate: 0,
          maladieRate: 0,
          totalRate: 0,
          csgDeductibleRate: 0,
        },
        {
          label: 'Taux réduit',
          rfrMin1Part: 11433,
          rfrMax1Part: 14944,
          csgRate: 3.8,
          crdsRate: 0.5,
          casaRate: 0,
          maladieRate: 0,
          totalRate: 4.3,
          csgDeductibleRate: 3.8,
        },
        {
          label: 'Taux médian',
          rfrMin1Part: 14945,
          rfrMax1Part: 23193,
          csgRate: 6.6,
          crdsRate: 0.5,
          casaRate: 0.3,
          maladieRate: 1.0,
          totalRate: 8.4,
          csgDeductibleRate: 4.2,
        },
        {
          label: 'Taux normal',
          rfrMin1Part: 23193,
          rfrMax1Part: null,
          csgRate: 8.3,
          crdsRate: 0.5,
          casaRate: 0.3,
          maladieRate: 1.0,
          totalRate: 10.1,
          csgDeductibleRate: 5.9,
        },
      ],
    },
  },
};

function numberOrEmpty(v) {
  return v === null || v === undefined || Number.isNaN(v) ? '' : String(v);
}

export default function SettingsPrelevements() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('User');
  const [settings, setSettings] = useState(DEFAULT_PS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = role === 'Admin';

  // ----------------------
  // Chargement initial
  // ----------------------
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        setMessage('');

        // 1. Récupérer l'utilisateur connecté
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!currentUser) {
          if (!mounted) return;
          setUser(null);
          setRole('User');
          setSettings(DEFAULT_PS_SETTINGS);
          return;
        }

        if (!mounted) return;
        setUser(currentUser);

        // 2. Récupérer le rôle (table users)
        const { data: userRow, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (roleError) {
          // On loggue juste, on ne bloque pas l'affichage
          console.warn('Erreur lecture rôle utilisateur', roleError);
        }

        const dbRole = userRow?.role || 'User';
        if (!mounted) return;
        setRole(dbRole);

        // 3. Récupérer les paramètres PS (table ps_settings, id = 1)
        const { data: row, error: psError } = await supabase
          .from('ps_settings')
          .select('data')
          .eq('id', 1)
          .maybeSingle();

        if (psError) {
          // Si la table n'existe pas encore, on garde les valeurs par défaut
          console.warn('Erreur lecture ps_settings', psError);
        }

        let finalSettings = DEFAULT_PS_SETTINGS;
        if (row && row.data) {
          // Merge simple : si tu ajoutes des champs plus tard,
          // les valeurs manquantes seront prises dans DEFAULT_PS_SETTINGS.
          finalSettings = {
            ...DEFAULT_PS_SETTINGS,
            ...row.data,
          };
        }

        if (!mounted) return;
        setSettings(finalSettings);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setError('Erreur lors du chargement des paramètres de prélèvements sociaux.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // ----------------------
  // Helpers de mise à jour
  // ----------------------
  const updateField = (path, value) => {
    setSettings((prev) => {
      const copy = structuredClone(prev);
      let obj = copy;
      for (let i = 0; i < path.length - 1; i += 1) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return copy;
    });
    setMessage('');
    setError('');
  };

  const updateRetirementBracket = (yearKey, index, key, value) => {
    setSettings((prev) => {
      const copy = structuredClone(prev);
      copy.retirement[yearKey].brackets[index][key] = value;
      return copy;
    });
    setMessage('');
    setError('');
  };

  // ----------------------
  // Sauvegarde
  // ----------------------
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const { error: saveError } = await supabase
        .from('ps_settings')
        .upsert({
          id: 1,
          data: settings,
        });

      if (saveError) {
        console.error(saveError);
        setError("Erreur lors de l'enregistrement des paramètres.");
        return;
      }

      setMessage('Paramètres de prélèvements sociaux enregistrés.');
    } catch (e) {
      console.error(e);
      setError("Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setSaving(false);
    }
  };

  const { labels, patrimony, retirement } = settings;

  // ----------------------
  // Rendu
  // ----------------------
  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>
        <SettingsNav />

        {/* Bandeau utilisateur */}
        <div style={{ marginTop: 16 }}>
          <div className="tax-user-banner">
            {user ? (
              <>
                Utilisateur : <strong>{user.email}</strong> — Statut :{' '}
                <strong>{role}</strong>
              </>
            ) : (
              <>Non connecté</>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ color: '#b3261e', marginTop: 12, fontSize: 13 }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ color: '#1b5e20', marginTop: 12, fontSize: 13 }}>
            {message}
          </div>
        )}

        {loading ? (
          <div style={{ marginTop: 24 }}>Chargement des paramètres…</div>
        ) : !user ? (
          <div style={{ marginTop: 24 }}>
            Vous devez être connecté pour voir cette page.
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            {/* 1. PS patrimoine / capital */}
            <section>
              <h3>Prélèvements sociaux — patrimoine et capital</h3>
              <p style={{ fontSize: 13, color: '#555' }}>
                Taux globaux applicables aux revenus du patrimoine et de
                placement (intérêts, dividendes, etc.).
              </p>

              <div className="tax-two-cols">
                {/* Colonne 2025 */}
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {labels.currentYearLabel}
                  </div>

                  <div className="settings-field-row">
                    <label>Taux global des prélèvements sociaux</label>
                    <input
                      type="number"
                      step="0.1"
                      value={numberOrEmpty(patrimony.current.totalRate)}
                      onChange={(e) =>
                        updateField(
                          ['patrimony', 'current', 'totalRate'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>%</span>
                  </div>

                  <div className="settings-field-row">
                    <label>CSG déductible (au barème)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={numberOrEmpty(
                        patrimony.current.csgDeductibleRate
                      )}
                      onChange={(e) =>
                        updateField(
                          ['patrimony', 'current', 'csgDeductibleRate'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>%</span>
                  </div>
                </div>

                {/* Colonne 2024 */}
                <div className="tax-two-cols-right">
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {labels.previousYearLabel}
                  </div>

                  <div className="settings-field-row">
                    <label>Taux global des prélèvements sociaux</label>
                    <input
                      type="number"
                      step="0.1"
                      value={numberOrEmpty(patrimony.previous.totalRate)}
                      onChange={(e) =>
                        updateField(
                          ['patrimony', 'previous', 'totalRate'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>%</span>
                  </div>

                  <div className="settings-field-row">
                    <label>CSG déductible (au barème)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={numberOrEmpty(
                        patrimony.previous.csgDeductibleRate
                      )}
                      onChange={(e) =>
                        updateField(
                          ['patrimony', 'previous', 'csgDeductibleRate'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. PS retraites */}
            <section>
              <h3 style={{ marginTop: 24 }}>
                Prélèvements sociaux — pensions de retraite
              </h3>
              <p style={{ fontSize: 13, color: '#555' }}>
                Barème des prélèvements sociaux sur les pensions de retraite
                (RFR pour 1 part). Les montants sont ajustés en fonction des
                parts, mais on stocke ici la base &quot;1 part&quot;.
              </p>

              <div className="tax-two-cols">
                {/* Colonne 2025 */}
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {labels.currentYearLabel}
                  </div>

                  <table className="settings-table">
                    <thead>
                      <tr>
                        <th>Tranche</th>
                        <th>RFR min (1 part)</th>
                        <th>RFR max (1 part)</th>
                        <th>CSG&nbsp;%</th>
                        <th>CRDS&nbsp;%</th>
                        <th>CASA&nbsp;%</th>
                        <th>Maladie&nbsp;%</th>
                        <th>Total&nbsp;%</th>
                        <th>CSG déd.&nbsp;%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retirement.current.brackets.map((b, idx) => (
                        <tr key={`retCur_${idx}`}>
                          <td>{b.label}</td>
                          <td>
                            <input
                              type="number"
                              value={numberOrEmpty(b.rfrMin1Part)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'current',
                                  idx,
                                  'rfrMin1Part',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={numberOrEmpty(b.rfrMax1Part)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'current',
                                  idx,
                                  'rfrMax1Part',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.csgRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'current',
                                  idx,
                                  'csgRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.crdsRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'current',
                                  idx,
                                  'crdsRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.casaRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'current',
                                  idx,
                                  'casaRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.maladieRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'current',
                                  idx,
                                  'maladieRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.totalRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'current',
                                  idx,
                                  'totalRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.csgDeductibleRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'current',
                                  idx,
                                  'csgDeductibleRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Colonne 2024 */}
                <div className="tax-two-cols-right">
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {labels.previousYearLabel}
                  </div>

                  <table className="settings-table">
                    <thead>
                      <tr>
                        <th>Tranche</th>
                        <th>RFR min (1 part)</th>
                        <th>RFR max (1 part)</th>
                        <th>CSG&nbsp;%</th>
                        <th>CRDS&nbsp;%</th>
                        <th>CASA&nbsp;%</th>
                        <th>Maladie&nbsp;%</th>
                        <th>Total&nbsp;%</th>
                        <th>CSG déd.&nbsp;%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retirement.previous.brackets.map((b, idx) => (
                        <tr key={`retPrev_${idx}`}>
                          <td>{b.label}</td>
                          <td>
                            <input
                              type="number"
                              value={numberOrEmpty(b.rfrMin1Part)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'previous',
                                  idx,
                                  'rfrMin1Part',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={numberOrEmpty(b.rfrMax1Part)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'previous',
                                  idx,
                                  'rfrMax1Part',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.csgRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'previous',
                                  idx,
                                  'csgRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.crdsRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'previous',
                                  idx,
                                  'crdsRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.casaRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'previous',
                                  idx,
                                  'casaRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.maladieRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'previous',
                                  idx,
                                  'maladieRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.totalRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'previous',
                                  idx,
                                  'totalRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={numberOrEmpty(b.csgDeductibleRate)}
                              onChange={(e) =>
                                updateRetirementBracket(
                                  'previous',
                                  idx,
                                  'csgDeductibleRate',
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!isAdmin}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Bouton de sauvegarde */}
            {isAdmin && (
              <div style={{ marginTop: 24 }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2B3E37',
                    color: 'white',
                    cursor: saving ? 'default' : 'pointer',
                    fontSize: 14,
                  }}
                >
                  {saving
                    ? 'Enregistrement...'
                    : 'Enregistrer les paramètres'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
