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
    ligneDirecte: {
      abattement: 100000,
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
    frereSoeur: {
      abattement: 15932,
      scale: [
        { from: 0, to: 24430, rate: 35 },
        { from: 24430, to: null, rate: 45 },
      ],
    },
    neveuNiece: {
      abattement: 7967,
      scale: [
        { from: 0, to: null, rate: 55 },
      ],
    },
    autre: {
      abattement: 1594,
      scale: [
        { from: 0, to: null, rate: 60 },
      ],
    },
  },
};

// Migration des anciennes données DMTG vers la nouvelle structure multi-catégories
function migrateDmtgData(data) {
  if (!data?.dmtg) return data;

  const hasOldStructure = data.dmtg.abattementLigneDirecte !== undefined;
  const hasNewStructure = data.dmtg.ligneDirecte !== undefined;

  if (hasOldStructure && !hasNewStructure) {
    return {
      ...data,
      dmtg: {
        ligneDirecte: {
          abattement: data.dmtg.abattementLigneDirecte,
          scale: data.dmtg.scale,
        },
        frereSoeur: DEFAULT_TAX_SETTINGS.dmtg.frereSoeur,
        neveuNiece: DEFAULT_TAX_SETTINGS.dmtg.neveuNiece,
        autre: DEFAULT_TAX_SETTINGS.dmtg.autre,
      },
    };
  }

  // Fusion avec défauts pour les catégories manquantes
  return {
    ...data,
    dmtg: {
      ligneDirecte: data.dmtg.ligneDirecte || DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte,
      frereSoeur: data.dmtg.frereSoeur || DEFAULT_TAX_SETTINGS.dmtg.frereSoeur,
      neveuNiece: data.dmtg.neveuNiece || DEFAULT_TAX_SETTINGS.dmtg.neveuNiece,
      autre: data.dmtg.autre || DEFAULT_TAX_SETTINGS.dmtg.autre,
    },
  };
}

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
          const migratedData = migrateDmtgData(rows[0].data);
          setSettings((prev) => ({
            ...prev,
            ...migratedData,
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

  const updateDmtgCategory = (categoryKey, field, value) => {
    setData((prev) => {
      const category = prev.dmtg?.[categoryKey];
      if (!category) return prev;

      // Mise à jour du barème (tableau)
      if (field === 'scale' && typeof value === 'object' && 'idx' in value) {
        const { idx, key, value: cellValue } = value;
        return {
          ...prev,
          dmtg: {
            ...prev.dmtg,
            [categoryKey]: {
              ...category,
              scale: category.scale.map((row, i) =>
                i === idx ? { ...row, [key]: cellValue } : row
              ),
            },
          },
        };
      }

      // Mise à jour simple (abattement)
      return {
        ...prev,
        dmtg: {
          ...prev.dmtg,
          [categoryKey]: {
            ...category,
            [field]: value,
          },
        },
      };
    });
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
    <span className="settings-premium-title" style={{ margin: 0 }}>Barème de l’impôt sur le revenu</span>
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
              <SettingsTable
                columns={[
                  { key: 'from', header: 'De' },
                  { key: 'to', header: 'À' },
                  { key: 'rate', header: 'Taux\u00a0%', step: '0.01', className: 'taux-col' },
                ]}
                rows={incomeTax.scaleCurrent}
                onCellChange={(idx, key, value) => updateIncomeScale('scaleCurrent', idx, key, value)}
                disabled={!isAdmin}
              />

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
              <SettingsTable
                columns={[
                  { key: 'from', header: 'De' },
                  { key: 'to', header: 'À' },
                  { key: 'rate', header: 'Taux\u00a0%', step: '0.01', className: 'taux-col' },
                ]}
                rows={incomeTax.scalePrevious}
                onCellChange={(idx, key, value) => updateIncomeScale('scalePrevious', idx, key, value)}
                disabled={!isAdmin}
              />

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
    <span className="settings-premium-title" style={{ margin: 0 }}>Abattement DOM sur l’IR (barème)</span>
    <span className="fisc-acc-chevron">{openSection === 'dom' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'dom' && (
  <div className="fisc-acc-body" id="impots-panel-dom" role="region" aria-labelledby="impots-header-dom">
  <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 8 }}>
    Appliqué sur l’impôt issu du barème <strong>après plafonnement du quotient familial</strong> et
    <strong> avant</strong> décote + réductions/crédits.
  </p>

  {(() => {
    const domZones = [
      { _key: 'gmr', zone: 'Guadeloupe / Martinique / Réunion', zoneKey: 'gmr' },
      { _key: 'guyane', zone: 'Guyane / Mayotte', zoneKey: 'guyane' },
    ];
    const domCols = [
      { key: 'zone', header: 'Zone', type: 'display' },
      { key: 'ratePercent', header: 'Taux %', className: 'taux-col' },
      { key: 'cap', header: 'Plafond €' },
    ];
    return (
      <div className="income-tax-columns">
        {['current', 'previous'].map((period) => (
          <div className="income-tax-col" key={period}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              {period === 'current'
                ? (incomeTax.currentYearLabel || 'Année N')
                : (incomeTax.previousYearLabel || 'Année N-1')}
            </div>
            <SettingsTable
              columns={domCols}
              rows={domZones.map((z) => ({
                _key: z._key,
                zone: z.zone,
                ratePercent: incomeTax?.domAbatement?.[period]?.[z.zoneKey]?.ratePercent,
                cap: incomeTax?.domAbatement?.[period]?.[z.zoneKey]?.cap,
              }))}
              onCellChange={(idx, key, value) =>
                updateField(
                  ['incomeTax', 'domAbatement', period, domZones[idx].zoneKey, key],
                  value === null ? '' : value
                )
              }
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


          {/* 2. PFU */}
          <div className="fisc-acc-item">
  <button type="button" className="fisc-acc-header" id="impots-header-pfu" aria-expanded={openSection === 'pfu'} aria-controls="impots-panel-pfu" onClick={() => setOpenSection(openSection === 'pfu' ? null : 'pfu')}>
    <span className="settings-premium-title" style={{ margin: 0 }}>PFU (flat tax)</span>
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
    <span className="settings-premium-title" style={{ margin: 0 }}>CEHR / CDHR</span>
    <span className="fisc-acc-chevron">{openSection === 'cehr' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'cehr' && (
  <div className="fisc-acc-body" id="impots-panel-cehr" role="region" aria-labelledby="impots-header-cehr">
  <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
    Contribution exceptionnelle sur les hauts revenus (CEHR) et
    contribution différentielle (CDHR).
  </p>

  <div className="tax-two-cols">
    {['current', 'previous'].map((period) => {
      const yearLabel = period === 'current' ? incomeTax.currentYearLabel : incomeTax.previousYearLabel;
      const cehrData = cehr[period];
      const cdhrData = cdhr[period];
      const suffix = period === 'current' ? '2025' : '2024';
      return (
        <SettingsYearColumn key={period} yearLabel={yearLabel} isRight={period === 'previous'}>
          <strong>CEHR – personne seule</strong>
          {cehrData.single.map((row, idx) => (
            <SettingsFieldRow
              key={`cehrS_${suffix}_${idx}`}
              label={`De ${numberOrEmpty(row.from)} € à ${row.to ? `${row.to} €` : 'plus'}`}
              path={['cehr', period, 'single', idx, 'rate']}
              value={row.rate}
              onChange={updateField}
              step="0.1"
              unit="%"
              disabled={!isAdmin}
            />
          ))}

          <strong>CEHR – couple</strong>
          {cehrData.couple.map((row, idx) => (
            <SettingsFieldRow
              key={`cehrC_${suffix}_${idx}`}
              label={`De ${numberOrEmpty(row.from)} € à ${row.to ? `${row.to} €` : 'plus'}`}
              path={['cehr', period, 'couple', idx, 'rate']}
              value={row.rate}
              onChange={updateField}
              step="0.1"
              unit="%"
              disabled={!isAdmin}
            />
          ))}

          <strong>CDHR (taux minimal)</strong>
          <SettingsFieldRow
            label="Taux effectif minimal"
            path={['cdhr', period, 'minEffectiveRate']}
            value={cdhrData.minEffectiveRate}
            onChange={updateField}
            step="0.1"
            unit="%"
            disabled={!isAdmin}
          />
          <SettingsFieldRow
            label="Seuil RFR personne seule"
            path={['cdhr', period, 'thresholdSingle']}
            value={cdhrData.thresholdSingle}
            onChange={updateField}
            unit="€"
            disabled={!isAdmin}
          />
          <SettingsFieldRow
            label="Seuil RFR couple"
            path={['cdhr', period, 'thresholdCouple']}
            value={cdhrData.thresholdCouple}
            onChange={updateField}
            unit="€"
            disabled={!isAdmin}
          />
        </SettingsYearColumn>
      );
    })}
  </div>
  </div>
  )}
</div>


          {/* 4. Impôt sur les sociétés */}
          <div className="fisc-acc-item">
  <button type="button" className="fisc-acc-header" id="impots-header-is" aria-expanded={openSection === 'is'} aria-controls="impots-panel-is" onClick={() => setOpenSection(openSection === 'is' ? null : 'is')}>
    <span className="settings-premium-title" style={{ margin: 0 }}>Impôt sur les sociétés</span>
    <span className="fisc-acc-chevron">{openSection === 'is' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'is' && (
  <div className="fisc-acc-body" id="impots-panel-is" role="region" aria-labelledby="impots-header-is">

  <div className="tax-two-cols">
    <SettingsYearColumn yearLabel={incomeTax.currentYearLabel}>
      <SettingsFieldRow
        label="Taux normal IS"
        path={['corporateTax', 'current', 'normalRate']}
        value={corporateTax.current.normalRate}
        onChange={updateField}
        step="0.1"
        unit="%"
        disabled={!isAdmin}
      />
      <SettingsFieldRow
        label="Taux réduit IS"
        path={['corporateTax', 'current', 'reducedRate']}
        value={corporateTax.current.reducedRate}
        onChange={updateField}
        step="0.1"
        unit="%"
        disabled={!isAdmin}
      />
      <SettingsFieldRow
        label="Seuil de bénéfice au taux réduit"
        path={['corporateTax', 'current', 'reducedThreshold']}
        value={corporateTax.current.reducedThreshold}
        onChange={updateField}
        unit="€"
        disabled={!isAdmin}
      />
    </SettingsYearColumn>

    <SettingsYearColumn yearLabel={incomeTax.previousYearLabel} isRight>
      <SettingsFieldRow
        label="Taux normal IS"
        path={['corporateTax', 'previous', 'normalRate']}
        value={corporateTax.previous.normalRate}
        onChange={updateField}
        step="0.1"
        unit="%"
        disabled={!isAdmin}
      />
      <SettingsFieldRow
        label="Taux réduit IS"
        path={['corporateTax', 'previous', 'reducedRate']}
        value={corporateTax.previous.reducedRate}
        onChange={updateField}
        step="0.1"
        unit="%"
        disabled={!isAdmin}
      />
      <SettingsFieldRow
        label="Seuil de bénéfice au taux réduit"
        path={['corporateTax', 'previous', 'reducedThreshold']}
        value={corporateTax.previous.reducedThreshold}
        onChange={updateField}
        unit="€"
        disabled={!isAdmin}
      />
    </SettingsYearColumn>
  </div>
  </div>
  )}
</div>

{/* Section DMTG - Droits de Mutation à Titre Gratuit */}
<div className="fisc-acc-item">
  <button type="button" className="fisc-acc-header" id="impots-header-dmtg" aria-expanded={openSection === 'dmtg'} aria-controls="impots-panel-dmtg" onClick={() => setOpenSection(openSection === 'dmtg' ? null : 'dmtg')}>
    <span className="settings-premium-title" style={{ margin: 0 }}>Droits de Mutation à Titre Gratuit (DMTG)</span>
    <span className="fisc-acc-chevron">{openSection === 'dmtg' ? '▾' : '▸'}</span>
  </button>
  {openSection === 'dmtg' && (
  <div className="fisc-acc-body" id="impots-panel-dmtg" role="region" aria-labelledby="impots-header-dmtg">
  <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
    Barèmes applicables aux successions et donations selon le lien de parenté.
    Utilisés par le simulateur de placement pour la phase de transmission.
  </p>

  {[
    { key: 'ligneDirecte', title: 'Ligne directe (enfants, petits-enfants)', labelAbattement: 'Abattement par enfant' },
    { key: 'frereSoeur', title: 'Frères et sœurs', labelAbattement: 'Abattement frère/sœur' },
    { key: 'neveuNiece', title: 'Neveux et nièces', labelAbattement: 'Abattement neveu/nièce' },
    { key: 'autre', title: 'Autres (non-parents)', labelAbattement: 'Abattement par défaut' },
  ].map(({ key, title, labelAbattement }) => {
    const catData = dmtg?.[key];
    if (!catData) return null;
    return (
      <div key={key} className="income-tax-block" style={{ marginBottom: 24 }}>
        <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
          {title}
        </div>
        <div style={{ paddingLeft: 8 }}>
          <div className="settings-field-row" style={{ marginBottom: 12 }}>
            <label>{labelAbattement}</label>
            <input
              type="number"
              value={numberOrEmpty(catData.abattement)}
              onChange={(e) =>
                updateDmtgCategory(key, 'abattement',
                  e.target.value === '' ? null : Number(e.target.value))
              }
              disabled={!isAdmin}
            />
            <span>€</span>
          </div>
          <SettingsTable
            columns={[
              { key: 'from', header: 'De (€)' },
              { key: 'to', header: 'À (€)' },
              { key: 'rate', header: 'Taux %', step: '0.1', className: 'taux-col' },
            ]}
            rows={catData.scale || []}
            onCellChange={(idx, colKey, value) =>
              updateDmtgCategory(key, 'scale', { idx, key: colKey, value })
            }
            disabled={!isAdmin}
          />
        </div>
      </div>
    );
  })}
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
