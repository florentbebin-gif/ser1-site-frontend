# Prompt Détaillé - Issue #24 : Barèmes DMTG Complets avec Référentiel Admin

## 🎯 Objectif Global
Transformer les barèmes DMTG (Droits de Mutation à Titre Gratuit) en un **référentiel modifiable par l'admin** dans la page `/settings/impots`, avec support complet des différents liens de parenté (ligne directe, frères/sœurs, neveux/nièces, autres).

---

## 📋 Contexte Actuel

### Architecture Existante
- **Stockage** : Table `tax_settings` (id=1, colonne `data` JSONB)
- **Page Admin** : `src/pages/Sous-Settings/SettingsImpots.jsx`
- **Engine** : `src/engine/succession.ts` + `src/engine/civil.ts`
- **Cache** : `src/utils/fiscalSettingsCache.js` (invalidate + broadcast)
- **Section DMTG Actuelle** : Lignes 1145-1187 de SettingsImpots.jsx
  - Titre : "Droits de Mutation à Titre Gratuit (DMTG) - Ligne directe"
  - Contient : `abattementLigneDirecte` + barème progressif (7 tranches)

### Données Actuelles (DEFAULT_TAX_SETTINGS)
```javascript
dmtg: {
  abattementLigneDirecte: 100000,
  scale: [
    { from: 0, to: 8072, rate: 5 },
    { from: 8072, to: 12109, rate: 10 },
    { from: 12109, to: 15932, rate: 15 },
    { from: 15932, to: 552324, rate: 20 },
    { from: 552324, to: 902838, rate: 30 },
    { from: 902838, to: 1805677, rate: 40 },
    { from: 1805677, to: null, rate: 45 },
  ],
}
```

---

## 📝 Spécifications Techniques

### 1. Mise à Jour du Modèle de Données

**Modifier DEFAULT_TAX_SETTINGS dans SettingsImpots.jsx (ligne ~138)** :

```typescript
interface DmtgScaleItem {
  from: number;
  to: number | null;
  rate: number;
}

interface DmtgCategory {
  abattement: number;
  scale: DmtgScaleItem[];
}

interface DmtgSettings {
  ligneDirecte: DmtgCategory;
  frereSoeur: DmtgCategory;
  neveuNiece: DmtgCategory;
  autre: DmtgCategory;
}
```

**Nouvelle structure DEFAULT_TAX_SETTINGS.dmtg** :
```javascript
dmtg: {
  // Ligne directe (existant - à migrer)
  ligneDirecte: {
    abattement: 100000,
    scale: [ /* 7 tranches */ ]
  },
  // Frères/Sœurs (nouveau)
  frereSoeur: {
    abattement: 15932,
    scale: [
      { from: 0, to: 24430, rate: 35 },
      { from: 24430, to: null, rate: 45 },
    ]
  },
  // Neveux/Nièces (nouveau)
  neveuNiece: {
    abattement: 7967,
    scale: [
      { from: 0, to: 15932, rate: 55 },
      { from: 15932, to: null, rate: 55 },
    ]
  },
  // Autres / Non-parents (nouveau)
  autre: {
    abattement: 1594,
    scale: [
      { from: 0, to: null, rate: 60 },
    ]
  },
}
```

### 2. Modification de l'UI SettingsImpots.jsx

**Changements requis** :

#### A) Renommer l'accordéon (ligne 1148)
- **AVANT** : `"Droits de Mutation à Titre Gratuit (DMTG) - Ligne directe"`
- **APRÈS** : `"Droits de Mutation à Titre Gratuit (DMTG)"`

#### B) Restructurer le contenu de l'accordéon (lignes 1151-1187)
Remplacer le contenu actuel par **4 sous-sections** (une par catégorie) :

```jsx
<div className="fisc-acc-body" id="impots-panel-dmtg" role="region" aria-labelledby="impots-header-dmtg">
  <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
    Barèmes applicables aux successions et donations selon le lien de parenté.
    Utilisés par le simulateur de placement pour la phase de transmission.
  </p>

  {/* Sous-sections */}
  {[
    { key: 'ligneDirecte', title: 'Ligne directe (enfants, petits-enfants)', defaultOpen: true },
    { key: 'frereSoeur', title: 'Frères et sœurs' },
    { key: 'neveuNiece', title: 'Neveux et nièces' },
    { key: 'autre', title: 'Autres (non-parents)' },
  ].map(({ key, title, defaultOpen }) => (
    <DmtgCategorySection
      key={key}
      title={title}
      categoryKey={key}
      data={dmtg?.[key]}
      isAdmin={isAdmin}
      onUpdate={updateDmtgCategory}
      defaultOpen={defaultOpen}
    />
  ))}
</div>
```

