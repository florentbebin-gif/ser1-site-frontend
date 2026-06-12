import settingKeys from './settingKeys.json';

export type LegalReferenceId = string;

export type LegalSourceType =
  | 'CGI'
  | 'Code civil'
  | 'Code de commerce'
  | 'Code monétaire et financier'
  | 'Code de la consommation'
  | 'Code du travail'
  | 'Code des assurances'
  | 'Code de la sécurité sociale'
  | 'BOFiP'
  | 'BOSS'
  | 'Service-Public'
  | 'Doctrine professionnelle'
  | 'Autre source officielle';

export type LegalReferenceVolatility = 'annual' | 'lawChange' | 'stable';

export type LegalReferenceSettingKey = keyof typeof settingKeys;

export const LEGAL_REFERENCE_SETTING_KEYS = Object.keys(settingKeys) as LegalReferenceSettingKey[];

export interface LegalReference {
  id: LegalReferenceId;
  label: string;
  sourceType: LegalSourceType;
  officialUrl: string;
  articleOrSection?: string;
  scope: string;
  volatility: LegalReferenceVolatility;
  relatedSimulatorIds?: string[];
  relatedSettings?: LegalReferenceSettingKey[];
  relatedCatalogProducts?: string[];
  lastCheckedAt?: string;
  notes?: string;
}
