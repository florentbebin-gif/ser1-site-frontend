export type LegalReferenceId = string;

export type LegalSourceType =
  | 'CGI'
  | 'Code civil'
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

export type LegalReferenceSettingKey = 'dmtg';

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
