# Règles de base — environnement & langue

## Terminal
- L'environnement est **Windows avec PowerShell**.
- Ne jamais utiliser des commandes macOS/Linux (`open`, `pbcopy`, `which`, `brew`, chemins `/usr/...`, `/dev/null`, etc.).
- Utiliser les équivalents PowerShell : `Start-Process`, `Get-Command`, `$null`, `.\script.ps1`, etc.
- Les séparateurs de chemin sont `\` sous PowerShell, mais les chemins avec `/` fonctionnent aussi dans la plupart des outils.

## Langue & orthographe
- Toujours rédiger en **français**, avec les accents (é, è, ê, à, ù, ç, î, ô…) et les apostrophes.
- Soigner la ponctuation : espace insécable avant `?`, `!`, `:`, `;` (ou à défaut espace simple).
- Si une faute d'orthographe ou de grammaire est détectée dans un fichier modifié, la corriger dans le même patch.
- Les commentaires de code, les messages de commit et les docs sont également en français.
