import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { useUserRole } from '@/auth/useUserRole';
import './SettingsShared.css';
import './SettingsImpots.css';
import { invalidate, broadcastInvalidation } from '@/utils/fiscalSettingsCache.js';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { numberOrEmpty } from '@/utils/settingsHelpers.js';

import { DEFAULT_TAX_SETTINGS, DEFAULT_FISCALITY_SETTINGS } from '@/constants/settingsDefaults';
import { REGIMES_MATRIMONIAUX } from '@/engine/civil';

import ImpotsDmtgSection from './Impots/ImpotsDmtgSection';
import SettingsTable from '@/components/settings/SettingsTable';
import {
  validateDmtg,
  validateAvDeces,
  isValid,
} from './validators/dmtgValidators';

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

// Donation / rappel fiscal / 790 G defaults (stored in tax_settings.data.donation)
const DEFAULT_DONATION = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
  donManuel: {
    abattementRenouvellement: 15,
  },
};

// Réserve héréditaire (lecture seule — code civil)
const RESERVE_HEREDITAIRE = [
  { enfants: 1, reserve: '1/2', quotiteDisponible: '1/2' },
  { enfants: 2, reserve: '2/3', quotiteDisponible: '1/3' },
  { enfants: '3+', reserve: '3/4', quotiteDisponible: '1/4' },
];

const DROITS_CONJOINT = [
  { situation: 'Sans enfant', droits: 'Pleine propriété ou 1/4 PP + 3/4 usufruit (selon option)' },
  { situation: 'Enfants communs', droits: '1/4 en PP ou usufruit sur totalité (option)' },
  { situation: 'Enfants non communs', droits: '1/4 en PP uniquement' },
];

