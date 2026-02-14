---
description: P0-10 - Gate publication admin (règles/settings)
---

# P0-10 — Publication Gate (admin)

## 1) Définition stricte de "publication" dans SER1

Pour P0-10, **publication** = action admin qui persiste des règles métier utilisées par les moteurs de simulation.

Sont inclus:
- `tax_settings` (Impôts)
- `ps_settings` (Prélèvements sociaux)
- `base_contrat_settings` (Référentiel contrats)

Sont exclus (hors scope P0-10):
- thème UI / branding (`ui_settings`, thèmes/cabinets),
- gestion des comptes utilisateurs,
- actions support/signalements.

Raison: P0-10 cible la publication des règles fiscales/produits (risque calcul métier), pas l'administration visuelle/comptes.

---

## 2) Inventaire des points de publication (UI + fonctions)

## 2.1 Écrans et boutons

1. **/settings/impots**
   - Bouton: `Enregistrer les paramètres impôts`
   - Handler: `handleSave`
   - Fichier: `src/pages/Sous-Settings/SettingsImpots.jsx`

2. **/settings/prelevements**
   - Bouton: `Enregistrer les paramètres`
   - Handler: `handleSave`
   - Fichier: `src/pages/Sous-Settings/SettingsPrelevements.jsx`

3. **/settings/base-contrat**
   - Bouton: `Enregistrer`
   - Handler: `handleSave`
   - Fichier: `src/pages/Sous-Settings/BaseContrat.tsx`

## 2.2 Fonctions de persistance réellement appelées

1. `tax_settings`
   - `supabase.from('tax_settings').upsert({ id: 1, data: settings })`
   - Fichier: `src/pages/Sous-Settings/SettingsImpots.jsx`

2. `ps_settings`
   - `supabase.from('ps_settings').upsert({ id: 1, data: settings })`
   - Fichier: `src/pages/Sous-Settings/SettingsPrelevements.jsx`

3. `base_contrat_settings`
   - `save(settings)` via `useBaseContratSettings()`
   - puis `saveBaseContratSettings(data)`
   - puis `supabase.from('base_contrat_settings').upsert({ id: 1, data })`
   - Fichiers:
     - `src/pages/Sous-Settings/BaseContrat.tsx`
     - `src/hooks/useBaseContratSettings.ts`
     - `src/utils/baseContratSettingsCache.ts`

---

## 3) État actuel (avant patch P0-10)

- `BaseContrat` possède déjà un gate local partiel:
  - bloque si `settings.tests` vide,
  - message de blocage UI explicite,
  - mais gate non mutualisé avec les autres pages.

- `SettingsImpots` et `SettingsPrelevements`:
  - aucune vérification P0-10 avant upsert,
  - peuvent publier sans corpus de tests.

=> Le standard n'est pas uniforme.

---

## 4) Standard unique de gate proposé (P0-10)

## 4.1 Condition unique (v1 P0-10)

Pour autoriser la publication, il faut:
1. **au moins 1 test importé** (`tests.length > 0`),
2. **au moins 1 test marqué exécuté + PASS**.

Si la donnée "exécuté/PASS" n'est pas disponible, la publication est bloquée (fail-safe) avec message guidant l'admin.

> Note: ce statut peut être stocké dans le JSON de configuration (pas de migration SQL requise), par exemple sous un bloc `testGate` sérialisé dans `data`.

## 4.2 Message UI unique

Message bloquant standard (exact, identique partout):

`⚠ Publication impossible : aucun test validé. Importez et exécutez au moins un test avec résultat PASS avant de publier.`

## 4.3 Comportement UX

- Le bouton reste cliquable mais la sauvegarde est bloquée avec message (comportement actuel compatible).
- Même texte et même logique sur les 3 écrans de publication.

---

## 5) Implémentation cible (patch minimal)

Créer un guard partagé:
- **Proposition**: `src/features/settings/publicationGate.ts`
- API:
  - `evaluatePublicationGate(input) -> { allowed: boolean, reason: string, diagnostics }`
  - `P0_10_GATE_MESSAGE` constant unique

Intégrations prévues:
1. `src/pages/Sous-Settings/BaseContrat.tsx` (remplacer le gate local ad-hoc)
2. `src/pages/Sous-Settings/SettingsImpots.jsx` (ajout du gate avant upsert)
3. `src/pages/Sous-Settings/SettingsPrelevements.jsx` (ajout du gate avant upsert)

Source de vérité des tests (v1):
- `base_contrat_settings.data.tests` (déjà présent)
- pour impôts/prélèvements: lecture du même corpus (shared), afin d'avoir un standard commun inter-pages.

---

## 6) Critères Done / Stop

## Done
- Les 3 points de publication utilisent le même guard partagé.
- Même message bloquant partout.
- Au moins 1 test automatisé prouve: publication bloquée si tests manquants/non validés.
- `npm run check` passe.

## Stop (ne pas merge)
- Un des 3 écrans peut encore publier sans gate.
- Messages de blocage divergents.
- Gate contournable côté UI dans un flux standard.
- Absence de test de non-régression du blocage.

---

## 7) Hors scope confirmé

- Refonte UI premium Settings.
- Refonte structurelle des pages Settings.
- Migration DB dédiée P0-10 (non requise pour v1 du gate).
