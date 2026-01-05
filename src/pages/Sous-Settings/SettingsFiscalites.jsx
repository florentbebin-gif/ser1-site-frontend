import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SettingsNav from '../SettingsNav';
import './SettingsFiscalites.css';
import { invalidate, broadcastInvalidation } from '../../utils/fiscalSettingsCache.js';

// ------------------------------------------------------------
// Valeurs par défaut (Assurance-vie) — issues du tableau Excel PJ
// Objectif: stocker uniquement les paramètres "légèrement mouvants"
// (taux/abattements/seuils/dates) pour alimenter les simulateurs.
// ------------------------------------------------------------
const DEFAULT_FISCALITY_SETTINGS = {
  passHistory: [
    { year: 2019, amount: 40524 },
    { year: 2020, amount: 41136 },
    { year: 2021, amount: 41136 },
    { year: 2022, amount: 41136 },
    { year: 2023, amount: 43992 },
    { year: 2024, amount: 46368 },
    { year: 2025, amount: 47100 },
    { year: 2026, amount: 48060 },
  ],

  perIndividuel: {
    epargne: {
      // Références plafonds (tu feras le calcul dans les simulateurs)
      plafond163Quatervicies: {
        ratePercent: 10,
        base: "revenu imposable après abattement 10% (frais pro éventuels)",
        minPassMultiple: 1,
        maxPassMultiple: 8,
        note:
          "Plafond = 10% des revenus imposables (après abattement 10% si applicable). Minimum = 10% d'1 PASS, maximum = 10% de 8 PASS.",
      },

      plafond154Bis: {
        // Le but est de stocker les règles + PASS multiples, pas de calculer ici
        assiettePotentielle: {
          base:
            "assiette sociale (revenu imposable majoré des cotisations facultatives)",
          part15: {
            ratePercent: 15,
            base: "revenus - 1 PASS",
            maxPassMultiple: 8,
          },
          part10: {
            ratePercent: 10,
            base:
              "revenus (après abattement 10% si applicable) - composante plancher/plafond",
            minPassMultiple: 1,
            maxPassMultiple: 8,
          },
        },
        assietteReportDeclaration: {
          base:
            "recalcul sur revenu imposable (après abattement 10% si applicable) : on reporte uniquement le dépassement de l'enveloppe 15%",
          note:
            "Assiette report = dépassement de l'enveloppe 15%, recalculé sur l'assiette 'revenu imposable après abattement 10%'.",
        },
        note:
          "Plafond 'Madelin' (154 bis) : 15% des revenus - 1 PASS (max 8 PASS) + 10% des revenus (max 8 PASS avec mini 10% PASS).",
      },
    },

    sortieCapital: {
      pfu: {
        irRatePercent: 12.8,
        psRatePercent: 17.2,
        allowBaremeIR: true,
      },

      retraite: {
        deduits: {
          versements: { irMode: "bareme", note: "Part versements déduits : imposable au barème IR (sans abattement)." },
          gains: { mode: "pfu", note: "Part gains : PFU (12,8% + 17,2%) par défaut, option barème pour la part IR possible." },
        },
        nonDeduits: {
          versements: { irMode: "exonere", note: "Part versements non déduits : exonérée d'IR." },
          gains: { mode: "pfu", note: "Part gains : PFU (12,8% + 17,2%) par défaut, option barème pour la part IR possible." },
        },
      },

      anticipation: {
        achatRP: {
          deduits: { versementsIR: "bareme", gains: "pfu" },
          nonDeduits: { versementsIR: "exonere", gains: "pfu" },
          note: "Déblocage anticipé pour achat de résidence principale : logique proche de la sortie à la retraite.",
        },
        accidentsDeLaVie: {
          note:
            "Déblocages anticipés 'accidents de la vie' : traitement fiscal à gérer au cas par cas (règles spécifiques, souvent exonérations).",
        },
      },
    },

    deces: {
      perAssurantiel: {
        // Présentation « logique CGP » : seuil total 852 500 = 152 500 + 700 000
        allowancePerBeneficiary: 152500,
        displayThresholdTotal: 852500,
        taxableThresholdPart: 700000,
        rates: [
          { upToTotal: 852500, ratePercent: 20 },
          { upToTotal: null, ratePercent: 31.25 },
        ],
        apres70ans: {
          globalAllowance: 30500,
          mode: "dmtg",
          note: "Au-delà : DMTG (barème succession).",
        },
        note: "PER assurantiel : transmission alignée assurance-vie (990 I / 757 B).",
      },

      perBancaire: {
        mode: "succession",
        note: "PER bancaire : intégration à l'actif successoral (DMTG barème succession).",
      },
    },

rente: {
  // Barème RVTO (utilisé pour la quote-part intérêts et pour non déduits)
  rvtoTaxableFractionByAgeAtFirstPayment: [
    { label: "< 50 ans", ageMaxInclusive: 49, fraction: 0.7 },
    { label: "50 à 59 ans", ageMaxInclusive: 59, fraction: 0.5 },
    { label: "60 à 69 ans", ageMaxInclusive: 69, fraction: 0.4 },
    { label: "≥ 70 ans", ageMaxInclusive: null, fraction: 0.3 },
  ],

  deduits: {
    capitalQuotePart: {
      irMode: "bareme_sans_abattement_10",
      psRatePercent: 0.3,
      psLabel: "CASA",
      note:
        "Quote-part capital : rente à titre gratuit, imposée au barème IR (sans abattement 10%). PS : CASA 0,3%.",
    },
    interestsQuotePart: {
      irMode: "rvto",
      psRatePercent: 17.2,
      note:
        "Quote-part intérêts : RVTO (fraction imposable selon âge). PS : 17,2% sur l'assiette après abattement RVTO.",
    },
  },

  nonDeduits: {
    irMode: "rvto",
    psRatePercent: 17.2,
    note:
      "Totalité de la rente : RVTO (fraction imposable selon âge). PS : 17,2% sur l'assiette après abattement RVTO.",
  },
},

  },
  
  assuranceVie: {

    // 1) Phase d’épargne
    epargne: {
      versementDeductibleIR: false,
      socialOnInterestsDuringAccumulation: {
        // commentaire Excel: PS sur intérêts fonds € prélevés annuellement
        psRatePercent: 17.2,
        note: "PS sur intérêts (fonds €) prélevés annuellement.",
      },
    },

    // 2) Retraits en capital
    retraitsCapital: {
      baseImposable: 'interets', // intérêts/gains uniquement
      psRatePercent: 17.2,

      // Versements effectués à partir du 27/09/2017
      depuis2017: {
        startDate: '2017-09-27',
        moins8Ans: {
          irRatePercent: 12.8, // PFU IR
          allowBaremeIR: true,
          label: '< 8 ans',
        },
        plus8Ans: {
          label: '> 8 ans',
          abattementAnnuel: {
            single: 4600,
            couple: 9200,
          },
          primesNettesSeuil: 150000,
          irRateUnderThresholdPercent: 7.5, // PFL (ou barème) sous seuil
          irRateOverThresholdPercent: 12.8, // PFU (ou barème) au-delà
          allowBaremeIR: true,
        },
      },

      // Versements effectués avant le 27/09/2017
      avant2017: {
        endDate: '2017-09-26',
        moins4Ans: { label: '< 4 ans', irRatePercent: 35, allowBaremeIR: true },
        de4a8Ans: { label: '4 à 8 ans', irRatePercent: 15, allowBaremeIR: true },
        plus8Ans: {
          label: '> 8 ans',
          abattementAnnuel: { single: 4600, couple: 9200 },
          irRatePercent: 7.5,
          allowBaremeIR: true,
        },
      },
    },

    // 3) Décès (transmission)
    deces: {
      // Bornes historiques
      contratAvantDate: '1998-10-12',
      contratApresDate: '1998-10-13',
      agePivotPrimes: 70,

      // Primes versées avant 13/10/1998 : exonération (tableau = 0)
      primesAvant1998: {
        taxRatePercent: 0,
        note: "Contrats souscrits avant le 13/10/1998 : primes versées avant le 13/10/1998 exonérées.",
      },

      // Primes versées à partir du 13/10/1998 (article 990 I — logique par bénéficiaire)
      primesApres1998: {
        allowancePerBeneficiary: 152500,
        brackets: [
          { upTo: 852500, ratePercent: 20 },
          { upTo: null, ratePercent: 35 },
        ],
        note: 'Barème par bénéficiaire (990 I).',
      },

      // Primes versées après 70 ans (article 757 B — logique globale)
      apres70ans: {
        globalAllowance: 30500,
        taxationMode: 'dmtg', // droits de mutation à titre gratuit
        note: 'Au-delà de 30 500 € (global), taxation aux DMTG (barème succession).',
      },
    },

    // 4) Liquidation en rente
    rente: {
      possible: true,
      psRatePercent: 17.2,
      taxableFractionByAgeAtLiquidation: [
        { label: '< 60 ans', ageMaxInclusive: 59, fraction: 0.5 },
        { label: '< 70 ans', ageMaxInclusive: 69, fraction: 0.4 },
        { label: '≥ 70 ans', ageMaxInclusive: null, fraction: 0.3 },
      ],
      irMode: 'bareme',
      notePs: "Les PS sont calculés sur l'assiette après abattement.",
      noteCapitalOnDeath:
        'Transmission des capitaux en cas de décès : non (sauf éventuelle réversion de la rente).',
    },
  },
};

