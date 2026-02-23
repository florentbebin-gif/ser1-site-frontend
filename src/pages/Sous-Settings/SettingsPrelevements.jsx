import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUserRole } from '@/auth/useUserRole';
import './SettingsShared.css';
import { invalidate, broadcastInvalidation } from '@/utils/fiscalSettingsCache.js';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { createFieldUpdater } from '@/utils/settingsHelpers.js';
import PassHistoryAccordion from '@/components/settings/PassHistoryAccordion';

import { DEFAULT_PS_SETTINGS } from '@/constants/settingsDefaults';

// Import des sous-composants
import PrelevementsPatrimoineSection from './Prelevements/PrelevementsPatrimoineSection';
import PrelevementsRetraitesSection from './Prelevements/PrelevementsRetraitesSection';
import PrelevementsSeuilsSection from './Prelevements/PrelevementsSeuilsSection';

export default function SettingsPrelevements() {
  const { isAdmin } = useUserRole();
  const [settings, setSettings] = useState(DEFAULT_PS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState(null);

  // ----------------------
  // Chargement initial
  // ----------------------
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        setMessage('');

        if (!mounted) return;

        // Récupérer les paramètres PS (table ps_settings, id = 1)
        const { data: rows, error: psErr } = await supabase
          .from('ps_settings')
          .select('data')
          .eq('id', 1);

        if (!psErr && rows && rows.length > 0 && rows[0].data) {
          setSettings((prev) => ({
            ...prev,
            ...rows[0].data,
          }));
        } else if (psErr && psErr.code !== 'PGRST116') {
          console.error('Erreur chargement ps_settings :', psErr);
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

  // Alias pour compatibilité
  const setData = setSettings;

  // ----------------------
  // Helpers de mise à jour
  // ----------------------
  const updateField = createFieldUpdater(setData, setMessage);

  const updateRetirementBracket = (yearKey, index, key, value) => {
    setData((prev) => {
      const copy = structuredClone(prev);
      copy.retirement[yearKey].brackets[index][key] = value;
      return copy;
    });
    setMessage('');
    setError('');
  };

  // ----------------------
  // Sauvegarde
  // ----------------------
  const handleSave = async () => {
    if (!isAdmin) return;  // on ne fait rien si pas admin

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const { error: saveError } = await supabase
        .from('ps_settings')
        .upsert({
          id: 1,
          data: settings,
        });

      if (saveError) {
        console.error(saveError);
        setError("Erreur lors de l'enregistrement des paramètres.");
        return;
      }

      setMessage('Paramètres de prélèvements sociaux enregistrés.');
      // Invalider le cache pour que /ir et autres pages rafraîchissent
      invalidate('ps');
      broadcastInvalidation('ps');
    } catch (e) {
      console.error(e);
      setError("Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setSaving(false);
    }
  };

  const { labels, patrimony, retirement, retirementThresholds } = settings;

  // ----------------------
  // Rendu
  // ----------------------
  return (
    <div style={{ marginTop: 16 }}>
      {/* Bandeau utilisateur */}
      <UserInfoBanner />

      {/* Messages */}
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
            {/* 0. Historique du PASS */}
            <PassHistoryAccordion
              isOpen={openSection === 'pass'}
              onToggle={() => setOpenSection(openSection === 'pass' ? null : 'pass')}
              isAdmin={isAdmin}
            />

            {/* 1. PS patrimoine / capital */}
            <PrelevementsPatrimoineSection
              labels={labels}
              patrimony={patrimony}
              updateField={updateField}
              isAdmin={isAdmin}
              openSection={openSection}
              setOpenSection={setOpenSection}
            />

            {/* 2. PS retraites */}
            <PrelevementsRetraitesSection
              labels={labels}
              retirement={retirement}
              updateRetirementBracket={updateRetirementBracket}
              isAdmin={isAdmin}
              openSection={openSection}
              setOpenSection={setOpenSection}
            />

            {/* 3. Seuils RFR pour CSG / CRDS / CASA */}
            <PrelevementsSeuilsSection
              labels={labels}
              retirementThresholds={retirementThresholds}
              updateField={updateField}
              isAdmin={isAdmin}
              openSection={openSection}
              setOpenSection={setOpenSection}
            />
          </div>{/* fin fisc-accordion */}

          {/* Bouton de sauvegarde */}
          {isAdmin && (
            <button
              type="button"
              className="chip settings-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? 'Enregistrement…'
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
