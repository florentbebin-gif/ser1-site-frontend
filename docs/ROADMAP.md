# ROADMAP (source de vérité)

## But
Piloter la trajectoire SER1 vers un outil **premium, simple et ultra fiable** pour le conseil patrimonial :
- des simulateurs cohérents entre eux,
- des paramètres actualisables (sans “patch code”),
- des livrables client (PowerPoint / Excel) utilisables en rendez-vous,
- une gouvernance “cabinet” (utilisateurs, droits, identité visuelle).

> Cette roadmap ne contient **que ce qui reste à faire**.  
> Le chantier “Paramètres fiscaux unifiés + traçabilité + garde-fous” (P1-06) est **livré**.

## Audience
Owner/PM + responsable produit + LLM opérant en PR-only workflow.

---

## Principes non négociables (trajectoire “outil pro”)
1) **Une seule source de vérité pour les chiffres**  
   Tous les simulateurs lisent le même “dossier fiscal” (déjà en place).

2) **Aucun chiffre révisable en dur dans les moteurs**  
   Tout ce qui change (taux/barèmes/abattements) doit être paramétrable et vérifié.

3) **Chargement fiable sur les simulateurs critiques**  
   Pas de calcul silencieux avec des valeurs provisoires.

4) **Validation côté administration**  
   On bloque la saisie incohérente (tranches, bornes, taux, valeurs négatives, etc.).

5) **Traçabilité des dossiers**  
   Un dossier sauvegardé doit indiquer si les paramètres ont changé depuis.

6) **Documentation alignée**  
   Ce qui est vrai dans le code doit être vrai dans les docs (et inversement).

---

## Definition of Done (pour chaque PR)
- **Qualité** : `npm run check` passe.
- **Preuves** : chemins fichiers + commandes `rg`/captures log + tests manuels décrits.
- **Régressions** : aucun comportement existant cassé (ou migration/compatibilité explicite).
- **Docs** : `docs/ROADMAP.md` mis à jour (✅ DONE + preuves + lien PR).  
  Si la PR change un flux, mise à jour de `docs/ARCHITECTURE.md` et/ou `docs/RUNBOOK.md`.

---

# P1-07 — Stabilisation post-P1-06 (maintenance + lisibilité)
Objectif : réduire la charge mentale, sécuriser les modules critiques, éviter que le repo se “déforme” avant d’accélérer sur les grosses features.

## PR-P1-07-01 — Migrer `fiscalSettingsCache.js` en TypeScript (module critique)
### Pourquoi
C’est un singleton central : un bug ici impacte tous les simulateurs. Le typage réduit fortement le risque.

### Travaux
- Convertir `src/utils/fiscalSettingsCache.js` → `src/utils/fiscalSettingsCache.ts`
- Ajouter des types explicites :
  - structure des retours (`tax`, `ps`, `fiscality`, `meta`, `hashes`)
  - signatures du mode strict/stale
- Vérifier compatibilité avec `useFiscalContext` et les pages Settings.

### Fichiers
- `src/utils/fiscalSettingsCache.(js|ts)`
- `src/hooks/useFiscalContext.ts` (ajustements typage si besoin)

### DoD
- Comportement identique (strict/stale), tests verts.
- Aucun appel cassé.

### Preuves
- `rg "fiscalSettingsCache\\.js" -n src` → 0
- `npm run check` vert

---

## PR-P1-07-02 — Ranger `src/utils/` (découpage par domaines)
### Pourquoi
`src/utils/` devient un tiroir. On veut des “tiroirs” clairs : cache, exports, nombres, etc.

### Travaux (minimal, sans refactor métier)
- Créer des dossiers :
  - `src/cache/` (settings cache, theme cache, etc.)
  - `src/export/` (fingerprint, xlsxBuilder, exportExcel…)
  - `src/math/` ou `src/domain-utils/` (number, tmiMetrics, irEngine…)
- Déplacer les fichiers **sans changer la logique**, juste les imports.
- Garder une compatibilité courte (facultatif) via ré-exports si nécessaire.

### Fichiers
- Déplacements sous `src/` + mise à jour des imports

### DoD
- Aucun changement fonctionnel.
- Repo plus lisible (imports cohérents).

### Preuves
- `git diff --stat`
- `npm run check` vert

---

## PR-P1-07-03 — Réduire les fichiers “trop longs” (IR + Placement)
### Pourquoi
Les fichiers >400–500 lignes deviennent fragiles. On veut des blocs plus petits et lisibles.

### Travaux
- Découper en sous-composants / sous-hooks **sans modifier le comportement** :
  - `src/features/ir/components/IrSimulatorContainer.jsx` (ou équivalent)
  - 1–2 gros fichiers Placement (controller / hooks)
- Objectif : isoler :
  - “lecture des inputs”
  - “calcul”
  - “affichage”
  - “exports”

### DoD
- Aucun changement d’UI.
- Tests existants passent.

### Preuves
- Avant/après : tailles fichiers (diff)
- `npm run check` vert

---

