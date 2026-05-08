# Audit Base-Contrat / DMTG Succession — métriques brutes

> Artefact généré et versionné comme snapshot daté de l’audit. Régénération : `npm run audit:base-contrat-dmtg -- --out docs/audit-base-contrat-dmtg-succession.generated.md`.

## Synthèse
- Produits catalogue : 111
- Couples produit/audience exposés : 111
- Blocs déclarés dans les bibliothèques : 199
- Blocs déclarés avec sources : 166 (83,4 %)
- Blocs déclarés moyenne/faible : 52
- Blocs exposés par produit/audience : 352
- Blocs exposés sourcés : 249 (70,7 %)
- Conformité moyenne/faible exposée : 71/71 (100,0 %)
- Phases vides exposées : 0
- Consommateurs engine hors domaine : 0
- Verdicts produit/audience : 0 source moteur, 111 éditorial, 0 non prêt

## Bibliothèques
| Fichier | Blocs | Sources | Moyenne/faible | Dependencies | Montants/taux bruts |
|---|---:|---:|---:|---:|---:|
| assurance-epargne.ts | 14 | 14 | 3 | 3 | 0 |
| autres.ts | 13 | 13 | 3 | 3 | 0 |
| epargne-bancaire.ts | 26 | 18 | 1 | 1 | 0 |
| fiscaux-immobilier.ts | 15 | 12 | 2 | 2 | 0 |
| immobilier.ts | 34 | 21 | 10 | 11 | 0 |
| prevoyance.ts | 22 | 22 | 5 | 5 | 0 |
| retraite.ts | 42 | 42 | 24 | 24 | 0 |
| valeurs-mobilieres.ts | 33 | 24 | 4 | 4 | 0 |

## Familles exposées
| Famille | Couples produit/audience | Blocs | Sources | Moyenne/faible | Phases vides |
|---|---:|---:|---:|---:|---:|
| Assurance prévoyance | 7 | 22 | 22 | 5 | 0 |
| Autres | 6 | 19 | 19 | 3 | 0 |
| Créances/Droits | 5 | 15 | 6 | 3 | 0 |
| Dispositifs fiscaux immobilier | 10 | 30 | 22 | 2 | 0 |
| Épargne Assurance | 3 | 14 | 14 | 3 | 0 |
| Épargne bancaire | 17 | 55 | 37 | 1 | 0 |
| Immobilier direct | 10 | 30 | 21 | 4 | 0 |
| Immobilier indirect | 6 | 18 | 8 | 10 | 0 |
| Non coté/PE | 10 | 30 | 13 | 0 | 0 |
| Retraite & épargne salariale | 19 | 65 | 65 | 36 | 0 |
| Valeurs mobilières | 18 | 54 | 22 | 4 | 0 |