function numberOrEmpty(v) {
  return v === null || v === undefined || Number.isNaN(v) ? '' : String(v);
}

function textOrEmpty(v) {
  return v === null || v === undefined ? '' : String(v);
}

export default function SettingsFiscalites() {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState('User');
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(DEFAULT_FISCALITY_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [openProductKey, setOpenProductKey] = useState(null);

const PRODUCTS = [
  { key: 'assuranceVie', label: 'Assurance vie' },
  { key: 'perIndividuel', label: 'PER individuel' },
  { key: 'cto', label: 'Compte-titres ordinaire (CTO)' },
  { key: 'pea', label: 'Plan d\'épargne en actions (PEA)' },
];

  const isAdmin =
    user &&
    ((typeof user?.user_metadata?.role === 'string' &&
      user.user_metadata.role.toLowerCase() === 'admin') ||
      user?.user_metadata?.is_admin === true);

  const av = settings.assuranceVie;
  const passHistory = settings.passHistory || [];
  const per = settings.perIndividuel || DEFAULT_FISCALITY_SETTINGS.perIndividuel;


  // ---------------------------------------------
  // Chargement user + paramètres depuis Supabase
  // ---------------------------------------------
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
        if (u) {
          const meta = u.user_metadata || {};
          const admin =
            (typeof meta.role === 'string' && meta.role.toLowerCase() === 'admin') ||
            meta.is_admin === true;
          setRoleLabel(admin ? 'Admin' : 'User');
        }

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

    // merge profond ciblé PER (évite écrasement de la structure par un jsonb partiel)
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

    // PASS aussi : merge “safe”
    passHistory: Array.isArray(db.passHistory)
      ? db.passHistory
      : DEFAULT_FISCALITY_SETTINGS.passHistory,
  }));
}
 else if (err && err.code !== 'PGRST116') {
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
  const updateField = (path, value) => {
    setSettings((prev) => {
      const clone = structuredClone(prev);
      let obj = clone;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (obj[k] === undefined || obj[k] === null) obj[k] = {};
        obj = obj[k];
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
    setMessage('');
  };

const handleSave = async () => {
  if (!isAdmin) return;
  try {
    setSaving(true);
    setMessage('');

    // -----------------------------
    // Validation PASS (8 lignes + ordre)
    // -----------------------------
    const ph = (settings.passHistory || []).slice();

    if (ph.length !== 8) {
      setMessage("Historique PASS : il faut exactement 8 lignes.");
      setSaving(false);
      return;
    }

    for (let i = 0; i < ph.length; i++) {
      if (!ph[i]?.year || !ph[i]?.amount) {
        setMessage("Historique PASS : année et montant obligatoires sur chaque ligne.");
        setSaving(false);
        return;
      }
      if (i > 0 && Number(ph[i].year) <= Number(ph[i - 1].year)) {
        setMessage(
          "Historique PASS : l’ordre doit être du plus ancien au plus récent (années strictement croissantes)."
        );
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('fiscality_settings')
      .upsert({ id: 1, data: settings });

    if (error) {
      console.error(error);
      setMessage("Erreur lors de l'enregistrement.");
    } else {
      setMessage('Paramètres fiscalités enregistrés.');
      // Invalider le cache pour que /ir et autres pages rafraîchissent
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

        <div
          style={{
            fontSize: 15,
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Bandeau info */}
<div className="tax-user-banner">
  <strong>Utilisateur :</strong> {user.email} — <strong>Statut :</strong> {roleLabel}
</div>

          <section>
  <h4 className="fisc-section-title">Historique du PASS (8 dernières valeurs)</h4>

  <div className="income-tax-block">
    <div className="income-tax-block-title">Année & montant</div>

    <table className="settings-table">
      <thead>
        <tr>
          <th>Année</th>
          <th className="taux-col">PASS</th>
        </tr>
      </thead>
      <tbody>
        {passHistory.map((row, idx) => (
          <tr key={idx}>
            <td style={{ textAlign: 'left' }}>
              <input
                type="number"
                value={numberOrEmpty(row.year)}
                onChange={(e) =>
                  updateField(['passHistory', idx, 'year'], e.target.value === '' ? null : Number(e.target.value))
                }
                disabled={!isAdmin}
                style={{ width: 110, textAlign: 'left' }}
              />
            </td>
            <td className="taux-col">
              <input
                type="number"
                value={numberOrEmpty(row.amount)}
                onChange={(e) =>
                  updateField(['passHistory', idx, 'amount'], e.target.value === '' ? null : Number(e.target.value))
                }
                disabled={!isAdmin}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ fontSize: 12, color: 'var(--color-c9)', marginTop: 6 }}>
      Ordre obligatoire : du plus ancien au plus récent (contrôle à l’enregistrement).
    </div>
  </div>
</section>


{/* Accordéon produits */}
<div className="fisc-accordion">
    {PRODUCTS.map((p) => {
    const isOpen = openProductKey === p.key;

    return (
      <div key={p.key} className="fisc-acc-item">
        <button
          type="button"
          className="fisc-acc-header"
          onClick={() => setOpenProductKey(isOpen ? null : p.key)}
        >
          <span className="fisc-product-title" style={{ margin: 0 }}>
            {p.label}
          </span>
          <span className="fisc-acc-chevron">{isOpen ? '▾' : '▸'}</span>
        </button>

        {isOpen && (
          <div className="fisc-acc-body">
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
                    <div className="settings-field-row">
                      <label>Taux de PS sur intérêts</label>
                      <input
                        type="number"
                        step="0.1"
                        value={numberOrEmpty(
                          av.epargne.socialOnInterestsDuringAccumulation.psRatePercent
                        )}
                        onChange={(e) =>
                          updateField(
                            [
                              'assuranceVie',
                              'epargne',
                              'socialOnInterestsDuringAccumulation',
                              'psRatePercent',
                            ],
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        disabled={!isAdmin}
                      />
                      <span>%</span>
                    </div>

                    <div className="settings-field-row">
                      <label>Note</label>
                      <input
                        type="text"
                        value={textOrEmpty(
                          av.epargne.socialOnInterestsDuringAccumulation.note
                        )}
                        onChange={(e) =>
                          updateField(
                            [
                              'assuranceVie',
                              'epargne',
                              'socialOnInterestsDuringAccumulation',
                              'note',
                            ],
                            e.target.value
                          )
                        }
                        disabled={!isAdmin}
                        style={{ width: 520, textAlign: 'left' }}
                      />
                      <span />
                    </div>
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
                    <div className="settings-field-row">
                      <label>Taux de PS (global)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={numberOrEmpty(av.retraitsCapital.psRatePercent)}
                        onChange={(e) =>
                          updateField(
                            ['assuranceVie', 'retraitsCapital', 'psRatePercent'],
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        disabled={!isAdmin}
                      />
                      <span>%</span>
                    </div>
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
                            <th>Option barème</th>
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
                            <td style={{ textAlign: 'left' }}>
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

                        <div className="settings-field-row">
                          <label>Abattement annuel célibataire</label>
                          <input
                            type="number"
                            value={numberOrEmpty(
                              av.retraitsCapital.depuis2017.plus8Ans.abattementAnnuel.single
                            )}
                            onChange={(e) =>
                              updateField(
                                [
                                  'assuranceVie',
                                  'retraitsCapital',
                                  'depuis2017',
                                  'plus8Ans',
                                  'abattementAnnuel',
                                  'single',
                                ],
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            disabled={!isAdmin}
                          />
                          <span>€</span>
                        </div>

                        <div className="settings-field-row">
                          <label>Abattement annuel couple</label>
                          <input
                            type="number"
                            value={numberOrEmpty(
                              av.retraitsCapital.depuis2017.plus8Ans.abattementAnnuel.couple
                            )}
                            onChange={(e) =>
                              updateField(
                                [
                                  'assuranceVie',
                                  'retraitsCapital',
                                  'depuis2017',
                                  'plus8Ans',
                                  'abattementAnnuel',
                                  'couple',
                                ],
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            disabled={!isAdmin}
                          />
                          <span>€</span>
                        </div>

                        <div className="settings-field-row">
                          <label>Seuil de primes nettes</label>
                          <input
                            type="number"
                            value={numberOrEmpty(
                              av.retraitsCapital.depuis2017.plus8Ans.primesNettesSeuil
                            )}
                            onChange={(e) =>
                              updateField(
                                [
                                  'assuranceVie',
                                  'retraitsCapital',
                                  'depuis2017',
                                  'plus8Ans',
                                  'primesNettesSeuil',
                                ],
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            disabled={!isAdmin}
                          />
                          <span>€</span>
                        </div>

                        <table className="settings-table" style={{ marginTop: 8 }}>
                          <thead>
                            <tr>
                              <th>Tranche</th>
                              <th className="taux-col">IR %</th>
                              <th>Option barème</th>
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
                              <td style={{ textAlign: 'left' }}>
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
                              <td style={{ textAlign: 'left' }}>
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
                            <th>Option barème</th>
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
                            <td style={{ textAlign: 'left' }}>
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
                            <td style={{ textAlign: 'left' }}>
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
                            <td style={{ textAlign: 'left' }}>
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
                        <div className="settings-field-row">
                          <label>Célibataire</label>
                          <input
                            type="number"
                            value={numberOrEmpty(
                              av.retraitsCapital.avant2017.plus8Ans.abattementAnnuel.single
                            )}
                            onChange={(e) =>
                              updateField(
                                [
                                  'assuranceVie',
                                  'retraitsCapital',
                                  'avant2017',
                                  'plus8Ans',
                                  'abattementAnnuel',
                                  'single',
                                ],
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            disabled={!isAdmin}
                          />
                          <span>€</span>
                        </div>
                        <div className="settings-field-row">
                          <label>Couple</label>
                          <input
                            type="number"
                            value={numberOrEmpty(
                              av.retraitsCapital.avant2017.plus8Ans.abattementAnnuel.couple
                            )}
                            onChange={(e) =>
                              updateField(
                                [
                                  'assuranceVie',
                                  'retraitsCapital',
                                  'avant2017',
                                  'plus8Ans',
                                  'abattementAnnuel',
                                  'couple',
                                ],
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

                    <div className="settings-field-row">
                      <label>Âge pivot (primes)</label>
                      <input
                        type="number"
                        value={numberOrEmpty(av.deces.agePivotPrimes)}
                        onChange={(e) =>
                          updateField(
                            ['assuranceVie', 'deces', 'agePivotPrimes'],
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        disabled={!isAdmin}
                      />
                      <span>ans</span>
                    </div>
                  </div>

                  <div className="fisc-two-cols">
                    <div className="fisc-col">
                      <div className="fisc-col-title">
                        Primes versées avant {av.deces.contratApresDate}
                      </div>
                      <div className="settings-field-row">
                        <label>Taux</label>
                        <input
                          type="number"
                          step="0.1"
                          value={numberOrEmpty(av.deces.primesAvant1998.taxRatePercent)}
                          onChange={(e) =>
                            updateField(
                              ['assuranceVie', 'deces', 'primesAvant1998', 'taxRatePercent'],
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                        <span>%</span>
                      </div>
                      <div className="settings-field-row">
                        <label>Note</label>
                        <input
                          type="text"
                          value={textOrEmpty(av.deces.primesAvant1998.note)}
                          onChange={(e) =>
                            updateField(
                              ['assuranceVie', 'deces', 'primesAvant1998', 'note'],
                              e.target.value
                            )
                          }
                          disabled={!isAdmin}
                          style={{ width: 520, textAlign: 'left' }}
                        />
                        <span />
                      </div>
                    </div>

                    <div className="fisc-col fisc-col-right">
                      <div className="fisc-col-title">
                        Primes versées à partir du {av.deces.contratApresDate} (par bénéficiaire)
                      </div>

                      <div className="settings-field-row">
                        <label>Abattement / bénéficiaire</label>
                        <input
                          type="number"
                          value={numberOrEmpty(av.deces.primesApres1998.allowancePerBeneficiary)}
                          onChange={(e) =>
                            updateField(
                              ['assuranceVie', 'deces', 'primesApres1998', 'allowancePerBeneficiary'],
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          disabled={!isAdmin}
                        />
                        <span>€</span>
                      </div>

                      <table className="settings-table" style={{ marginTop: 8 }}>
                        <thead>
                          <tr>
                            <th>Jusqu’à</th>
                            <th className="taux-col">Taux %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {av.deces.primesApres1998.brackets.map((b, idx) => (
                            <tr key={idx}>
                              <td style={{ textAlign: 'left' }}>
                                {b.upTo === null ? 'Au-delà' : `${b.upTo.toLocaleString('fr-FR')} €`}
                              </td>
                              <td className="taux-col">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={numberOrEmpty(b.ratePercent)}
                                  onChange={(e) =>
                                    updateField(
                                      [
                                        'assuranceVie',
                                        'deces',
                                        'primesApres1998',
                                        'brackets',
                                        idx,
                                        'ratePercent',
                                      ],
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

                      <div className="settings-field-row" style={{ marginTop: 6 }}>
                        <label>Note</label>
                        <input
                          type="text"
                          value={textOrEmpty(av.deces.primesApres1998.note)}
                          onChange={(e) =>
                            updateField(
                              ['assuranceVie', 'deces', 'primesApres1998', 'note'],
                              e.target.value
                            )
                          }
                          disabled={!isAdmin}
                          style={{ width: 520, textAlign: 'left' }}
                        />
                        <span />
                      </div>
                    </div>
                  </div>

                  <div className="income-tax-block" style={{ marginTop: 10 }}>
                    <div className="income-tax-block-title">
                      Primes versées après {av.deces.agePivotPrimes} ans (logique globale)
                    </div>
                    <div className="settings-field-row">
                      <label>Abattement global</label>
                      <input
                        type="number"
                        value={numberOrEmpty(av.deces.apres70ans.globalAllowance)}
                        onChange={(e) =>
                          updateField(
                            ['assuranceVie', 'deces', 'apres70ans', 'globalAllowance'],
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        disabled={!isAdmin}
                      />
                      <span>€</span>
                    </div>
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
                    <div className="settings-field-row">
                      <label>Note</label>
                      <input
                        type="text"
                        value={textOrEmpty(av.deces.apres70ans.note)}
                        onChange={(e) =>
                          updateField(
                            ['assuranceVie', 'deces', 'apres70ans', 'note'],
                            e.target.value
                          )
                        }
                        disabled={!isAdmin}
                        style={{ width: 520, textAlign: 'left' }}
                      />
                      <span />
                    </div>
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

                    <div className="settings-field-row">
                      <label>Taux de PS</label>
                      <input
                        type="number"
                        step="0.1"
                        value={numberOrEmpty(av.rente.psRatePercent)}
                        onChange={(e) =>
                          updateField(
                            ['assuranceVie', 'rente', 'psRatePercent'],
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        disabled={!isAdmin}
                      />
                      <span>%</span>
                    </div>

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

                    <table className="settings-table">
                      <thead>
                        <tr>
                          <th>Âge</th>
                          <th className="taux-col">Fraction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {av.rente.taxableFractionByAgeAtLiquidation.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'left' }}>{row.label}</td>
                            <td className="taux-col">
                              <input
                                type="number"
                                step="0.01"
                                value={numberOrEmpty(row.fraction)}
                                onChange={(e) =>
                                  updateField(
                                    [
                                      'assuranceVie',
                                      'rente',
                                      'taxableFractionByAgeAtLiquidation',
                                      idx,
                                      'fraction',
                                    ],
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

                    <div className="settings-field-row" style={{ marginTop: 6 }}>
                      <label>Note PS</label>
                      <input
                        type="text"
                        value={textOrEmpty(av.rente.notePs)}
                        onChange={(e) =>
                          updateField(['assuranceVie', 'rente', 'notePs'], e.target.value)
                        }
                        disabled={!isAdmin}
                        style={{ width: 520, textAlign: 'left' }}
                      />
                      <span />
                    </div>

                    <div className="settings-field-row">
                      <label>Note décès</label>
                      <input
                        type="text"
                        value={textOrEmpty(av.rente.noteCapitalOnDeath)}
                        onChange={(e) =>
                          updateField(
                            ['assuranceVie', 'rente', 'noteCapitalOnDeath'],
                            e.target.value
                          )
                        }
                        disabled={!isAdmin}
                        style={{ width: 520, textAlign: 'left' }}
                      />
                      <span />
                    </div>
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

            <div className="settings-field-row">
              <label>Taux</label>
              <input
                type="number"
                step="0.1"
                value={numberOrEmpty(per.epargne.plafond163Quatervicies.ratePercent)}
                onChange={(e) =>
                  updateField(
                    ['perIndividuel', 'epargne', 'plafond163Quatervicies', 'ratePercent'],
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
              <span>%</span>
            </div>

            <div className="settings-field-row">
              <label>Mini</label>
              <input
                type="number"
                value={numberOrEmpty(per.epargne.plafond163Quatervicies.minPassMultiple)}
                onChange={(e) =>
                  updateField(
                    ['perIndividuel', 'epargne', 'plafond163Quatervicies', 'minPassMultiple'],
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
              <span>x PASS</span>
            </div>

            <div className="settings-field-row">
              <label>Maxi</label>
              <input
                type="number"
                value={numberOrEmpty(per.epargne.plafond163Quatervicies.maxPassMultiple)}
                onChange={(e) =>
                  updateField(
                    ['perIndividuel', 'epargne', 'plafond163Quatervicies', 'maxPassMultiple'],
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
              <span>x PASS</span>
            </div>

            <div className="settings-field-row">
              <label>Note</label>
              <input
                type="text"
                value={textOrEmpty(per.epargne.plafond163Quatervicies.note)}
                onChange={(e) =>
                  updateField(['perIndividuel', 'epargne', 'plafond163Quatervicies', 'note'], e.target.value)
                }
                disabled={!isAdmin}
                style={{ width: 520, textAlign: 'left' }}
              />
              <span />
            </div>
          </div>
        </div>

        <div className="fisc-col fisc-col-right">
          <div className="income-tax-block">
            <div className="income-tax-block-title">Plafond 154 bis (TNS)</div>

            <div className="settings-field-row">
              <label>Part 15% — taux</label>
              <input
                type="number"
                step="0.1"
                value={numberOrEmpty(per.epargne.plafond154Bis.assiettePotentielle.part15.ratePercent)}
                onChange={(e) =>
                  updateField(
                    ['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part15','ratePercent'],
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
              <span>%</span>
            </div>

            <div className="settings-field-row">
              <label>Part 15% — max</label>
              <input
                type="number"
                value={numberOrEmpty(per.epargne.plafond154Bis.assiettePotentielle.part15.maxPassMultiple)}
                onChange={(e) =>
                  updateField(
                    ['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part15','maxPassMultiple'],
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
              <span>x PASS</span>
            </div>

            <div className="settings-field-row">
              <label>Part 10% — taux</label>
              <input
                type="number"
                step="0.1"
                value={numberOrEmpty(per.epargne.plafond154Bis.assiettePotentielle.part10.ratePercent)}
                onChange={(e) =>
                  updateField(
                    ['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part10','ratePercent'],
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
              <span>%</span>
            </div>

            <div className="settings-field-row">
              <label>Part 10% — mini</label>
              <input
                type="number"
                value={numberOrEmpty(per.epargne.plafond154Bis.assiettePotentielle.part10.minPassMultiple)}
                onChange={(e) =>
                  updateField(
                    ['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part10','minPassMultiple'],
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
              <span>x PASS</span>
            </div>

            <div className="settings-field-row">
              <label>Part 10% — max</label>
              <input
                type="number"
                value={numberOrEmpty(per.epargne.plafond154Bis.assiettePotentielle.part10.maxPassMultiple)}
                onChange={(e) =>
                  updateField(
                    ['perIndividuel','epargne','plafond154Bis','assiettePotentielle','part10','maxPassMultiple'],
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                disabled={!isAdmin}
              />
              <span>x PASS</span>
            </div>

            <div className="settings-field-row">
              <label>Note</label>
              <input
                type="text"
                value={textOrEmpty(per.epargne.plafond154Bis.note)}
                onChange={(e) => updateField(['perIndividuel','epargne','plafond154Bis','note'], e.target.value)}
                disabled={!isAdmin}
                style={{ width: 520, textAlign: 'left' }}
              />
              <span />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* 2) Sortie en capital */}
    <section>
      <h4 className="fisc-section-title">Sortie en capital</h4>

      <div className="income-tax-block">
        <div className="income-tax-block-title">PFU (référence)</div>
        <div className="settings-field-row">
          <label>IR PFU</label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(per.sortieCapital.pfu.irRatePercent)}
            onChange={(e) =>
              updateField(['perIndividuel','sortieCapital','pfu','irRatePercent'], e.target.value === '' ? null : Number(e.target.value))
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
        <div className="settings-field-row">
          <label>PS</label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(per.sortieCapital.pfu.psRatePercent)}
            onChange={(e) =>
              updateField(['perIndividuel','sortieCapital','pfu','psRatePercent'], e.target.value === '' ? null : Number(e.target.value))
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>
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
          style={{ width: 720, textAlign: 'left' }}
        />
      </div>
    </section>

    {/* 3) Décès */}
    <section>
      <h4 className="fisc-section-title">Décès</h4>

      <div className="fisc-two-cols">
        <div className="fisc-col">
          <div className="fisc-col-title">PER assurantiel</div>

          <div className="settings-field-row">
            <label>Abattement / bénéficiaire</label>
            <input
              type="number"
              value={numberOrEmpty(per.deces.perAssurantiel.allowancePerBeneficiary)}
              onChange={(e) =>
                updateField(['perIndividuel','deces','perAssurantiel','allowancePerBeneficiary'], e.target.value === '' ? null : Number(e.target.value))
              }
              disabled={!isAdmin}
            />
            <span>€</span>
          </div>

          <div className="settings-field-row">
            <label>Seuil “présentation”</label>
            <input
              type="number"
              value={numberOrEmpty(per.deces.perAssurantiel.displayThresholdTotal)}
              onChange={(e) =>
                updateField(['perIndividuel','deces','perAssurantiel','displayThresholdTotal'], e.target.value === '' ? null : Number(e.target.value))
              }
              disabled={!isAdmin}
            />
            <span>€</span>
          </div>

          <table className="settings-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Jusqu’à</th>
                <th className="taux-col">Taux %</th>
              </tr>
            </thead>
            <tbody>
              {per.deces.perAssurantiel.rates.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'left' }}>
                    {r.upToTotal === null ? 'Au-delà' : `${r.upToTotal.toLocaleString('fr-FR')} €`}
                  </td>
                  <td className="taux-col">
                    <input
                      type="number"
                      step="0.01"
                      value={numberOrEmpty(r.ratePercent)}
                      onChange={(e) =>
                        updateField(['perIndividuel','deces','perAssurantiel','rates', idx, 'ratePercent'], e.target.value === '' ? null : Number(e.target.value))
                      }
                      disabled={!isAdmin}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="income-tax-block" style={{ marginTop: 10 }}>
            <div className="income-tax-block-title">Primes après 70 ans</div>
            <div className="settings-field-row">
              <label>Abattement global</label>
              <input
                type="number"
                value={numberOrEmpty(per.deces.perAssurantiel.apres70ans.globalAllowance)}
                onChange={(e) =>
                  updateField(['perIndividuel','deces','perAssurantiel','apres70ans','globalAllowance'], e.target.value === '' ? null : Number(e.target.value))
                }
                disabled={!isAdmin}
              />
              <span>€</span>
            </div>
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

        <div className="settings-field-row">
          <label>PS (CASA)</label>
          <input
            type="number"
            step="0.01"
            value={numberOrEmpty(per.rente.deduits.capitalQuotePart.psRatePercent)}
            onChange={(e) =>
              updateField(
                ['perIndividuel', 'rente', 'deduits', 'capitalQuotePart', 'psRatePercent'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>

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

        <div className="settings-field-row">
          <label>PS</label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(per.rente.deduits.interestsQuotePart.psRatePercent)}
            onChange={(e) =>
              updateField(
                ['perIndividuel', 'rente', 'deduits', 'interestsQuotePart', 'psRatePercent'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>

        <table className="settings-table">
          <thead>
            <tr>
              <th>Âge 1er paiement</th>
              <th className="taux-col">Fraction</th>
            </tr>
          </thead>
          <tbody>
            {per.rente.rvtoTaxableFractionByAgeAtFirstPayment.map((row, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'left' }}>{row.label}</td>
                <td className="taux-col">
                  <input
                    type="number"
                    step="0.01"
                    value={numberOrEmpty(row.fraction)}
                    onChange={(e) =>
                      updateField(
                        ['perIndividuel', 'rente', 'rvtoTaxableFractionByAgeAtFirstPayment', idx, 'fraction'],
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

        <div className="settings-field-row">
          <label>PS</label>
          <input
            type="number"
            step="0.1"
            value={numberOrEmpty(per.rente.nonDeduits.psRatePercent)}
            onChange={(e) =>
              updateField(
                ['perIndividuel', 'rente', 'nonDeduits', 'psRatePercent'],
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            disabled={!isAdmin}
          />
          <span>%</span>
        </div>

        <table className="settings-table">
          <thead>
            <tr>
              <th>Âge 1er paiement</th>
              <th className="taux-col">Fraction</th>
            </tr>
          </thead>
          <tbody>
            {per.rente.rvtoTaxableFractionByAgeAtFirstPayment.map((row, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'left' }}>{row.label}</td>
                <td className="taux-col">
                  <input
                    type="number"
                    step="0.01"
                    value={numberOrEmpty(row.fraction)}
                    onChange={(e) =>
                      updateField(
                        ['perIndividuel', 'rente', 'rvtoTaxableFractionByAgeAtFirstPayment', idx, 'fraction'],
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

{message && <div style={{ fontSize: 13, marginTop: 8 }}>{message}</div>}

          
        </div>
      </div>
    </div>
  );
}
