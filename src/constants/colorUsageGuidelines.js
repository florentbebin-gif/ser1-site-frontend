export const COLOR_USAGE_GUIDELINES = [
  { themeKey: 'c1', legacyKey: 'color1', token: 'C1', usage: 'Titres, top bar et elements structurants.' },
  { themeKey: 'c2', legacyKey: 'color2', token: 'C2', usage: 'Actions primaires: boutons, liens, etats interactifs.' },
  { themeKey: 'c3', legacyKey: 'color3', token: 'C3', usage: 'Etat actif ou positif visible: onglets actifs, validations, reperes.' },
  { themeKey: 'c4', legacyKey: 'color4', token: 'C4', usage: 'Fond d accent doux: zones actives, survols legers, focus ring.' },
  { themeKey: 'c5', legacyKey: 'color5', token: 'C5', usage: 'Separation renforcee: liseres secondaires et blocs de synthese.' },
  { themeKey: 'c6', legacyKey: 'color6', token: 'C6', usage: 'Accent chaud decoratif: signatures visuelles non interactives.' },
  { themeKey: 'c7', legacyKey: 'color7', token: 'C7', usage: 'Fond global et surfaces neutres de l interface.' },
  { themeKey: 'c8', legacyKey: 'color8', token: 'C8', usage: 'Bordures standard, separateurs fins et contours d inputs.' },
  { themeKey: 'c9', legacyKey: 'color9', token: 'C9', usage: 'Texte secondaire: labels, aides et metadonnees.' },
  { themeKey: 'c10', legacyKey: 'color10', token: 'C10', usage: 'Texte principal et valeurs a forte lisibilite.' },
];

export const COLOR_USAGE_BY_THEME_KEY = Object.fromEntries(
  COLOR_USAGE_GUIDELINES.map((rule) => [rule.themeKey, rule])
);

export const COLOR_USAGE_BY_LEGACY_KEY = Object.fromEntries(
  COLOR_USAGE_GUIDELINES.map((rule) => [rule.legacyKey, rule])
);
