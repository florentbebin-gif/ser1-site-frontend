export {
  LEGAL_REFERENCE_BY_ID,
  LEGAL_REFERENCES,
  getLegalReference,
  getOptionalLegalReference,
  listLegalReferencesForProduct,
  listLegalReferencesForSetting,
  listLegalReferencesForSimulator,
} from './references';
export { OFFICIAL_LEGAL_REFERENCE_DOMAINS, isOfficialUrl } from './officialUrls';
export type {
  LegalReference,
  LegalReferenceId,
  LegalReferenceSettingKey,
  LegalReferenceVolatility,
  LegalSourceType,
} from './types';
