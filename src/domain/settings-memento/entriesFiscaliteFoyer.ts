import type { MementoEntry } from './types';

export const MEMENTO_FISCALITE_FOYER_ENTRIES = [
  {
    chapterId: 'fiscalite-foyer',
    key: 'fiscalite-foyer.ir',
    label: 'Impôt sur le revenu du foyer',
    description:
      'Barème progressif, quotient familial, décote, contributions sur hauts revenus et part IR du PFU administrés par la page Impôts et consommés via la chaîne fiscale.',
    status: 'couvert',
    statusReason:
      'Paramètres administrés et sourcés via les claims settings-references de la page Impôts ; simulateur IR actif.',
    priority: 'critique',
    ownerPagePath: '/settings/impots',
    registryKeys: [
      'impots.ir.bareme',
      'impots.ir.abattements-et-decote',
      'impots.cehr',
      'impots.cdhr',
      'impots.pfu.part-ir',
    ],
    claimKeys: [
      'income-tax-scale-current',
      'income-tax-decote-current',
      'quotient-familial-plafond-current',
      'income-tax-dom-abatement-current',
      'abat10-salaries-current',
      'abat10-pensions-current',
      'cehr-current',
      'cdhr-current',
      'pfu-ir-current',
    ],
    refIds: [
      'cgi-193-197',
      'cgi-197',
      'cgi-200-a',
      'cgi-223-sexies',
      'boi-ir-liq-20-10',
      'boi-ir-liq-20-20-20',
      'boi-ir-liq-20-20-30',
      'boi-ir-liq-20-30-10',
      'boi-ir-chr',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['ir'],
  },
  {
    chapterId: 'fiscalite-foyer',
    key: 'fiscalite-foyer.niches-fiscales',
    label: 'Niches fiscales et réductions d’impôt',
    description:
      'Réductions et crédits d’impôt du foyer recensés par le BOFiP RICI, sans référentiel centralisé des dispositifs dans Settings.',
    status: 'partiel',
    statusReason:
      'Seuls les montants saisis manuellement dans le simulateur IR sont reflétés ; aucun paramètre dédié n’est centralisé dans le registry settings.',
    priority: 'utile',
    ownerPagePath: '/settings/impots',
    registryKeys: [],
    claimKeys: [],
    refIds: ['boi-ir-rici', 'boi-ir-rici-200'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: [],
  },
  {
    chapterId: 'fiscalite-foyer',
    key: 'fiscalite-foyer.ifi',
    label: 'IFI',
    description:
      'Imposition de la fortune immobilière : barème administré par la page Impôts, biens imposables et dettes lus par les analyses patrimoniales.',
    status: 'partiel',
    statusReason:
      'Barème courant administré et sourcé ; millésimes encore planifiés côté registry, simulateur IFI non livré et valorisation du démembrement fondée par le barème usufruit commun.',
    priority: 'structurant',
    ownerPagePath: '/settings/impots',
    registryKeys: ['impots.ifi.bareme', 'impots.ifi.millesimes'],
    claimKeys: ['ifi-current'],
    refIds: [
      'cgi-964',
      'cgi-977',
      'cgi-669',
      'boi-pat-ifi-40-10',
      'base-source-art-973-cgi-ifi-abattement-residence-principale',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['ifi'],
  },
  {
    chapterId: 'fiscalite-foyer',
    key: 'fiscalite-foyer.non-residents',
    label: 'Fiscalité des non-résidents',
    description:
      'Imposition des revenus de source française et de la fortune immobilière des non-résidents, sous réserve des conventions fiscales.',
    status: 'a_verifier',
    statusReason:
      'Aucun claim ni référence repo sur ce périmètre ; taux minimum, retenues à la source et lecture IFI des non-résidents doivent être qualifiés sur une source officielle avant tout affichage opérationnel.',
    priority: 'structurant',
    ownerPagePath: '/settings/impots',
    registryKeys: [],
    claimKeys: [],
    refIds: [],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['ifi'],
  },
] as const satisfies readonly MementoEntry[];
