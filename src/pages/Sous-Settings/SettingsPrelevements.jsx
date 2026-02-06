import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './SettingsImpots.css';
import { invalidate, broadcastInvalidation } from '../../utils/fiscalSettingsCache.js';
import { UserInfoBanner } from '../../components/UserInfoBanner';
import { numberOrEmpty, createFieldUpdater } from '../../utils/settingsHelpers.js';
import SettingsFieldRow from '../../components/settings/SettingsFieldRow';
import SettingsYearColumn from '../../components/settings/SettingsYearColumn';
import SettingsTable from '../../components/settings/SettingsTable';

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
    currentYearLabel: '2025 (RFR 2023 & Avis IR 2024)',
    previousYearLabel: '2024 (RFR 2022 & Avis IR 2023)',
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
  // Seuils RFR pour CSG / CRDS / CASA
  //  - par lieu de résidence (Métropole / DOM / Guyane)
  //  - pour 1 part de quotient familial
  //  - et majoration par quart de part supplémentaire
  //
  // 2025 : RFR 2023 — barème CNIEG (tableau seuils 2025)
  // 2024 : RFR 2022 — barème CRPCEN (tableaux seuils 2024)
  retirementThresholds: {
    current: {
      // Résidence en métropole
      metropole: {
        rfrMaxExemption1Part: 12817, // plafond exonération totale
        rfrMaxReduced1Part: 16755,   // plafond CSG 3,8 % (taux réduit)
        rfrMaxMedian1Part: 26004,    // plafond CSG 6,6 % (taux médian). Au-delà : taux normal 8,3 %
        // Majoration par quart de part supplémentaire
        incrementQuarterExemption: 1711,
        incrementQuarterReduced: 2237,
        incrementQuarterMedian: 3471,
      },
      // Résidence en Guadeloupe / Martinique / Réunion / St-Barth / St-Martin
      gmr: {
        rfrMaxExemption1Part: 15164,
        rfrMaxReduced1Part: 18331,
        rfrMaxMedian1Part: 26004,
        // valeurs initialisées d'après le tableau 2025 (premier quart puis quarts suivants),
        // tu pourras les affiner dans l'interface si besoin
        incrementQuarterExemption: 1882,
        incrementQuarterReduced: 2459,
        incrementQuarterMedian: 3471,
      },
      // Résidence en Guyane
      guyane: {
        rfrMaxExemption1Part: 15856,
        rfrMaxReduced1Part: 19200,
        rfrMaxMedian1Part: 26004,
        incrementQuarterExemption: 1968,
        incrementQuarterReduced: 2572,
        incrementQuarterMedian: 3471,
      },
    },
    previous: {
      // 2024 — métropole
      metropole: {
        rfrMaxExemption1Part: 12230,
        rfrMaxReduced1Part: 15988,
        rfrMaxMedian1Part: 24812,
        incrementQuarterExemption: 1633,
        incrementQuarterReduced: 2135,
        incrementQuarterMedian: 3312,
      },
      // 2024 — Guadeloupe / Martinique / Réunion / St-Barth / St-Martin
      gmr: {
        rfrMaxExemption1Part: 14469,
        rfrMaxReduced1Part: 17491,
        rfrMaxMedian1Part: 24812,
        incrementQuarterExemption: 1633,
        incrementQuarterReduced: 2135,
        incrementQuarterMedian: 3312,
      },
      // 2024 — Guyane
      guyane: {
        rfrMaxExemption1Part: 15130,
        rfrMaxReduced1Part: 18321,
        rfrMaxMedian1Part: 24812,
        incrementQuarterExemption: 1633,
        incrementQuarterReduced: 2135,
        incrementQuarterMedian: 3312,
      },
    },
  },
};


