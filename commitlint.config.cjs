/**
 * commitlint — règles SER1
 *
 * Source du CHANGELOG via Release Please. Les commits doivent être propres :
 * - Type explicite (feat, fix, refactor, chore, docs, test, perf, style, build, ci, revert).
 * - Sujet en minuscules, descriptif, sans point final.
 * - Longueur raisonnable (le sujet apparaît tel quel dans le CHANGELOG).
 *
 * Voir `.github/CONTRIBUTING.md` § Commits & Releases.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [0],
    'subject-min-length': [2, 'always', 10],
    'subject-max-length': [2, 'always', 100],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'subject-full-stop': [2, 'never', '.'],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'chore',
        'docs',
        'test',
        'perf',
        'style',
        'build',
        'ci',
        'revert',
      ],
    ],
  },
};
