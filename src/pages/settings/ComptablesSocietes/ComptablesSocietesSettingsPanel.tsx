import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUserRole } from '@/auth/useUserRole';
import { createFieldUpdater } from '@/components/settings/settingsHelpers';
import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import { broadcastInvalidation, invalidate } from '@/utils/cache/fiscalSettingsCache';
import ComptablesSocietesISSection from './ComptablesSocietesISSection';
import { isValid, validateCorporateTaxSettings } from '../validators/dmtgValidators';

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

interface TaxSettingsRow {
  data: Partial<TaxSettings> | null;
}

function mergeTaxSettings(base: TaxSettings, nextData: Partial<TaxSettings>): TaxSettings {
  return {
    ...base,
    ...nextData,
    incomeTax: {
      ...base.incomeTax,
      ...nextData.incomeTax,
    },
    corporateTax: {
      current: {
        ...base.corporateTax.current,
        ...nextData.corporateTax?.current,
        motherDaughterQpfc: {
          ...base.corporateTax.current.motherDaughterQpfc,
          ...nextData.corporateTax?.current?.motherDaughterQpfc,
        },
      },
      previous: {
        ...base.corporateTax.previous,
        ...nextData.corporateTax?.previous,
        motherDaughterQpfc: {
          ...base.corporateTax.previous.motherDaughterQpfc,
          ...nextData.corporateTax?.previous?.motherDaughterQpfc,
        },
      },
    },
  };
}

export default function ComptablesSocietesSettingsPanel() {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const taxRes = await supabase.from('tax_settings').select('data').eq('id', 1);
        const typedTaxRes = taxRes as {
          data: TaxSettingsRow[] | null;
          error: { code?: string } | null;
        };
        const taxData = typedTaxRes.data?.[0]?.data;

        if (!typedTaxRes.error && taxData) {
          if (mounted) {
            setSettings((prev) => mergeTaxSettings(prev, taxData));
          }
        } else if (typedTaxRes.error && typedTaxRes.error.code !== 'PGRST116') {
          console.error('Erreur chargement tax_settings :', typedTaxRes.error);
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

  const corporateTaxErrors = useMemo(
    () =>
      validateCorporateTaxSettings(
        settings.corporateTax as Parameters<typeof validateCorporateTaxSettings>[0],
      ),
    [settings.corporateTax],
  );
  const hasErrors = !isValid(corporateTaxErrors);

  const setDataRecord = (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
    setSettings((prev) => updater(prev as Record<string, unknown>) as TaxSettings);
  };
  const updateField = createFieldUpdater(setDataRecord, setMessage);

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
        setMessage('Erreur lors du chargement des paramètres existants.');
        return;
      }

      const existingData = (existingRow?.data as Partial<TaxSettings> | null) ?? {};
      const payload: Partial<TaxSettings> = {
        ...existingData,
        corporateTax: settings.corporateTax,
      };

      const { error } = await supabase.from('tax_settings').upsert({ id: 1, data: payload });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setSettings((prev) => mergeTaxSettings(prev, payload));
        setMessage('Paramètres comptables et sociétés enregistrés.');
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

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <div className="settings-stack">
      <div className="fisc-accordion">
        <ComptablesSocietesISSection
          corporateTax={settings.corporateTax}
          incomeTax={settings.incomeTax}
          updateField={updateField}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />
      </div>

      {hasErrors && (
        <div className="settings-feedback-message settings-feedback-message--error">
          <strong>
            Erreurs de validation ({Object.keys(corporateTaxErrors).length}) - corrigez avant de
            sauvegarder :
          </strong>
          <ul className="settings-error-list">
            {Object.entries(corporateTaxErrors).map(([key, msg]) => (
              <li key={key}>
                {key} : {msg}
              </li>
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
              : 'Enregistrer les paramètres comptables et sociétés'}
        </button>
      )}

      {message && (
        <div
          className={`settings-feedback-message ${message.includes('Erreur') ? 'settings-feedback-message--error' : 'settings-feedback-message--success'}`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
