import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUserRole } from '@/auth/useUserRole';
import './styles/impots.css';
import { invalidate, broadcastInvalidation } from '@/utils/cache/fiscalSettingsCache';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { createFieldUpdater } from '@/components/settings/settingsHelpers';

import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import {
  validateImpotsSettings,
  isValid,
} from './validators/dmtgValidators';

import ImpotsBaremeSection from './Impots/ImpotsBaremeSection';
import ImpotsAbattementDomSection from './Impots/ImpotsAbattementDomSection';
import ImpotsPfuSection from './Impots/ImpotsPfuSection';
import ImpotsCehrSection from './Impots/ImpotsCehrSection';
import ImpotsISSection from './Impots/ImpotsISSection';

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

type TaxSettings = DeepFormValue<typeof DEFAULT_TAX_SETTINGS>;
type PsSettings = DeepFormValue<typeof DEFAULT_PS_SETTINGS>;
type IncomeScaleKey = 'scaleCurrent' | 'scalePrevious';
type IncomeScaleRow = TaxSettings['incomeTax']['scaleCurrent'][number];

interface TaxSettingsRow {
  data: Partial<TaxSettings> | null;
}

interface PsSettingsRow {
  data: Partial<PsSettings> | null;
}

function mergeTaxSettings(
  base: TaxSettings,
  nextData: Partial<TaxSettings>,
): TaxSettings {
  return {
    ...base,
    ...nextData,
    incomeTax: {
      ...base.incomeTax,
      ...nextData.incomeTax,
    },
    pfu: {
      current: {
        ...base.pfu.current,
        ...nextData.pfu?.current,
      },
      previous: {
        ...base.pfu.previous,
        ...nextData.pfu?.previous,
      },
    },
    cehr: {
      current: {
        ...base.cehr.current,
        ...nextData.cehr?.current,
      },
      previous: {
        ...base.cehr.previous,
        ...nextData.cehr?.previous,
      },
    },
    cdhr: {
      current: {
        ...base.cdhr.current,
        ...nextData.cdhr?.current,
      },
      previous: {
        ...base.cdhr.previous,
        ...nextData.cdhr?.previous,
      },
    },
    corporateTax: {
      current: {
        ...base.corporateTax.current,
        ...nextData.corporateTax?.current,
      },
      previous: {
        ...base.corporateTax.previous,
        ...nextData.corporateTax?.previous,
      },
    },
    dmtg: nextData.dmtg ?? base.dmtg,
  };
}

