import {
  findColorPolicyViolationsInText,
  isColorPolicyPathAllowed,
  toRepoPath,
} from '../ser1-color-policy.mjs';

const noHardcodedColors = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Interdit les couleurs runtime hors alias semantiques SER1',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      noHardcodedColor:
        'Couleur hardcodee interdite: "{{color}}". Utilisez un alias semantique SER1.',
      noRawThemeVar:
        'Usage direct de "{{color}}" interdit. Utilisez --surface-active, --data-secondary, --accent-signature ou --state-warning.',
    },
  },

  create(context) {
    const repoPath = toRepoPath(context.filename ?? context.getFilename?.());
    if (isColorPolicyPathAllowed(repoPath)) {
      return {};
    }

    function checkColorInNode(node, value) {
      const violations = findColorPolicyViolationsInText(value, repoPath);
      for (const violation of violations) {
        context.report({
          node,
          messageId: violation.kind === 'raw-theme-var' ? 'noRawThemeVar' : 'noHardcodedColor',
          data: { color: violation.value },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkColorInNode(node, node.value);
        }
      },

      TemplateElement(node) {
        if (node.value?.raw) {
          checkColorInNode(node, node.value.raw);
        }
      },
    };
  },
};

const useSemanticColors = {
  meta: {
    type: 'suggestion',
    docs: {
      description: "Encourage l'utilisation des alias semantiques SER1",
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      useSemantic: 'Privilegier les alias semantiques SER1 pour le code UI nouveau.',
    },
  },

  create() {
    return {};
  },
};

const plugin = {
  meta: {
    name: 'eslint-plugin-ser1-colors',
    version: '1.1.0',
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
