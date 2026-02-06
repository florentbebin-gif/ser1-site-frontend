import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './SettingsImpots.css';
import { invalidate, broadcastInvalidation } from '../../utils/fiscalSettingsCache.js';
import { UserInfoBanner } from '../../components/UserInfoBanner';
import { numberOrEmpty, createFieldUpdater } from '../../utils/settingsHelpers.js';
import SettingsFieldRow from '../../components/settings/SettingsFieldRow';
import SettingsYearColumn from '../../components/settings/SettingsYearColumn';

// ----------------------
// Valeurs par défaut
// ----------------------
// Barème 2025 (revenus 2024) + retraitements : Word + brochure IR 2025
// Barème 2024 (revenus 2023) : barème officiel 2024
// PFU, CEHR, CDHR, IS : sources officielles.
const DEFAULT_TAX_SETTINGS = {
  incomeTax: {
    currentYearLabel: '2025 (revenus 2024)',
    previousYearLabel: '2024 (revenus 2023)',
    scaleCurrent: [
      { from: 0, to: 11497, rate: 0, deduction: 0 },
      { from: 11498, to: 29315, rate: 11, deduction: 1264.78 },
      { from: 29316, to: 83823, rate: 30, deduction: 6834.63 },
      { from: 83824, to: 180294, rate: 41, deduction: 16055.16 },
      { from: 180295, to: null, rate: 45, deduction: 23266.92 },
    ],
    scalePrevious: [
      { from: 0, to: 11294, rate: 0, deduction: 0 },
      { from: 11295, to: 28797, rate: 11, deduction: 0 },
      { from: 28798, to: 82341, rate: 30, deduction: 0 },
      { from: 82342, to: 177106, rate: 41, deduction: 0 },
      { from: 177107, to: null, rate: 45, deduction: 0 },
    ],
    quotientFamily: {
      current: {
        plafondPartSup: 1791,
        plafondParentIsoléDeuxPremièresParts: 4224,
      },
      previous: {
        plafondPartSup: 1791,
        plafondParentIsoléDeuxPremièresParts: 4224,
      },
    },
    decote: {
      current: {
        triggerSingle: 1964,
        triggerCouple: 3248,
        amountSingle: 889,
        amountCouple: 1470,
        ratePercent: 45.25,
      },
      previous: {
        triggerSingle: 1964,
        triggerCouple: 3248,
        amountSingle: 889,
        amountCouple: 1470,
        ratePercent: 45.25,
      },
    },

    abat10: {
      current: { plafond: 14426, plancher: 504 },
      previous: { plafond: 14171, plancher: 495 },
      retireesCurrent: { plafond: 4399, plancher: 450 },
      retireesPrevious: { plafond: 4321, plancher: 442 },
    },
domAbatement: {
  current: {
    gmr: { ratePercent: 30, cap: 2450 },
    guyane: { ratePercent: 40, cap: 4050 },
  },
  previous: {
    gmr: { ratePercent: 30, cap: 2450 },
    guyane: { ratePercent: 40, cap: 4050 },
  },
},

  },
  pfu: {
    current: {
      rateIR: 12.8,
      rateSocial: 17.2,
      rateTotal: 30.0,
    },
    previous: {
      rateIR: 12.8,
      rateSocial: 17.2,
      rateTotal: 30.0,
    },
  },
  cehr: {
    current: {
      single: [
        { from: 250000, to: 500000, rate: 3 },
        { from: 500000, to: null, rate: 4 },
      ],
      couple: [
        { from: 500000, to: 1000000, rate: 3 },
        { from: 1000000, to: null, rate: 4 },
      ],
    },
    previous: {
      single: [
        { from: 250000, to: 500000, rate: 3 },
        { from: 500000, to: null, rate: 4 },
      ],
      couple: [
        { from: 500000, to: 1000000, rate: 3 },
        { from: 1000000, to: null, rate: 4 },
      ],
    },
  },
  cdhr: {
    current: {
      minEffectiveRate: 20,
      thresholdSingle: 250000,
      thresholdCouple: 500000,
    },
    previous: {
      minEffectiveRate: 20,
      thresholdSingle: 250000,
      thresholdCouple: 500000,
    },
  },
  corporateTax: {
    current: {
      normalRate: 25,
      reducedRate: 15,
      reducedThreshold: 42500,
    },
    previous: {
      normalRate: 25,
      reducedRate: 15,
      reducedThreshold: 42500,
    },
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

export default function SettingsImpots() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(DEFAULT_TAX_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState(null);

  const isAdmin =
    user &&
    ((typeof user?.user_metadata?.role === 'string' &&
      user.user_metadata.role.toLowerCase() === 'admin') ||
      user?.user_metadata?.is_admin === true);

  // Chargement user + paramètres depuis la table tax_settings
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error('Erreur user:', userErr);
          if (mounted) setLoading(false);
          return;
        }

        const u = userData?.user || null;
        if (!mounted) return;

        setUser(u);

        // Charge la ligne id=1 si elle existe
        const { data: rows, error: taxErr } = await supabase
          .from('tax_settings')
          .select('data')
          .eq('id', 1);

        if (!taxErr && rows && rows.length > 0 && rows[0].data) {
          setSettings((prev) => ({
            ...prev,
            ...rows[0].data,
          }));
        } else if (taxErr && taxErr.code !== 'PGRST116') {
          console.error('Erreur chargement tax_settings :', taxErr);
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

  // Sauvegarde
  const handleSave = async () => {
    if (!isAdmin) return;
    
    try {
      setSaving(true);
      setMessage('');

      const { error } = await supabase
        .from('tax_settings')
        .upsert({ id: 1, data: settings });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setMessage('Paramètres impôts enregistrés.');
        // Invalider le cache pour que /ir et autres pages rafraîchissent
        invalidate('tax');
        broadcastInvalidation('tax');
      }
    } catch (e) {
      console.error(e);
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // Alias pour compatibilité
  const setData = setSettings;

  // Helpers de MAJ
  const updateIncomeScale = (which, index, key, value) => {
    setData((prev) => ({
      ...prev,
      incomeTax: {
        ...prev.incomeTax,
        [which]: prev.incomeTax[which].map((row, i) =>
          i === index ? { ...row, [key]: value } : row
        ),
      },
    }));
    setMessage('');
  };

  const updateField = createFieldUpdater(setData, setMessage);

  if (loading) {
    return <p>Chargement…</p>;
  }

  if (!user) {
    return <p>Aucun utilisateur connecté.</p>;
  }

  const { incomeTax, pfu, cehr, cdhr, corporateTax, dmtg } = settings;

  const updateDmtgScale = (index, key, value) => {
    setData((prev) => ({
      ...prev,
      dmtg: {
        ...prev.dmtg,
        scale: prev.dmtg.scale.map((row, i) =>
          i === index ? { ...row, [key]: value } : row
        ),
      },
    }));
    setMessage('');
  };

  return (
    <div
      style={{
        fontSize: 15,
        marginTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Bandeau info */}
      <UserInfoBanner />

        <div className="fisc-accordion">

                  {/* 1. Barème impôt sur le revenu */}
<div className="fisc-acc-item">
  <button type="button" className="fisc-acc-header" id="impots-header-bareme" aria-expanded={openSection === 'bareme'} aria-controls="impots-panel-bareme" onClick={() => setOpenSection(openSection === 'bareme' ? null : 'bareme')}>
    <span className="fisc-product-title" style={{ margin: 0 }}>Barème de l’impôt sur le revenu</span>
    <span className="fisc-acc-chevron">{openSection === 'bareme' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'bareme' && (
  <div className="fisc-acc-body" id="impots-panel-bareme" role="region" aria-labelledby="impots-header-bareme">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 8 }}>
            Barème progressif par tranches (taux et retraitement) pour le
            barème actuel et celui de l’année précédente.
          </p>

          <div className="income-tax-columns">
            {/* Colonne 2025 / revenus 2024 */}
            <div className="income-tax-col">
<div className="settings-field-row" style={{ marginBottom: 10 }}>
  <label style={{ fontWeight: 600 }}>Barème</label>
  <input
    type="text"
    value={incomeTax.currentYearLabel || ''}
    onChange={(e) =>
      updateField(['incomeTax', 'currentYearLabel'], e.target.value)
    }
    disabled={!isAdmin}
    style={{ width: 220, textAlign: 'left' }}
    placeholder="Ex: 2026 (revenus 2025)"
  />
</div>


              {/* Tableau barème 2025 */}
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>De</th>
                    <th>À</th>
                    <th className="taux-col">Taux&nbsp;%</th>
                  </tr>
                </thead>

                <tbody>
                  {incomeTax.scaleCurrent.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="number"
                          value={numberOrEmpty(row.from)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scaleCurrent',
                              idx,
                              'from',
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
                          value={numberOrEmpty(row.to)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scaleCurrent',
                              idx,
                              'to',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                        <td className="taux-col">
                        <input
                          type="number"
                          step="0.01"
                          value={numberOrEmpty(row.rate)}
                          onChange={(e) =>
                            updateIncomeScale(
                            'scaleCurrent',
                            idx,
                            'rate',
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

              {/* Blocs sous le barème 2025 */}
              <div className="income-tax-extra">
{/* 1. Plafond du quotient familial */}
<div className="income-tax-block">
  <div className="income-tax-block-title">
    Plafond du quotient familial
  </div>
  <div className="settings-field-row">
    <label>Par 1/2 part supplémentaire</label>
    <input
      type="number"
      value={numberOrEmpty(
        incomeTax.quotientFamily.current.plafondPartSup
      )}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'quotientFamily', 'current', 'plafondPartSup'],
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
    <label>Parent isolé (2 premières parts)</label>
    <input
      type="number"
      value={numberOrEmpty(
        incomeTax.quotientFamily.current
          .plafondParentIsoléDeuxPremièresParts
      )}
      onChange={(e) =>
        updateField(
          [
            'incomeTax',
            'quotientFamily',
            'current',
            'plafondParentIsoléDeuxPremièresParts',
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


{/* 2. Décote */}
<div className="income-tax-block">
  <div className="income-tax-block-title">Décote</div>
  <div className="settings-field-row">
    <label>Déclenchement célibataire</label>
    <input
      type="number"
      value={numberOrEmpty(incomeTax.decote.current.triggerSingle)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'current', 'triggerSingle'],
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
    <label>Déclenchement couple</label>
    <input
      type="number"
      value={numberOrEmpty(incomeTax.decote.current.triggerCouple)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'current', 'triggerCouple'],
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
    <label>Montant célibataire</label>
    <input
      type="number"
      value={numberOrEmpty(incomeTax.decote.current.amountSingle)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'current', 'amountSingle'],
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
    <label>Montant couple</label>
    <input
      type="number"
      value={numberOrEmpty(incomeTax.decote.current.amountCouple)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'current', 'amountCouple'],
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
    <label>Taux de la décote</label>
    <input
      type="number"
      step="0.01"
      value={numberOrEmpty(incomeTax.decote.current.ratePercent)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'current', 'ratePercent'],
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


                {/* 3. Abattement 10 % */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;%
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.current.plafond)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'current', 'plafond'],
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
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.current.plancher)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'current', 'plancher'],
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

                {/* 4. Abattement 10 % pensions retraite */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;% pensions retraite
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesCurrent.plafond
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'retireesCurrent', 'plafond'],
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
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesCurrent.plancher
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'abat10',
                            'retireesCurrent',
                            'plancher',
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

            {/* Colonne 2024 / revenus 2023 */}
            <div className="income-tax-col income-tax-col-right">
<div className="settings-field-row" style={{ marginBottom: 10 }}>
  <label style={{ fontWeight: 600 }}>Barème</label>
  <input
    type="text"
    value={incomeTax.previousYearLabel || ''}
    onChange={(e) =>
      updateField(['incomeTax', 'previousYearLabel'], e.target.value)
    }
    disabled={!isAdmin}
    style={{ width: 220, textAlign: 'left' }}
    placeholder="Ex: 2025 (revenus 2024)"
  />
</div>


              {/* Tableau barème 2024 */}
              <table className="settings-table">
                <thead>
<tr>
  <th>De</th>
  <th>À</th>
  <th className="taux-col">Taux&nbsp;%</th>
</tr>

                </thead>

                <tbody>
                  {incomeTax.scalePrevious.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="number"
                          value={numberOrEmpty(row.from)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scalePrevious',
                              idx,
                              'from',
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
                          value={numberOrEmpty(row.to)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scalePrevious',
                              idx,
                              'to',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                        <td className="taux-col">
                        <input
                          type="number"
                          step="0.01"
                          value={numberOrEmpty(row.rate)}
                          onChange={(e) =>
                            updateIncomeScale(
                              'scalePrevious',
                                idx,
                                'rate',
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

              {/* Blocs sous le barème 2024 */}
              <div className="income-tax-extra">
{/* 1. Plafond du quotient familial */}
<div className="income-tax-block">
  <div className="income-tax-block-title">
    Plafond du quotient familial
  </div>
  <div className="settings-field-row">
    <label>Par 1/2 part supplémentaire</label>
    <input
      type="number"
      value={numberOrEmpty(
        incomeTax.quotientFamily.previous.plafondPartSup
      )}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'quotientFamily', 'previous', 'plafondPartSup'],
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
    <label>Parent isolé (2 premières parts)</label>
    <input
      type="number"
      value={numberOrEmpty(
        incomeTax.quotientFamily.previous
          .plafondParentIsoléDeuxPremièresParts
      )}
      onChange={(e) =>
        updateField(
          [
            'incomeTax',
            'quotientFamily',
            'previous',
            'plafondParentIsoléDeuxPremièresParts',
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

                {/* 2. Décote */}
<div className="income-tax-block">
  <div className="income-tax-block-title">Décote</div>
  <div className="settings-field-row">
    <label>Déclenchement célibataire</label>
    <input
      type="number"
      value={numberOrEmpty(incomeTax.decote.previous.triggerSingle)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'previous', 'triggerSingle'],
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
    <label>Déclenchement couple</label>
    <input
      type="number"
      value={numberOrEmpty(incomeTax.decote.previous.triggerCouple)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'previous', 'triggerCouple'],
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
    <label>Montant célibataire</label>
    <input
      type="number"
      value={numberOrEmpty(incomeTax.decote.previous.amountSingle)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'previous', 'amountSingle'],
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
    <label>Montant couple</label>
    <input
      type="number"
      value={numberOrEmpty(incomeTax.decote.previous.amountCouple)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'previous', 'amountCouple'],
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
    <label>Taux de la décote</label>
    <input
      type="number"
      step="0.01"
      value={numberOrEmpty(incomeTax.decote.previous.ratePercent)}
      onChange={(e) =>
        updateField(
          ['incomeTax', 'decote', 'previous', 'ratePercent'],
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


                {/* 3. Abattement 10 % */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;%
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.previous.plafond)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'previous', 'plafond'],
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
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.previous.plancher)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'previous', 'plancher'],
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

                {/* 4. Abattement 10 % pensions retraite */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;% pensions retraite
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesPrevious.plafond
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'abat10',
                            'retireesPrevious',
                            'plafond',
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
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesPrevious.plancher
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'abat10',
                            'retireesPrevious',
                            'plancher',
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
          </div>
  </div>
  )}
</div>
{/* Abattement DOM sur l'IR (barème) */}
<div className="fisc-acc-item">
  <button type="button" className="fisc-acc-header" id="impots-header-dom" aria-expanded={openSection === 'dom'} aria-controls="impots-panel-dom" onClick={() => setOpenSection(openSection === 'dom' ? null : 'dom')}>
    <span className="fisc-product-title" style={{ margin: 0 }}>Abattement DOM sur l’IR (barème)</span>
    <span className="fisc-acc-chevron">{openSection === 'dom' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'dom' && (
  <div className="fisc-acc-body" id="impots-panel-dom" role="region" aria-labelledby="impots-header-dom">
  <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 8 }}>
    Appliqué sur l’impôt issu du barème <strong>après plafonnement du quotient familial</strong> et
    <strong> avant</strong> décote + réductions/crédits.
  </p>

  <div className="income-tax-columns">
    {/* Colonne CURRENT */}
    <div className="income-tax-col">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        {incomeTax.currentYearLabel || 'Année N'}
      </div>

      <table className="settings-table">
        <thead>
          <tr>
            <th>Zone</th>
            <th className="taux-col">Taux %</th>
            <th>Plafond €</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Guadeloupe / Martinique / Réunion</td>
            <td className="taux-col">
              <input
                type="number"
                value={numberOrEmpty(incomeTax?.domAbatement?.current?.gmr?.ratePercent)}
                onChange={(e) =>
                  updateField(
                    ['incomeTax', 'domAbatement', 'current', 'gmr', 'ratePercent'],
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
            </td>
            <td>
              <input
                type="number"
                value={numberOrEmpty(incomeTax?.domAbatement?.current?.gmr?.cap)}
                onChange={(e) =>
                  updateField(
                    ['incomeTax', 'domAbatement', 'current', 'gmr', 'cap'],
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
            </td>
          </tr>

          <tr>
            <td>Guyane / Mayotte</td>
            <td className="taux-col">
              <input
                type="number"
                value={numberOrEmpty(incomeTax?.domAbatement?.current?.guyane?.ratePercent)}
                onChange={(e) =>
                  updateField(
                    ['incomeTax', 'domAbatement', 'current', 'guyane', 'ratePercent'],
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
            </td>
            <td>
              <input
                type="number"
                value={numberOrEmpty(incomeTax?.domAbatement?.current?.guyane?.cap)}
                onChange={(e) =>
                  updateField(
                    ['incomeTax', 'domAbatement', 'current', 'guyane', 'cap'],
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Colonne PREVIOUS */}
    <div className="income-tax-col">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        {incomeTax.previousYearLabel || 'Année N-1'}
      </div>

      <table className="settings-table">
        <thead>
          <tr>
            <th>Zone</th>
            <th className="taux-col">Taux %</th>
            <th>Plafond €</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Guadeloupe / Martinique / Réunion</td>
            <td className="taux-col">
              <input
                type="number"
                value={numberOrEmpty(incomeTax?.domAbatement?.previous?.gmr?.ratePercent)}
                onChange={(e) =>
                  updateField(
                    ['incomeTax', 'domAbatement', 'previous', 'gmr', 'ratePercent'],
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
            </td>
            <td>
              <input
                type="number"
                value={numberOrEmpty(incomeTax?.domAbatement?.previous?.gmr?.cap)}
                onChange={(e) =>
                  updateField(
                    ['incomeTax', 'domAbatement', 'previous', 'gmr', 'cap'],
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
            </td>
          </tr>

          <tr>
            <td>Guyane / Mayotte</td>
            <td className="taux-col">
              <input
                type="number"
                value={numberOrEmpty(incomeTax?.domAbatement?.previous?.guyane?.ratePercent)}
                onChange={(e) =>
                  updateField(
                    ['incomeTax', 'domAbatement', 'previous', 'guyane', 'ratePercent'],
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
            </td>
            <td>
              <input
                type="number"
                value={numberOrEmpty(incomeTax?.domAbatement?.previous?.guyane?.cap)}
                onChange={(e) =>
                  updateField(
                    ['incomeTax', 'domAbatement', 'previous', 'guyane', 'cap'],
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  </div>
  )}
</div>


          {/* 2. PFU */}
          <div className="fisc-acc-item">
  <button type="button" className="fisc-acc-header" id="impots-header-pfu" aria-expanded={openSection === 'pfu'} aria-controls="impots-panel-pfu" onClick={() => setOpenSection(openSection === 'pfu' ? null : 'pfu')}>
    <span className="fisc-product-title" style={{ margin: 0 }}>PFU (flat tax)</span>
    <span className="fisc-acc-chevron">{openSection === 'pfu' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'pfu' && (
  <div className="fisc-acc-body" id="impots-panel-pfu" role="region" aria-labelledby="impots-header-pfu">

  <div className="tax-two-cols">
    <SettingsYearColumn yearLabel={incomeTax.currentYearLabel}>
      <SettingsFieldRow
        label="Part impôt sur le revenu"
        path={['pfu', 'current', 'rateIR']}
        value={pfu.current.rateIR}
        onChange={updateField}
        step="0.1"
        unit="%"
        disabled={!isAdmin}
      />
      <SettingsFieldRow
        label="Prélèvements sociaux"
        path={['pfu', 'current', 'rateSocial']}
        value={pfu.current.rateSocial}
        onChange={updateField}
        step="0.1"
        unit="%"
        disabled={!isAdmin}
      />
      <SettingsFieldRow
        label="Taux global PFU"
        path={['pfu', 'current', 'rateTotal']}
        value={pfu.current.rateTotal}
        onChange={updateField}
        step="0.1"
        unit="%"
        disabled={!isAdmin}
      />
    </SettingsYearColumn>

    <SettingsYearColumn yearLabel={incomeTax.previousYearLabel} isRight>
      <SettingsFieldRow
        label="Part impôt sur le revenu"
        path={['pfu', 'previous', 'rateIR']}
        value={pfu.previous.rateIR}
        onChange={updateField}
        step="0.1"
        unit="%"
        disabled={!isAdmin}
      />
      <SettingsFieldRow
        label="Prélèvements sociaux"
        path={['pfu', 'previous', 'rateSocial']}
        value={pfu.previous.rateSocial}
        onChange={updateField}
        step="0.1"
        unit="%"
        disabled={!isAdmin}
      />
      <SettingsFieldRow
        label="Taux global PFU"
        path={['pfu', 'previous', 'rateTotal']}
        value={pfu.previous.rateTotal}
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


          {/* 3. CEHR / CDHR */}
          <div className="fisc-acc-item">
  <button type="button" className="fisc-acc-header" id="impots-header-cehr" aria-expanded={openSection === 'cehr'} aria-controls="impots-panel-cehr" onClick={() => setOpenSection(openSection === 'cehr' ? null : 'cehr')}>
    <span className="fisc-product-title" style={{ margin: 0 }}>CEHR / CDHR</span>
    <span className="fisc-acc-chevron">{openSection === 'cehr' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'cehr' && (
  <div className="fisc-acc-body" id="impots-panel-cehr" role="region" aria-labelledby="impots-header-cehr">
  <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
    Contribution exceptionnelle sur les hauts revenus (CEHR) et
    contribution différentielle (CDHR).
  </p>

  <div className="tax-two-cols">
    {/* Colonne 2025 */}
    <div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.currentYearLabel}
      </div>

      <strong>CEHR – personne seule</strong>
      {cehr.current.single.map((row, idx) => (
        <div className="settings-field-row" key={`cehrS_2025_${idx}`}>
          <label>
            De {numberOrEmpty(row.from)} € à{' '}
            {row.to ? `${row.to} €` : 'plus'}
          </label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(row.rate)}
            onChange={(e) =>
              updateField(
                ['cehr', 'current', 'single', idx, 'rate'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
      ))}

      <strong>CEHR – couple</strong>
      {cehr.current.couple.map((row, idx) => (
        <div className="settings-field-row" key={`cehrC_2025_${idx}`}>
          <label>
            De {numberOrEmpty(row.from)} € à{' '}
            {row.to ? `${row.to} €` : 'plus'}
          </label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(row.rate)}
            onChange={(e) =>
              updateField(
                ['cehr', 'current', 'couple', idx, 'rate'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
      ))}

      <strong>CDHR (taux minimal)</strong>
      <div className="settings-field-row">
        <label>Taux effectif minimal</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(cdhr.current.minEffectiveRate)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'current', 'minEffectiveRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil RFR personne seule</label>
        <input
          type="number"
          value={numberOrEmpty(cdhr.current.thresholdSingle)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'current', 'thresholdSingle'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil RFR couple</label>
        <input
          type="number"
          value={numberOrEmpty(cdhr.current.thresholdCouple)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'current', 'thresholdCouple'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
    </div>

    {/* Colonne 2024 – mêmes paramètres pour l’instant */}
    <div className="tax-two-cols-right">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.previousYearLabel}
      </div>

      <strong>CEHR – personne seule</strong>
      {cehr.previous.single.map((row, idx) => (
        <div className="settings-field-row" key={`cehrS_2024_${idx}`}>
          <label>
            De {numberOrEmpty(row.from)} € à{' '}
            {row.to ? `${row.to} €` : 'plus'}
          </label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(row.rate)}
            onChange={(e) =>
              updateField(
                ['cehr', 'previous', 'single', idx, 'rate'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
      ))}

      <strong>CEHR – couple</strong>
      {cehr.previous.couple.map((row, idx) => (
        <div className="settings-field-row" key={`cehrC_2024_${idx}`}>
          <label>
            De {numberOrEmpty(row.from)} € à{' '}
            {row.to ? `${row.to} €` : 'plus'}
          </label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(row.rate)}
            onChange={(e) =>
              updateField(
                ['cehr', 'previous', 'couple', idx, 'rate'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
      ))}

      <strong>CDHR (taux minimal)</strong>
      <div className="settings-field-row">
        <label>Taux effectif minimal</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(cdhr.previous.minEffectiveRate)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'previous', 'minEffectiveRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil RFR personne seule</label>
        <input
          type="number"
          value={numberOrEmpty(cdhr.previous.thresholdSingle)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'previous', 'thresholdSingle'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil RFR couple</label>
        <input
          type="number"
          value={numberOrEmpty(cdhr.previous.thresholdCouple)}
          onChange={(e) =>
            updateField(
              ['cdhr', 'previous', 'thresholdCouple'],
              e.target.value === '' ? null : Number(e.target.value)
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


          {/* 4. Impôt sur les sociétés */}
          <div className="fisc-acc-item">
  <button type="button" className="fisc-acc-header" id="impots-header-is" aria-expanded={openSection === 'is'} aria-controls="impots-panel-is" onClick={() => setOpenSection(openSection === 'is' ? null : 'is')}>
    <span className="fisc-product-title" style={{ margin: 0 }}>Impôt sur les sociétés</span>
    <span className="fisc-acc-chevron">{openSection === 'is' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'is' && (
  <div className="fisc-acc-body" id="impots-panel-is" role="region" aria-labelledby="impots-header-is">

  <div className="tax-two-cols">
    {/* 2025 */}
    <div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.currentYearLabel}
      </div>
      <div className="settings-field-row">
        <label>Taux normal IS</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(corporateTax.current.normalRate)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'current', 'normalRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Taux réduit IS</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(corporateTax.current.reducedRate)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'current', 'reducedRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil de bénéfice au taux réduit</label>
        <input
          type="number"
          value={numberOrEmpty(corporateTax.current.reducedThreshold)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'current', 'reducedThreshold'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
    </div>

    {/* 2024 – mêmes valeurs aujourd’hui */}
    <div className="tax-two-cols-right">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {incomeTax.previousYearLabel}
      </div>
      <div className="settings-field-row">
        <label>Taux normal IS</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(corporateTax.previous.normalRate)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'previous', 'normalRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Taux réduit IS</label>
        <input
          type="number"
          step="0.1"
          value={numberOrEmpty(corporateTax.previous.reducedRate)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'previous', 'reducedRate'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>%</span>
      </div>
      <div className="settings-field-row">
        <label>Seuil de bénéfice au taux réduit</label>
        <input
          type="number"
          value={numberOrEmpty(corporateTax.previous.reducedThreshold)}
          onChange={(e) =>
            updateField(
              ['corporateTax', 'previous', 'reducedThreshold'],
              e.target.value === '' ? null : Number(e.target.value)
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

{/* Section DMTG - Droits de Mutation à Titre Gratuit */}
<div className="fisc-acc-item">
  <button type="button" className="fisc-acc-header" id="impots-header-dmtg" aria-expanded={openSection === 'dmtg'} aria-controls="impots-panel-dmtg" onClick={() => setOpenSection(openSection === 'dmtg' ? null : 'dmtg')}>
    <span className="fisc-product-title" style={{ margin: 0 }}>Droits de Mutation à Titre Gratuit (DMTG) - Ligne directe</span>
    <span className="fisc-acc-chevron">{openSection === 'dmtg' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'dmtg' && (
  <div className="fisc-acc-body" id="impots-panel-dmtg" role="region" aria-labelledby="impots-header-dmtg">
  <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 8 }}>
    Barème applicable aux successions et donations en ligne directe (parents → enfants).
    Utilisé par le simulateur de placement pour la phase de transmission.
  </p>

  <div className="income-tax-col">
    <div className="income-tax-block">
      <div className="income-tax-block-title">Abattement</div>
      <div className="settings-field-row">
        <label>Abattement par enfant (ligne directe)</label>
        <input
          type="number"
          value={numberOrEmpty(dmtg?.abattementLigneDirecte)}
          onChange={(e) =>
            updateField(
              ['dmtg', 'abattementLigneDirecte'],
              e.target.value === '' ? null : Number(e.target.value)
            )
          }
          disabled={!isAdmin}
        />
        <span>€</span>
      </div>
    </div>

    <div className="income-tax-block">
      <div className="income-tax-block-title">Barème progressif</div>
      <table className="settings-table">
        <thead>
          <tr>
            <th>De (€)</th>
            <th>À (€)</th>
            <th className="taux-col">Taux %</th>
          </tr>
        </thead>
        <tbody>
          {dmtg?.scale?.map((row, idx) => (
            <tr key={idx}>
              <td>
                <input
                  type="number"
                  value={numberOrEmpty(row.from)}
                  onChange={(e) =>
                    updateDmtgScale(
                      idx,
                      'from',
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={numberOrEmpty(row.to)}
                  onChange={(e) =>
                    updateDmtgScale(
                      idx,
                      'to',
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
              </td>
              <td className="taux-col">
                <input
                  type="number"
                  step="0.1"
                  value={numberOrEmpty(row.rate)}
                  onChange={(e) =>
                    updateDmtgScale(
                      idx,
                      'rate',
                      e.target.value === '' ? null : Number(e.target.value)
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
  </div>
  )}
</div>

        </div>{/* fin fisc-accordion */}

          {/* Bouton Enregistrer */}
          {isAdmin && (
            <button
              type="button"
              className="chip"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? 'Enregistrement…'
                : 'Enregistrer les paramètres impôts'}
            </button>
          )}

      {message && (
        <div className="settings-success-message" style={{ 
          fontSize: 14, 
          marginTop: 12, 
          padding: '12px 16px', 
          background: 'var(--color-success-bg)', 
          border: '1px solid var(--color-success-border)', 
          borderRadius: 6, 
          color: 'var(--color-success-text)',
          fontWeight: 500
        }}>{message}</div>
      )}
    </div>
  );
}
