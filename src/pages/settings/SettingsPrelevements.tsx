import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUserRole } from '@/auth/useUserRole';
import './SettingsShared.css';
import { invalidate, broadcastInvalidation } from '@/utils/cache/fiscalSettingsCache';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { createFieldUpdater } from '@/components/settings/settingsHelpers';
import PassHistoryAccordion from '@/components/settings/PassHistoryAccordion';

import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import {
  validatePrelevementsSettings,
  isValid,
} from './validators/dmtgValidators';

import PrelevementsPatrimoineSection from './Prelevements/PrelevementsPatrimoineSection';
import PrelevementsRetraitesSection from './Prelevements/PrelevementsRetraitesSection';
import PrelevementsSeuilsSection from './Prelevements/PrelevementsSeuilsSection';

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

type PsSettings = DeepFormValue<typeof DEFAULT_PS_SETTINGS>;
type RetirementYearKey = keyof PsSettings['retirement'];
type TaxSettings = DeepFormValue<typeof DEFAULT_TAX_SETTINGS>;

interface PsSettingsRow {
  data: Partial<PsSettings> | null;
}

interface TaxSettingsRow {
  data: Partial<TaxSettings> | null;
}

function derivePsYearLabel(irLabel: string | undefined, fallbackLabel: string): string {
  if (!irLabel) return fallbackLabel;
  const match = irLabel.match(/(\d{4}).*revenus\s+(\d{4})/i);
  if (!match) return fallbackLabel;

  const taxYear = Number(match[1]);
  const incomeYear = Number(match[2]);
  if (Number.isNaN(taxYear) || Number.isNaN(incomeYear)) return fallbackLabel;

  return `${taxYear} (RFR ${incomeYear - 1} & Avis IR ${incomeYear})`;
}

