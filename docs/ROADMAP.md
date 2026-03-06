# ROADMAP (source de verite)

## But
Piloter la trajectoire SER1 vers un outil **premium, simple et ultra fiable** pour le conseil patrimonial :
- des simulateurs coherents entre eux,
- des parametres actualisables (sans "patch code"),
- des livrables client (PowerPoint / Excel) utilisables en rendez-vous,
- une gouvernance "cabinet" (utilisateurs, droits, identite visuelle).

> Cette roadmap ne contient **que ce qui reste a faire**.
> Le chantier "Parametres fiscaux unifies + tracabilite + garde-fous" (P1-06) est **livre**.

## Audience
Owner/PM + responsable produit + LLM operant en PR-only workflow.

---

## Principes non negociables (trajectoire "outil pro")
1) **Une seule source de verite pour les chiffres**
   Tous les simulateurs lisent le meme "dossier fiscal" (deja en place).

2) **Aucun chiffre revisable en dur dans les moteurs**
   Tout ce qui change (taux/baremes/abattements) doit etre parametrable et verifie.

3) **Chargement fiable sur les simulateurs critiques**
   Pas de calcul silencieux avec des valeurs provisoires.

4) **Validation cote administration**
   On bloque la saisie incoherente (tranches, bornes, taux, valeurs negatives, etc.).

5) **Tracabilite des dossiers**
   Un dossier sauvegarde doit indiquer si les parametres ont change depuis.

6) **Documentation alignee**
   Ce qui est vrai dans le code doit etre vrai dans les docs (et inversement).

---

## Definition of Done (pour chaque PR)
- **Qualite** : `npm run check` passe.
- **Preuves** : chemins fichiers + commandes `rg`/captures log + tests manuels decrits.
- **Regressions** : aucun comportement existant casse (ou migration/compatibilite explicite).
- **Docs** : `docs/ROADMAP.md` mis a jour (`DONE` + preuves + lien PR).
  Si la PR change un flux, mise a jour de `docs/ARCHITECTURE.md` et/ou `docs/RUNBOOK.md`.

---

## Comment utiliser cette roadmap
- Un item `ready` doit etre executable par une PR courte sans re-cadrage majeur.
- Un item `spec` n'est pas pret a coder : il faut d'abord figer le cadre ou les decisions.
- Si un item est trop gros pour une PR mergeable, il doit etre re-decoupe avant execution.
- Une PR doit couvrir un seul item ou sous-item clair.
- Toute PR mergee doit remettre a jour le statut de l'item et, si utile, les preuves associees.

## Format standard d'un item executable
Utiliser ce format pour tout item actif proche de l'execution :
- `Statut` : `spec` / `ready` / `in_progress` / `blocked` / `done`
- `Objectif`
- `Non-objectifs`
- `Travaux`
- `Fichiers probables`
- `Tests attendus`
- `Preuves attendues`
- `Taille PR max`
- `Dependances / blocages`

---

# P1-07 - Stabilisation post-P1-06 (maintenance + lisibilite)
Objectif : reduire la charge mentale, securiser les modules critiques, eviter que le repo se "deforme" avant d'accelerer sur les grosses features.

## PR-P1-07-01 - Migrer `fiscalSettingsCache.js` en TypeScript (module critique)
### Pourquoi
C'est un singleton central : un bug ici impacte tous les simulateurs. Le typage reduit fortement le risque.

### Travaux
- Convertir `src/utils/fiscalSettingsCache.js` -> `src/utils/fiscalSettingsCache.ts`
- Ajouter des types explicites :
  - structure des retours (`tax`, `ps`, `fiscality`, `meta`, `hashes`)
  - signatures du mode strict/stale
- Verifier compatibilite avec `useFiscalContext` et les pages Settings.

### Fichiers
- `src/utils/fiscalSettingsCache.(js|ts)`
- `src/hooks/useFiscalContext.ts` (ajustements typage si besoin)

### DoD
- Comportement identique (strict/stale), tests verts.
- Aucun appel casse.

### Preuves
- `rg "fiscalSettingsCache\\.js" -n src` -> 0
- `npm run check` vert

---

## PR-P1-07-02 - Ranger `src/utils/` (decoupage par domaines)
### Pourquoi
`src/utils/` devient un tiroir. On veut des "tiroirs" clairs : cache, exports, nombres, etc.

### Travaux (minimal, sans refactor metier)
- Creer des dossiers :
  - `src/cache/` (settings cache, theme cache, etc.)
  - `src/export/` (fingerprint, xlsxBuilder, exportExcel...)
  - `src/math/` ou `src/domain-utils/` (number, tmiMetrics, irEngine...)
- Deplacer les fichiers **sans changer la logique**, juste les imports.
- Garder une compatibilite courte (facultatif) via re-exports si necessaire.