## PR-P1-07-04 — E2E “smoke tests” Playwright en CI
### Pourquoi
Le repo a Playwright configuré, mais sans preuve claire d’exécution en CI. Il faut au moins un filet anti-régression.

### Travaux
- Ajouter 3–5 tests E2E “smoke” :
  - ouverture app
  - ouverture simulateur IR
  - ouverture simulateur Succession
  - ouverture Settings (lecture)
- Brancher l’exécution dans `npm run check` **ou** dans la pipeline CI (selon stratégie repo).
- Garder ces tests ultra rapides.

### Fichiers
- `playwright.config.ts`
- `e2e/**` (ou dossier existant)
- pipeline/commande check

### DoD
- E2E tourne local + CI, stable.

### Preuves
- log CI / commande
- `npm run check` vert

---

## PR-P1-07-05 — Documentation métier (règles implémentées) + “comment ajouter un simulateur”
### Pourquoi
Aujourd’hui, une partie de la logique métier n’est lisible que dans le code (succession, DMTG, PER, etc.). C’est un risque de maintenance.

### Travaux
- Ajouter un doc **fonctionnel** (sans jargon technique inutile) :
  - `docs/METIER.md` : ce que calcule SER1, ce qui est couvert, limites
  - sections : IR, prélèvements sociaux, DMTG/succession, placement, PER, crédit
- Ajouter une checklist claire :
  - `docs/ADDING_A_SIMULATOR.md` : étapes, conventions, tests, exports, settings

### DoD
- Un lecteur interne comprend “ce qui est calculé” sans lire le code.

### Preuves
- liens vers docs + plan clair
- revue cohérence avec `ARCHITECTURE.md`

---

# P2 — Expérience Rendez-vous : Mode simplifié / Mode expert (priorité produit)
Objectif : rendre l’outil **utilisable en rendez-vous** sans intimider, tout en gardant une profondeur “expert” quand nécessaire.

## PR-P2-01 — Décision produit : définition du mode simplifié / expert (cadre + UX)
### Pourquoi
La forme du “mode” change toute l’architecture UI : toggle global, par simulateur, par section, persistance utilisateur, etc.

### Travaux
- Écrire une décision claire (1 page) dans `docs/ROADMAP.md` ou `docs/GOUVERNANCE.md` :
  - “ce qui est visible en simplifié vs expert”
  - où se trouve le toggle
  - si le choix est sauvegardé (par utilisateur)
- Maquette rapide (même sommaire) : structure écran.

### DoD
- Règle stable et appliquable par PR suivantes.

### Preuves
- doc + captures/description UX

---

## PR-P2-02 — Infrastructure “modes” (composants + persistance)
### Travaux
- Ajouter un “mode” au niveau utilisateur (par défaut : simplifié) :
  - stockage local ou profil utilisateur selon ce qui existe
- Composants utilitaires :
  - `ExpertOnly`, `SimpleOnly`
  - helpers pour “niveau de détail” (affichage, sections, explications)
- S’assurer que ça n’impacte pas les calculs : uniquement l’interface.

### DoD
- Toggle stable, pas de bug de navigation.

### Preuves
- test manuel : toggle → UI change sur au moins 1 écran
- `npm run check` vert

---

## PR-P2-03 — Déploiement modes sur IR + Succession (les plus sensibles)
### Travaux
- Mode simplifié :
  - inputs réduits aux essentiels
  - résultats lisibles (1–3 chiffres clés + explications)
- Mode expert :
  - accès aux hypothèses, détails, paramètres avancés
- Ne pas modifier les moteurs : uniquement UI, organisation, explications.

### DoD
- Un CGP peut utiliser IR/Succession en rendez-vous sans surcharge.

### Preuves
- captures avant/après
- `npm run check` vert

---

## PR-P2-04 — Déploiement modes sur Placement + Crédit
### Travaux
- Simplifié : parcours guidé, peu d’options, résultats comparatifs simples
- Expert : options avancées (hypothèses, détails)
- Garder exports inchangés, ou indiquer clairement les options utilisées.

### DoD
- Mode simplifié exploitable en RDV.

---

## PR-P2-05 — Déploiement modes sur PER + Stratégie
### Travaux
- PER : simplifié (versement / impact global) vs expert (paramètres détaillés)
- Stratégie : simplifié (baseline vs recommandation) vs expert (hypothèses + détails)

---

# P3 — PER “multi-enveloppes” + recommandations fiscales (différenciant)
Objectif : permettre au CGP de simuler le **transfert** vers un PER et d’optimiser l’utilisation des enveloppes disponibles, avec une restitution claire pour la déclaration.

## PR-P3-01 — Spécification métier PER (avant code)
### Travaux
- Documenter précisément :
  - transferts : Madelin, PERP, Article 83, PERCO, PER → PER
  - règles d’enveloppes disponibles et impacts
  - logique de recommandation “report” déclaration IR (quoi, où, comment expliquer)
- Cas types (3–5) avec chiffres simples.

### DoD
- Spécification validable sans lire le code.

---

## PR-P3-02 — Modèle de données PER (enveloppes + historique) + validation
### Travaux
- Représentation claire :
  - origine des droits
  - règles d’utilisation
  - plafonds disponibles