export default function SettingsPrelevements() {
  const { isAdmin } = useUserRole();
  const [settings, setSettings] = useState<PsSettings>(DEFAULT_PS_SETTINGS);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        setMessage('');

        if (!mounted) return;

        const [psRes, taxRes] = await Promise.all([
          supabase.from('ps_settings').select('data').eq('id', 1),
          supabase.from('tax_settings').select('data').eq('id', 1),
        ]);

        const { data: psRows, error: psErr } = psRes as {
          data: PsSettingsRow[] | null;
          error: { code?: string } | null;
        };
        const { data: taxRows, error: taxErr } = taxRes as {
          data: TaxSettingsRow[] | null;
          error: { code?: string } | null;
        };

        if (!psErr && psRows && psRows.length > 0 && psRows[0].data) {
          const nextData = psRows[0].data;
          setSettings((prev) => ({
            ...prev,
            ...nextData,
            labels: {
              ...prev.labels,
              ...nextData.labels,
            },
            patrimony: {
              current: {
                ...prev.patrimony.current,
                ...nextData.patrimony?.current,
              },
              previous: {
                ...prev.patrimony.previous,
                ...nextData.patrimony?.previous,
              },
            },
            retirement: {
              current: {
                ...prev.retirement.current,
                ...nextData.retirement?.current,
              },
              previous: {
                ...prev.retirement.previous,
                ...nextData.retirement?.previous,
              },
            },
            retirementThresholds: {
              ...prev.retirementThresholds,
              ...nextData.retirementThresholds,
            },
          }));
        } else if (psErr && psErr.code !== 'PGRST116') {
          console.error('Erreur chargement ps_settings :', psErr);
        }

        const taxData = taxRows?.[0]?.data;
        if (!taxErr && taxData) {
          setTaxSettings((prev) => ({
            ...prev,
            ...taxData,
            incomeTax: {
              ...prev.incomeTax,
              ...taxData.incomeTax,
            },
          }));
        } else if (taxErr && taxErr.code !== 'PGRST116') {
          console.error('Erreur chargement tax_settings :', taxErr);
        }

        if (mounted) setLoading(false);
      } catch (loadError) {
        console.error(loadError);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const setData = setSettings;
  const setDataRecord = (
    updater: (prev: Record<string, unknown>) => Record<string, unknown>,
  ) => {
    setData((prev) => updater(prev as Record<string, unknown>) as PsSettings);
  };

  const updateField = createFieldUpdater(setDataRecord, setMessage);

  const updateRetirementBracket = (
    yearKey: RetirementYearKey,
    index: number,
    key: string,
    value: string | number | null,
  ) => {
    setData((prev) => {
      const copy = structuredClone(prev);
      const bracket = copy.retirement[yearKey].brackets[index] as Record<string, string | number | null>;
      bracket[key] = value;
      return copy;
    });
    setMessage('');
    setError('');
  };

  const psErrors = useMemo(
    () => validatePrelevementsSettings(settings as Parameters<typeof validatePrelevementsSettings>[0]),
    [settings],
  );
  const hasErrors = !isValid(psErrors);

  const effectiveLabels = useMemo(() => ({
    currentYearLabel: derivePsYearLabel(
      taxSettings.incomeTax.currentYearLabel,
      settings.labels.currentYearLabel,
    ),
    previousYearLabel: derivePsYearLabel(
      taxSettings.incomeTax.previousYearLabel,
      settings.labels.previousYearLabel,
    ),
  }), [
    settings.labels.currentYearLabel,
    settings.labels.previousYearLabel,
    taxSettings.incomeTax.currentYearLabel,
    taxSettings.incomeTax.previousYearLabel,
  ]);

  const handleSave = async () => {
    if (!isAdmin || hasErrors) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload: PsSettings = {
        ...settings,
        labels: effectiveLabels,
      };

      const { error: saveError } = await supabase
        .from('ps_settings')
        .upsert({
          id: 1,
          data: payload,
        });

      if (saveError) {
        console.error(saveError);
        setError("Erreur lors de l'enregistrement des paramètres.");
        return;
      }

      setSettings(payload);
      setMessage('Paramètres de prélèvements sociaux enregistrés.');
      invalidate('ps');
      broadcastInvalidation('ps');
    } catch (saveError) {
      console.error(saveError);
      setError("Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setSaving(false);
    }
  };

  const { patrimony, retirement, retirementThresholds } = settings;

  return (
    <div style={{ marginTop: 16 }}>
      <UserInfoBanner />

      {error && (
        <div className="settings-feedback-message settings-feedback-message--error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 24 }}>Chargement des paramètres…</div>
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
            <PassHistoryAccordion
              isOpen={openSection === 'pass'}
              onToggle={() => setOpenSection(openSection === 'pass' ? null : 'pass')}
              isAdmin={isAdmin}
            />

            <PrelevementsPatrimoineSection
              labels={effectiveLabels}
              patrimony={patrimony}
              updateField={updateField}
              isAdmin={isAdmin}
              openSection={openSection}
              setOpenSection={setOpenSection}
            />

            <PrelevementsRetraitesSection
              labels={effectiveLabels}
              retirement={retirement}
              updateRetirementBracket={updateRetirementBracket}
              isAdmin={isAdmin}
              openSection={openSection}
              setOpenSection={setOpenSection}
            />

            <PrelevementsSeuilsSection
              labels={effectiveLabels}
              retirementThresholds={retirementThresholds}
              updateField={updateField}
              isAdmin={isAdmin}
              openSection={openSection}
              setOpenSection={setOpenSection}
            />
          </div>

          {hasErrors && (
            <div className="settings-feedback-message settings-feedback-message--error">
              <strong>Erreurs de validation ({Object.keys(psErrors).length}) - corrigez avant de sauvegarder :</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 13 }}>
                {Object.entries(psErrors).map(([key, msg]) => (
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
                  : 'Enregistrer les paramètres'}
            </button>
          )}

          {message && (
            <div className={`settings-feedback-message ${message.includes('Erreur') ? 'settings-feedback-message--error' : 'settings-feedback-message--success'}`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
