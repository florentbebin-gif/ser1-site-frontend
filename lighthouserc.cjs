const profile = process.env.LHCI_PROFILE ?? 'full';
const parsedRuns = Number(process.env.LHCI_RUNS);
const numberOfRuns = Number.isFinite(parsedRuns) && parsedRuns > 0 ? parsedRuns : 3;

const FULL_URLS = [
  'http://127.0.0.1:4173/',
  'http://127.0.0.1:4173/login',
  'http://127.0.0.1:4173/sim/ir',
  'http://127.0.0.1:4173/sim/credit',
  'http://127.0.0.1:4173/sim/succession',
  'http://127.0.0.1:4173/sim/placement',
  'http://127.0.0.1:4173/sim/per',
];

const SMOKE_URLS = [
  'http://127.0.0.1:4173/',
  'http://127.0.0.1:4173/login',
  'http://127.0.0.1:4173/sim/per',
];

const url = profile === 'smoke' ? SMOKE_URLS : FULL_URLS;

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/lhci-preview-server.mjs',
      startServerReadyPattern: 'LHCI_READY',
      url,
      numberOfRuns,
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
