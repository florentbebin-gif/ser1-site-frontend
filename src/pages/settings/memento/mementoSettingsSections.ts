import type { SettingsReferenceBinding } from '@/domain/settings-references';
import type { SettingRegistryKey } from '@/domain/settings-registry';

export const MEMENTO_SETTINGS_TARGET_PATH = '/settings/memento' as const;

export type MementoSettingsSectionId =
  | 'impots'
  | 'comptables-societes'
  | 'prelevements'
  | 'dmtg-succession'
  | 'base-contrat'
  | 'prevoyance-regimes';

export type MementoSettingsDataSource =
  | 'tax_settings'
  | 'ps_settings'
  | 'fiscality_settings'
  | 'pass_history'
  | 'base_contrat_catalog'
  | 'base_contrat_overrides'
  | 'prevoyance_regime_settings'
  | 'prevoyance_maintien_employeur_settings';

export interface MementoSettingsSection {
  id: MementoSettingsSectionId;
  label: string;
  targetPagePath: typeof MEMENTO_SETTINGS_TARGET_PATH;
  targetSectionKey: MementoSettingsSectionId;
  sourceSectionKeys: readonly string[];
  readSources: readonly MementoSettingsDataSource[];
  writeSources: readonly MementoSettingsDataSource[];
  expectedSettingsReferenceClaims: number;
  shortDescription: string;
  registrySettingKeys: readonly SettingRegistryKey[];
}

