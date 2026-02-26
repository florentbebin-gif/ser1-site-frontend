import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUserRole } from '@/auth/useUserRole';
import './SettingsShared.css';
import './SettingsImpots.css';
import { invalidate, broadcastInvalidation } from '@/utils/fiscalSettingsCache.js';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { createFieldUpdater } from '@/utils/settingsHelpers.js';

import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';

// Import des sous-composants
import ImpotsBaremeSection from './Impots/ImpotsBaremeSection';
import ImpotsAbattementDomSection from './Impots/ImpotsAbattementDomSection';
import ImpotsPfuSection from './Impots/ImpotsPfuSection';
import ImpotsCehrSection from './Impots/ImpotsCehrSection';
import ImpotsISSection from './Impots/ImpotsISSection';
import ImpotsDmtgSection from './Impots/ImpotsDmtgSection';

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
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(DEFAULT_TAX_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openSection, setOpenSection] = useState(null);

  // Chargement user + paramètres depuis la table tax_settings
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (!mounted) return;

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

  // Auth check handled by PrivateRoute / SettingsShell

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
        <ImpotsBaremeSection
          incomeTax={incomeTax}
          updateField={updateField}
          updateIncomeScale={updateIncomeScale}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        {/* Abattement DOM sur l'IR (barème) */}
        <ImpotsAbattementDomSection
          incomeTax={incomeTax}
          updateField={updateField}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        {/* 2. PFU */}
        <ImpotsPfuSection
          pfu={pfu}
          incomeTax={incomeTax}
          updateField={updateField}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        {/* 3. CEHR / CDHR */}
        <ImpotsCehrSection
          cehr={cehr}
          cdhr={cdhr}
          incomeTax={incomeTax}
          updateField={updateField}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        {/* 4. Impôt sur les sociétés */}
        <ImpotsISSection
          corporateTax={corporateTax}
          incomeTax={incomeTax}
          updateField={updateField}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        {/* Section DMTG - Droits de Mutation à Titre Gratuit */}
        <ImpotsDmtgSection
          dmtg={dmtg}
          updateDmtgCategory={updateDmtgCategory}
          isAdmin={isAdmin}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />
      </div>{/* fin fisc-accordion */}

      {/* Bouton Enregistrer */}
      {isAdmin && (
        <button
          type="button"
          className="chip settings-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? 'Enregistrement…'
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
