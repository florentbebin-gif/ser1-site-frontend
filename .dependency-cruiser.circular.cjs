'use strict';

const base = require('./.dependency-cruiser.cjs');

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Aucun cycle de dépendances dans src/ — le graphe doit rester acyclique.',
      from: {},
      to: { circular: true },
    },
  ],
  options: base.options,
};