#### C) Créer le composant interne `DmtgCategorySection`
Dans le même fichier (avant le composant principal ou inline), créer un sous-composant :

```jsx
function DmtgCategorySection({ title, categoryKey, data, isAdmin, onUpdate, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (!data) return null;
  
  return (
    <div className="income-tax-block" style={{ marginBottom: 24 }}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 0',
          fontWeight: 600,
          fontSize: 15,
          color: 'var(--color-c1)'
        }}
      >
        <span>{isOpen ? '▾' : '▸'}</span>
        <span>{title}</span>
      </button>
      
      {isOpen && (
        <div style={{ marginTop: 12, paddingLeft: 24 }}>
          {/* Abattement */}
          <div className="settings-field-row" style={{ marginBottom: 16 }}>
            <label>Abattement</label>
            <input
              type="number"
              value={numberOrEmpty(data.abattement)}
              onChange={(e) => onUpdate(categoryKey, 'abattement', 
                e.target.value === '' ? null : Number(e.target.value))}
              disabled={!isAdmin}
            />
            <span>€</span>
          </div>
          
          {/* Barème progressif */}
          <div className="income-tax-block-title">Barème progressif</div>
          <SettingsTable
            columns={[
              { key: 'from', header: 'De (€)' },
              { key: 'to', header: 'À (€)' },
              { key: 'rate', header: 'Taux %', step: '0.1', className: 'taux-col' },
            ]}
            rows={data.scale || []}
            onCellChange={(idx, key, value) => onUpdate(categoryKey, 'scale', { idx, key, value })}
            disabled={!isAdmin}
          />
        </div>
      )}
    </div>
  );
}
```

#### D) Mettre à jour les helpers de MAJ
Remplacer `updateDmtgScale` par `updateDmtgCategory` (ligne ~271) :

```javascript
const updateDmtgCategory = (categoryKey, field, value) => {
  setData((prev) => {
    const category = prev.dmtg?.[categoryKey];
    if (!category) return prev;
    
    // Mise à jour du barème (tableau)
    if (field === 'scale' && typeof value === 'object' && 'idx' in value) {
      const { idx, key, value: cellValue } = value;
      return {
        ...prev,
        dmtg: {
          ...prev.dmtg,
          [categoryKey]: {
            ...category,
            scale: category.scale.map((row, i) =>
              i === idx ? { ...row, [key]: cellValue } : row
            ),
          },
        },
      };
    }
    
    // Mise à jour simple (abattement)
    return {
      ...prev,
      dmtg: {
        ...prev.dmtg,
        [categoryKey]: {
          ...category,
          [field]: value,
        },
      },
    };
  });
  setMessage('');
};
```

### 3. Migration des Données Existantes

**Problème** : Les données existantes ont la structure ancienne (`dmtg.abattementLigneDirecte` + `dmtg.scale`).

**Solution** : Implémenter une logique de migration dans le `useEffect` de chargement (ligne ~185-198) :

```javascript
// Migration des anciennes données DMTG vers nouvelle structure
const migratedData = migrateDmtgData(rows[0].data);

function migrateDmtgData(data) {
  if (!data?.dmtg) return data;
  
  // Détection structure ancienne
  const hasOldStructure = data.dmtg.abattementLigneDirecte !== undefined;
  const hasNewStructure = data.dmtg.ligneDirecte !== undefined;
  
  if (hasOldStructure && !hasNewStructure) {
    return {
      ...data,
      dmtg: {
        ligneDirecte: {
          abattement: data.dmtg.abattementLigneDirecte,
          scale: data.dmtg.scale,
        },
        frereSoeur: DEFAULT_TAX_SETTINGS.dmtg.frereSoeur,
        neveuNiece: DEFAULT_TAX_SETTINGS.dmtg.neveuNiece,
        autre: DEFAULT_TAX_SETTINGS.dmtg.autre,
      },
    };
  }
  
  // Fusion avec défauts pour les catégories manquantes
  return {
    ...data,
    dmtg: {
      ligneDirecte: data.dmtg.ligneDirecte || DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte,
      frereSoeur: data.dmtg.frereSoeur || DEFAULT_TAX_SETTINGS.dmtg.frereSoeur,
      neveuNiece: data.dmtg.neveuNiece || DEFAULT_TAX_SETTINGS.dmtg.neveuNiece,
      autre: data.dmtg.autre || DEFAULT_TAX_SETTINGS.dmtg.autre,
    },
  };
}
```