### Fichiers
- Deplacements sous `src/` + mise a jour des imports

### DoD
- Aucun changement fonctionnel.
- Repo plus lisible (imports coherents).

### Preuves
- `git diff --stat`
- `npm run check` vert

---

## PR-P1-07-03 - Reduire les fichiers "trop longs" (IR + Placement)
### Pourquoi
Les fichiers >400-500 lignes deviennent fragiles. On veut des blocs plus petits et lisibles.

### Travaux
- Decouper en sous-composants / sous-hooks **sans modifier le comportement** :
  - `src/features/ir/components/IrSimulatorContainer.jsx` (ou equivalent)
  - 1-2 gros fichiers Placement (controller / hooks)
- Objectif : isoler :
  - "lecture des inputs"
  - "calcul"
  - "affichage"
  - "exports"

### DoD
- Aucun changement d'UI.
- Tests existants passent.

### Preuves
- Avant/apres : tailles fichiers (diff)
- `npm run check` vert

---

## PR-P1-07-04 - E2E "smoke tests" Playwright en CI
### Statut
ready

### Objectif
Ajouter un filet anti-regression E2E minimal sur les surfaces stables de l'application, sans figer les simulateurs encore incomplets.

### Non-objectifs
- Ne pas tester en profondeur les simulateurs encore en construction ou encore relies a `UpcomingSimulatorPage`.
- Ne pas brancher ces E2E dans `npm run check` tant que la stabilite locale n'est pas prouvee.
- Ne pas couvrir tous les parcours metier.

### Travaux
- Ajouter 3 a 5 tests E2E smoke tres rapides sur les routes stables :
  - ouverture app / Home
  - ouverture `/sim/credit`
  - ouverture `/sim/ir`
  - ouverture `/sim/succession`
  - ouverture `/settings` et lecture d'au moins une sous-page stable
- Si une route `/sim/*` pointe encore vers `UpcomingSimulatorPage`, limiter le smoke test a l'ouverture et au rendu attendu.
- Brancher l'execution dans une CI dediee ou dans la pipeline existante, sans rendre `npm run check` plus fragile a ce stade.

### Fichiers probables
- `playwright.config.ts`
- `tests/e2e/**` (ou dossier E2E existant)
- `.github/workflows/e2e.yml`
- eventuellement `package.json` si une commande dediee doit etre clarifiee

### Tests attendus
- execution locale des specs smoke
- execution CI verte sur les routes stables
- verification manuelle qu'aucune route encore incomplete n'est testee au-dela de son contrat actuel

### Preuves attendues
- log CI ou sortie Playwright montrant les specs executees
- liste explicite des routes couvertes
- note explicite sur les routes volontairement exclues ou testees en mode minimal

### Taille PR max
1 PR courte a moyenne

### Dependances / blocages
- stabilite minimale des routes testees
- confirmation du dossier E2E de reference (`tests/e2e/**` vs autre)

---

## PR-P1-07-05 - Documentation metier (regles implementees) + gouvernance d'ajout de pages
### Statut
ready

### Objectif
Rendre lisible ce que SER1 calcule vraiment et cadrer la creation des futures pages sans multiplier les docs.

### Non-objectifs
- Ne pas produire une encyclopedie fiscale.
- Ne pas dupliquer l'architecture ou la gouvernance UI dans plusieurs fichiers.
- Ne pas ajouter `docs/ADDING_A_SIMULATOR.md` si les regles peuvent etre absorbees par les docs pivots existantes.

### Travaux
- Ajouter `docs/METIER.md` en version courte et fonctionnelle :
  - ce que calcule SER1
  - ce qui est couvert
  - limites connues
  - sections minimales : IR, prelevements sociaux, DMTG/succession, placement, PER, credit
- Integrer la regle "comment ajouter un simulateur / une page settings / organiser une feature" dans les docs pivots existantes :
  - structure et routing dans `docs/ARCHITECTURE.md`
  - regles UI et contrats `/sim/*` dans `docs/GOUVERNANCE.md`
- Mettre a jour `README.md` uniquement pour pointer vers ces sources de verite si necessaire.

### Fichiers probables
- `docs/METIER.md`
- `docs/ARCHITECTURE.md`
- `docs/GOUVERNANCE.md`
- eventuellement `README.md`

### Tests attendus
- revue de coherence entre docs pivots
- verification manuelle qu'aucune regle de creation de page n'est dupliquee inutilement

### Preuves attendues
- liens vers les sections mises a jour
- tableau ou structure claire montrant quels sujets vivent dans quel doc
- mention explicite qu'aucun doc supplementaire n'a ete ajoute hors `docs/METIER.md`

### Taille PR max
1 PR moyenne, purement documentaire

### Dependances / blocages
- validation du format court de `docs/METIER.md`
- accord sur le fait que la gouvernance "ajout de simulateur/settings" reste dans les docs pivots existantes