export default function SettingsDmtgSuccession() {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);

  const [taxSettings, setTaxSettings] = useState(DEFAULT_TAX_SETTINGS);
  const [fiscalitySettings, setFiscalitySettings] = useState(DEFAULT_FISCALITY_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState(null);

  // Chargement des données depuis tax_settings + fiscality_settings
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [taxRes, fiscRes] = await Promise.all([
          supabase.from('tax_settings').select('data').eq('id', 1),
          supabase.from('fiscality_settings').select('data').eq('id', 1),
        ]);

        if (!taxRes.error && taxRes.data?.length > 0 && taxRes.data[0].data) {
          const migratedData = migrateDmtgData(taxRes.data[0].data);
          if (mounted) {
            setTaxSettings((prev) => ({ ...prev, ...migratedData }));
          }
        } else if (taxRes.error && taxRes.error.code !== 'PGRST116') {
          console.error('Erreur chargement tax_settings :', taxRes.error);
        }

        if (!fiscRes.error && fiscRes.data?.length > 0 && fiscRes.data[0].data) {
          if (mounted) {
            setFiscalitySettings((prev) => ({ ...prev, ...fiscRes.data[0].data }));
          }
        } else if (fiscRes.error && fiscRes.error.code !== 'PGRST116') {
          console.error('Erreur chargement fiscality_settings :', fiscRes.error);
        }

        if (mounted) setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // DMTG updater (same pattern as SettingsImpots)
  const updateDmtgCategory = (categoryKey, field, value) => {
    setTaxSettings((prev) => {
      const category = prev.dmtg?.[categoryKey];
      if (!category) return prev;

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

  // Donation updater
  const updateDonation = (path, value) => {
    setTaxSettings((prev) => {
      const donation = { ...DEFAULT_DONATION, ...prev.donation };
      const clone = structuredClone({ ...prev, donation });
      let obj = clone.donation;
      for (let i = 0; i < path.length - 1; i++) {
        if (obj[path[i]] === undefined || obj[path[i]] === null) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
    setMessage('');
  };

  // AV décès updater — preserves existing keys in fiscality_settings
  const updateAvDeces = (path, value) => {
    setFiscalitySettings((prev) => {
      const clone = structuredClone(prev);
      let obj = clone.assuranceVie.deces;
      for (let i = 0; i < path.length - 1; i++) {
        if (obj[path[i]] === undefined || obj[path[i]] === null) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
    setMessage('');
  };

  // Validation
  const dmtgErrors = useMemo(() => validateDmtg(taxSettings.dmtg), [taxSettings.dmtg]);
  const avDecesErrors = useMemo(
    () => validateAvDeces(fiscalitySettings.assuranceVie?.deces),
    [fiscalitySettings.assuranceVie?.deces]
  );
  const hasErrors = !isValid(dmtgErrors, avDecesErrors);

  // Sauvegarde
  const handleSave = async () => {
    if (!isAdmin || hasErrors) return;

    try {
      setSaving(true);
      setMessage('');

      const [taxRes, fiscRes] = await Promise.all([
        supabase.from('tax_settings').upsert({ id: 1, data: taxSettings }),
        supabase.from('fiscality_settings').upsert({ id: 1, data: fiscalitySettings }),
      ]);

      if (taxRes.error || fiscRes.error) {
        console.error(taxRes.error, fiscRes.error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setMessage('Paramètres DMTG & Succession enregistrés.');
        invalidate('tax');
        broadcastInvalidation('tax');
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

  if (loading) {
    return <p>Chargement…</p>;
  }

  const { dmtg } = taxSettings;
  const donation = { ...DEFAULT_DONATION, ...taxSettings.donation };
  const avDeces = fiscalitySettings.assuranceVie?.deces || DEFAULT_FISCALITY_SETTINGS.assuranceVie.deces;

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
      <UserInfoBanner />

      <div className="fisc-accordion">
        {/* 1. DMTG — Barèmes (reuse ImpotsDmtgSection) */}
        <ImpotsDmtgSection
          dmtg={dmtg}
          updateDmtgCategory={updateDmtgCategory}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />
        {/* DMTG validation errors */}
        {openSection === 'dmtg' && Object.keys(dmtgErrors).length > 0 && (
          <div style={{ padding: '0 16px 8px', fontSize: 13 }}>
            {Object.entries(dmtgErrors).map(([key, msg]) => (
              <div key={key} style={{ color: 'var(--color-error-text)', marginBottom: 2 }}>
                {key} : {msg}
              </div>
            ))}
          </div>
        )}

        {/* 2. Donation / rappel fiscal / 790 G */}
        <DonationSection
          donation={donation}
          updateDonation={updateDonation}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        {/* 3. Assurance-vie décès (990 I / 757 B) */}
        <AvDecesSection
          avDeces={avDeces}
          updateAvDeces={updateAvDeces}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
          errors={avDecesErrors}
        />

        {/* 4. Réserve / quotité / droits du conjoint (lecture seule) */}
        <ReserveCivilSection
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        {/* 5. Régimes matrimoniaux & PACS (lecture seule) */}
        <RegimesSection
          openSection={openSection}
          setOpenSection={setOpenSection}
        />
      </div>

      {/* Bouton Enregistrer */}
      {isAdmin && (
        <button
          type="button"
          className="chip settings-save-btn"
          onClick={handleSave}
          disabled={saving || hasErrors}
          title={hasErrors ? 'Corrigez les erreurs avant de sauvegarder' : ''}
        >
          {saving
            ? 'Enregistrement…'
            : hasErrors
              ? 'Erreurs de validation'
              : 'Enregistrer DMTG & Succession'}
        </button>
      )}

      {message && (
        <div className={`settings-feedback-message ${message.includes('Erreur') ? 'settings-feedback-message--error' : 'settings-feedback-message--success'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

// ─── Section Donation ──────────────────────────────────────────────

function DonationSection({ donation, updateDonation, isAdmin, openSection, setOpenSection }) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={openSection === 'donation'}
        onClick={() => setOpenSection(openSection === 'donation' ? null : 'donation')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Donation & rappel fiscal
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'donation' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'donation' && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Paramètres de donation entre vifs et rappel fiscal (CGI art. 784).
          </p>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Rappel fiscal
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row">
                <label>Durée du rappel fiscal</label>
                <input
                  type="number"
                  value={numberOrEmpty(donation.rappelFiscalAnnees)}
                  onChange={(e) =>
                    updateDonation(
                      ['rappelFiscalAnnees'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>ans</span>
              </div>
            </div>
          </div>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Don familial de sommes d'argent (art. 790 G)
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Montant exonéré</label>
                <input
                  type="number"
                  value={numberOrEmpty(donation.donFamilial790G?.montant)}
                  onChange={(e) =>
                    updateDonation(
                      ['donFamilial790G', 'montant'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Conditions</label>
                <input
                  type="text"
                  style={{ width: 280 }}
                  value={donation.donFamilial790G?.conditions || ''}
                  onChange={(e) =>
                    updateDonation(['donFamilial790G', 'conditions'], e.target.value)
                  }
                  disabled={!isAdmin}
                />
                <span />
              </div>
            </div>
          </div>

          <div className="income-tax-block">
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Don manuel
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row">
                <label>Renouvellement abattement tous les</label>
                <input
                  type="number"
                  value={numberOrEmpty(donation.donManuel?.abattementRenouvellement)}
                  onChange={(e) =>
                    updateDonation(
                      ['donManuel', 'abattementRenouvellement'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>ans</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section Assurance-vie décès ───────────────────────────────────

function AvDecesSection({ avDeces, updateAvDeces, isAdmin, openSection, setOpenSection, errors }) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={openSection === 'avDeces'}
        onClick={() => setOpenSection(openSection === 'avDeces' ? null : 'avDeces')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Assurance-vie décès (990 I / 757 B)
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'avDeces' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'avDeces' && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Fiscalité des capitaux décès transmis via l'assurance-vie.
          </p>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Paramètres généraux
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Âge pivot primes (avant/après)</label>
                <input
                  type="number"
                  value={numberOrEmpty(avDeces.agePivotPrimes)}
                  onChange={(e) =>
                    updateAvDeces(
                      ['agePivotPrimes'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>ans</span>
              </div>
              {errors['agePivotPrimes'] && (
                <div style={{ color: 'var(--color-error-text)', fontSize: 12, marginLeft: 8 }}>
                  {errors['agePivotPrimes']}
                </div>
              )}
            </div>
          </div>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Primes versées après le 13/10/1998 — avant {avDeces.agePivotPrimes || 70} ans (art. 990 I)
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Abattement par bénéficiaire</label>
                <input
                  type="number"
                  value={numberOrEmpty(avDeces.primesApres1998?.allowancePerBeneficiary)}
                  onChange={(e) =>
                    updateAvDeces(
                      ['primesApres1998', 'allowancePerBeneficiary'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              {errors['primesApres1998.allowancePerBeneficiary'] && (
                <div style={{ color: 'var(--color-error-text)', fontSize: 12, marginLeft: 8 }}>
                  {errors['primesApres1998.allowancePerBeneficiary']}
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Barème par bénéficiaire</div>
                <SettingsTable
                  columns={[
                    { key: 'upTo', header: 'Jusqu\'à (€ cumulé)' },
                    { key: 'ratePercent', header: 'Taux %', step: '0.1', className: 'taux-col' },
                  ]}
                  rows={avDeces.primesApres1998?.brackets || []}
                  onCellChange={(idx, colKey, value) => {
                    const newBrackets = (avDeces.primesApres1998?.brackets || []).map((b, i) =>
                      i === idx ? { ...b, [colKey]: value } : b
                    );
                    updateAvDeces(['primesApres1998', 'brackets'], newBrackets);
                  }}
                  disabled={!isAdmin}
                />
                {/* Bracket errors */}
                {Object.entries(errors)
                  .filter(([k]) => k.startsWith('primesApres1998.brackets'))
                  .map(([k, msg]) => (
                    <div key={k} style={{ color: 'var(--color-error-text)', fontSize: 12, marginTop: 2 }}>
                      {msg}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="income-tax-block">
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Primes versées après {avDeces.agePivotPrimes || 70} ans (art. 757 B)
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Abattement global (tous bénéficiaires)</label>
                <input
                  type="number"
                  value={numberOrEmpty(avDeces.apres70ans?.globalAllowance)}
                  onChange={(e) =>
                    updateAvDeces(
                      ['apres70ans', 'globalAllowance'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              {errors['apres70ans.globalAllowance'] && (
                <div style={{ color: 'var(--color-error-text)', fontSize: 12, marginLeft: 8 }}>
                  {errors['apres70ans.globalAllowance']}
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--color-c9)', margin: '4px 0 0 0' }}>
                Au-delà : taxation aux DMTG (barème succession).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section Réserve / droits du conjoint (lecture seule) ──────────

function ReserveCivilSection({ openSection, setOpenSection }) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={openSection === 'reserve'}
        onClick={() => setOpenSection(openSection === 'reserve' ? null : 'reserve')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Réserve héréditaire & droits du conjoint
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'reserve' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'reserve' && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Règles du Code civil — lecture seule (non paramétrable).
          </p>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Réserve héréditaire (art. 913 C. civ.)
            </div>
            <table className="settings-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Enfants</th>
                  <th>Réserve</th>
                  <th>Quotité disponible</th>
                </tr>
              </thead>
              <tbody>
                {RESERVE_HEREDITAIRE.map((row) => (
                  <tr key={row.enfants}>
                    <td style={{ textAlign: 'left' }}>{row.enfants}</td>
                    <td>{row.reserve}</td>
                    <td>{row.quotiteDisponible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="income-tax-block">
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Droits du conjoint survivant (art. 757 et s. C. civ.)
            </div>
            <table className="settings-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Situation</th>
                  <th style={{ textAlign: 'left' }}>Droits</th>
                </tr>
              </thead>
              <tbody>
                {DROITS_CONJOINT.map((row) => (
                  <tr key={row.situation}>
                    <td style={{ textAlign: 'left' }}>{row.situation}</td>
                    <td style={{ textAlign: 'left' }}>{row.droits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 12, color: 'var(--color-c9)', margin: '8px 0 0 0' }}>
              Le conjoint survivant est exonéré de droits de succession (loi TEPA 2007).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section Régimes matrimoniaux & PACS (lecture seule) ───────────

function RegimesSection({ openSection, setOpenSection }) {
  const regimes = Object.values(REGIMES_MATRIMONIAUX);

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={openSection === 'regimes'}
        onClick={() => setOpenSection(openSection === 'regimes' ? null : 'regimes')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Régimes matrimoniaux & PACS
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'regimes' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'regimes' && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Référentiel des régimes matrimoniaux — lecture seule.
            Impact sur l'actif successoral dans le simulateur.
          </p>

          {regimes.map((r) => (
            <div
              key={r.id}
              className="income-tax-block"
              style={{ marginBottom: 12 }}
            >
              <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
                {r.label}
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: '0 0 8px 0' }}>
                {r.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <strong style={{ color: 'var(--color-c1)' }}>Avantages</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {r.avantages.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-c9)' }}>Limites</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {r.limites.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          <div className="income-tax-block" style={{ marginTop: 4 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              PACS
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: 0 }}>
              Par défaut : séparation de biens. Option : indivision des acquêts.
              Le partenaire pacsé est exonéré de droits de succession (loi TEPA 2007).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
