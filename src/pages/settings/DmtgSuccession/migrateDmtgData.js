import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';

export function migrateDmtgData(data) {
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
