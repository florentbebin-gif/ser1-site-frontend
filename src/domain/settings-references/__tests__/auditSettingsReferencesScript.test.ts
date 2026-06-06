import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/audit-settings-references.mjs');
const tempRoots: string[] = [];

type ScriptResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

type AuditReport = {
  ok: boolean;
  liveness: {
    failures: Array<Record<string, unknown>>;
    blocked: Array<Record<string, unknown>>;
  };
};

type AuditModule = {
  auditPrevoyanceSourceRows: (
    table: string,
    rows: Array<Record<string, unknown>>,
  ) => {
    counters: {
      nonSpecificNoRefReasons: number;
      missingCategoryClaims: number;
      rootOrGenericUrls: number;
    };
    findings: string[];
  };
};

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ser1-settings-references-audit-'));
  tempRoots.push(root);
  return root;
}

function writeFixture(root: string, relativePath: string, content: string) {
  const fullPath = join(root, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

function writeAuditRoot(root: string, officialUrl: string) {
  writeFixture(
    root,
    'src/domain/legal-references/references.json',
    JSON.stringify(
      [
        {
          id: 'demo-ref',
          officialUrl,
          lastCheckedAt: '2026-01-01',
          volatility: 'lawChange',
        },
      ],
      null,
      2,
    ),
  );
  writeFixture(
    root,
    'src/domain/settings-references/chain.json',
    JSON.stringify(
      [
        {
          pagePath: '/settings/impots',
          claimKey: 'fixture-http',
          refIds: ['demo-ref'],
          verifiedAt: '2026-01-01',
          volatility: 'lawChange',
        },
      ],
      null,
      2,
    ),
  );
}

function listen(server: Server) {
  return new Promise<string>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Adresse HTTP fixture invalide');
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function withHttpStatus(statusCode: number, test: (origin: string) => Promise<void>) {
  const server = createServer((_request, response) => {
    response.statusCode = statusCode;
    response.end('fixture');
  });
  const origin = await listen(server);

  try {
    await test(origin);
  } finally {
    await close(server);
  }
}

function runAudit(root: string): Promise<ScriptResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, '--root', root, '--stale', '--json'], {
      cwd: process.cwd(),
      env: { ...process.env, CI: 'false' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => {
      resolve({ status, stdout, stderr });
    });
  });
}

function parseReport(stdout: string) {
  return JSON.parse(stdout) as AuditReport;
}

async function loadAuditModule() {
  return (await import(pathToFileURL(scriptPath).href)) as AuditModule;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('audit-settings-references', () => {
  it('classe un HTTP 403 en URL bloquée sans échec CLI', async () => {
    await withHttpStatus(403, async (origin) => {
      const root = createRoot();
      writeAuditRoot(root, `${origin}/blocked`);

      const result = await runAudit(root);
      const report = parseReport(result.stdout);

      expect(result.status).toBe(0);
      expect(report.ok).toBe(true);
      expect(report.liveness.failures).toHaveLength(0);
      expect(report.liveness.blocked).toEqual([
        expect.objectContaining({ id: 'demo-ref', status: 403 }),
      ]);
    });
  });

  it('classe un HTTP 404 en URL morte avec échec CLI', async () => {
    await withHttpStatus(404, async (origin) => {
      const root = createRoot();
      writeAuditRoot(root, `${origin}/dead`);

      const result = await runAudit(root);
      const report = parseReport(result.stdout);

      expect(result.status).toBe(1);
      expect(report.ok).toBe(false);
      expect(report.liveness.failures).toEqual([
        expect.objectContaining({ id: 'demo-ref', status: 404 }),
      ]);
      expect(report.liveness.blocked).toHaveLength(0);
    });
  });

  it('signale une absence de source prévoyance dont la raison ne nomme pas le régime', async () => {
    const { auditPrevoyanceSourceRows } = await loadAuditModule();

    const audit = auditPrevoyanceSourceRows('prevoyance_regime_settings', [
      {
        code: 'cavamac',
        label: 'Agent général - CAVAMAC',
        caisse: 'CAVAMAC',
        sources: {
          references: [],
          noRefReason:
            "Aucune source institutionnelle stable et pertinente n'a encore été validée.",
        },
      },
    ]);

    expect(audit.counters.nonSpecificNoRefReasons).toBe(1);
    expect(audit.findings).toContain(
      'prevoyance_regime_settings:cavamac: noRefReason sans code, label ou caisse du régime',
    );
  });

  it('accepte une absence de source prévoyance justifiée par régime et par catégorie', async () => {
    const { auditPrevoyanceSourceRows } = await loadAuditModule();

    const audit = auditPrevoyanceSourceRows('prevoyance_regime_settings', [
      {
        code: 'cavamac',
        label: 'Agent général - CAVAMAC',
        caisse: 'CAVAMAC',
        sources: {
          references: [],
          noRefReason:
            "Aucune source institutionnelle stable et pertinente n'a été validée pour Agent général - CAVAMAC (cavamac) sur les catégories arret, invalidite, deces et cotisations.",
        },
      },
    ]);

    expect(audit.counters.nonSpecificNoRefReasons).toBe(0);
    expect(audit.counters.missingCategoryClaims).toBe(0);
    expect(audit.findings).toHaveLength(0);
  });

  it('signale une catégorie prévoyance non couverte par valeursCouvertes', async () => {
    const { auditPrevoyanceSourceRows } = await loadAuditModule();

    const audit = auditPrevoyanceSourceRows('prevoyance_regime_settings', [
      {
        code: 'cavamac',
        label: 'Agent général - CAVAMAC',
        caisse: 'CAVAMAC',
        sources: {
          references: [
            {
              titre: 'Garanties CAVAMAC',
              url: 'https://www.cavamac.fr',
              valeursCouvertes: ['arret', 'invalidite', 'deces'],
              relevanceNote:
                'La référence institutionnelle CAVAMAC est rattachée au régime cavamac de la fixture.',
              verifiedAt: '2026-06-06',
            },
          ],
        },
      },
    ]);

    expect(audit.counters.missingCategoryClaims).toBe(1);
    expect(audit.findings).toContain(
      'prevoyance_regime_settings:cavamac: catégorie prévoyance non couverte (cotisations)',
    );
  });

  it('refuse une URL prévoyance racine même si les catégories sont couvertes', async () => {
    const { auditPrevoyanceSourceRows } = await loadAuditModule();

    const audit = auditPrevoyanceSourceRows('prevoyance_regime_settings', [
      {
        code: 'cavamac',
        label: 'Agent général - CAVAMAC',
        caisse: 'CAVAMAC',
        sources: {
          references: [
            {
              titre: 'Garanties CAVAMAC',
              url: 'https://www.cavamac.fr',
              valeursCouvertes: ['arret'],
              relevanceNote:
                'La référence institutionnelle CAVAMAC est rattachée au régime cavamac de la fixture.',
              verifiedAt: '2026-06-06',
            },
          ],
          noRefReason:
            'Les catégories invalidite, deces et cotisations du régime Agent général - CAVAMAC (cavamac) restent justifiées par cette fixture.',
        },
      },
    ]);

    expect(audit.counters.rootOrGenericUrls).toBe(1);
    expect(audit.findings).toContain(
      'prevoyance_regime_settings:cavamac: URL prévoyance racine ou générique (https://www.cavamac.fr)',
    );
  });
});
