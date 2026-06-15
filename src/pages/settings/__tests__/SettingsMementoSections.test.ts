import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import { listSettingsForOwnerPage } from '@/domain/settings-registry';
import {
  getActiveSettingsKey,
  getVisibleSettingsRoutes,
  isDeclaredSettingsPath,
  SETTINGS_ROUTES,
} from '@/routes/settingsRoutes';

import {
  bindingMatchesMementoSettingsSection,
  getMementoSettingsSection,
  MEMENTO_SETTINGS_SECTIONS,
  MEMENTO_SETTINGS_TARGET_PATH,
} from '../memento/mementoSettingsSections';
import {
  MEMENTO_AUDIT_SETTINGS_SECTION_IDS_BY_CHAPTER,
  MEMENTO_READ_SETTINGS_SECTION_IDS_BY_CHAPTER,
  MEMENTO_VALUE_PANEL_BY_SECTION,
} from '../memento/mementoValueSections';
import {
  readChapterWrapperForChapter,
  readChapterWrappersForChapter,
  readEntrySectionForKey,
  readEntrySectionsForKey,
} from '../memento/mementoEntrySections';

describe('route settings mémento', () => {
  it('expose l’onglet mémento à tous les utilisateurs', () => {
    const route = SETTINGS_ROUTES.find((entry) => entry.key === 'memento');
    const generalIndex = SETTINGS_ROUTES.findIndex((entry) => entry.key === 'general');
    const mementoIndex = SETTINGS_ROUTES.findIndex((entry) => entry.key === 'memento');

    expect(route).toMatchObject({
      label: 'Mémento',
      path: 'memento',
      urlPath: '/settings/memento',
    });
    expect(route?.adminOnly).toBeUndefined();
    expect(mementoIndex).toBe(generalIndex + 1);
    expect(getVisibleSettingsRoutes(false).some((entry) => entry.key === 'memento')).toBe(true);
    expect(isDeclaredSettingsPath('/settings/memento-old')).toBe(false);
    expect(getActiveSettingsKey('/settings/section-inconnue')).toBe('memento');
    expect(isDeclaredSettingsPath('/settings/section-inconnue')).toBe(false);
  });
});

