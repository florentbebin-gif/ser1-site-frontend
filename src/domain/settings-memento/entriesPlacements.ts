import type { MementoEntry } from './types';

export const MEMENTO_PLACEMENTS_ENTRIES = [
  {
    chapterId: 'placements',
    key: 'placements.allocation',
    label: 'Allocation et choix d’enveloppes',
    description:
      'Comparaison et allocation entre enveloppes financières du catalogue Base-Contrat, avec la fiscalité des revenus du capital consommée via la chaîne fiscale.',
    status: 'couvert',
    statusReason:
      'Simulateur placement actif ; prélèvements sociaux du patrimoine et part IR du PFU administrés et sourcés via les claims settings-references.',
    priority: 'critique',
    ownerPagePath: '/settings/base-contrat',
    registryKeys: [],
    claimKeys: ['patrimony-current', 'pfu-ir-current'],
    refIds: ['cgi-200-a', 'css-l136-6', 'css-l136-7'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['placement'],
  },
  {
    chapterId: 'placements',
    key: 'placements.assurance-vie-capitalisation',
    label: 'Assurance-vie et contrats de capitalisation',
    description:
      'Enveloppes vie et capitalisation du catalogue Base-Contrat : versements, rachats selon l’ancienneté du contrat et transmissibilité, l’angle décès restant porté par la page DMTG & Succession.',
    status: 'partiel',
    statusReason:
      'Claims Base-Contrat de constitution, de rachat et de transmission présents ; le pack placement complet reste partiel dans le registry settings.',
    priority: 'critique',
    ownerPagePath: '/settings/base-contrat',
    registryKeys: ['placements.assurance-vie-capitalisation'],
    claimKeys: [
      'base-contrat-assurance-vie-pp-constitution-versements',
      'base-contrat-assurance-vie-pp-sortie-contrat-de-moins-de-8-ans',
      'base-contrat-assurance-vie-pp-sortie-contrat-de-8-ans-et-plus',
      'base-contrat-assurance-vie-pp-sortie-anciens-contrats-regimes-anterieurs-a-1997',
      'base-contrat-assurance-vie-pp-deces-capital-hors-succession',
      'base-contrat-contrat-capitalisation-pp-pp-constitution-versements',
      'base-contrat-contrat-capitalisation-pp-pp-sortie-fiscalite-des-gains-meme-regime-que-l-assurance-vie',
      'base-contrat-contrat-capitalisation-pp-pp-deces-avantages-de-transmissibilite',
    ],
    refIds: [
      'base-source-art-125-0-a-cgi',
      'base-source-art-l132-12-code-des-assurances',
      'base-source-service-public-fonctionnement-assurance-vie',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['placement'],
  },
  {
    chapterId: 'placements',
    key: 'placements.enveloppes-titres',
    label: 'Enveloppes titres : PEA, PEA-PME et compte-titres',
    description:
      'Sous-types titres du simulateur placement : éligibilité et versements des plans, retraits selon la maturité du plan et imposition des revenus et cessions du compte-titres.',
    status: 'partiel',
    statusReason:
      'Claims Base-Contrat des plans et du compte-titres présents ; les abattements de détention des titres acquis avant la réforme du prélèvement forfaitaire restent à qualifier.',
    priority: 'structurant',
    ownerPagePath: '/settings/base-contrat',
    registryKeys: [],
    claimKeys: [
      'base-contrat-pea-pp-constitution-versements-et-titres-eligibles',
      'base-contrat-pea-pp-sortie-avant-5-ans',
      'base-contrat-pea-pp-sortie-apres-5-ans',
      'base-contrat-pea-pp-deces-cloture-et-succession',
      'base-contrat-pea-pme-pp-constitution-versements-et-titres-eligibles',
      'base-contrat-cto-pp-pp-constitution-ouverture-et-versements',
      'base-contrat-cto-pp-pp-sortie-plus-values-et-cessions',
      'base-contrat-cto-pp-pp-sortie-dividendes-et-revenus',
    ],
    refIds: [
      'base-source-art-l221-30-code-monetaire-et-financier-pea',
      'base-source-art-l221-32-1-code-monetaire-et-financier-pea-pme',
      'base-source-art-150-0-a-ii-2-cgi-pea',
      'base-source-art-200-a-cgi-pfu',
      'cgi-150-0-a',
      'boi-rppm-pvbmi-30-20',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['placement'],
  },
  {
    chapterId: 'immobilier',
    key: 'immobilier.scpi',
    label: 'SCPI',
    description:
      'Parts de SCPI comme sous-parcours du placement : souscription, revenus, cession et transmission documentés par le catalogue Base-Contrat.',
    status: 'partiel',
    statusReason:
      'Enveloppe documentée par les claims Base-Contrat ; le simulateur SCPI et son pack fiscal dédié restent planifiés dans le registry settings.',
    priority: 'structurant',
    ownerPagePath: '/settings/base-contrat',
    registryKeys: ['immobilier.scpi.regime'],
    claimKeys: [
      'base-contrat-parts-scpi-pp-pp-constitution-souscription-et-revenus',
      'base-contrat-parts-scpi-pp-pp-sortie-plus-value-de-cession',
      'base-contrat-parts-scpi-pp-pp-deces-succession',
    ],
    refIds: [
      'base-source-art-150-u-cgi-plus-values-immobilieres',
      'boi-rfpi-pvi-10',
      'boi-rfpi-pvi-20',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['scpi'],
  },
] as const satisfies readonly MementoEntry[];
