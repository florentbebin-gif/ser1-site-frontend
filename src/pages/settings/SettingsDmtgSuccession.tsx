import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { useUserRole } from '@/auth/useUserRole';
import './SettingsShared.css';
import './SettingsImpots.css';
import { invalidate, broadcastInvalidation } from '@/utils/cache/fiscalSettingsCache';
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

type DeepFormValue<T> = T extends number
  ? number | null
  : T extends string
    ? string
    : T extends boolean
      ? boolean
      : T extends Array<infer U>
        ? DeepFormValue<U>[]
        : T extends object
          ? { [K in keyof T]: DeepFormValue<T[K]> }
          : T;

type DonationSettings = DeepFormValue<typeof DEFAULT_DONATION>;
type TaxSettings = DeepFormValue<typeof DEFAULT_TAX_SETTINGS> & {
  donation?: DonationSettings;
};
type FiscalitySettings = DeepFormValue<typeof DEFAULT_FISCALITY_SETTINGS>;
type DmtgCategoryKey = keyof TaxSettings['dmtg'];
type DmtgScaleRow = TaxSettings['dmtg']['ligneDirecte']['scale'][number];
type DmtgScaleUpdate = {
  idx: number;
  key: string;
  value: string | number | null;
};
type DonationUpdateValue = string | number | null;
type AvDecesBracket = {
  upTo: number | null;
  ratePercent: number | null;
};
type AvDecesUpdateValue = number | null | AvDecesBracket[];
type NestedRecord = Record<string, unknown>;
type MigrateDmtgInput = Parameters<typeof migrateDmtgData>[0];
type MigrateDmtgOutput = Partial<TaxSettings> | null | undefined;

interface SettingsRow<T> {
  data: Partial<T> | null;
}

export default function SettingsDmtgSuccession() {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [fiscalitySettings, setFiscalitySettings] = useState<FiscalitySettings>(DEFAULT_FISCALITY_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [taxResRaw, fiscResRaw] = await Promise.all([
          supabase.from('tax_settings').select('data').eq('id', 1),
          supabase.from('fiscality_settings').select('data').eq('id', 1),
        ]);
        const taxRes = taxResRaw as {
          data: SettingsRow<TaxSettings>[] | null;
          error: { code?: string } | null;
        };
        const fiscRes = fiscResRaw as {
          data: SettingsRow<FiscalitySettings>[] | null;
          error: { code?: string } | null;
        };

        if (!taxRes.error && taxRes.data && taxRes.data.length > 0 && taxRes.data[0].data) {
          const migratedData = migrateDmtgData(
            taxRes.data[0].data as MigrateDmtgInput,
          ) as MigrateDmtgOutput;
          if (mounted && migratedData) {
            setTaxSettings((prev) => ({ ...prev, ...migratedData }));
          }
        } else if (taxRes.error && taxRes.error.code !== 'PGRST116') {
          console.error('Erreur chargement tax_settings :', taxRes.error);
        }

        if (!fiscRes.error && fiscRes.data && fiscRes.data.length > 0 && fiscRes.data[0].data) {
          const fiscalityData = fiscRes.data[0].data;
          if (mounted) {
            setFiscalitySettings((prev) => ({ ...prev, ...fiscalityData }));
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

  const updateDmtgCategory = (
    categoryKey: DmtgCategoryKey,
    field: 'abattement' | 'scale',
    value: number | null | DmtgScaleUpdate,
  ) => {
    setTaxSettings((prev) => {
      const category = prev.dmtg?.[categoryKey];
      if (!category) return prev;

      if (field === 'scale' && typeof value === 'object' && value !== null && 'idx' in value) {
        const { idx, key, value: cellValue } = value;
        return {
          ...prev,
          dmtg: {
            ...prev.dmtg,
            [categoryKey]: {
              ...category,
              scale: category.scale.map((row, i) =>
                i === idx ? { ...row, [key]: cellValue as DmtgScaleRow[keyof DmtgScaleRow] } : row
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

  const updateDonation = (path: string[], value: DonationUpdateValue) => {
    setTaxSettings((prev) => {
      const donation = { ...DEFAULT_DONATION, ...prev.donation };
      const clone = structuredClone({ ...prev, donation });
      let obj = clone.donation as NestedRecord;
      for (let i = 0; i < path.length - 1; i += 1) {
        const key = path[i];
        if (obj[key] === undefined || obj[key] === null) obj[key] = {};
        obj = obj[key] as NestedRecord;
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
    setMessage('');
  };

  const updateAvDeces = (path: string[], value: AvDecesUpdateValue) => {
    setFiscalitySettings((prev) => {
      const clone = structuredClone(prev);
      let obj = clone.assuranceVie.deces as NestedRecord;
      for (let i = 0; i < path.length - 1; i += 1) {
        const key = path[i];
        if (obj[key] === undefined || obj[key] === null) obj[key] = {};
        obj = obj[key] as NestedRecord;
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

      const [existingTaxRes, existingFiscRes] = await Promise.all([
        supabase.from('tax_settings').select('data').eq('id', 1).maybeSingle(),
        supabase.from('fiscality_settings').select('data').eq('id', 1).maybeSingle(),
      ]);

      if ((existingTaxRes.error && existingTaxRes.error.code !== 'PGRST116')
        || (existingFiscRes.error && existingFiscRes.error.code !== 'PGRST116')) {
        console.error(existingTaxRes.error, existingFiscRes.error);
        setMessage("Erreur lors du chargement des paramètres existants.");
        return;
      }

      const existingTaxData = (existingTaxRes.data?.data as Partial<TaxSettings> | null) ?? {};
      const existingFiscData = (existingFiscRes.data?.data as Partial<FiscalitySettings> | null) ?? {};

      const taxPayload: Partial<TaxSettings> = {
        ...existingTaxData,
        dmtg: taxSettings.dmtg,
        donation: taxSettings.donation,
      };
      const fiscalityPayload: Partial<FiscalitySettings> = {
        ...existingFiscData,
        assuranceVie: {
          ...existingFiscData.assuranceVie,
          ...fiscalitySettings.assuranceVie,
          deces: fiscalitySettings.assuranceVie.deces,
        },
      };

      const [taxRes, fiscRes] = await Promise.all([
        supabase.from('tax_settings').upsert({ id: 1, data: taxPayload }),
        supabase.from('fiscality_settings').upsert({ id: 1, data: fiscalityPayload }),
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

