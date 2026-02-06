# TODOs à créer comme Issues GitHub

Ce fichier liste les TODOs identifiés dans le code qui doivent être créés comme issues GitHub pour le traçage.

## Issue SER1-001 : Implémenter le chargement réel du template PPTX
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:26`
- **Description** : Implémenter le chargement réel du fichier PPTX
- **Détails** :
  - Rechercher une bibliothèque compatible avec PPTXGenJS
  - Ou utiliser PPTXGenJS avec support de template (si disponible)
  - Ou parser le PPTX et reconstruire les slides
- **Priorité** : Medium
- **Effort estimé** : L (1-2 semaines)

## Issue SER1-002 : Charger la structure depuis public/pptx/templates/serenity-base.pptx
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:39`
- **Description** : Charger la structure du template depuis le fichier PPTX
- **Détails** : Actuellement reconstruction minimale. Le template file est à `public/pptx/templates/serenity-base.pptx`
- **Priorité** : Medium
- **Effort estimé** : M (3-5 jours)

## Issue SER1-003 : Définir les dimensions du slide (16:9)
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:68`
- **Description** : Définir explicitement les dimensions 16:9 des slides
- **Détails** : Actuellement géré par PPTXGenJS automatiquement. Devrait être explicite pour cohérence.
- **Priorité** : Low
- **Effort estimé** : XS (1-2 heures)

## Issue SER1-004 : Ajouter les masters slides depuis le template
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:71-75`
- **Description** : Ajouter les masters slides depuis le fichier template
- **Masters à créer** :
  - Cover slide master
  - Chapter slide master
  - Content slide master
  - End slide master
- **Priorité** : Medium
- **Effort estimé** : M (3-5 jours)

## Issue SER1-005 : Vérifier la présence réelle du fichier template
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:84`
- **Description** : Vérifier réellement si le fichier template existe avant de l'utiliser
- **Détails** : Actuellement retourne toujours `true`. Devrait vérifier `public/pptx/templates/serenity-base.pptx`
- **Priorité** : Low
- **Effort estimé** : XS (1-2 heures)

## Issue SER1-006 : Charger l'image logo depuis l'URL et convertir en data URI
- **Fichier** : `src/pptx/ops/applyCoverLogo.ts:115`
- **Description** : Charger l'image depuis l'URL et convertir en data URI
- **Détails** : Actuellement retourne l'URL directe. Pour plus de fiabilité (CORS, disponibilité), convertir en data URI.
- **Priorité** : Medium
- **Effort estimé** : S (1 jour)

## Issue SER1-007 : Vérifier la présence réelle des images de chapitre
- **Fichier** : `src/pptx/ops/applyChapterImage.ts:130`
- **Description** : Vérifier réellement si les images de chapitre existent avant de les utiliser
- **Détails** : Actuellement retourne `true` pour les index 1-9. Devrait vérifier `public/pptx/chapters/chapter-{index}.jpg`
- **Priorité** : Low
- **Effort estimé** : XS (1-2 heures)

## Issue SER1-008 : Ajouter les barèmes spécifiques DMTG
- **Fichier** : `src/engine/succession.ts:86`
- **Description** : Ajouter les barèmes de succession spécifiques (frères/sœurs, etc.)
- **Détails** : Actuellement utilise uniquement le barème ligne directe. Besoin des barèmes :
  - Frères/sœurs
  - Autres collatéraux
  - Non-parents
- **Priorité** : High (impact métier)
- **Effort estimé** : M (3-5 jours)

## Issue SER1-009 : Logo handling dans Settings.jsx (deprecated)
- **Fichier** : `src/pages/Settings.jsx:262`
- **Description** : Logo handling deprecated in V3.1 - nettoyage de compatibilité
- **Détails** : Cabinet logos now managed in admin. Ce code est kept for compatibility only et doit être retiré.
- **Priorité** : Low
- **Effort estimé** : XS (1-2 heures)

---

## Comment créer ces issues

1. Ouvrir GitHub : https://github.com/florentbebin-gif/ser1-site-frontend/issues
2. Créer chaque issue avec le titre formaté : `[SER1-XXX] Titre de l'issue`
3. Copier la description et les détails
4. Ajouter les labels appropriés : `technical-debt`, `enhancement`, ou `bug`
5. Une fois créées, mettre à jour les TODOs dans le code avec `TODO(#<issue_number>)`