## Consommateurs hors domaine
| Zone | Preuve | Type | Ligne |
|---|---|---|---|
| features | src/features/placement/components/PlacementLiquidationSection.tsx:188 | route base-contrat | <a href="/settings/base-contrat">Consulter la fiscalité des contrats &rarr;</a> |
| pages | src/pages/settings/BaseContrat.tsx:14 | CATALOG | import { CATALOG } from '@/domain/base-contrat/catalog'; |
| pages | src/pages/settings/BaseContrat.tsx:29 | base_contrat_overrides | } from '@/utils/cache/baseContratOverridesCache'; |
| pages | src/pages/settings/BaseContrat.tsx:198 | CATALOG | return CATALOG.filter((product) => { |
| pages | src/pages/settings/BaseContrat.tsx:233 | CATALOG | () => CATALOG.filter((product) => !isProductClosed(product.id, overrides, today)).length, |
| pages | src/pages/settings/BaseContrat.tsx:236 | CATALOG | const closedCount = CATALOG.length - activeCount; |
| pages | src/pages/settings/BaseContrat.tsx:264 | CATALOG | {CATALOG.length} produits - {activeCount} ouverts - {closedCount} clôturés |
| pages | src/pages/settings/BaseContrat.tsx:355 | getRules | const rules = getRules(product.id, togglePPPM); |
| pages | src/pages/settings/__tests__/BaseContrat.test.tsx:29 | base_contrat_overrides | vi.mock('@/utils/cache/baseContratOverridesCache', () => ({ |
| other | src/routes/settingsRoutes.ts:55 | route base-contrat | path: 'base-contrat', |
| other | src/routes/settingsRoutes.ts:56 | route base-contrat | urlPath: '/settings/base-contrat', |
| other | src/routes/settingsRoutes.ts:80 | route base-contrat | if (pathname.startsWith('/settings/base-contrat')) return 'baseContrats'; |
| other | src/settings/__tests__/baseContratOverridesReviewSchema.test.ts:21 | base_contrat_overrides | expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*add\s+column\s+if\s+not\s+exists\s+review_status\s+public\.base_contrat_review_status/i); |
| other | src/settings/__tests__/baseContratOverridesReviewSchema.test.ts:22 | base_contrat_overrides | expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*alter\s+column\s+review_status\s+set\s+default\s+'ok'/i); |
| other | src/settings/__tests__/baseContratOverridesReviewSchema.test.ts:23 | base_contrat_overrides | expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*alter\s+column\s+review_status\s+set\s+not\s+null/i); |
| other | src/settings/__tests__/baseContratOverridesReviewSchema.test.ts:24 | base_contrat_overrides | expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*add\s+column\s+if\s+not\s+exists\s+review_reason\s+text/i); |
| other | src/settings/__tests__/baseContratOverridesReviewSchema.test.ts:25 | base_contrat_overrides | expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*add\s+column\s+if\s+not\s+exists\s+next_review_at\s+date/i); |
| other | src/settings/__tests__/rlsSettingsPolicies.test.ts:27 | base_contrat_overrides | for (const table of ['tax_settings', 'fiscality_settings', 'base_contrat_overrides']) { |
| other | src/utils/cache/baseContratOverridesCache.ts:2 | base_contrat_overrides | * utils/baseContratOverridesCache.ts |
| other | src/utils/cache/baseContratOverridesCache.ts:4 | base_contrat_overrides | * Cache minimal pour base_contrat_overrides. |
| other | src/utils/cache/baseContratOverridesCache.ts:19 | base_contrat_overrides | const TABLE = 'base_contrat_overrides'; |
| other | src/utils/cache/baseContratOverridesCache.ts:37 | base_contrat_overrides | console.error('[baseContratOverridesCache] fetch error:', error.message); |
| other | src/utils/cache/baseContratOverridesCache.ts:69 | base_contrat_overrides | throw new Error(`[baseContratOverridesCache] upsert error: ${error.message}`); |

## Produits / régimes exposés
| Produit | Famille | Audience | Blocs | Sources | Moyenne/faible | Score patrimonial | Score dev senior | Verdict |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Assurance dépendance | Assurance prévoyance | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Assurance emprunteur | Assurance prévoyance | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Assurance emprunteur | Assurance prévoyance | PM | 3 | 3/3 | 1 | 5/5 | 2/5 | éditorial |
| Assurance obsèques | Assurance prévoyance | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Prévoyance individuelle décès | Assurance prévoyance | PP | 3 | 3/3 | 1 | 5/5 | 2/5 | éditorial |
| Prévoyance individuelle arrêt de travail / invalidité | Assurance prévoyance | PP | 4 | 4/4 | 1 | 5/5 | 2/5 | éditorial |
| Assurance homme-clé | Assurance prévoyance | PM | 3 | 3/3 | 2 | 4/5 | 2/5 | éditorial |
| Assurance-vie | Épargne Assurance | PP | 7 | 7/7 | 1 | 5/5 | 2/5 | éditorial |
| Contrat de capitalisation | Épargne Assurance | PP | 4 | 4/4 | 0 | 5/5 | 2/5 | éditorial |
| Contrat de capitalisation | Épargne Assurance | PM | 3 | 3/3 | 2 | 4/5 | 2/5 | éditorial |
| Compte à terme / dépôt à terme (CAT) | Épargne bancaire | PP | 3 | 1/3 | 0 | 4/5 | 2/5 | éditorial |
| Compte à terme / dépôt à terme (CAT) | Épargne bancaire | PM | 3 | 1/3 | 0 | 4/5 | 2/5 | éditorial |
| Compte courant (compte de dépôt) | Épargne bancaire | PP | 3 | 1/3 | 0 | 4/5 | 2/5 | éditorial |
| Compte courant (compte de dépôt) | Épargne bancaire | PM | 3 | 1/3 | 0 | 4/5 | 2/5 | éditorial |
| Compte sur livret (CSL) | Épargne bancaire | PP | 3 | 1/3 | 0 | 4/5 | 2/5 | éditorial |
| Compte sur livret (CSL) | Épargne bancaire | PM | 3 | 1/3 | 0 | 4/5 | 2/5 | éditorial |
| CEL (Compte épargne logement) | Épargne bancaire | PP | 3 | 2/3 | 1 | 5/5 | 2/5 | éditorial |
| LDDS | Épargne bancaire | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| LEP | Épargne bancaire | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Livret A | Épargne bancaire | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Livret Jeune | Épargne bancaire | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| PEL (Plan épargne logement) | Épargne bancaire | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| PEAC (Plan d'épargne avenir climat) | Épargne bancaire | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Compte-titres ordinaire (CTO) | Épargne bancaire | PP | 4 | 2/4 | 0 | 5/5 | 2/5 | éditorial |
| Compte-titres ordinaire (CTO) | Épargne bancaire | PM | 4 | 2/4 | 0 | 5/5 | 2/5 | éditorial |
| PEA (Plan d'épargne en actions) | Épargne bancaire | PP | 4 | 4/4 | 0 | 5/5 | 2/5 | éditorial |
| PEA-PME | Épargne bancaire | PP | 4 | 4/4 | 0 | 5/5 | 2/5 | éditorial |
| Article 83 (anciens contrats "retraite entreprise") | Retraite & épargne salariale | PP | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| Article 83 (anciens contrats "retraite entreprise") | Retraite & épargne salariale | PM | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| Article 39 (retraite supplémentaire à prestations définies) | Retraite & épargne salariale | PP | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| Article 39 (retraite supplémentaire à prestations définies) | Retraite & épargne salariale | PM | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| Madelin retraite (ancien) | Retraite & épargne salariale | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| PEE (Plan d'épargne entreprise) | Retraite & épargne salariale | PP | 4 | 4/4 | 0 | 5/5 | 2/5 | éditorial |
| PEE (Plan d'épargne entreprise) | Retraite & épargne salariale | PM | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| Intéressement | Retraite & épargne salariale | PM | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| Participation | Retraite & épargne salariale | PM | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| Prime de Partage de la Valeur (PPV) | Retraite & épargne salariale | PM | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| PERIN assurantiel (PER individuel assurance) | Retraite & épargne salariale | PP | 7 | 7/7 | 0 | 5/5 | 2/5 | éditorial |
| PERIN bancaire (PER individuel compte-titres) | Retraite & épargne salariale | PP | 4 | 4/4 | 0 | 5/5 | 2/5 | éditorial |
| PERCOL (PER collectif) | Retraite & épargne salariale | PP | 4 | 4/4 | 0 | 5/5 | 2/5 | éditorial |
| PERCOL (PER collectif) | Retraite & épargne salariale | PM | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| PERCO (ancien) | Retraite & épargne salariale | PP | 4 | 4/4 | 0 | 5/5 | 2/5 | éditorial |
| PERCO (ancien) | Retraite & épargne salariale | PM | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| PERO (PER obligatoire) | Retraite & épargne salariale | PP | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| PERO (PER obligatoire) | Retraite & épargne salariale | PM | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| PERP (ancien) | Retraite & épargne salariale | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Censi-Bouvard (LMNP "réduction") | Dispositifs fiscaux immobilier | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Denormandie (ancien à rénover) | Dispositifs fiscaux immobilier | PP | 3 | 3/3 | 1 | 5/5 | 2/5 | éditorial |
| Duflot | Dispositifs fiscaux immobilier | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Loc'Avantages (convention Anah) | Dispositifs fiscaux immobilier | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Louer abordable (Cosse) — déduction | Dispositifs fiscaux immobilier | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Malraux | Dispositifs fiscaux immobilier | PP | 3 | 2/3 | 1 | 5/5 | 2/5 | éditorial |
| Monuments historiques | Dispositifs fiscaux immobilier | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Pinel / Pinel+ | Dispositifs fiscaux immobilier | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Relance logement (dit "Jeanbrun") | Dispositifs fiscaux immobilier | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Scellier | Dispositifs fiscaux immobilier | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Résidence principale | Immobilier direct | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Résidence secondaire | Immobilier direct | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Immobilier locatif nu (revenus fonciers) | Immobilier direct | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Immobilier locatif nu (revenus fonciers) | Immobilier direct | PM | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Immobilier locatif meublé (LMNP) | Immobilier direct | PP | 3 | 2/3 | 2 | 4/5 | 2/5 | éditorial |
| Immobilier locatif meublé (LMP) | Immobilier direct | PP | 3 | 3/3 | 2 | 4/5 | 2/5 | éditorial |
| Garage / parking / lot annexe | Immobilier direct | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Garage / parking / lot annexe | Immobilier direct | PM | 3 | 1/3 | 0 | 4/5 | 2/5 | éditorial |
| Terrain (constructible / non constructible) | Immobilier direct | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Terrain (constructible / non constructible) | Immobilier direct | PM | 3 | 1/3 | 0 | 4/5 | 2/5 | éditorial |
| Groupement foncier agricole / viticole (GFA / GFV) | Immobilier indirect | PP | 3 | 2/3 | 3 | 4/5 | 2/5 | éditorial |
| Groupement foncier agricole / viticole (GFA / GFV) | Immobilier indirect | PM | 3 | 1/3 | 2 | 3/5 | 2/5 | éditorial |
| Groupement forestier (GFF / GF) | Immobilier indirect | PP | 3 | 2/3 | 3 | 4/5 | 2/5 | éditorial |
| Groupement forestier (GFF / GF) | Immobilier indirect | PM | 3 | 1/3 | 2 | 3/5 | 2/5 | éditorial |
| Parts de SCPI | Immobilier indirect | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Parts de SCPI | Immobilier indirect | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| FCPR (fonds commun de placement à risques) | Valeurs mobilières | PP | 3 | 3/3 | 1 | 5/5 | 2/5 | éditorial |
| FCPR (fonds commun de placement à risques) | Valeurs mobilières | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| FCPI | Valeurs mobilières | PP | 3 | 3/3 | 1 | 5/5 | 2/5 | éditorial |
| FCPI | Valeurs mobilières | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| FIP | Valeurs mobilières | PP | 3 | 3/3 | 1 | 5/5 | 2/5 | éditorial |
| FIP | Valeurs mobilières | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| OPCI grand public | Valeurs mobilières | PP | 3 | 3/3 | 1 | 5/5 | 2/5 | éditorial |
| OPCI grand public | Valeurs mobilières | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Actions (cotées) | Valeurs mobilières | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Actions (cotées) | Valeurs mobilières | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Actions de préférence | Valeurs mobilières | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Actions de préférence | Valeurs mobilières | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Parts sociales (banques mutualistes / coopératives) | Valeurs mobilières | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Parts sociales (banques mutualistes / coopératives) | Valeurs mobilières | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Titres participatifs | Valeurs mobilières | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Titres participatifs | Valeurs mobilières | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Bon de souscription d'actions / Droits / DPS | Valeurs mobilières | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Bon de souscription d'actions / Droits / DPS | Valeurs mobilières | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Actions non cotées (parts/actions de société) | Non coté/PE | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Actions non cotées (parts/actions de société) | Non coté/PE | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Crowdfunding (actions/obligations via plateforme) | Non coté/PE | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Crowdfunding (actions/obligations via plateforme) | Non coté/PE | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Obligations non cotées (PME, club deals) | Non coté/PE | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Obligations non cotées (PME, club deals) | Non coté/PE | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| SOFICA | Non coté/PE | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| SOFICA | Non coté/PE | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Souscription au capital de PME (IR-PME / "Madelin") | Non coté/PE | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Souscription au capital de PME (IR-PME / "Madelin") | Non coté/PE | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Compte courant d'associé (créance) | Créances/Droits | PP | 3 | 2/3 | 0 | 5/5 | 2/5 | éditorial |
| Compte courant d'associé (créance) | Créances/Droits | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Prêt entre particuliers (reconnaissance de dette) | Créances/Droits | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Usufruit / nue-propriété (droits patrimoniaux) | Créances/Droits | PP | 3 | 1/3 | 3 | 3/5 | 2/5 | éditorial |
| Usufruit / nue-propriété (droits patrimoniaux) | Créances/Droits | PM | 3 | 0/3 | 0 | 3/5 | 2/5 | éditorial |
| Crypto-actifs | Autres | PP | 4 | 4/4 | 0 | 5/5 | 2/5 | éditorial |
| Crypto-actifs | Autres | PM | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Métaux précieux | Autres | PP | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Métaux précieux | Autres | PM | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |
| Tontine (association tontinière) | Autres | PP | 3 | 3/3 | 3 | 4/5 | 2/5 | éditorial |
| Tontine (association tontinière) | Autres | PM | 3 | 3/3 | 0 | 5/5 | 2/5 | éditorial |