export default function SettingsImpots() {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [psSettings, setPsSettings] = useState<PsSettings>(DEFAULT_PS_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [taxRes, psRes] = await Promise.all([
          supabase.from('tax_settings').select('data').eq('id', 1),
          supabase.from('ps_settings').select('data').eq('id', 1),
        ]);

        const typedTaxRes = taxRes as {
          data: TaxSettingsRow[] | null;
          error: { code?: string } | null;
        };
        const typedPsRes = psRes as {
          data: PsSettingsRow[] | null;
          error: { code?: string } | null;
        };

        const taxData = typedTaxRes.data?.[0]?.data;
        if (!typedTaxRes.error && taxData) {
          if (mounted) {
            setSettings((prev) => mergeTaxSettings(prev, taxData as Partial<TaxSettings>));
          }
        } else if (typedTaxRes.error && typedTaxRes.error.code !== 'PGRST116') {
          console.error('Erreur chargement tax_settings :', typedTaxRes.error);
        }

        const psData = typedPsRes.data?.[0]?.data;
        if (!typedPsRes.error && psData) {
          const nextPs = psData;
          if (mounted) {
            setPsSettings((prev) => ({
              ...prev,
              ...nextPs,
              patrimony: {
                current: {
                  ...prev.patrimony.current,
                  ...nextPs.patrimony?.current,
                },
                previous: {
                  ...prev.patrimony.previous,
                  ...nextPs.patrimony?.previous,
                },
              },
            }));
          }
        } else if (typedPsRes.error && typedPsRes.error.code !== 'PGRST116') {
          console.error('Erreur chargement ps_settings :', typedPsRes.error);
        }
      } catch (loadError) {
        console.error(loadError);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const impotsErrors = useMemo(
    () => validateImpotsSettings(settings as Parameters<typeof validateImpotsSettings>[0]),
    [settings],
  );
  const hasErrors = !isValid(impotsErrors);

  const handleSave = async () => {
    if (!isAdmin || hasErrors) return;

    try {
      setSaving(true);
      setMessage('');

      const { data: existingRow, error: existingError } = await supabase
        .from('tax_settings')
        .select('data')
        .eq('id', 1)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error(existingError);
        setMessage("Erreur lors du chargement des paramètres existants.");
        return;
      }

      const existingData = (existingRow?.data as Partial<TaxSettings> | null) ?? {};
      const payload: Partial<TaxSettings> = {
        ...existingData,
        incomeTax: settings.incomeTax,
        pfu: {
          current: { rateIR: settings.pfu.current.rateIR },
          previous: { rateIR: settings.pfu.previous.rateIR },
        },
        cehr: settings.cehr,
        cdhr: settings.cdhr,
        corporateTax: settings.corporateTax,
      };

      const { error } = await supabase
        .from('tax_settings')
        .upsert({ id: 1, data: payload });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setSettings((prev) => mergeTaxSettings(prev, payload));
        setMessage('Paramètres impôts enregistrés.');
        invalidate('tax');
        broadcastInvalidation('tax');
      }
    } catch (saveError) {
      console.error(saveError);
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const setData = setSettings;
  const setDataRecord = (
    updater: (prev: Record<string, unknown>) => Record<string, unknown>,
  ) => {
    setData((prev) => updater(prev as Record<string, unknown>) as TaxSettings);
  };

  const updateIncomeScale = (
    which: IncomeScaleKey,
    index: number,
    key: keyof IncomeScaleRow,
    value: string | number | null,
  ) => {
    setData((prev) => ({
      ...prev,
      incomeTax: {
        ...prev.incomeTax,
        [which]: prev.incomeTax[which].map((row, i) =>
          i === index ? { ...row, [key]: value as IncomeScaleRow[keyof IncomeScaleRow] } : row
        ),
      },
    }));
    setMessage('');
  };

  const updateField = createFieldUpdater(setDataRecord, setMessage);

  if (loading) {
    return <p>Chargement...</p>;
  }

  const { incomeTax, pfu, cehr, cdhr, corporateTax } = settings;

  return (
    <div className="settings-stack settings-stack--offset">
      <UserInfoBanner />

      <div className="fisc-accordion">
        <ImpotsBaremeSection
          incomeTax={incomeTax}
          updateField={updateField}
          updateIncomeScale={updateIncomeScale}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        <ImpotsAbattementDomSection
          incomeTax={incomeTax}
          updateField={updateField}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        <ImpotsPfuSection
          pfu={pfu}
          incomeTax={incomeTax}
          patrimony={psSettings.patrimony}
          updateField={updateField}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        <ImpotsCehrSection
          cehr={cehr}
          cdhr={cdhr}
          incomeTax={incomeTax}
          updateField={updateField}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        <ImpotsISSection
          corporateTax={corporateTax}
          incomeTax={incomeTax}
          updateField={updateField}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />
      </div>

      {hasErrors && (
        <div className="settings-feedback-message settings-feedback-message--error">
          <strong>Erreurs de validation ({Object.keys(impotsErrors).length}) - corrigez avant de sauvegarder :</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 13 }}>
            {Object.entries(impotsErrors).map(([key, msg]) => (
              <li key={key}>{key} : {msg}</li>
            ))}
          </ul>
        </div>
      )}

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
              : 'Enregistrer les paramètres impôts'}
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
