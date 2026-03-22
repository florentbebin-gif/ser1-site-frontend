import { useCallback, useState } from 'react';
import { adminClient } from '@/settings/admin/adminClient';
import type { CabinetRecord } from '@/settings/admin/adminClient';

export function useAdminCabinets(onError: (msg: string) => void) {
  const [cabinets, setCabinets] = useState<CabinetRecord[]>([]);
  const [cabinetsLoading, setCabinetsLoading] = useState(false);
  const [showCabinetModal, setShowCabinetModal] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<CabinetRecord | null>(null);

  const fetchCabinets = useCallback(async () => {
    try {
      setCabinetsLoading(true);
      setCabinets(await adminClient.listCabinets());
    } catch (err) {
      console.error('[SettingsComptes] fetchCabinets error:', err);
    } finally {
      setCabinetsLoading(false);
    }
  }, []);

  const openCabinetModal = (cabinet: CabinetRecord | null = null) => {
    setEditingCabinet(cabinet);
    setShowCabinetModal(true);
  };

  const closeCabinetModal = () => {
    setShowCabinetModal(false);
    setEditingCabinet(null);
  };

  const handleDeleteCabinet = async (cabinet: CabinetRecord) => {
    if (!confirm(`Supprimer le cabinet "${cabinet.name}" ?`)) return;
    try {
      setCabinetsLoading(true);
      onError('');
      await adminClient.deleteCabinet(cabinet.id);
      void fetchCabinets();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setCabinetsLoading(false);
    }
  };

  return {
    cabinets,
    cabinetsLoading,
    showCabinetModal,
    editingCabinet,
    fetchCabinets,
    openCabinetModal,
    closeCabinetModal,
    handleDeleteCabinet,
  };
}