describe('contrat des sections settings du mémento', () => {
  const routePaths = SETTINGS_ROUTES.map((route) => route.urlPath);

  it('déclare les six sections settings intégrées dans /settings/memento', () => {
    const targetSectionKeys = MEMENTO_SETTINGS_SECTIONS.map((section) => section.targetSectionKey);

    expect(MEMENTO_SETTINGS_SECTIONS.map((section) => section.id)).toEqual([
      'impots',
      'comptables-societes',
      'prelevements',
      'dmtg-succession',
      'base-contrat',
      'prevoyance-regimes',
    ]);
    expect(new Set(MEMENTO_SETTINGS_SECTIONS.map((section) => section.targetPagePath))).toEqual(
      new Set([MEMENTO_SETTINGS_TARGET_PATH]),
    );
    expect(new Set(targetSectionKeys).size).toBe(targetSectionKeys.length);
  });

  it('conserve /settings/memento comme route settings fiscal/social unique', () => {
    expect(routePaths).toContain(MEMENTO_SETTINGS_TARGET_PATH);
    expect(routePaths).toContain('/settings/base-contrat-retraite');
  });

  it('verrouille les sources de lecture et d’écriture par domaine migré', () => {
    expect(getMementoSettingsSection('impots')).toMatchObject({
      readSources: ['tax_settings', 'ps_settings'],
      writeSources: ['tax_settings'],
    });
    expect(getMementoSettingsSection('comptables-societes')).toMatchObject({
      readSources: ['tax_settings'],
      writeSources: ['tax_settings'],
    });
    expect(getMementoSettingsSection('prelevements')).toMatchObject({
      readSources: ['ps_settings', 'tax_settings', 'pass_history'],
      writeSources: ['ps_settings', 'pass_history'],
    });
    expect(getMementoSettingsSection('dmtg-succession')).toMatchObject({
      readSources: ['tax_settings', 'fiscality_settings'],
      writeSources: ['tax_settings', 'fiscality_settings'],
    });
    expect(getMementoSettingsSection('base-contrat')).toMatchObject({
      readSources: ['base_contrat_catalog', 'base_contrat_overrides'],
      writeSources: ['base_contrat_overrides'],
    });
    expect(getMementoSettingsSection('prevoyance-regimes')).toMatchObject({
      readSources: ['prevoyance_regime_settings', 'prevoyance_maintien_employeur_settings'],
      writeSources: ['prevoyance_regime_settings', 'prevoyance_maintien_employeur_settings'],
    });
  });

  it('compte les claims settings-references sans perte', () => {
    for (const section of MEMENTO_SETTINGS_SECTIONS) {
      const count = SETTINGS_REFERENCE_CHAIN.filter((binding) =>
        bindingMatchesMementoSettingsSection(binding, section),
      ).length;

      expect(count, section.id).toBe(section.expectedSettingsReferenceClaims);
    }
  });

  it('couvre chaque entrée registry mémento dans une seule section audit', () => {
    const registryEntries = listSettingsForOwnerPage('/settings/memento');
    const sectionByKey = new Map<string, string[]>();

    for (const section of MEMENTO_SETTINGS_SECTIONS) {
      for (const key of section.registrySettingKeys) {
        sectionByKey.set(key, [...(sectionByKey.get(key) ?? []), section.id]);
      }
    }

    expect(registryEntries).toHaveLength(31);
    for (const entry of registryEntries) {
      expect(sectionByKey.get(entry.key), entry.key).toHaveLength(1);
    }
    expect(sectionByKey.get('impots.ps-patrimoine')).toEqual(['prelevements']);
  });

  it('rattache les valeurs de lecture aux bons chapitres sans blocs monolithiques migrés', () => {
    expect(MEMENTO_READ_SETTINGS_SECTION_IDS_BY_CHAPTER['fiscalite-foyer']).toBeUndefined();
    expect(MEMENTO_READ_SETTINGS_SECTION_IDS_BY_CHAPTER.societe).toBeUndefined();
    expect(MEMENTO_READ_SETTINGS_SECTION_IDS_BY_CHAPTER.placements).toBeUndefined();
    expect(MEMENTO_READ_SETTINGS_SECTION_IDS_BY_CHAPTER.retraite).toBeUndefined();
    expect(MEMENTO_READ_SETTINGS_SECTION_IDS_BY_CHAPTER.transmission).toBeUndefined();
    expect(MEMENTO_READ_SETTINGS_SECTION_IDS_BY_CHAPTER.prevoyance).toBeUndefined();
    expect(MEMENTO_AUDIT_SETTINGS_SECTION_IDS_BY_CHAPTER.transmission).toEqual(['dmtg-succession']);
    expect(MEMENTO_AUDIT_SETTINGS_SECTION_IDS_BY_CHAPTER.prevoyance).toEqual([
      'prevoyance-regimes',
      'base-contrat',
    ]);
    expect(MEMENTO_VALUE_PANEL_BY_SECTION.impots).toBeUndefined();
    expect(MEMENTO_VALUE_PANEL_BY_SECTION.prelevements).toBeUndefined();
    expect(MEMENTO_VALUE_PANEL_BY_SECTION['dmtg-succession']).toBeUndefined();
    expect(MEMENTO_VALUE_PANEL_BY_SECTION['prevoyance-regimes']).toBeUndefined();
  });

  it('rattache les sections DMTG aux entrées de lecture ciblées', () => {
    expect(readChapterWrapperForChapter('transmission')).toBeDefined();
    expect(readEntrySectionForKey('transmission.succession-dmtg')).toBeDefined();
    expect(readEntrySectionForKey('transmission.donations-anterieures')).toBeDefined();
    expect(readEntrySectionForKey('transmission.assurance-vie-deces')).toBeDefined();
    expect(readEntrySectionForKey('transmission.liberalites')).toBeDefined();
    expect(readEntrySectionForKey('civil.reserve-quotite')).toBeDefined();
    expect(readEntrySectionForKey('civil.devolution-conjoint-survivant')).toBeDefined();
    expect(readEntrySectionForKey('civil.regime-matrimonial')).toBeDefined();
    expect(readEntrySectionForKey('placements.revenus-capitaux')).toBeUndefined();
  });

  it('rattache les sections Comptables et sociétés aux entrées de lecture ciblées', () => {
    expect(readChapterWrapperForChapter('societe')).toBeDefined();
    expect(readChapterWrapperForChapter('dirigeant')).toBeDefined();
    expect(readEntrySectionForKey('societe.is')).toBeDefined();
    expect(readEntrySectionForKey('societe.groupe-mere-fille-qpfc')).toBeDefined();
    expect(readEntrySectionForKey('societe.compte-courant-associe')).toBeDefined();
    expect(readEntrySectionForKey('dirigeant.dividendes-tns')).toBeDefined();
  });

  it('rattache les sections Impôts aux entrées de lecture ciblées', () => {
    expect(readChapterWrapperForChapter('fiscalite-foyer')).toBeDefined();
    expect(readEntrySectionForKey('fiscalite-foyer.ir')).toBeDefined();
    expect(readEntrySectionForKey('fiscalite-foyer.ifi')).toBeDefined();
  });

  it('rattache les sections Prélèvements aux entrées ciblées sans double panneau', () => {
    expect(readChapterWrapperForChapter('placements')).toBeDefined();
    expect(readChapterWrapperForChapter('retraite')).toBeDefined();
    expect(readChapterWrappersForChapter('dirigeant')).toHaveLength(2);
    expect(readEntrySectionForKey('placements.ps-pfu-revenus-capital')).toBeDefined();
    expect(readEntrySectionForKey('retraite.globale')).toBeDefined();
    expect(readEntrySectionsForKey('dirigeant.dividendes-tns')).toHaveLength(2);
    expect(readEntrySectionForKey('dirigeant.charges-sociales-tns')).toBeDefined();
    expect(readEntrySectionForKey('dirigeant.puma-csm')).toBeUndefined();
  });

  it('rattache les sections Prévoyance aux entrées ciblées sans panneau monolithique', () => {
    expect(readChapterWrapperForChapter('prevoyance')).toBeDefined();
    expect(readEntrySectionForKey('prevoyance.maintien-employeur')).toBeDefined();
    expect(readEntrySectionForKey('prevoyance.regimes-salaries')).toBeDefined();
    expect(readEntrySectionForKey('prevoyance.regimes-independants')).toBeDefined();
    expect(readEntrySectionForKey('prevoyance.affiliation-caisses')).toBeDefined();
    expect(readEntrySectionForKey('prevoyance.contrats-assurantiels')).toBeDefined();
  });
});
