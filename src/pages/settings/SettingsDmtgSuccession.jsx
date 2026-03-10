import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { useUserRole } from '@/auth/useUserRole';
import './SettingsShared.css';
import './SettingsImpots.css';
import { invalidate, broadcastInvalidation } from '@/utils/fiscalSettingsCache';
import { UserInfoBanner } from '@/components/UserInfoBanner';

import { DEFAULT_TAX_SETTINGS, DEFAULT_FISCALITY_SETTINGS } from '@/constants/settingsDefaults';

import ImpotsDmtgSection from './Impots/ImpotsDmtgSection';
import {
  validateDmtg,
  validateAvDeces,
  isValid,
} from './validators/dmtgValidators';
import { DEFAULT_DONATION } from './DmtgSuccession/dmtgReferenceData';
import { migrateDmtgData } from './DmtgSuccession/migrateDmtgData';
import DonationSection from './DmtgSuccession/DonationSection';
import AvDecesSection from './DmtgSuccession/AvDecesSection';
import ReserveCivilSection from './DmtgSuccession/ReserveCivilSection';
import RegimesSection from './DmtgSuccession/RegimesSection';
import LiberalitesSection from './DmtgSuccession/LiberalitesSection';
import AvantagesMatrimoniauxSection from './DmtgSuccession/AvantagesMatrimoniauxSection';

export default function SettingsDmtgSuccession() {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [taxSettings, setTaxSettings] = useState(DEFAULT_TAX_SETTINGS);
  const [fiscalitySettings, setFiscalitySettings] = useState(DEFAULT_FISCALITY_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState(null);

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
    return () => {
      mounted = false;
    };
  }, []);

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

  const updateDonation = (path, value) => {
    setTaxSettings((prev) => {
      const donation = { ...DEFAULT_DONATION, ...prev.donation };
      const clone = structuredClone({ ...prev, donation });
      let obj = clone.donation;
      for (let i = 0; i < path.length - 1; i += 1) {
        if (obj[path[i]] === undefined || obj[path[i]] === null) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
    setMessage('');
  };

  const updateAvDeces = (path, value) => {
    setFiscalitySettings((prev) => {
      const clone = structuredClone(prev);
      let obj = clone.assuranceVie.deces;
      for (let i = 0; i < path.length - 1; i += 1) {
        if (obj[path[i]] === undefined || obj[path[i]] === null) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
    setMessage('');
  };

  const dmtgErrors = useMemo(() => validateDmtg(taxSettings.dmtg), [taxSettings.dmtg]);
  const avDecesErrors = useMemo(
    () => validateAvDeces(fiscalitySettings.assuranceVie?.deces),
    [fiscalitySettings.assuranceVie?.deces]
  );
  const hasErrors = !isValid(dmtgErrors, avDecesErrors);

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
        <ImpotsDmtgSection
          dmtg={dmtg}
          updateDmtgCategory={updateDmtgCategory}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />
        {openSection === 'dmtg' && Object.keys(dmtgErrors).length > 0 && (
          <div style={{ padding: '0 16px 8px', fontSize: 13 }}>
            {Object.entries(dmtgErrors).map(([key, msg]) => (
              <div key={key} style={{ color: 'var(--color-error-text)', marginBottom: 2 }}>
                {key} : {msg}
              </div>
            ))}
          </div>
        )}

        <DonationSection
          donation={donation}
          updateDonation={updateDonation}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        <AvDecesSection
          avDeces={avDeces}
          updateAvDeces={updateAvDeces}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
          errors={avDecesErrors}
        />

        <ReserveCivilSection
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        <RegimesSection
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        <LiberalitesSection
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        <AvantagesMatrimoniauxSection
          openSection={openSection}
          setOpenSection={setOpenSection}
        />
      </div>

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
