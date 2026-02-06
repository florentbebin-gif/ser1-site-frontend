/**
 * ESLint Plugin - Color Governance
 * 
 * Règles pour interdire les couleurs hardcodées (sauf WHITE #FFFFFF et WARNING #996600)
 * Conforme à la gouvernance SER1 documentée dans docs/color-governance.md
 */

/**
 * Détecte les patterns de couleurs hex dans le code
 * Exceptions autorisées: WHITE (#FFFFFF), WARNING (#996600)
 */
const HEX_COLOR_PATTERN = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/g;
const RGB_COLOR_PATTERN = /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;
const HSL_COLOR_PATTERN = /hsla?\s*\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?/g;

const ALLOWED_COLORS = ['#ffffff', '#fff', '#996600'];

/**
 * Vérifie si une couleur est autorisée
 */
function isAllowedColor(color) {
  const normalized = color.toLowerCase().replace(/#/g, '');
  const normalizedHex = normalized.length === 3 
    ? normalized.split('').map(c => c + c).join('')
    : normalized;
  return ALLOWED_COLORS.includes('#' + normalizedHex) || 
         ALLOWED_COLORS.includes('#' + normalized);
}

/**
 * Règle ESLint: no-hardcoded-colors
 * Interdit les couleurs hardcodées sauf exceptions autorisées
 */
const noHardcodedColors = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Interdit les couleurs hardcodées (sauf #FFFFFF et #996600)',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowedColors: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noHardcodedHex: 'Couleur hex hardcodée interdite: "{{color}}". Utilisez les tokens sémantiques C1-C10 via getSemanticColors() ou DEFAULT_COLORS.',
      noHardcodedRgb: 'Couleur RGB hardcodée interdite. Utilisez les tokens sémantiques C1-C10.',
      noHardcodedHsl: 'Couleur HSL hardcodée interdite. Utilisez les tokens sémantiques C1-C10.',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const customAllowed = (options.allowedColors || []).map(c => c.toLowerCase());
    const allAllowed = [...ALLOWED_COLORS, ...customAllowed];

    function checkColorInNode(node, value) {
      // Check hex colors
      const hexMatches = value.match(HEX_COLOR_PATTERN);
      if (hexMatches) {
        hexMatches.forEach(color => {
          if (!isAllowedColor(color) && !customAllowed.includes(color.toLowerCase())) {
            context.report({
              node,
              messageId: 'noHardcodedHex',
              data: { color },
            });
          }
        });
      }

      // Check RGB colors (allow black overlay/shadow: rgba(0,0,0,...) per README §5.3)
      if (RGB_COLOR_PATTERN.test(value)) {
        const isBlackOverlay = /rgba?\s*\(\s*0\s*,\s*0\s*,\s*0/.test(value);
        if (!isBlackOverlay) {
          context.report({
            node,
            messageId: 'noHardcodedRgb',
          });
        }
      }

      // Check HSL colors
      if (HSL_COLOR_PATTERN.test(value)) {
        context.report({
          node,
          messageId: 'noHardcodedHsl',
        });
      }
    }

    return {
      // Check string literals
      Literal(node) {
        if (typeof node.value === 'string') {
          checkColorInNode(node, node.value);
        }
      },

      // Check template literals
      TemplateElement(node) {
        if (node.value && node.value.raw) {
          checkColorInNode(node, node.value.raw);
        }
      },

      // Check JSX attributes (style={{ color: '#ff0000' }})
      JSXAttribute(node) {
        if (node.name && node.name.name === 'style' && node.value) {
          // This is handled by the Literal visitor above for simple cases
          // Complex cases would need additional AST analysis
        }
      },
    };
  },
};

/**
 * Règle ESLint: use-semantic-colors
 * Encourage l'utilisation des tokens sémantiques
 */
const useSemanticColors = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Encourage l\'utilisation des tokens sémantiques C1-C10',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      useSemantic: 'Privilégiez getSemanticColors() ou DEFAULT_COLORS pour une meilleure maintenabilité.',
    },
  },

  create(context) {
    return {
      // Détecte les imports depuis les modules de couleurs
      ImportDeclaration(node) {
        const source = node.source && node.source.value;
        if (source && source.includes('semanticColors')) {
          // Good - using semantic colors
          return;
        }
      },
    };
  },
};

// Export du plugin
const plugin = {
  meta: {
    name: 'eslint-plugin-ser1-colors',
    version: '1.0.0',
  },
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'use-semantic-colors': useSemanticColors,
  },
  configs: {
    recommended: {
      plugins: ['ser1-colors'],
      rules: {
        'ser1-colors/no-hardcoded-colors': 'error',
        'ser1-colors/use-semantic-colors': 'warn',
      },
    },
  },
};

export default plugin;
export { noHardcodedColors, useSemanticColors };
