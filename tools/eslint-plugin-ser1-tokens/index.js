import path from 'node:path';

/**
 * ESLint Plugin - gouvernance des tokens SIM SER1 2026.
 *
 * Les règles ciblent les styles inline JSX. Les CSS restent couverts par
 * stylelint et les scripts de gouvernance thème.
 */

const DEFAULT_ALLOWED_VALUES = new Set(['0', '0px', 'auto', 'inherit', 'initial', 'unset']);

const ruleDefinitions = {
  'no-hardcoded-spacing': {
    description: 'Interdit les espacements inline hardcodés',
    message:
      'Espacement inline hardcodé "{{value}}" sur "{{property}}". Utilisez un token var(--space-*).',
    properties: new Set([
      'gap',
      'rowGap',
      'columnGap',
      'margin',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'inset',
      'top',
      'right',
      'bottom',
      'left',
      'width',
      'height',
      'minWidth',
      'minHeight',
      'maxWidth',
      'maxHeight',
    ]),
    tokenPrefixes: ['var(--space-'],
    acceptsNumeric: true,
    forbiddenPattern: /\b\d+(?:\.\d+)?px\b/i,
  },
  'no-hardcoded-radius': {
    description: 'Interdit les rayons inline hardcodés',
    message:
      'Rayon inline hardcodé "{{value}}" sur "{{property}}". Utilisez un token var(--radius-*).',
    properties: new Set([
      'borderRadius',
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomRightRadius',
      'borderBottomLeftRadius',
    ]),
    tokenPrefixes: ['var(--radius-'],
    acceptsNumeric: true,
    forbiddenPattern: /\b\d+(?:\.\d+)?px\b/i,
  },
  'no-hardcoded-font-size': {
    description: 'Interdit les tailles de police inline hardcodées',
    message:
      'Taille de police inline hardcodée "{{value}}" sur "{{property}}". Utilisez un token var(--font-size-*).',
    properties: new Set(['fontSize']),
    tokenPrefixes: ['var(--font-size-'],
    acceptsNumeric: true,
    forbiddenPattern: /\b\d+(?:\.\d+)?px\b/i,
  },
  'no-hardcoded-transition': {
    description: 'Interdit les transitions inline hardcodées',
    message:
      'Transition inline hardcodée "{{value}}" sur "{{property}}". Utilisez var(--transition-*) et var(--easing-standard).',
    properties: new Set(['transition', 'transitionDuration']),
    tokenPrefixes: ['var(--transition-', 'var(--easing-standard)'],
    acceptsNumeric: false,
    forbiddenPattern: /\b\d+(?:\.\d+)?m?s\b/i,
  },
};

function getPropertyName(property) {
  if (property.key?.type === 'Identifier') {
    return property.key.name;
  }

  if (property.key?.type === 'Literal' && typeof property.key.value === 'string') {
    return property.key.value;
  }

  return null;
}

function literalValues(node) {
  if (!node) {
    return [];
  }

  if (node.type === 'Literal') {
    return [String(node.value)];
  }

  if (node.type === 'TemplateLiteral') {
    return node.quasis.map((quasi) => quasi.value.raw).filter(Boolean);
  }

  if (node.type === 'ConditionalExpression') {
    return [...literalValues(node.consequent), ...literalValues(node.alternate)];
  }

  return [];
}

function isAllowedTokenValue(value, tokenPrefixes) {
  const normalized = String(value).trim();
  const lower = normalized.toLowerCase();

  if (DEFAULT_ALLOWED_VALUES.has(lower)) {
    return true;
  }

  return tokenPrefixes.some((prefix) => normalized.includes(prefix));
}

function isAllowlisted(context, ruleName, property, value) {
  const options = context.options[0] ?? {};
  const allowlist = options.allowlist ?? [];
  const filename = context.filename ?? context.getFilename?.() ?? '<unknown>';
  const relativeFilename = path.relative(process.cwd(), filename).replace(/\\/g, '/');
  const normalizedValue = String(value).trim();
  const keys = [
    `${property}:${normalizedValue}`,
    `${ruleName}:${property}:${normalizedValue}`,
    `${filename}:${ruleName}:${property}:${normalizedValue}`,
    `${relativeFilename}:${ruleName}:${property}:${normalizedValue}`,
  ];

  return keys.some((key) => allowlist.includes(key));
}

function shouldReport(value, definition) {
  const normalized = String(value).trim();

  if (isAllowedTokenValue(normalized, definition.tokenPrefixes)) {
    return false;
  }

  if (definition.acceptsNumeric && /^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return normalized !== '0';
  }

  return definition.forbiddenPattern.test(normalized);
}

function createRule(ruleName, definition) {
  return {
    meta: {
      type: 'suggestion',
      docs: {
        description: definition.description,
        recommended: false,
      },
      schema: [
        {
          type: 'object',
          properties: {
            allowlist: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          additionalProperties: false,
        },
      ],
      messages: {
        hardcodedToken: definition.message,
      },
    },

    create(context) {
      function inspectStyleProperty(property) {
        const propertyName = getPropertyName(property);
        if (!propertyName || !definition.properties.has(propertyName)) {
          return;
        }

        const values = literalValues(property.value);
        for (const value of values) {
          if (!shouldReport(value, definition)) {
            continue;
          }

          if (isAllowlisted(context, ruleName, propertyName, value)) {
            continue;
          }

          context.report({
            node: property.value,
            messageId: 'hardcodedToken',
            data: {
              property: propertyName,
              value,
            },
          });
        }
      }

      function inspectStyleExpression(expression) {
        if (expression?.type !== 'ObjectExpression') {
          return;
        }

        for (const property of expression.properties) {
          if (property.type === 'Property') {
            inspectStyleProperty(property);
          }
        }
      }

      return {
        JSXAttribute(node) {
          if (node.name?.name !== 'style') {
            return;
          }

          if (node.value?.type !== 'JSXExpressionContainer') {
            return;
          }

          inspectStyleExpression(node.value.expression);
        },
      };
    },
  };
}

const rules = Object.fromEntries(
  Object.entries(ruleDefinitions).map(([ruleName, definition]) => [
    ruleName,
    createRule(ruleName, definition),
  ]),
);

const plugin = {
  meta: {
    name: 'eslint-plugin-ser1-tokens',
    version: '1.0.0',
  },
  rules,
  configs: {
    recommended: {
      plugins: ['ser1-tokens'],
      rules: Object.fromEntries(
        Object.keys(rules).map((ruleName) => [`ser1-tokens/${ruleName}`, 'error']),
      ),
    },
  },
};

export default plugin;
export { rules };
