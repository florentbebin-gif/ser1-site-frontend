import type { LegalReferenceId, LegalReferenceVolatility } from '@/domain/legal-references';

export type SettingsReferenceCategory =
  | 'constitution'
  | 'sortie-rachat'
  | 'deces-transmission'
  | 'arret'
  | 'invalidite'
  | 'cotisations'
  | 'maintien-employeur'
  | 'valeur-fiscale'
  | 'regle-civile'
  | 'transverse';

export type SettingsDefaultTable = 'tax_settings' | 'ps_settings' | 'fiscality_settings';

export type SettingsReferenceTarget =
  | {
      kind: 'settings-default';
      table: SettingsDefaultTable;
      path: string;
    }
  | {
      kind: 'pass-history';
      year: number | 'latest';
    }
  | {
      kind: 'base-contrat-rule';
      productId: string;
      audience: 'pp' | 'pm';
      phase: 'constitution' | 'sortie' | 'deces';
      blockKey: string;
    }
  | {
      kind: 'prevoyance-db';
      table: 'prevoyance_regime_settings' | 'prevoyance_maintien_employeur_settings';
      code: string;
      jsonPath: string;
    };

export interface SettingsReferenceBinding {
  pagePath: string;
  sectionKey: string;
  sectionLabel: string;
  category: SettingsReferenceCategory;
  claimKey: string;
  claimLabel: string;
  target: SettingsReferenceTarget;
  refIds: LegalReferenceId[];
  noRefReason?: string;
  relevanceNote?: string;
  verifiedAt: string;
  volatility: LegalReferenceVolatility;
}
