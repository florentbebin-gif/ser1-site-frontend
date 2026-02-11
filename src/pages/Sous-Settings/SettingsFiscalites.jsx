import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUserRole } from '@/auth/useUserRole';
import './SettingsFiscalites.css';
import { invalidate, broadcastInvalidation } from '@/utils/fiscalSettingsCache.js';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { numberOrEmpty, textOrEmpty, createFieldUpdater } from '@/utils/settingsHelpers.js';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import SettingsTable from '@/components/settings/SettingsTable';

// ------------------------------------------------------------
// Valeurs par défaut — source unique : src/constants/settingsDefaults.ts
// ------------------------------------------------------------
import { DEFAULT_FISCALITY_SETTINGS } from '@/constants/settingsDefaults';

export default function SettingsFiscalites() {
  const { isAdmin } = useUserRole();
  const [settings, setSettings] = useState(DEFAULT_FISCALITY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openProductKey, setOpenProductKey] = useState(null);

  // Alias pour compatibilité
  const setData = setSettings;

const PRODUCTS = [
  { key: 'assuranceVie', label: 'Assurance vie' },
  { key: 'perIndividuel', label: 'PER individuel' },
  { key: 'cto', label: 'Compte-titres ordinaire (CTO)' },
  { key: 'pea', label: 'Plan d\'épargne en actions (PEA)' },
];


  const av = settings.assuranceVie;
  const per = settings.perIndividuel || DEFAULT_FISCALITY_SETTINGS.perIndividuel;

  // ---------------------------------------------
  // Chargement user + paramètres depuis Supabase
  // ---------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (!mounted) return;

        // Charge la ligne id=1
        const { data: rows, error: err } = await supabase
          .from('fiscality_settings')
          .select('data')
          .eq('id', 1);

        if (!err && rows && rows.length > 0 && rows[0].data) {
          const db = rows[0].data;
          setSettings((prev) => ({
            ...prev,
            ...db,
            perIndividuel: {
              ...DEFAULT_FISCALITY_SETTINGS.perIndividuel,
              ...(db.perIndividuel || {}),
              epargne: {
                ...DEFAULT_FISCALITY_SETTINGS.perIndividuel.epargne,
                ...(db.perIndividuel?.epargne || {}),
              },
              sortieCapital: {
                ...DEFAULT_FISCALITY_SETTINGS.perIndividuel.sortieCapital,
                ...(db.perIndividuel?.sortieCapital || {}),
              },
              deces: {
                ...DEFAULT_FISCALITY_SETTINGS.perIndividuel.deces,
                ...(db.perIndividuel?.deces || {}),
              },
              rente: {
                ...DEFAULT_FISCALITY_SETTINGS.perIndividuel.rente,
                ...(db.perIndividuel?.rente || {}),
                deduits: {
                  ...DEFAULT_FISCALITY_SETTINGS.perIndividuel.rente.deduits,
                  ...(db.perIndividuel?.rente?.deduits || {}),
                  capitalQuotePart: {
                    ...DEFAULT_FISCALITY_SETTINGS.perIndividuel.rente.deduits.capitalQuotePart,
                    ...(db.perIndividuel?.rente?.deduits?.capitalQuotePart || {}),
                  },
                  interestsQuotePart: {
                    ...DEFAULT_FISCALITY_SETTINGS.perIndividuel.rente.deduits.interestsQuotePart,
                    ...(db.perIndividuel?.rente?.deduits?.interestsQuotePart || {}),
                  },
                },
                nonDeduits: {
                  ...DEFAULT_FISCALITY_SETTINGS.perIndividuel.rente.nonDeduits,
                  ...(db.perIndividuel?.rente?.nonDeduits || {}),
                },
                rvtoTaxableFractionByAgeAtFirstPayment:
                  db.perIndividuel?.rente?.rvtoTaxableFractionByAgeAtFirstPayment ||
                  DEFAULT_FISCALITY_SETTINGS.perIndividuel.rente.rvtoTaxableFractionByAgeAtFirstPayment,
              },
            },
          }));
        } else if (err && err.code !== 'PGRST116') {
          console.error('Erreur chargement fiscality_settings :', err);
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

  // ---------------------------------------------
  // Helpers de MAJ
  // ---------------------------------------------
  const updateField = createFieldUpdater(setData, setMessage);

const handleSave = async () => {
  if (!isAdmin) return;
  
  try {
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('fiscality_settings')
      .upsert({ id: 1, data: settings });

    if (error) {
      console.error(error);
      setMessage("Erreur lors de l'enregistrement.");
    } else {
      setMessage('Paramètres fiscalités enregistrés.');
      invalidate('fiscality');
      broadcastInvalidation('fiscality');
    }
  } catch (e) {
    console.error(e);
    setMessage("Erreur lors de l'enregistrement.");
  } finally {
    setSaving(false);
  }
};

  // ---------------------------------------------
  // Rendu
  // ---------------------------------------------
  if (loading) {
    return <p>Chargement...</p>;
  }

  // Auth check handled by PrivateRoute / SettingsShell

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

{/* Accordéon produits */}
<div className="fisc-accordion">
    {PRODUCTS.map((p) => {
    const isOpen = openProductKey === p.key;

    return (
      <div key={p.key} className="fisc-acc-item">
        <button
          type="button"
          className="fisc-acc-header"
          id={`fisc-header-${p.key}`}
          aria-expanded={isOpen}
          aria-controls={`fisc-panel-${p.key}`}
          onClick={() => setOpenProductKey(isOpen ? null : p.key)}
        >
          <span className="settings-premium-title" style={{ margin: 0 }}>
            {p.label}
          </span>
          <span className="fisc-acc-chevron">{isOpen ? '▾' : '▸'}</span>
        </button>

        {isOpen && (
          <div className="fisc-acc-body" id={`fisc-panel-${p.key}`} role="region" aria-labelledby={`fisc-header-${p.key}`}>
            {p.key === 'assuranceVie' && (
              <>
                {/* 1) Phase d'épargne */}
                <section>
                  <h4 className="fisc-section-title">Phase d’épargne</h4>

                  <div className="income-tax-block">
                    <div className="income-tax-block-title">Versements</div>
                    <div className="settings-field-row">
                      <label>Versement déductible du revenu imposable</label>
                      <input
                        type="text"
                        value={av.epargne.versementDeductibleIR ? 'Oui' : 'Non'}
                        disabled
                        style={{ width: 90, textAlign: 'center' }}
                      />
                      <span />
                    </div>
                  </div>

                  <div className="income-tax-block">
                    <div className="income-tax-block-title">
                      Prélèvements sociaux pendant la capitalisation
                    </div>
                    <SettingsFieldRow
                      label="Taux de PS sur intérêts"
                      path={['assuranceVie', 'epargne', 'socialOnInterestsDuringAccumulation', 'psRatePercent']}
                      value={av.epargne.socialOnInterestsDuringAccumulation.psRatePercent}
                      onChange={updateField}
                      step="0.1"
                      unit="%"
                      disabled={!isAdmin}
                    />
                    <SettingsFieldRow
                      label="Note"
                      path={['assuranceVie', 'epargne', 'socialOnInterestsDuringAccumulation', 'note']}
                      value={av.epargne.socialOnInterestsDuringAccumulation.note}
                      onChange={updateField}
                      type="text"
                      disabled={!isAdmin}
                    />
                  </div>
                </section>

                {/* 2) Retraits en capital */}
                <section>
                  <h4 className="fisc-section-title">Retraits en capital</h4>

                  <div className="income-tax-block">
                    <div className="income-tax-block-title">Assiette & PS</div>
                    <div className="settings-field-row">
                      <label>Assiette imposable</label>
                      <input
                        type="text"
                        value="Intérêts / gains"
                        disabled
                        style={{ width: 180, textAlign: 'center' }}
                      />
                      <span />
                    </div>
                    <SettingsFieldRow
                      label="Taux de PS (global)"
                      path={['assuranceVie', 'retraitsCapital', 'psRatePercent']}
                      value={av.retraitsCapital.psRatePercent}
                      onChange={updateField}
                      step="0.1"
                      unit="%"
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="fisc-two-cols">
                    {/* Depuis 27/09/2017 */}
                    <div className="fisc-col">
                      <div className="fisc-col-title">
                        Versements à partir du {av.retraitsCapital.depuis2017.startDate}
                      </div>

                      <table className="settings-table">
                        <thead>
                          <tr>
                            <th>Durée</th>
                            <th className="taux-col">IR %</th>
                            <th style={{ textAlign: 'center' }}>Option barème</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{av.retraitsCapital.depuis2017.moins8Ans.label}</td>
                            <td className="taux-col">
                              <input
                                type="number"
                                step="0.1"
                                value={numberOrEmpty(
                                  av.retraitsCapital.depuis2017.moins8Ans.irRatePercent
                                )}
                                onChange={(e) =>
                                  updateField(
                                    [
                                      'assuranceVie',
                                      'retraitsCapital',
                                      'depuis2017',
                                      'moins8Ans',
                                      'irRatePercent',
                                    ],
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                disabled={!isAdmin}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {av.retraitsCapital.depuis2017.moins8Ans.allowBaremeIR
                                ? 'Oui'
                                : 'Non'}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="income-tax-block" style={{ marginTop: 10 }}>
                        <div className="income-tax-block-title">
                          {av.retraitsCapital.depuis2017.plus8Ans.label}
                        </div>

                        <SettingsFieldRow
                          label="Abattement annuel célibataire"
                          path={['assuranceVie', 'retraitsCapital', 'depuis2017', 'plus8Ans', 'abattementAnnuel', 'single']}
                          value={av.retraitsCapital.depuis2017.plus8Ans.abattementAnnuel.single}
                          onChange={updateField}
                          unit="€"
                          disabled={!isAdmin}
                        />
                        <SettingsFieldRow
                          label="Abattement annuel couple"
                          path={['assuranceVie', 'retraitsCapital', 'depuis2017', 'plus8Ans', 'abattementAnnuel', 'couple']}
                          value={av.retraitsCapital.depuis2017.plus8Ans.abattementAnnuel.couple}
                          onChange={updateField}
                          unit="€"
                          disabled={!isAdmin}
                        />
                        <SettingsFieldRow
                          label="Seuil de primes nettes"
                          path={['assuranceVie', 'retraitsCapital', 'depuis2017', 'plus8Ans', 'primesNettesSeuil']}
                          value={av.retraitsCapital.depuis2017.plus8Ans.primesNettesSeuil}
                          onChange={updateField}
                          unit="€"
                          disabled={!isAdmin}
                        />

                        <table className="settings-table" style={{ marginTop: 8 }}>
                          <thead>
                            <tr>
                              <th>Tranche</th>
                              <th className="taux-col">IR %</th>
                              <th style={{ textAlign: 'center' }}>Option barème</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ textAlign: 'left' }}>Gain sous seuil</td>
                              <td className="taux-col">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={numberOrEmpty(
                                    av.retraitsCapital.depuis2017.plus8Ans
                                      .irRateUnderThresholdPercent
                                  )}
                                  onChange={(e) =>
                                    updateField(
                                      [
                                        'assuranceVie',
                                        'retraitsCapital',
                                        'depuis2017',
                                        'plus8Ans',
                                        'irRateUnderThresholdPercent',
                                      ],
                                      e.target.value === '' ? null : Number(e.target.value)
                                    )
                                  }
                                  disabled={!isAdmin}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {av.retraitsCapital.depuis2017.plus8Ans.allowBaremeIR
                                  ? 'Oui'
                                  : 'Non'}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ textAlign: 'left' }}>Gain au-delà</td>
                              <td className="taux-col">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={numberOrEmpty(
                                    av.retraitsCapital.depuis2017.plus8Ans
                                      .irRateOverThresholdPercent
                                  )}
                                  onChange={(e) =>
                                    updateField(
                                      [
                                        'assuranceVie',
                                        'retraitsCapital',
                                        'depuis2017',
                                        'plus8Ans',
                                        'irRateOverThresholdPercent',
                                      ],
                                      e.target.value === '' ? null : Number(e.target.value)
                                    )
                                  }
                                  disabled={!isAdmin}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {av.retraitsCapital.depuis2017.plus8Ans.allowBaremeIR
                                  ? 'Oui'
                                  : 'Non'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Avant 27/09/2017 */}
                    <div className="fisc-col fisc-col-right">
                      <div className="fisc-col-title">
                        Versements avant le {av.retraitsCapital.avant2017.endDate}
                      </div>

                      <table className="settings-table">
                        <thead>
                          <tr>
                            <th>Durée</th>
                            <th className="taux-col">IR %</th>
                            <th style={{ textAlign: 'center' }}>Option barème</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{av.retraitsCapital.avant2017.moins4Ans.label}</td>
                            <td className="taux-col">
                              <input
                                type="number"
                                step="0.1"
                                value={numberOrEmpty(
                                  av.retraitsCapital.avant2017.moins4Ans.irRatePercent
                                )}
                                onChange={(e) =>
                                  updateField(
                                    [
                                      'assuranceVie',
                                      'retraitsCapital',
                                      'avant2017',
                                      'moins4Ans',
                                      'irRatePercent',
                                    ],
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                disabled={!isAdmin}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {av.retraitsCapital.avant2017.moins4Ans.allowBaremeIR
                                ? 'Oui'
                                : 'Non'}
                            </td>
                          </tr>

                          <tr>
                            <td>{av.retraitsCapital.avant2017.de4a8Ans.label}</td>
                            <td className="taux-col">
                              <input
                                type="number"
                                step="0.1"
                                value={numberOrEmpty(
                                  av.retraitsCapital.avant2017.de4a8Ans.irRatePercent
                                )}
                                onChange={(e) =>
                                  updateField(
                                    [
                                      'assuranceVie',
                                      'retraitsCapital',
                                      'avant2017',
                                      'de4a8Ans',
                                      'irRatePercent',
                                    ],
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                disabled={!isAdmin}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {av.retraitsCapital.avant2017.de4a8Ans.allowBaremeIR
                                ? 'Oui'
                                : 'Non'}
                            </td>
                          </tr>

                          <tr>
                            <td>{av.retraitsCapital.avant2017.plus8Ans.label}</td>
                            <td className="taux-col">
                              <input
                                type="number"
                                step="0.1"
                                value={numberOrEmpty(
                                  av.retraitsCapital.avant2017.plus8Ans.irRatePercent
                                )}
                                onChange={(e) =>
                                  updateField(
                                    [
                                      'assuranceVie',
                                      'retraitsCapital',
                                      'avant2017',
                                      'plus8Ans',
                                      'irRatePercent',
                                    ],
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                disabled={!isAdmin}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {av.retraitsCapital.avant2017.plus8Ans.allowBaremeIR
                                ? 'Oui'
                                : 'Non'}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="income-tax-block" style={{ marginTop: 10 }}>
                        <div className="income-tax-block-title">
                          Abattement annuel (si &gt; 8 ans)
                        </div>
                        <SettingsFieldRow
                          label="Célibataire"
                          path={['assuranceVie', 'retraitsCapital', 'avant2017', 'plus8Ans', 'abattementAnnuel', 'single']}
                          value={av.retraitsCapital.avant2017.plus8Ans.abattementAnnuel.single}
                          onChange={updateField}
                          unit="€"
                          disabled={!isAdmin}
                        />
                        <SettingsFieldRow
                          label="Couple"
                          path={['assuranceVie', 'retraitsCapital', 'avant2017', 'plus8Ans', 'abattementAnnuel', 'couple']}
                          value={av.retraitsCapital.avant2017.plus8Ans.abattementAnnuel.couple}
                          onChange={updateField}
                          unit="€"
                          disabled={!isAdmin}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3) Décès */}
                <section>
                  <h4 className="fisc-section-title">Décès — transmission</h4>

                  <div className="income-tax-block">
                    <div className="income-tax-block-title">Dates & âge pivot</div>

                    <div className="settings-field-row">
                      <label>Date pivot (contrats historiques)</label>
                      <input
                        type="text"
                        value={`${av.deces.contratApresDate}`}
                        disabled
                        style={{ width: 140, textAlign: 'center' }}
                      />
                      <span />
                    </div>

                    <SettingsFieldRow
                      label="Âge pivot (primes)"
                      path={['assuranceVie', 'deces', 'agePivotPrimes']}
                      value={av.deces.agePivotPrimes}
                      onChange={updateField}
                      unit="ans"
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="fisc-two-cols">
                    <div className="fisc-col">
                      <div className="fisc-col-title">
                        Primes versées avant {av.deces.contratApresDate}
                      </div>
                      <SettingsFieldRow
                        label="Taux"
                        path={['assuranceVie', 'deces', 'primesAvant1998', 'taxRatePercent']}
                        value={av.deces.primesAvant1998.taxRatePercent}
                        onChange={updateField}
                        step="0.1"
                        unit="%"
                        disabled={!isAdmin}
                      />
                      <SettingsFieldRow
                        label="Note"
                        path={['assuranceVie', 'deces', 'primesAvant1998', 'note']}
                        value={av.deces.primesAvant1998.note}
                        onChange={updateField}
                        type="text"
                        disabled={!isAdmin}
                      />
                    </div>

                    <div className="fisc-col fisc-col-right">
                      <div className="fisc-col-title">
                        Primes versées à partir du {av.deces.contratApresDate} (par bénéficiaire)
                      </div>

                      <SettingsFieldRow
                        label="Abattement / bénéficiaire"
                        path={['assuranceVie', 'deces', 'primesApres1998', 'allowancePerBeneficiary']}
                        value={av.deces.primesApres1998.allowancePerBeneficiary}
                        onChange={updateField}
                        unit="€"
                        disabled={!isAdmin}
                      />

                      <SettingsTable
                        columns={[
                          { key: 'upToLabel', header: "Jusqu'à", type: 'display' },
                          { key: 'ratePercent', header: 'Taux %', step: '0.1', className: 'taux-col' },
                        ]}
                        rows={av.deces.primesApres1998.brackets.map((b) => ({
                          ...b,
                          _key: b.upTo === null ? 'beyond' : b.upTo,
                          upToLabel: b.upTo === null ? 'Au-delà' : `${b.upTo.toLocaleString('fr-FR')} €`,
                        }))}
                        onCellChange={(idx, key, value) =>
                          updateField(['assuranceVie', 'deces', 'primesApres1998', 'brackets', idx, key], value)
                        }
                        disabled={!isAdmin}
                        style={{ marginTop: 8 }}
                      />

                      <SettingsFieldRow
                        label="Note"
                        path={['assuranceVie', 'deces', 'primesApres1998', 'note']}
                        value={av.deces.primesApres1998.note}
                        onChange={updateField}
                        type="text"
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>

                  <div className="income-tax-block" style={{ marginTop: 10 }}>
                    <div className="income-tax-block-title">
                      Primes versées après {av.deces.agePivotPrimes} ans (logique globale)
                    </div>
                    <SettingsFieldRow
                      label="Abattement global"
                      path={['assuranceVie', 'deces', 'apres70ans', 'globalAllowance']}
                      value={av.deces.apres70ans.globalAllowance}
                      onChange={updateField}
                      unit="€"
                      disabled={!isAdmin}
                    />
                    <div className="settings-field-row">
                      <label>Mode de taxation</label>
                      <input
                        type="text"
                        value="DMTG (barème succession)"
                        disabled
                        style={{ width: 220, textAlign: 'center' }}
                      />
                      <span />
                    </div>
                    <SettingsFieldRow
                      label="Note"
                      path={['assuranceVie', 'deces', 'apres70ans', 'note']}
                      value={av.deces.apres70ans.note}
                      onChange={updateField}
                      type="text"
                      disabled={!isAdmin}
                    />
                  </div>
                </section>

                {/* 4) Rente */}
                <section>
                  <h4 className="fisc-section-title">Liquidation en rente</h4>

                  <div className="income-tax-block">
                    <div className="income-tax-block-title">Conditions & PS</div>

                    <div className="settings-field-row">
                      <label>Transformation du capital en rente possible</label>
                      <input
                        type="text"
                        value={av.rente.possible ? 'Oui' : 'Non'}
                        disabled
                        style={{ width: 90, textAlign: 'center' }}
                      />
                      <span />
                    </div>

                    <SettingsFieldRow
                      label="Taux de PS"
                      path={['assuranceVie', 'rente', 'psRatePercent']}
                      value={av.rente.psRatePercent}
                      onChange={updateField}
                      step="0.1"
                      unit="%"
                      disabled={!isAdmin}
                    />

                    <div className="settings-field-row">
                      <label>IR</label>
                      <input
                        type="text"
                        value="Barème"
                        disabled
                        style={{ width: 90, textAlign: 'center' }}
                      />
                      <span />
                    </div>
                  </div>

                  <div className="income-tax-block">
                    <div className="income-tax-block-title">
                      Fraction imposable (selon âge à la liquidation)
                    </div>

                    <SettingsTable
                      columns={[
                        { key: 'label', header: 'Âge', type: 'display' },
                        { key: 'fraction', header: 'Fraction', step: '0.01', className: 'taux-col' },
                      ]}
                      rows={av.rente.taxableFractionByAgeAtLiquidation}
                      onCellChange={(idx, key, value) =>
                        updateField(['assuranceVie', 'rente', 'taxableFractionByAgeAtLiquidation', idx, key], value)
                      }
                      disabled={!isAdmin}
                    />

                    <SettingsFieldRow
                      label="Note PS"
                      path={['assuranceVie', 'rente', 'notePs']}
                      value={av.rente.notePs}
                      onChange={updateField}
                      type="text"
                      disabled={!isAdmin}
                    />
                    <SettingsFieldRow
                      label="Note décès"
                      path={['assuranceVie', 'rente', 'noteCapitalOnDeath']}
                      value={av.rente.noteCapitalOnDeath}
                      onChange={updateField}
                      type="text"
                      disabled={!isAdmin}
                    />
                  </div>
                </section>

              </>
            )}

{p.key === 'perIndividuel' && (
  <>
    {/* 1) Phase d'épargne */}
    <section>
      <h4 className="fisc-section-title">Phase d’épargne</h4>

      <div className="fisc-two-cols">
        <div className="fisc-col">
          <div className="income-tax-block">
            <div className="income-tax-block-title">Plafond 163 quatervicies</div>

            <SettingsFieldRow
              label="Taux"
              path={['perIndividuel', 'epargne', 'plafond163Quatervicies', 'ratePercent']}
              value={per.epargne.plafond163Quatervicies.ratePercent}
              onChange={updateField}
              step="0.1"
              unit="%"
              disabled={!isAdmin}
            />
            <SettingsFieldRow
              label="Mini"
              path={['perIndividuel', 'epargne', 'plafond163Quatervicies', 'minPassMultiple']}
              value={per.epargne.plafond163Quatervicies.minPassMultiple}
              onChange={updateField}
              unit="x PASS"
              disabled={!isAdmin}
            />
            <SettingsFieldRow
              label="Maxi"
              path={['perIndividuel', 'epargne', 'plafond163Quatervicies', 'maxPassMultiple']}
              value={per.epargne.plafond163Quatervicies.maxPassMultiple}
              onChange={updateField}
              unit="x PASS"
              disabled={!isAdmin}
            />
            <SettingsFieldRow
              label="Note"
              path={['perIndividuel', 'epargne', 'plafond163Quatervicies', 'note']}
              value={per.epargne.plafond163Quatervicies.note}
              onChange={updateField}
              type="text"
              disabled={!isAdmin}
            />
          </div>
        </div>

        <div className="fisc-col fisc-col-right">
          <div className="income-tax-block">
            <div className="income-tax-block-title">Plafond 154 bis (TNS)</div>

            <SettingsFieldRow
              label="Part 15% — taux"
              path={['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part15','ratePercent']}
              value={per.epargne.plafond154Bis.assiettePotentielle.part15.ratePercent}
              onChange={updateField}
              step="0.1"
              unit="%"
              disabled={!isAdmin}
            />
            <SettingsFieldRow
              label="Part 15% — max"
              path={['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part15','maxPassMultiple']}
              value={per.epargne.plafond154Bis.assiettePotentielle.part15.maxPassMultiple}
              onChange={updateField}
              unit="x PASS"
              disabled={!isAdmin}
            />
            <SettingsFieldRow
              label="Part 10% — taux"
              path={['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part10','ratePercent']}
              value={per.epargne.plafond154Bis.assiettePotentielle.part10.ratePercent}
              onChange={updateField}
              step="0.1"
              unit="%"
              disabled={!isAdmin}
            />
            <SettingsFieldRow
              label="Part 10% — mini"
              path={['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part10','minPassMultiple']}
              value={per.epargne.plafond154Bis.assiettePotentielle.part10.minPassMultiple}
              onChange={updateField}
              unit="x PASS"
              disabled={!isAdmin}
            />
            <SettingsFieldRow
              label="Part 10% — max"
              path={['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part10','maxPassMultiple']}
              value={per.epargne.plafond154Bis.assiettePotentielle.part10.maxPassMultiple}
              onChange={updateField}
              unit="x PASS"
              disabled={!isAdmin}
            />
            <SettingsFieldRow
              label="Note"
              path={['perIndividuel','epargne','plafond154Bis','note']}
              value={per.epargne.plafond154Bis.note}
              onChange={updateField}
              type="text"
              disabled={!isAdmin}
            />
          </div>
        </div>
      </div>
    </section>

    {/* 2) Sortie en capital */}
    <section>
      <h4 className="fisc-section-title">Sortie en capital</h4>

      <div className="income-tax-block">
        <div className="income-tax-block-title">PFU (référence)</div>
        <SettingsFieldRow
          label="IR PFU"
          path={['perIndividuel','sortieCapital','pfu','irRatePercent']}
          value={per.sortieCapital.pfu.irRatePercent}
          onChange={updateField}
          step="0.1"
          unit="%"
          disabled={!isAdmin}
        />
        <SettingsFieldRow
          label="PS"
          path={['perIndividuel','sortieCapital','pfu','psRatePercent']}
          value={per.sortieCapital.pfu.psRatePercent}
          onChange={updateField}
          step="0.1"
          unit="%"
          disabled={!isAdmin}
        />
      </div>

      <div className="fisc-two-cols">
        <div className="fisc-col">
          <div className="fisc-col-title">Versements déduits</div>

          <div className="income-tax-block">
            <div className="income-tax-block-title">Retraite</div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)' }}>{per.sortieCapital.retraite.deduits.versements.note}</div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 6 }}>{per.sortieCapital.retraite.deduits.gains.note}</div>
          </div>

          <div className="income-tax-block">
            <div className="income-tax-block-title">Achat résidence principale</div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)' }}>Versements : barème IR</div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)' }}>Gains : PFU</div>
          </div>
        </div>

        <div className="fisc-col fisc-col-right">
          <div className="fisc-col-title">Versements non déduits</div>

          <div className="income-tax-block">
            <div className="income-tax-block-title">Retraite</div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)' }}>{per.sortieCapital.retraite.nonDeduits.versements.note}</div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 6 }}>{per.sortieCapital.retraite.nonDeduits.gains.note}</div>
          </div>

          <div className="income-tax-block">
            <div className="income-tax-block-title">Achat résidence principale</div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)' }}>Versements : exonérés d’IR</div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)' }}>Gains : PFU</div>
          </div>
        </div>
      </div>

      <div className="income-tax-block" style={{ marginTop: 10 }}>
        <div className="income-tax-block-title">Déblocages “accidents de la vie”</div>
        <input
          type="text"
          value={textOrEmpty(per.sortieCapital.anticipation.accidentsDeLaVie.note)}
          onChange={(e) =>
            updateField(['perIndividuel','sortieCapital','anticipation','accidentsDeLaVie','note'], e.target.value)
          }
          disabled={!isAdmin}
          style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left', fontFamily: 'inherit', fontSize: 13 }}
        />
      </div>
    </section>

    {/* 3) Décès */}
    <section>
      <h4 className="fisc-section-title">Décès</h4>

      <div className="fisc-two-cols">
        <div className="fisc-col">
          <div className="fisc-col-title">PER assurantiel</div>

          <SettingsFieldRow
            label="Abattement / bénéficiaire"
            path={['perIndividuel','deces','perAssurantiel','allowancePerBeneficiary']}
            value={per.deces.perAssurantiel.allowancePerBeneficiary}
            onChange={updateField}
            unit="€"
            disabled={!isAdmin}
          />
          <SettingsFieldRow
            label='Seuil "présentation"'
            path={['perIndividuel','deces','perAssurantiel','displayThresholdTotal']}
            value={per.deces.perAssurantiel.displayThresholdTotal}
            onChange={updateField}
            unit="€"
            disabled={!isAdmin}
          />

          <SettingsTable
            columns={[
              { key: 'upToLabel', header: "Jusqu'à", type: 'display' },
              { key: 'ratePercent', header: 'Taux %', step: '0.01', className: 'taux-col' },
            ]}
            rows={per.deces.perAssurantiel.rates.map((r) => ({
              ...r,
              _key: r.upToTotal === null ? 'beyond' : r.upToTotal,
              upToLabel: r.upToTotal === null ? 'Au-delà' : `${r.upToTotal.toLocaleString('fr-FR')} €`,
            }))}
            onCellChange={(idx, key, value) =>
              updateField(['perIndividuel','deces','perAssurantiel','rates', idx, key], value)
            }
            disabled={!isAdmin}
            style={{ marginTop: 8 }}
          />

          <div className="income-tax-block" style={{ marginTop: 10 }}>
            <div className="income-tax-block-title">Primes après 70 ans</div>
            <SettingsFieldRow
              label="Abattement global"
              path={['perIndividuel','deces','perAssurantiel','apres70ans','globalAllowance']}
              value={per.deces.perAssurantiel.apres70ans.globalAllowance}
              onChange={updateField}
              unit="€"
              disabled={!isAdmin}
            />
          </div>
        </div>

        <div className="fisc-col fisc-col-right">
          <div className="fisc-col-title">PER bancaire</div>
          <textarea
  className="settings-note"
  rows={3}
  value={textOrEmpty(per.deces.perBancaire.note)}
  onChange={(e) => updateField(['perIndividuel','deces','perBancaire','note'], e.target.value)}
  disabled={!isAdmin}
/>
        </div>
      </div>
    </section>

   {/* 4) Rente */}
<section>
  <h4 className="fisc-section-title">Liquidation en rente</h4>

  <div className="fisc-two-cols">
    {/* Colonne gauche : Déduits */}
    <div className="fisc-col">
      <div className="fisc-col-title">Versements déduits</div>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Quote-part capital — rente à titre gratuit</div>

        <div className="settings-field-row">
          <label>IR</label>
          <input type="text" value="Barème (sans abattement 10%)" disabled style={{ width: 220, textAlign: 'center' }} />
          <span />
        </div>

        <SettingsFieldRow
          label="PS (CASA)"
          path={['perIndividuel', 'rente', 'deduits', 'capitalQuotePart', 'psRatePercent']}
          value={per.rente.deduits.capitalQuotePart.psRatePercent}
          onChange={updateField}
          step="0.01"
          unit="%"
          disabled={!isAdmin}
        />

        <textarea
          className="settings-note"
          rows={2}
          value={textOrEmpty(per.rente.deduits.capitalQuotePart.note)}
          onChange={(e) =>
            updateField(['perIndividuel', 'rente', 'deduits', 'capitalQuotePart', 'note'], e.target.value)
          }
          disabled={!isAdmin}
        />
      </div>

      <div className="income-tax-block" style={{ marginTop: 10 }}>
        <div className="income-tax-block-title">Quote-part intérêts — RVTO</div>

        <SettingsFieldRow
          label="PS"
          path={['perIndividuel', 'rente', 'deduits', 'interestsQuotePart', 'psRatePercent']}
          value={per.rente.deduits.interestsQuotePart.psRatePercent}
          onChange={updateField}
          step="0.1"
          unit="%"
          disabled={!isAdmin}
        />

        <SettingsTable
          columns={[
            { key: 'label', header: 'Âge 1er paiement', type: 'display' },
            { key: 'fraction', header: 'Fraction', step: '0.01', className: 'taux-col' },
          ]}
          rows={per.rente.rvtoTaxableFractionByAgeAtFirstPayment}
          onCellChange={(idx, key, value) =>
            updateField(['perIndividuel', 'rente', 'rvtoTaxableFractionByAgeAtFirstPayment', idx, key], value)
          }
          disabled={!isAdmin}
        />

        <textarea
          className="settings-note"
          rows={2}
          value={textOrEmpty(per.rente.deduits.interestsQuotePart.note)}
          onChange={(e) =>
            updateField(['perIndividuel', 'rente', 'deduits', 'interestsQuotePart', 'note'], e.target.value)
          }
          disabled={!isAdmin}
        />
      </div>
    </div>

    {/* Colonne droite : Non déduits */}
    <div className="fisc-col fisc-col-right">
      <div className="fisc-col-title">Versements non déduits — RVTO</div>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Rente (totalité) — RVTO</div>

        <SettingsFieldRow
          label="PS"
          path={['perIndividuel', 'rente', 'nonDeduits', 'psRatePercent']}
          value={per.rente.nonDeduits.psRatePercent}
          onChange={updateField}
          step="0.1"
          unit="%"
          disabled={!isAdmin}
        />

        <SettingsTable
          columns={[
            { key: 'label', header: 'Âge 1er paiement', type: 'display' },
            { key: 'fraction', header: 'Fraction', step: '0.01', className: 'taux-col' },
          ]}
          rows={per.rente.rvtoTaxableFractionByAgeAtFirstPayment}
          onCellChange={(idx, key, value) =>
            updateField(['perIndividuel', 'rente', 'rvtoTaxableFractionByAgeAtFirstPayment', idx, key], value)
          }
          disabled={!isAdmin}
        />

        <textarea
          className="settings-note"
          rows={2}
          value={textOrEmpty(per.rente.nonDeduits.note)}
          onChange={(e) =>
            updateField(['perIndividuel', 'rente', 'nonDeduits', 'note'], e.target.value)
          }
          disabled={!isAdmin}
        />
      </div>
    </div>
  </div>
</section>

  </>
)}

{p.key === 'cto' && (
  <>
    {/* 1) Phase d'épargne */}
    <section>
      <h4 className="fisc-section-title">Phase d'épargne</h4>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Versements</div>
        <div className="settings-field-row">
          <label>Déductibilité IR</label>
          <input type="text" value="Non" disabled style={{ width: 90, textAlign: 'center' }} />
          <span />
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text)', marginTop: 8 }}>
          Les versements sur un compte-titres ne sont pas déductibles du revenu imposable.
        </div>
      </div>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Prélèvements sociaux en phase de détention</div>
        <div className="settings-field-row">
          <label>PS sur plus-values latentes</label>
          <input type="text" value="Non" disabled style={{ width: 90, textAlign: 'center' }} />
          <span />
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text)', marginTop: 8 }}>
          Aucun prélèvement social pendant la détention (hors dividendes et coupons encaissés).<br />
          <strong>Imposition uniquement</strong> lors de la perception de revenus (dividendes, coupons) ou de la cession des titres.
        </div>
      </div>
    </section>

    {/* 2) Revenus & plus-values */}
    <section>
      <h4 className="fisc-section-title">Revenus & plus-values</h4>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Assiette imposable</div>
        <div className="settings-field-row">
          <label>Base</label>
          <input type="text" value="Revenus (dividendes, coupons) + plus-values de cession" disabled style={{ width: 380, textAlign: 'left' }} />
          <span />
        </div>
      </div>

      <div className="fisc-two-cols">
        <div className="fisc-col">
          <div className="fisc-col-title">Régime par défaut : PFU (Flat Tax)</div>

          <div className="income-tax-block">
            <div className="settings-field-row">
              <label>IR (prélèvement forfaitaire)</label>
              <input type="text" value="12,8" disabled style={{ width: 70, textAlign: 'center' }} />
              <span>%</span>
            </div>
            <div className="settings-field-row">
              <label>Prélèvements sociaux</label>
              <input type="text" value="17,2" disabled style={{ width: 70, textAlign: 'center' }} />
              <span>%</span>
            </div>
            <div className="settings-field-row">
              <label><strong>Total PFU</strong></label>
              <input type="text" value="30,0" disabled style={{ width: 70, textAlign: 'center', fontWeight: 'bold' }} />
              <span>%</span>
            </div>
          </div>
        </div>

        <div className="fisc-col fisc-col-right">
          <div className="fisc-col-title">Option : barème progressif IR</div>

          <div className="income-tax-block">
            <div className="settings-field-row">
              <label>IR</label>
              <input type="text" value="Barème progressif" disabled style={{ width: 160, textAlign: 'center' }} />
              <span />
            </div>
            <div className="settings-field-row">
              <label>Prélèvements sociaux</label>
              <input type="text" value="17,2" disabled style={{ width: 70, textAlign: 'center' }} />
              <span>%</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>
              Option possible sur option annuelle expresse.<br />
              Intéressant si TMI &lt; 12,8 % (revenus modestes).
            </div>
          </div>
        </div>
      </div>

      <div className="income-tax-block" style={{ marginTop: 10 }}>
        <div className="income-tax-block-title">Dividendes — abattement de 40 %</div>
        <div style={{ fontSize: 13, color: 'var(--color-c9)' }}>
          En cas d'option pour le barème IR, un abattement de 40 % s'applique sur les dividendes éligibles 
          (actions de sociétés françaises ou européennes soumises à l'IS).<br />
          <strong>Attention :</strong> l'abattement ne s'applique pas en cas de PFU.
        </div>
      </div>
    </section>

    {/* 3) Moins-values */}
    <section>
      <h4 className="fisc-section-title">Moins-values</h4>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Imputation et report</div>
        <div style={{ fontSize: 13, color: 'var(--color-c9)' }}>
          <strong>Imputation :</strong> les moins-values sont imputables sur les plus-values de même nature 
          (valeurs mobilières et droits sociaux) réalisées la même année.<br /><br />
          <strong>Report :</strong> si les moins-values excèdent les plus-values de l'année, 
          le solde est reportable sur les 10 années suivantes.<br /><br />
          <em>Le report est automatique et s'impute sur les premières plus-values réalisées.</em>
        </div>
      </div>
    </section>

    {/* 4) Décès — transmission */}
    <section>
      <h4 className="fisc-section-title">Décès — transmission</h4>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Régime successoral</div>
        <div className="settings-field-row">
          <label>Intégration à l'actif successoral</label>
          <input type="text" value="Oui" disabled style={{ width: 90, textAlign: 'center' }} />
          <span />
        </div>
        <div className="settings-field-row">
          <label>Régime fiscal</label>
          <input type="text" value="DMTG (droits de mutation à titre gratuit)" disabled style={{ width: 320, textAlign: 'left' }} />
          <span />
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>
          Le compte-titres est intégré à l'actif successoral pour sa valeur au jour du décès.<br />
          Application du barème des droits de succession selon le lien de parenté.<br /><br />
          <strong>Pas de régime dérogatoire</strong> (contrairement à l'assurance-vie).<br />
          <strong>Purge des plus-values latentes</strong> : les héritiers reçoivent les titres avec une valeur d'acquisition 
          égale à la valeur au décès (pas d'imposition sur les plus-values antérieures).
        </div>
      </div>
    </section>
  </>
)}

{p.key === 'pea' && (
  <>
    {/* 1) Phase d'épargne */}
    <section>
      <h4 className="fisc-section-title">Phase d'épargne</h4>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Versements</div>
        <div className="settings-field-row">
          <label>Déductibilité IR</label>
          <input type="text" value="Non" disabled style={{ width: 90, textAlign: 'center' }} />
          <span />
        </div>
        <div className="settings-field-row">
          <label>Plafond de versements</label>
          <input type="text" value="150 000" disabled style={{ width: 100, textAlign: 'right' }} />
          <span>€</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>
          Les versements sur un PEA ne sont pas déductibles du revenu imposable.<br />
          Le plafond de versements est de 150 000 € (225 000 € avec un PEA-PME).
        </div>
      </div>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Fiscalité pendant la détention</div>
        <div className="settings-field-row">
          <label>Imposition des gains</label>
          <input type="text" value="Aucune" disabled style={{ width: 120, textAlign: 'center' }} />
          <span />
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>
          <strong>Pas d'imposition</strong> tant qu'il n'y a pas de retrait.<br />
          Les dividendes et plus-values sont capitalisés en franchise d'impôt à l'intérieur du plan.
        </div>
      </div>
    </section>

    {/* 2) Retraits */}
    <section>
      <h4 className="fisc-section-title">Retraits</h4>

      <div className="fisc-two-cols">
        <div className="fisc-col">
          <div className="fisc-col-title" style={{ color: 'var(--color-c6)' }}>Retrait avant 5 ans</div>

          <div className="income-tax-block">
            <div className="income-tax-block-title">Conséquences</div>
            <div className="settings-field-row">
              <label>Clôture du plan</label>
              <input type="text" value="Oui (sauf cas spécifiques)" disabled style={{ width: 180, textAlign: 'center' }} />
              <span />
            </div>

            <table className="settings-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Composante</th>
                  <th className="taux-col">IR</th>
                  <th className="taux-col">PS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left' }}>Gains (plus-values + dividendes)</td>
                  <td className="taux-col">12,8 %</td>
                  <td className="taux-col">17,2 %</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>
              Les gains sont imposés au PFU (30 %) ou sur option au barème IR + PS.<br />
              <strong>Cas de déblocage anticipé sans clôture :</strong> licenciement, invalidité, 
              mise en retraite anticipée, création/reprise d'entreprise.
            </div>
          </div>
        </div>

        <div className="fisc-col fisc-col-right">
          <div className="fisc-col-title" style={{ color: 'var(--color-c2)' }}>Retrait après 5 ans</div>

          <div className="income-tax-block">
            <div className="income-tax-block-title">Régime fiscal avantageux</div>
            <div className="settings-field-row">
              <label>Clôture du plan</label>
              <input type="text" value="Non (retraits partiels possibles)" disabled style={{ width: 220, textAlign: 'center' }} />
              <span />
            </div>

            <table className="settings-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Composante</th>
                  <th className="taux-col">IR</th>
                  <th className="taux-col">PS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left' }}>Gains (plus-values + dividendes)</td>
                  <td className="taux-col" style={{ color: 'var(--color-c2)', fontWeight: 'bold' }}>Exonéré</td>
                  <td className="taux-col">17,2 %</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>
              <strong>Exonération totale d'IR</strong> sur les gains.<br />
              Seuls les prélèvements sociaux (17,2 %) restent dus sur les gains.<br /><br />
              Les retraits partiels sont possibles sans clôture du plan.<br />
              Les nouveaux versements restent possibles dans la limite du plafond.
            </div>
          </div>
        </div>
      </div>

      <div className="income-tax-block" style={{ marginTop: 10 }}>
        <div className="income-tax-block-title">Synthèse des seuils temporels</div>
        <table className="settings-table">
          <thead>
            <tr>
              <th>Durée de détention</th>
              <th>Retrait</th>
              <th>IR sur gains</th>
              <th>PS sur gains</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>&lt; 5 ans</td>
              <td style={{ textAlign: 'left' }}>Clôture du plan</td>
              <td className="taux-col">12,8 %</td>
              <td className="taux-col">17,2 %</td>
            </tr>
            <tr style={{ backgroundColor: 'var(--color-c7)' }}>
              <td style={{ textAlign: 'left' }}>≥ 5 ans</td>
              <td style={{ textAlign: 'left' }}>Maintien possible</td>
              <td className="taux-col" style={{ fontWeight: 'bold', color: 'var(--color-c2)' }}>Exonéré</td>
              <td className="taux-col">17,2 %</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    {/* 3) Décès — transmission */}
    <section>
      <h4 className="fisc-section-title">Décès — transmission</h4>

      <div className="income-tax-block">
        <div className="income-tax-block-title">Clôture du plan</div>
        <div className="settings-field-row">
          <label>Clôture automatique au décès</label>
          <input type="text" value="Oui" disabled style={{ width: 90, textAlign: 'center' }} />
          <span />
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>
          Le PEA est automatiquement clôturé au décès du titulaire.<br />
          Les titres sont transférés aux héritiers ou le plan est liquidé.
        </div>
      </div>

      <div className="fisc-two-cols" style={{ marginTop: 10 }}>
        <div className="fisc-col">
          <div className="fisc-col-title">Fiscalité des gains</div>
          <div className="income-tax-block">
            <div className="settings-field-row">
              <label>IR sur les gains</label>
              <input type="text" value="Exonéré" disabled style={{ width: 120, textAlign: 'center', color: 'var(--color-c2)', fontWeight: 'bold' }} />
              <span />
            </div>
            <div className="settings-field-row">
              <label>PS sur les gains</label>
              <input type="text" value="17,2 %" disabled style={{ width: 90, textAlign: 'center' }} />
              <span />
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>
              Les gains réalisés sont exonérés d'IR (même si le plan a moins de 5 ans).<br />
              Les PS restent dus sur les gains.
            </div>
          </div>
        </div>

        <div className="fisc-col fisc-col-right">
          <div className="fisc-col-title">Intégration à la succession</div>
          <div className="income-tax-block">
            <div className="settings-field-row">
              <label>Régime fiscal</label>
              <input type="text" value="DMTG" disabled style={{ width: 90, textAlign: 'center' }} />
              <span />
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>
              La valeur du PEA au jour du décès est intégrée à l'actif successoral.<br />
              Application du barème des droits de succession selon le lien de parenté.<br /><br />
              <strong>Pas de régime dérogatoire</strong> (contrairement à l'assurance-vie).
            </div>
          </div>
        </div>
      </div>
    </section>
  </>
)}

          </div>
        )}
      </div>
    );
  })}
</div>

          
          {/* Actions globales (hors accordéon) */}
{isAdmin && (
  <button
    type="button"
    className="chip"
    onClick={handleSave}
    disabled={saving}
  >
    {saving ? 'Enregistrement…' : 'Enregistrer les paramètres fiscalités'}
  </button>
)}

{message && (
  <div style={{ 
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
  );
}
