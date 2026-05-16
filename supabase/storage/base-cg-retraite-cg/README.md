# CG retraite locales

Ce dossier contient les PDF sources à uploader dans le bucket Supabase Storage `base-cg-retraite-cg`.

Les PDF ne sont pas versionnés. Conserver uniquement cette structure locale :

```text
supabase/storage/base-cg-retraite-cg/
  compagnie/
    contrat/
      version.pdf
```

Exemple pour SwissLife :

```text
supabase/storage/base-cg-retraite-cg/
  swisslife/
    swisslife-per-individuel/
      13124-09-2019.pdf
```

Le `storage_path` en base reste relatif au bucket :

```text
swisslife/swisslife-per-individuel/13124-09-2019.pdf
```

Commande d’upload :

```powershell
npx supabase storage cp ".\supabase\storage\base-cg-retraite-cg\swisslife\swisslife-per-individuel\13124-09-2019.pdf" "ss:///base-cg-retraite-cg/swisslife/swisslife-per-individuel/13124-09-2019.pdf" --content-type application/pdf
```
