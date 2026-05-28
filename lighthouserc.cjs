const profile = process.env.LHCI_PROFILE ?? 'full';
const parsedRuns = Number(process.env.LHCI_RUNS);
const numberOfRuns = Number.isFinite(parsedRuns) && parsedRuns > 0 ? parsedRuns : 1;

// Pages retenues : login public + simulateurs représentatifs et routes premium actives.
// `/settings/*` reste exclu : la surface utile dépend d'un état auth/admin et donnerait surtout du bruit.
const FULL_URLS = [
  'http://127.0.0.1:4173/login',
  'http://127.0.0.1:4173/sim/ir',
  'http://127.0.0.1:4173/sim/placement',
  'http://127.0.0.1:4173/sim/per',
  'http://127.0.0.1:4173/sim/per/transfert',
  'http://127.0.0.1:4173/sim/tresorerie-societe',
  'http://127.0.0.1:4173/sim/prevoyance',
  'http://127.0.0.1:4173/sim/credit',
  'http://127.0.0.1:4173/sim/succession',
];

const SMOKE_URLS = [
  'http://127.0.0.1:4173/login',
  'http://127.0.0.1:4173/sim/placement',
  'http://127.0.0.1:4173/sim/per/transfert',
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
