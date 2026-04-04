import { useCallback, useState } from 'react';
import { adminClient } from '@/settings/admin/adminClient';
import type { ThemeRecord } from '@/settings/admin/adminClient';

export function useAdminThemes(onError: (msg: string) => void) {
  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeRecord | null>(null);

  const fetchThemes = useCallback(async () => {
    try {
      setThemesLoading(true);
      setThemes(await adminClient.listThemes());
    } catch (err) {
      console.error('[SettingsComptes] fetchThemes error:', err);
    } finally {
      setThemesLoading(false);
    }
  }, []);

  const openThemeModal = (theme: ThemeRecord | null = null) => {
    setEditingTheme(theme);
    setShowThemeModal(true);
  };

  const closeThemeModal = () => {
    setShowThemeModal(false);
    setEditingTheme(null);
  };

  const handleDeleteTheme = async (theme: ThemeRecord) => {
    if (theme.is_system) {
      onError('Les thèmes système ne peuvent pas être supprimés.');
      return;
    }
    if (!confirm(`Supprimer le thème "${theme.name}" ?`)) return;
    try {
      setThemesLoading(true);
      onError('');
      await adminClient.deleteTheme(theme.id);
      void fetchThemes();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setThemesLoading(false);
    }
  };

  return {
    themes,
    themesLoading,
    showThemeModal,
    editingTheme,
    fetchThemes,
    openThemeModal,
    closeThemeModal,
    handleDeleteTheme,
  };
}