### 4. Mise à Jour de l'Engine

**Fichier** : `src/engine/civil.ts`

#### A) Remplacer les constantes hardcodées
Supprimer (ou marquer @deprecated) :
```typescript
// @deprecated - Utiliser les valeurs depuis tax_settings via SettingsImpots
export const ABATTEMENT_ENFANT = 100_000;
export const BAREME_DMTG_LIGNE_DIRECTE = [...];
```

#### B) Créer le type DMTG
```typescript
export interface DmtgScaleItem {
  from: number;
  to: number | null;
  rate: number;
}

export interface DmtgCategory {
  abattement: number;
  scale: DmtgScaleItem[];
}

export interface DmtgSettings {
  ligneDirecte: DmtgCategory;
  frereSoeur: DmtgCategory;
  neveuNiece: DmtgCategory;
  autre: DmtgCategory;
}
```

#### C) Créer une fonction de récupération des settings
```typescript
import { getTaxSettings } from '../utils/fiscalSettingsCache';

export function getDmtgSettings(): DmtgSettings {
  const settings = getTaxSettings();
  return settings?.dmtg || {
    ligneDirecte: { abattement: 100000, scale: BAREME_DMTG_LIGNE_DIRECTE },
    frereSoeur: { abattement: 15932, scale: [{ from: 0, to: 24430, rate: 35 }, { from: 24430, to: null, rate: 45 }] },
    neveuNiece: { abattement: 7967, scale: [{ from: 0, to: null, rate: 55 }] },
    autre: { abattement: 1594, scale: [{ from: 0, to: null, rate: 60 }] },
  };
}
```

### 5. Mise à Jour de succession.ts

**Fichier** : `src/engine/succession.ts`

#### A) Modifier `getAbattement()` (ligne ~62)
```typescript
import { getDmtgSettings } from './civil';

export function getAbattement(lien: LienParente): number {
  const settings = getDmtgSettings();
  
  switch (lien) {
    case 'conjoint':
      return Infinity;
    case 'enfant':
    case 'petit_enfant':
      return settings.ligneDirecte.abattement;
    case 'frere_soeur':
      return settings.frereSoeur.abattement;
    case 'neveu_niece':
      return settings.neveuNiece.abattement;
    default:
      return settings.autre.abattement;
  }
}
```

#### B) Modifier `calculateDMTG()` (ligne ~81)
```typescript
function calculateDMTG(baseImposable: number, lien: LienParente): number {
  if (lien === 'conjoint') return 0;
  if (baseImposable <= 0) return 0;

  const settings = getDmtgSettings();
  let scale: DmtgScaleItem[];
  
  switch (lien) {
    case 'enfant':
    case 'petit_enfant':
      scale = settings.ligneDirecte.scale;
      break;
    case 'frere_soeur':
      scale = settings.frereSoeur.scale;
      break;
    case 'neveu_niece':
      scale = settings.neveuNiece.scale;
      break;
    default:
      scale = settings.autre.scale;
  }
  
  let droits = 0;
  for (const tranche of scale) {
    if (baseImposable > tranche.from) {
      const base = Math.min(baseImposable, tranche.to ?? Infinity) - tranche.from;
      droits += base * (tranche.rate / 100);
    }
  }
  
  return Math.round(droits);
}
```

#### C) Supprimer le TODO(#24)
Supprimer la ligne 86 : `// TODO(#24): Ajouter les barèmes spécifiques...`

### 6. Cache et Synchronisation