export default function SettingsPrelevements() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_PS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState(null);

  const isAdmin =
    user &&
    ((typeof user?.user_metadata?.role === 'string' &&
      user.user_metadata.role.toLowerCase() === 'admin') ||
      user?.user_metadata?.is_admin === true);

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
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error('Erreur user:', userErr);
          if (mounted) setLoading(false);
          return;
        }

        const currentUser = userData?.user || null;
        if (!mounted) return;

        setUser(currentUser);

        // 2. Récupérer les paramètres PS (table ps_settings, id = 1)
        const { data: rows, error: psErr } = await supabase
          .from('ps_settings')
          .select('data')
          .eq('id', 1);

        if (!psErr && rows && rows.length > 0 && rows[0].data) {
          setSettings((prev) => ({
            ...prev,
            ...rows[0].data,
          }));
        } else if (psErr && psErr.code !== 'PGRST116') {
          console.error('Erreur chargement ps_settings :', psErr);
        }

        if (mounted) setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Alias pour compatibilité
  const setData = setSettings;

  // ----------------------
  // Helpers de mise à jour
  // ----------------------
  const updateField = createFieldUpdater(setData, setMessage);

  const updateRetirementBracket = (yearKey, index, key, value) => {
    setData((prev) => {
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
    if (!isAdmin) return;  // on ne fait rien si pas admin
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
      // Invalider le cache pour que /ir et autres pages rafraîchissent
      invalidate('ps');
      broadcastInvalidation('ps');
    } catch (e) {
      console.error(e);
      setError("Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setSaving(false);
    }
  };

  const { labels, patrimony, retirement, retirementThresholds } = settings;

  // ----------------------
  // Rendu
  // ----------------------
  return (
    <div style={{ marginTop: 16 }}>
      {/* Bandeau utilisateur */}
      <UserInfoBanner />

      {/* Messages */}
      {error && (
        <div style={{ color: 'var(--color-error-text)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', padding: '12px 16px', borderRadius: 6, marginTop: 12, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 24 }}>Chargement des paramètres…</div>
      ) : !user ? (
        <div style={{ marginTop: 24 }}>
          Vous devez être connecté pour voir cette page.
        </div>
      ) : (
        <div
          style={{
            fontSize: 15,
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
            <div className="fisc-accordion">

            {/* 1. PS patrimoine / capital */}
            <div className="fisc-acc-item">
              <button
                type="button"
                className="fisc-acc-header"
                id="prelev-header-patrimoine"
                aria-expanded={openSection === 'patrimoine'}
                aria-controls="prelev-panel-patrimoine"
                onClick={() => setOpenSection(openSection === 'patrimoine' ? null : 'patrimoine')}
              >
                <span className="fisc-product-title" style={{ margin: 0 }}>
                  Prélèvements sociaux — patrimoine et capital
                </span>
                <span className="fisc-acc-chevron">{openSection === 'patrimoine' ? '▾' : '▸'}</span>
              </button>
              {openSection === 'patrimoine' && (
              <div className="fisc-acc-body" id="prelev-panel-patrimoine" role="region" aria-labelledby="prelev-header-patrimoine">
              <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
                Taux globaux applicables aux revenus du patrimoine et de
                placement (intérêts, dividendes, etc.).
              </p>

              <div className="tax-two-cols">
                <SettingsYearColumn yearLabel={labels.currentYearLabel}>
                  <SettingsFieldRow
                    label="Taux global des prélèvements sociaux"
                    path={['patrimony', 'current', 'totalRate']}
                    value={patrimony.current.totalRate}
                    onChange={updateField}
                    step="0.1"
                    unit="%"
                    disabled={!isAdmin}
                  />
                  <SettingsFieldRow
                    label="CSG déductible (au barème)"
                    path={['patrimony', 'current', 'csgDeductibleRate']}
                    value={patrimony.current.csgDeductibleRate}
                    onChange={updateField}
                    step="0.1"
                    unit="%"
                    disabled={!isAdmin}
                  />
                </SettingsYearColumn>

                <SettingsYearColumn yearLabel={labels.previousYearLabel} isRight>
                  <SettingsFieldRow
                    label="Taux global des prélèvements sociaux"
                    path={['patrimony', 'previous', 'totalRate']}
                    value={patrimony.previous.totalRate}
                    onChange={updateField}
                    step="0.1"
                    unit="%"
                    disabled={!isAdmin}
                  />
                  <SettingsFieldRow
                    label="CSG déductible (au barème)"
                    path={['patrimony', 'previous', 'csgDeductibleRate']}
                    value={patrimony.previous.csgDeductibleRate}
                    onChange={updateField}
                    step="0.1"
                    unit="%"
                    disabled={!isAdmin}
                  />
                </SettingsYearColumn>
              </div>
              </div>
              )}
            </div>

            {/* 2. PS retraites */}
            <div className="fisc-acc-item">
              <button
                type="button"
                className="fisc-acc-header"
                id="prelev-header-retraites"
                aria-expanded={openSection === 'retraites'}
                aria-controls="prelev-panel-retraites"
                onClick={() => setOpenSection(openSection === 'retraites' ? null : 'retraites')}
              >
                <span className="fisc-product-title" style={{ margin: 0 }}>
                  Prélèvements sociaux — pensions de retraite
                </span>
                <span className="fisc-acc-chevron">{openSection === 'retraites' ? '▾' : '▸'}</span>
              </button>
              {openSection === 'retraites' && (
              <div className="fisc-acc-body" id="prelev-panel-retraites" role="region" aria-labelledby="prelev-header-retraites">
              <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
                Barème des prélèvements sociaux sur les pensions de retraite
                (RFR pour 1 part). Les montants sont ajustés en fonction des
                parts, mais on stocke ici la base &quot;1 part&quot;.
              </p>

{/* On empile les deux tableaux : 2025 puis 2024 */}
{(() => {
  const retCols = [
    { key: 'label', header: 'Tranche', type: 'display' },
    { key: 'rfrMin1Part', header: 'RFR min (1 part)' },
    { key: 'rfrMax1Part', header: 'RFR max (1 part)' },
    { key: 'csgRate', header: 'CSG\u00a0%', step: '0.1' },
    { key: 'crdsRate', header: 'CRDS\u00a0%', step: '0.1' },
    { key: 'casaRate', header: 'CASA\u00a0%', step: '0.1' },
    { key: 'maladieRate', header: 'Maladie\u00a0%', step: '0.1' },
    { key: 'totalRate', header: 'Total\u00a0%', step: '0.1' },
    { key: 'csgDeductibleRate', header: 'CSG déd.\u00a0%', step: '0.1' },
  ];
  return (
    <div>
      {[
        { yearKey: 'current', label: labels.currentYearLabel, prefix: 'retCur' },
        { yearKey: 'previous', label: labels.previousYearLabel, prefix: 'retPrev' },
      ].map(({ yearKey, label, prefix }, i) => (
        <div key={yearKey} style={i > 0 ? { marginTop: 24 } : undefined}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
          <SettingsTable
            columns={retCols}
            rows={retirement[yearKey].brackets.map((b, idx) => ({ ...b, _key: `${prefix}_${idx}` }))}
            onCellChange={(idx, key, value) => updateRetirementBracket(yearKey, idx, key, value)}
            disabled={!isAdmin}
          />
        </div>
      ))}
    </div>
  );
})()}
              </div>
              )}
            </div>

                        {/* 3. Seuils RFR pour CSG / CRDS / CASA */}
            <div className="fisc-acc-item">
              <button
                type="button"
                className="fisc-acc-header"
                id="prelev-header-seuils"
                aria-expanded={openSection === 'seuils'}
                aria-controls="prelev-panel-seuils"
                onClick={() => setOpenSection(openSection === 'seuils' ? null : 'seuils')}
              >
                <span className="fisc-product-title" style={{ margin: 0 }}>
                  Seuils de revenus pour la CSG, la CRDS et la CASA (RFR)
                </span>
                <span className="fisc-acc-chevron">{openSection === 'seuils' ? '▾' : '▸'}</span>
              </button>
              {openSection === 'seuils' && (
              <div className="fisc-acc-body" id="prelev-panel-seuils" role="region" aria-labelledby="prelev-header-seuils">
              <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 12 }}>
                Seuils de revenu fiscal de référence (RFR) utilisés pour déterminer
                l&apos;exonération ou l&apos;assujettissement aux taux réduit, médian
                ou normal de CSG sur les pensions de retraite. Ces seuils s&apos;appliquent
                aussi pour la CRDS et la CASA.
                Les montants sont indiqués pour <strong>1 part</strong>, avec une
                majoration par <strong>quart de part supplémentaire</strong>.
              </p>

              <div className="tax-two-cols">
                {/* Colonne 2025 */}
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {labels.currentYearLabel}
                  </div>

                  {/* Métropole */}
                  <div style={{ fontWeight: 500, marginTop: 8, marginBottom: 4 }}>
                    Résidence en métropole
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond exonération (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.metropole.rfrMaxExemption1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'metropole',
                            'rfrMaxExemption1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux réduit (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.metropole.rfrMaxReduced1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'metropole',
                            'rfrMaxReduced1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux médian (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.metropole.rfrMaxMedian1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'metropole',
                            'rfrMaxMedian1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  <div className="settings-field-row">
                    <label>
                      Majoration par quart – exonération
                    </label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.metropole
                          .incrementQuarterExemption
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'metropole',
                            'incrementQuarterExemption',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>
                      Majoration par quart – taux réduit
                    </label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.metropole
                          .incrementQuarterReduced
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'metropole',
                            'incrementQuarterReduced',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>
                      Majoration par quart – taux médian
                    </label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.metropole
                          .incrementQuarterMedian
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'metropole',
                            'incrementQuarterMedian',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  {/* DOM hors Guyane */}
                  <div style={{ fontWeight: 500, marginTop: 16, marginBottom: 4 }}>
                    Résidence en Martinique, Guadeloupe, Réunion,
                    Saint-Barthélemy, Saint-Martin
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond exonération (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.gmr.rfrMaxExemption1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          ['retirementThresholds', 'current', 'gmr', 'rfrMaxExemption1Part'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux réduit (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.gmr.rfrMaxReduced1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          ['retirementThresholds', 'current', 'gmr', 'rfrMaxReduced1Part'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux médian (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.gmr.rfrMaxMedian1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          ['retirementThresholds', 'current', 'gmr', 'rfrMaxMedian1Part'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  <div className="settings-field-row">
                    <label>Majoration par quart – exonération</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.gmr.incrementQuarterExemption
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'gmr',
                            'incrementQuarterExemption',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux réduit</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.gmr.incrementQuarterReduced
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'gmr',
                            'incrementQuarterReduced',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux médian</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.gmr.incrementQuarterMedian
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'gmr',
                            'incrementQuarterMedian',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  {/* Guyane */}
                  <div style={{ fontWeight: 500, marginTop: 16, marginBottom: 4 }}>
                    Résidence en Guyane
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond exonération (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.guyane.rfrMaxExemption1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'guyane',
                            'rfrMaxExemption1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux réduit (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.guyane.rfrMaxReduced1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'guyane',
                            'rfrMaxReduced1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux médian (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.guyane.rfrMaxMedian1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'guyane',
                            'rfrMaxMedian1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  <div className="settings-field-row">
                    <label>Majoration par quart – exonération</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.guyane
                          .incrementQuarterExemption
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'guyane',
                            'incrementQuarterExemption',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux réduit</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.guyane
                          .incrementQuarterReduced
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'guyane',
                            'incrementQuarterReduced',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux médian</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.current.guyane
                          .incrementQuarterMedian
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'current',
                            'guyane',
                            'incrementQuarterMedian',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* Colonne 2024 */}
                <div className="tax-two-cols-right">
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {labels.previousYearLabel}
                  </div>

                  {/* Métropole */}
                  <div style={{ fontWeight: 500, marginTop: 8, marginBottom: 4 }}>
                    Résidence en métropole
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond exonération (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.metropole.rfrMaxExemption1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'metropole',
                            'rfrMaxExemption1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux réduit (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.metropole.rfrMaxReduced1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'metropole',
                            'rfrMaxReduced1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux médian (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.metropole.rfrMaxMedian1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'metropole',
                            'rfrMaxMedian1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  <div className="settings-field-row">
                    <label>Majoration par quart – exonération</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.metropole
                          .incrementQuarterExemption
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'metropole',
                            'incrementQuarterExemption',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux réduit</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.metropole
                          .incrementQuarterReduced
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'metropole',
                            'incrementQuarterReduced',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux médian</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.metropole
                          .incrementQuarterMedian
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'metropole',
                            'incrementQuarterMedian',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  {/* GMR */}
                  <div style={{ fontWeight: 500, marginTop: 16, marginBottom: 4 }}>
                    Résidence en Martinique, Guadeloupe, Réunion,
                    Saint-Barthélemy, Saint-Martin
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond exonération (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.gmr.rfrMaxExemption1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          ['retirementThresholds', 'previous', 'gmr', 'rfrMaxExemption1Part'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux réduit (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.gmr.rfrMaxReduced1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          ['retirementThresholds', 'previous', 'gmr', 'rfrMaxReduced1Part'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux médian (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.gmr.rfrMaxMedian1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          ['retirementThresholds', 'previous', 'gmr', 'rfrMaxMedian1Part'],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  <div className="settings-field-row">
                    <label>Majoration par quart – exonération</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.gmr.incrementQuarterExemption
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'gmr',
                            'incrementQuarterExemption',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux réduit</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.gmr.incrementQuarterReduced
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'gmr',
                            'incrementQuarterReduced',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux médian</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.gmr.incrementQuarterMedian
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'gmr',
                            'incrementQuarterMedian',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  {/* Guyane */}
                  <div style={{ fontWeight: 500, marginTop: 16, marginBottom: 4 }}>
                    Résidence en Guyane
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond exonération (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.guyane.rfrMaxExemption1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'guyane',
                            'rfrMaxExemption1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux réduit (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.guyane.rfrMaxReduced1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'guyane',
                            'rfrMaxReduced1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond taux médian (1 part)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.guyane.rfrMaxMedian1Part
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'guyane',
                            'rfrMaxMedian1Part',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>

                  <div className="settings-field-row">
                    <label>Majoration par quart – exonération</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.guyane
                          .incrementQuarterExemption
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'guyane',
                            'incrementQuarterExemption',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux réduit</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.guyane
                          .incrementQuarterReduced
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'guyane',
                            'incrementQuarterReduced',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Majoration par quart – taux médian</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        retirementThresholds.previous.guyane
                          .incrementQuarterMedian
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'retirementThresholds',
                            'previous',
                            'guyane',
                            'incrementQuarterMedian',
                          ],
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>
              </div>
              </div>
              )}
            </div>

            </div>{/* fin fisc-accordion */}

            
            {/* Bouton de sauvegarde */}
            {isAdmin && (
              <button
                type="button"
                className="chip"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? 'Enregistrement...'
                  : 'Enregistrer les paramètres'}
              </button>
            )}
            {message && (
              <div className="settings-success-message" style={{ 
                fontSize: 14, 
                marginTop: 12, 
                padding: '12px 16px', 
                background: message.includes('Erreur') ? 'var(--color-error-bg)' : 'var(--color-success-bg)', 
                border: message.includes('Erreur') ? '1px solid var(--color-error-border)' : '1px solid var(--color-success-border)', 
                borderRadius: 6, 
                color: message.includes('Erreur') ? 'var(--color-error-text)' : 'var(--color-success-text)',
                fontWeight: 500
              }}>
                {message}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