---

# P2 - Experience Rendez-vous : Mode simplifie / Mode expert (priorite produit)
Objectif : rendre l'outil **utilisable en rendez-vous** sans intimider, tout en gardant une profondeur "expert" quand necessaire.

## PR-P2-01 - Decision produit : definition du mode simplifie / expert (cadre + UX)
### Statut
spec

### Objectif
Figer une regle produit simple et stable pour le mode simplifie / expert avant de continuer a l'etendre a d'autres simulateurs.

### Non-objectifs
- Ne pas implementer ici les composants utilitaires ni la persistance.
- Ne pas traiter tous les simulateurs dans la meme decision.
- Ne pas modifier les moteurs de calcul.

### Travaux
- Ecrire une decision produit courte dans `docs/GOUVERNANCE.md` ou `docs/ROADMAP.md` sur :
  - ce qui est visible en simplifie vs expert
  - ou vit le toggle principal
  - ce qui releve du mode global vs d'un override local de page
  - ce qui est masque visuellement seulement vs retire du calcul
- Donner 1 exemple concret applique a `/sim/credit`, `/sim/ir` et `/sim/succession`.
- Ajouter une maquette textuelle tres courte du comportement cible si necessaire.

### Fichiers probables
- `docs/GOUVERNANCE.md`
- eventuellement `docs/ROADMAP.md`

### Tests attendus
- revue produit de la decision
- verification de coherence avec les regles deja presentes sur `useUserMode` et `/sim/credit`

### Preuves attendues
- decision ecrite et localisable
- exemples explicites de comportement global vs local
- mention claire des champs qui doivent sortir du calcul en mode simplifie

### Taille PR max
1 petite PR documentaire

### Dependances / blocages
- arbitrage produit sur le perimetre exact du mode simplifie pour IR et Succession
- validation que la decision reste compatible avec la gouvernance actuelle du Home et de `/sim/credit`

---

## PR-P2-02 - Infrastructure "modes" (composants + persistance)
### Travaux
- Ajouter un "mode" au niveau utilisateur (par defaut : simplifie) :
  - stockage local ou profil utilisateur selon ce qui existe
- Composants utilitaires :
  - `ExpertOnly`, `SimpleOnly`
  - helpers pour "niveau de detail" (affichage, sections, explications)
- S'assurer que ca n'impacte pas les calculs : uniquement l'interface.

### DoD
- Toggle stable, pas de bug de navigation.

### Preuves
- test manuel : toggle -> UI change sur au moins 1 ecran
- `npm run check` vert

---

## PR-P2-03 - Deploiement modes sur IR + Succession (les plus sensibles)
### Travaux
- Mode simplifie :
  - inputs reduits aux essentiels
  - resultats lisibles (1-3 chiffres cles + explications)
- Mode expert :
  - acces aux hypotheses, details, parametres avances
- Ne pas modifier les moteurs : uniquement UI, organisation, explications.

### DoD
- Un CGP peut utiliser IR/Succession en rendez-vous sans surcharge.

### Preuves
- captures avant/apres
- `npm run check` vert

---

## PR-P2-04 - Deploiement modes sur Placement + Credit
### Travaux
- Simplifie : parcours guide, peu d'options, resultats comparatifs simples
- Expert : options avancees (hypotheses, details)
- Garder exports inchanges, ou indiquer clairement les options utilisees.

### DoD
- Mode simplifie exploitable en RDV.

---

## PR-P2-05 - Deploiement modes sur PER + Strategie
### Travaux
- PER : simplifie (versement / impact global) vs expert (parametres detailles)
- Strategie : simplifie (baseline vs recommandation) vs expert (hypotheses + details)

---

# P3 - PER "multi-enveloppes" + recommandations fiscales (differenciant)
Objectif : permettre au CGP de simuler le **transfert** vers un PER et d'optimiser l'utilisation des enveloppes disponibles, avec une restitution claire pour la declaration.

## PR-P3-01 - Specification metier PER (avant code)
### Travaux
- Documenter precisement :
  - transferts : Madelin, PERP, Article 83, PERCO, PER -> PER
  - regles d'enveloppes disponibles et impacts
  - logique de recommandation "report" declaration IR (quoi, ou, comment expliquer)
- Cas types (3-5) avec chiffres simples.

### DoD
- Specification validable sans lire le code.

---

## PR-P3-02 - Modele de donnees PER (enveloppes + historique) + validation
### Travaux
- Representation claire :
  - origine des droits
  - regles d'utilisation
  - plafonds disponibles
- Validation cote interface (coherence, bornes, dates).

---

## PR-P3-03 - Moteur PER : transferts multi-enveloppes (calculs)
### Travaux
- Etendre l'engine PER pour :
  - integrer les enveloppes d'origine
  - simuler le transfert vers PER
  - calculer impacts (deductibilite, plafonds, etc.)
