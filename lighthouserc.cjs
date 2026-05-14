module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/lhci-preview-server.mjs',
      startServerReadyPattern: 'LHCI_READY',
      url: [
        'http://127.0.0.1:4173/',
        'http://127.0.0.1:4173/login',
        'http://127.0.0.1:4173/sim/ir',
        'http://127.0.0.1:4173/sim/credit',
        'http://127.0.0.1:4173/sim/succession',
        'http://127.0.0.1:4173/sim/placement',
        'http://127.0.0.1:4173/sim/per',
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.55 }],
        'categories:accessibility': ['warn', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.75 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