export const MEMENTO_SETTINGS_SECTIONS = [
  {
    id: 'impots',
    label: 'Fiscalité du foyer',
    targetPagePath: MEMENTO_SETTINGS_TARGET_PATH,
    targetSectionKey: 'impots',
    sourceSectionKeys: ['income-tax', 'pfu', 'cehr', 'cdhr', 'ifi'],
    readSources: ['tax_settings', 'ps_settings'],
    writeSources: ['tax_settings'],
    expectedSettingsReferenceClaims: 10,
    shortDescription:
      'Barème IR, PFU, contributions haut revenu, IFI et repères immobiliers centralisés.',
    registrySettingKeys: [
      'impots.ir.bareme',
      'impots.ir.abattements-et-decote',
      'impots.pfu.part-ir',
      'impots.cehr',
      'impots.cdhr',
      'impots.ifi.bareme',
      'impots.ifi.millesimes',
      'immobilier.pv-immobilieres.abattements-duree',
      'immobilier.revenus-fonciers.micro-foncier',
      'immobilier.lmnp-lmp.regimes',
      'immobilier.scpi.regime',
    ],
  },
  {
    id: 'comptables-societes',
    label: 'Comptables et sociétés',
    targetPagePath: MEMENTO_SETTINGS_TARGET_PATH,
    targetSectionKey: 'comptables-societes',
    sourceSectionKeys: ['corporate-tax'],
    readSources: ['tax_settings'],
    writeSources: ['tax_settings'],
    expectedSettingsReferenceClaims: 1,
    shortDescription:
      'Impôt sur les sociétés et repères société qui alimentent les scénarios dirigeants.',
    registrySettingKeys: [
      'comptables-societes.is',
      'comptables-societes.mere-fille-qpfc',
      'comptables-societes.pv-mobilieres',
      'comptables-societes.dividendes',
      'comptables-societes.holding-apport-cession',
    ],
  },
  {
    id: 'prelevements',
    label: 'Prélèvements sociaux',
    targetPagePath: MEMENTO_SETTINGS_TARGET_PATH,
    targetSectionKey: 'prelevements',
    sourceSectionKeys: [
      'patrimony',
      'retirement-thresholds',
      'pass',
      'social-dirigeant',
      'retirement',
    ],
    readSources: ['ps_settings', 'tax_settings', 'pass_history'],
    writeSources: ['ps_settings', 'pass_history'],
    expectedSettingsReferenceClaims: 5,
    shortDescription: 'Prélèvements sociaux, PASS, retraite et charges sociales dirigeant.',
    registrySettingKeys: [
      'impots.ps-patrimoine',
      'retraite-prevoyance.ps-retraite',
      'retraite-prevoyance.seuils-rfr',
      'retraite-prevoyance.pass',
      'placements.per-individuel',
      'social-dirigeant.charges-sociales',
      'retraite-prevoyance.cotisations-retraite',
      'retraite-prevoyance.validation-retraite-600-smic',
      'social-dirigeant.puma-csm',
      'placements.epargne-salariale',
    ],
  },
  {
    id: 'dmtg-succession',
    label: 'Transmission, DMTG et succession',
    targetPagePath: MEMENTO_SETTINGS_TARGET_PATH,
    targetSectionKey: 'dmtg-succession',
    sourceSectionKeys: ['donations', 'droits-mutation', 'assurance-vie-deces', 'liberalites'],
    readSources: ['tax_settings', 'fiscality_settings'],
    writeSources: ['tax_settings', 'fiscality_settings'],
    expectedSettingsReferenceClaims: 7,
    shortDescription: 'DMTG, donations, assurance-vie décès et règles civiles de transmission.',
    registrySettingKeys: [
      'transmission.dmtg-succession',
      'transmission.assurance-vie-deces',
      'placements.assurance-vie-capitalisation',
      'transmission.dutreil',
    ],
  },
  {
    id: 'base-contrat',
    label: 'Référentiel contrats',
    targetPagePath: MEMENTO_SETTINGS_TARGET_PATH,
    targetSectionKey: 'base-contrat',
    sourceSectionKeys: [
      'assurance-epargne',
      'assurance-prevoyance',
      'epargne-assurance',
      'epargne-bancaire',
      'retraite-et-epargne-salariale',
      'dispositifs-fiscaux-immobilier',
      'immobilier-direct',
      'immobilier-indirect',
      'valeurs-mobilieres',
      'non-cote-pe',
      'creances-droits',
      'autres',
    ],
    readSources: ['base_contrat_catalog', 'base_contrat_overrides'],
    writeSources: ['base_contrat_overrides'],
    expectedSettingsReferenceClaims: 352,
    shortDescription: 'Catalogue patrimonial et overrides administrés à la demande.',
    registrySettingKeys: [],
  },
  {
    id: 'prevoyance-regimes',
    label: 'Prévoyance et régimes',
    targetPagePath: MEMENTO_SETTINGS_TARGET_PATH,
    targetSectionKey: 'prevoyance-regimes',
    sourceSectionKeys: [
      'maintien-employeur',
      'regime-salarie-cpam',
      'regime-salarie-msa',
      'regime-ssi-artisan-commercant',
      'regime-cnavpl',
      'regime-cipav',
      'regime-carpimko',
      'regime-carmf',
      'regime-carcdsf-dentiste',
      'regime-carcdsf-sagefemme',
      'regime-cavp',
      'regime-carpv',
      'regime-cavec',
      'regime-cprn',
      'regime-cavom',
      'regime-cavamac',
      'regime-cnbf',
      'regime-msa-exploitant',
    ],
    readSources: ['prevoyance_regime_settings', 'prevoyance_maintien_employeur_settings'],
    writeSources: ['prevoyance_regime_settings', 'prevoyance_maintien_employeur_settings'],
    expectedSettingsReferenceClaims: 69,
    shortDescription: 'Régimes obligatoires, maintien employeur et garanties prévoyance.',
    registrySettingKeys: ['retraite-prevoyance.prevoyance-garanties'],
  },
] as const satisfies readonly MementoSettingsSection[];

export function getMementoSettingsSection(id: MementoSettingsSectionId): MementoSettingsSection {
  const section = MEMENTO_SETTINGS_SECTIONS.find((candidate) => candidate.id === id);
  if (!section) {
    throw new Error(`Section settings mémento inconnue : ${id}`);
  }
  return section;
}

export function bindingMatchesMementoSettingsSection(
  binding: SettingsReferenceBinding,
  section: MementoSettingsSection,
): boolean {
  return (
    binding.pagePath === section.targetPagePath &&
    (binding.sectionKey === section.targetSectionKey ||
      section.sourceSectionKeys.includes(binding.sectionKey))
  );
}
