# TODOs créés comme Issues GitHub

Ce fichier liste les TODOs du code qui ont été créés comme issues GitHub pour le traçage.

## Issue #17 : Implémenter le chargement réel du template PPTX
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:26`
- **Description** : Implémenter le chargement réel du fichier PPTX
- **Détails** :
  - Rechercher une bibliothèque compatible avec PPTXGenJS
  - Ou utiliser PPTXGenJS avec support de template (si disponible)
  - Ou parser le PPTX et reconstruire les slides
- **Priorité** : Medium
- **Effort estimé** : L (1-2 semaines)

## Issue #18 : Charger la structure depuis public/pptx/templates/serenity-base.pptx
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:40`
- **Description** : Charger la structure du template depuis le fichier PPTX
- **Détails** : Actuellement reconstruction minimale. Le template file est à `public/pptx/templates/serenity-base.pptx`
- **Priorité** : Medium
- **Effort estimé** : M (3-5 jours)

## Issue #19 : Définir les dimensions du slide (16:9)
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:70`
- **Description** : Définir explicitement les dimensions 16:9 des slides
- **Détails** : Actuellement géré par PPTXGenJS automatiquement. Devrait être explicite pour cohérence.
- **Priorité** : Low
- **Effort estimé** : XS (1-2 heures)

## Issue #20 : Ajouter les masters slides depuis le template
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:74`
- **Description** : Ajouter les masters slides depuis le fichier template
- **Masters à créer** :
  - Cover slide master
  - Chapter slide master
  - Content slide master
  - End slide master
- **Priorité** : Medium
- **Effort estimé** : M (3-5 jours)

## Issue #21 : Vérifier la présence réelle du fichier template
- **Fichier** : `src/pptx/template/loadBaseTemplate.ts:88`
- **Description** : Vérifier réellement si le fichier template existe avant de l'utiliser
- **Détails** : Actuellement retourne toujours `true`. Devrait vérifier `public/pptx/templates/serenity-base.pptx`
- **Priorité** : Low
- **Effort estimé** : XS (1-2 heures)

## Issue #22 : Charger l'image logo depuis l'URL et convertir en data URI
- **Fichier** : `src/pptx/ops/applyCoverLogo.ts:113`
- **Description** : Charger l'image depuis l'URL et convertir en data URI
- **Détails** : Actuellement retourne l'URL directe. Pour plus de fiabilité (CORS, disponibilité), convertir en data URI.
- **Priorité** : Medium
- **Effort estimé** : S (1 jour)

## Issue #23 : Vérifier la présence réelle des images de chapitre
- **Fichier** : `src/pptx/ops/applyChapterImage.ts:130`
- **Description** : Vérifier réellement si les images de chapitre existent avant de les utiliser
- **Détails** : Actuellement retourne `true` pour les index 1-9. Devrait vérifier `public/pptx/chapters/chapter-{index}.jpg`
- **Priorité** : Low
- **Effort estimé** : XS (1-2 heures)

## Issue #24 : Ajouter les barèmes spécifiques DMTG
- **Fichier** : `src/engine/succession.ts:86`
- **Description** : Ajouter les barèmes de succession spécifiques (frères/sœurs, etc.)
- **Détails** : Actuellement utilise uniquement le barème ligne directe. Besoin des barèmes :
  - Frères/sœurs
  - Autres collatéraux
  - Non-parents
- **Priorité** : High (impact métier)
- **Effort estimé** : M (3-5 jours)

## Issue #25 : Logo handling dans Settings.jsx (deprecated)
- **Fichier** : `src/pages/Settings.jsx:262`
- **Description** : Logo handling deprecated in V3.1 - nettoyage de compatibilité
- **Détails** : Cabinet logos now managed in admin. Ce code est kept for compatibility only et doit être retiré.
- **Priorité** : Low
- **Effort estimé** : XS (1-2 heures)
- **Statut** : ✅ **RÉSOLU** - Code deprecated supprimé dans la PR #25

---

## Statut

✅ **Toutes les issues ont été créées et les TODOs dans le code ont été mis à jour avec les références #17-#25.**