- Tests unitaires "cas type".

---

## PR-P3-04 - Recommandations : utilisation des enveloppes + guidance report IR
### Travaux
- Generer une recommandation structuree :
  - ordre d'utilisation
  - message clair "quoi reporter" (sans jargon)
  - resume actionnable pour le CGP

---

## PR-P3-05 - Exports PER (PPTX/Excel) enrichis
### Travaux
- Ajouter dans le livrable :
  - scenario avant/apres transfert
  - hypotheses utilisees
  - recommandation report IR

---

# P4 - Scan documentaire (pre-remplissage analyse patrimoniale)
Objectif : reduire la saisie et securiser les donnees via un flux "documents -> extraction -> validation".

## PR-P4-01 - Decision infra + cadre de confidentialite
### Travaux
- Choisir l'approche :
  - extraction locale vs service externe
  - conservation (ou non) des documents
  - limites (types de docs au debut)
- Rediger un cadre simple (ce qui est stocke, combien de temps, qui y accede).

---

## PR-P4-02 - Prototype : depot document + extraction minimale + relecture
### Travaux
- Upload 1-2 types de documents (ex : avis d'imposition, releve de situation)
- Extraction minimale (quelques champs) + ecran de validation humaine
- Aucune automatisation complexe au depart.

---

## PR-P4-03 - Integration dans l'analyse patrimoniale
### Travaux
- Mapper les champs extraits vers le dossier client
- Traces : "d'ou vient l'info" (doc, champ, date)
- Gestion des erreurs et corrections.

---

# P5 - Cabinet : roles, utilisateurs, identite visuelle (web + livrables)
Objectif : fonctionner en cabinet (plusieurs profils) + livrables a l'image du cabinet.

## PR-P5-01 - Multi-roles (au-dela is_admin) + droits
### Travaux
- Definir 3-4 roles simples (ex : admin, manager, conseiller, lecture)
- Modele de droits + regles d'acces
- Ajustements interface (ce qui est visible selon role)

---

## PR-P5-02 - Gestion utilisateurs (interface) + processus cabinet
### Travaux
- Page gestion : creation / desactivation / affectation role
- Regles de securite simples

---

## PR-P5-03 - Branding complet : couleurs cabinet + logo dans exports
### Travaux
- Alignement theme web + theme PPTX + export Excel
- Verifier coherence sur les livrables existants (PER/Placement/Audit).

---

# P6 - Analyse patrimoniale premium + livrables
Objectif : rendre l'audit "vraiment livrable", standardise, et reutilisable.

## PR-P6-01 - Audit patrimonial (PPTX) : structure stable + donnees minimales
- Plan de slides fixe
- Donnees essentielles + hypotheses + limites
- Zero donnees sensibles serveur

## PR-P6-02 - Simulateur epargne / arbitrages (comparateurs)
- Scenarios compares
- Exports exploitables en RDV

## PR-P6-03 - Simulateur prevoyance (si scope confirme)
- Definir perimetre exact (avant code)
- Meme philosophie : regles separees des chiffres

---

# P7 - Strategie avancee + societe fine (si confirme)
Objectif : recommandations structurees, y compris cas avec societes/holding.

## PR-P7-01 - Moteur de scenarios (baseline vs recommandations)
- Recommandations expliquees + hypotheses
- Comparaison claire

## PR-P7-02 - Societe fine (organigramme, flux, consolidation)
- Modele minimal utile (pas d'usine a gaz)

## PR-P7-03 - Export strategie PPTX complet

---

# P8 - Anticipation : Catalogue produits personnalisable (a moyen terme)
Objectif : eviter que `catalog.ts` devienne bloquant si le cabinet veut personnaliser.

## PR-P8-01 - Etude / decision : catalogue en base (ou non)
- Identifier besoins "cabinet"
- Decider si/quand migrer vers une table Supabase

## PR-P8-02 - Catalogue en base + overrides
- Disponibilite produits par cabinet
- Migration progressive (sans casser l'existant)

---

## References (pour travailler vite)
- Features (simulateurs) : `src/features/{ir,placement,succession,per,credit,strategy,audit}`
- Engine (calculs purs) : `src/engine/**`
- Settings : `src/pages/settings/*` + `src/constants/settingsRoutes.js`
- Cache parametres : `src/utils/fiscalSettingsCache.ts` (apres P1-07-01)
- Theme cabinet : `src/settings/ThemeProvider.tsx` + `src/settings/theme/**`
- Exports : `src/pptx/**` + `src/utils/xlsxBuilder.ts`
- Snapshots `.ser1` : `src/reporting/json-io/**`
- Docs : `docs/{ARCHITECTURE,RUNBOOK,GOUVERNANCE}.md`