**Vérifier** que `fiscalSettingsCache.js` existe et supporte les nouvelles clés :
- Le cache doit pouvoir stocker et récupérer `taxSettings.dmtg`
- L'invalidation via `invalidate('tax')` doit fonctionner
- Le broadcast doit notifier tous les onglets

### 7. Style et UI-Governance

**Conformité requise** (`docs/design/ui-governance.md`, `docs/design/color-governance.md`) :

| Élément | Règle |
|---------|-------|
| **Fond** | `var(--color-c7)` pour le fond de l'accordéon |
| **Inputs** | `#FFFFFF` avec bordure `var(--color-c8)` |
| **Focus** | Bordure `var(--color-c2)` + ring `var(--color-c4)` |
| **Titres** | `var(--color-c1)`, font-weight 600 |
| **Texte secondaire** | `var(--color-c9)` |
| **Espacement** | gap 24px entre sections |

**Composants à réutiliser** :
- `SettingsTable` (existant)
- `SettingsFieldRow` (existant)
- `numberOrEmpty()` helper (existant)

---

## 🔧 Mise à Jour Supabase (si nécessaire)

### Schéma Actuel
```sql
CREATE TABLE tax_settings (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Pas de migration SQL nécessaire
La structure JSONB permet d'ajouter des champs sans migration. Cependant, **vérifier** :
- Que la table existe
- Que la colonne `data` peut accueillir des objets imbriqués
- Que les RLS policies permettent aux admins de modifier

### Vérification RLS
```sql
-- Vérifier que les policies existent
SELECT * FROM pg_policies WHERE tablename = 'tax_settings';
```

---

## ✅ Checklist de Validation

### Phase 1 : Frontend
- [ ] DEFAULT_TAX_SETTINGS mis à jour avec 4 catégories
- [ ] Composant `DmtgCategorySection` créé
- [ ] UI avec accordéons imbriqués fonctionnelle
- [ ] Migration des données anciennes testée
- [ ] Styles conformes à color-governance et ui-governance
- [ ] Bouton "Enregistrer" persiste correctement

### Phase 2 : Engine
- [ ] Types TypeScript créés dans civil.ts
- [ ] `getDmtgSettings()` fonctionne avec le cache
- [ ] `getAbattement()` utilise les settings
- [ ] `calculateDMTG()` utilise les settings par catégorie
- [ ] TODO(#24) supprimé du code

### Phase 3 : Intégration
- [ ] Changement d'une valeur dans SettingsImpots → succession.ts utilise la nouvelle valeur
- [ ] Cache invalidé correctement après sauvegarde
- [ ] Broadcast fonctionne (multi-onglets)

### Phase 4 : Tests
- [ ] Test ligne directe : abattement 100K€ + barème
- [ ] Test frère/sœur : abattement 15,932€ + taux 35%/45%
- [ ] Test neveu/nièce : abattement 7,967€ + taux 55%
- [ ] Test autre : abattement 1,594€ + taux 60%

---

## 📁 Fichiers à Modifier

| Fichier | Lignes | Changements |
|---------|--------|-------------|
| `src/pages/Sous-Settings/SettingsImpots.jsx` | 138-150, 271-282, 1145-1187 | Structure DMTG, helpers, UI |
| `src/engine/civil.ts` | 103-115, +nouveau | Types, getDmtgSettings() |
| `src/engine/succession.ts` | 62-76, 81-98 | getAbattement, calculateDMTG |
| `src/engine/__tests__/succession.test.ts` | +nouveau | Tests barèmes |

---

## 🚫 Contraintes

1. **Pas de valeurs hardcodées** dans succession.ts (sauf fallback par défaut)
2. **Pas de breaking change** : migration automatique des anciennes données
3. **Style strict** : respecter color-governance.md et ui-governance.md
4. **Cache fonctionnel** : invalidate/broadcast doit rafraîchir toutes les pages
5. **TypeScript strict** : tous les types doivent être définis

---

## 📚 Références

- `docs/design/color-governance.md` - Tokens C1-C10
- `docs/design/ui-governance.md` - Standards "Gestion Privée"
- `src/engine/succession.ts` - Logique de calcul actuelle
- `src/pages/Sous-Settings/SettingsImpots.jsx` - UI existante
- Barèmes officiels DMTG 2024 : https://www.impots.gouv.fr
