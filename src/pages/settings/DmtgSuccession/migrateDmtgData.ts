import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';

type DmtgSettings = typeof DEFAULT_TAX_SETTINGS.dmtg;
type LegacyDmtgSettings = DmtgSettings & {
  abattementLigneDirecte?: number;
  scale?: DmtgSettings['ligneDirecte']['scale'];
};

interface DmtgDataRecord extends Record<string, unknown> {
  dmtg?: LegacyDmtgSettings;
}

export function migrateDmtgData(
  data: DmtgDataRecord | null | undefined,
): DmtgDataRecord | null | undefined {
  if (!data?.dmtg) return data;

  const hasOldStructure = data.dmtg.abattementLigneDirecte !== undefined;
  const hasNewStructure = data.dmtg.ligneDirecte !== undefined;

  if (hasOldStructure && !hasNewStructure) {
    return {
      ...data,
      dmtg: {
        ligneDirecte: {
          abattement:
            data.dmtg.abattementLigneDirecte ?? DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.abattement,
          scale: data.dmtg.scale ?? DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale,
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
