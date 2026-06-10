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
    coverageSources: ['laplace'],
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
    ownerPagePath: '/settings/impots',
    registryKeys: [],
    claimKeys: [],
    refIds: ['boi-ir-rici', 'boi-ir-rici-200'],
    coverageSources: ['laplace'],
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
      'Barème courant administré et sourcé ; millésimes encore planifiés côté registry et simulateur IFI non livré.',
    ownerPagePath: '/settings/impots',
    registryKeys: ['impots.ifi.bareme', 'impots.ifi.millesimes'],
    claimKeys: ['ifi-current'],
    refIds: [
      'cgi-964',
      'cgi-977',
      'boi-pat-ifi-40-10',
      'base-source-art-973-cgi-ifi-abattement-residence-principale',
    ],
    coverageSources: ['laplace'],
    relatedSimulatorIds: ['ifi'],
  },
  {
    chapterId: 'immobilier',
    key: 'immobilier.revenus-fonciers',
    label: 'Revenus fonciers',
    description:
      'Location nue du foyer : micro-foncier, régime réel, intérêts d’emprunt et déficit foncier rattachés à la page Impôts.',
    status: 'planned',
    statusReason:
      'Moteur revenus fonciers planifié ; le paramètre micro-foncier reste planned dans le registry settings.',
    ownerPagePath: '/settings/impots',
    registryKeys: ['immobilier.revenus-fonciers.micro-foncier'],
    claimKeys: [],
    refIds: [
      'base-source-art-28-cgi-revenus-fonciers',
      'base-source-bofip-rfpi-interets-et-frais-d-emprunt',
    ],
    coverageSources: ['laplace'],
    relatedSimulatorIds: ['revenus-fonciers'],
  },
  {
    chapterId: 'immobilier',
    key: 'immobilier.lmnp-lmp',
    label: 'Location meublée LMNP / LMP',
    description:
      'Location meublée non professionnelle et professionnelle : régimes d’imposition et bascule de statut social du loueur professionnel.',
    status: 'planned',
    statusReason:
      'Moteur location meublée planifié ; les régimes restent planned dans le registry settings.',
    ownerPagePath: '/settings/impots',
    registryKeys: ['immobilier.lmnp-lmp.regimes'],
    claimKeys: [],
    refIds: ['boi-bic-champ-40', 'base-source-urssaf-lmp-cotisations-sociales'],
    coverageSources: ['laplace'],
    relatedSimulatorIds: ['lmnp-lmp'],
  },
  {
    chapterId: 'immobilier',
    key: 'immobilier.pv-immobilieres',
    label: 'Plus-values immobilières',
    description:
      'Cession immobilière des particuliers : durée de détention, exonérations et prélèvements sociaux. Le régime relève de l’article 150 U du CGI.',
    status: 'planned',
    statusReason:
      'Moteur plus-values immobilières planifié ; le paramètre de durée de détention reste planned dans le registry settings.',
    ownerPagePath: '/settings/impots',
    registryKeys: ['immobilier.pv-immobilieres.abattements-duree'],
    claimKeys: [],
    refIds: [
      'base-source-art-150-u-cgi-plus-values-immobilieres',
      'boi-rfpi-pvi-10',
      'boi-rfpi-pvi-20',
    ],
    coverageSources: ['laplace'],
    relatedSimulatorIds: ['plus-values-immobilieres'],
  },
] as const satisfies readonly MementoEntry[];