- Validation côté interface (cohérence, bornes, dates).

---

## PR-P3-03 — Moteur PER : transferts multi-enveloppes (calculs)
### Travaux
- Étendre l’engine PER pour :
  - intégrer les enveloppes d’origine
  - simuler le transfert vers PER
  - calculer impacts (déductibilité, plafonds, etc.)
- Tests unitaires “cas type”.

---

## PR-P3-04 — Recommandations : utilisation des enveloppes + guidance report IR
### Travaux
- Générer une recommandation structurée :
  - ordre d’utilisation
  - message clair “quoi reporter” (sans jargon)
  - résumé actionnable pour le CGP

---

## PR-P3-05 — Exports PER (PPTX/Excel) enrichis
### Travaux
- Ajouter dans le livrable :
  - scénario avant/après transfert
  - hypothèses utilisées
  - recommandation report IR

---

# P4 — Scan documentaire (pré-remplissage analyse patrimoniale)
Objectif : réduire la saisie et sécuriser les données via un flux “documents → extraction → validation”.

## PR-P4-01 — Décision infra + cadre de confidentialité
### Travaux
- Choisir l’approche :
  - extraction locale vs service externe
  - conservation (ou non) des documents
  - limites (types de docs au début)
- Rédiger un cadre simple (ce qui est stocké, combien de temps, qui y accède).

---

## PR-P4-02 — Prototype : dépôt document + extraction minimale + relecture
### Travaux
- Upload 1–2 types de documents (ex : avis d’imposition, relevé de situation)
- Extraction minimale (quelques champs) + écran de validation humaine
- Aucune automatisation complexe au départ.

---

## PR-P4-03 — Intégration dans l’analyse patrimoniale
### Travaux
- Mapper les champs extraits vers le dossier client
- Traces : “d’où vient l’info” (doc, champ, date)
- Gestion des erreurs et corrections.

---

# P5 — Cabinet : rôles, utilisateurs, identité visuelle (web + livrables)
Objectif : fonctionner en cabinet (plusieurs profils) + livrables à l’image du cabinet.

## PR-P5-01 — Multi-rôles (au-delà is_admin) + droits
### Travaux
- Définir 3–4 rôles simples (ex : admin, manager, conseiller, lecture)
- Modèle de droits + règles d’accès
- Ajustements interface (ce qui est visible selon rôle)

---

## PR-P5-02 — Gestion utilisateurs (interface) + processus cabinet
### Travaux
- Page gestion : création / désactivation / affectation rôle
- Règles de sécurité simples

---

## PR-P5-03 — Branding complet : couleurs cabinet + logo dans exports
### Travaux
- Alignement thème web + thème PPTX + export Excel
- Vérifier cohérence sur les livrables existants (PER/Placement/Audit).

---

# P6 — Analyse patrimoniale premium + livrables
Objectif : rendre l’audit “vraiment livrable”, standardisé, et réutilisable.

## PR-P6-01 — Audit patrimonial (PPTX) : structure stable + données minimales
- Plan de slides fixe
- Données essentielles + hypothèses + limites
- Zéro données sensibles serveur

## PR-P6-02 — Simulateur épargne / arbitrages (comparateurs)
- Scénarios comparés
- Exports exploitables en RDV

## PR-P6-03 — Simulateur prévoyance (si scope confirmé)
- Définir périmètre exact (avant code)
- Même philosophie : règles séparées des chiffres

---

# P7 — Stratégie avancée + société fine (si confirmé)
Objectif : recommandations structurées, y compris cas avec sociétés/holding.

## PR-P7-01 — Moteur de scénarios (baseline vs recommandations)
- Recommandations expliquées + hypothèses
- Comparaison claire

## PR-P7-02 — Société fine (organigramme, flux, consolidation)
- Modèle minimal utile (pas d’usine à gaz)

## PR-P7-03 — Export stratégie PPTX complet

---

# P8 — Anticipation : Catalogue produits personnalisable (à moyen terme)
Objectif : éviter que `catalog.ts` devienne bloquant si le cabinet veut personnaliser.

## PR-P8-01 — Étude / décision : catalogue en base (ou non)
- Identifier besoins “cabinet”
- Décider si/Quand migrer vers une table Supabase

## PR-P8-02 — Catalogue en base + overrides
- Disponibilité produits par cabinet
- Migration progressive (sans casser l’existant)

---

## Références (pour travailler vite)
- Features (simulateurs) : `src/features/{ir,placement,succession,per,credit,strategy,audit}`
- Engine (calculs purs) : `src/engine/**`
- Settings : `src/pages/settings/*` + `src/constants/settingsRoutes.js`
- Cache paramètres : `src/utils/fiscalSettingsCache.ts` (après P1-07-01)
- Thème cabinet : `src/settings/ThemeProvider.tsx` + `src/settings/theme/**`
- Exports : `src/pptx/**` + `src/utils/xlsxBuilder.ts`
- Snapshots `.ser1` : `src/reporting/json-io/**`
- Docs : `docs/{ARCHITECTURE,RUNBOOK,GOUVERNANCE}.md`