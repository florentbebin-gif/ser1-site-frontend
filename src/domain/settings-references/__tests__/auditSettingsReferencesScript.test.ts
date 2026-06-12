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
    checked: number;
    failures: Array<Record<string, unknown>>;
    blocked: Array<Record<string, unknown>>;
  };
  storage?: {
    enabled: boolean;
    error?: string;
  };
};

type AuditModule = {
  getStaleAssessment: (
    isoDate: string,
    volatility: string,
    now?: Date,
  ) => {
    stale: boolean;
    ageDays: number;
    deadline?: string;
    thresholdDays?: number;
  };
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
  summarizeReferenceAuditReport: (report: Record<string, unknown>) => {
    requiresAction: boolean;
    staleBindingCount: number;
    staleReferenceCount: number;
    urlFailureCount: number;
    urlBlockedCount: number;
    urlInconclusiveCount: number;
    dbFindingCount: number;
    warningCount: number;
    errorCount: number;
  };
  buildReferenceAuditReportRow: (
    report: Record<string, unknown>,
    context: Record<string, string | null>,
  ) => Record<string, unknown>;
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
          pagePath: '/settings/memento',
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

function runAudit(
  root: string,
  extraArgs: string[] = [],
  envOverrides: Record<string, string | undefined> = {},
): Promise<ScriptResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [scriptPath, '--root', root, '--stale', '--json', ...extraArgs],
      {
        cwd: process.cwd(),
        env: { ...process.env, CI: 'false', ...envOverrides },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
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
  return (await import(/* @vite-ignore */ pathToFileURL(scriptPath).href)) as AuditModule;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('audit-settings-references', () => {
  it("bloque une attestation annuelle à partir du 1er février de l'année suivante", async () => {
    const { getStaleAssessment } = await loadAuditModule();

    expect(getStaleAssessment('2026-06-06', 'annual', new Date('2027-01-31T12:00:00Z'))).toEqual(
      expect.objectContaining({
        stale: false,
        deadline: '2027-02-01',
      }),
    );
    expect(getStaleAssessment('2026-06-06', 'annual', new Date('2027-02-01T00:00:00Z'))).toEqual(
      expect.objectContaining({
        stale: true,
        deadline: '2027-02-01',
      }),
    );
  });

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

  it('force le fetch URL en CI avec --fetch', async () => {
    await withHttpStatus(404, async (origin) => {
      const root = createRoot();
      writeAuditRoot(root, `${origin}/dead`);

      const withoutFetch = await runAudit(root, [], { CI: 'true' });
      const withoutFetchReport = parseReport(withoutFetch.stdout);
      const withFetch = await runAudit(root, ['--fetch'], { CI: 'true' });
      const withFetchReport = parseReport(withFetch.stdout);

      expect(withoutFetch.status).toBe(0);
      expect(withoutFetchReport.liveness.checked).toBe(0);
      expect(withFetch.status).toBe(1);
      expect(withFetchReport.liveness.failures).toEqual([
        expect.objectContaining({ id: 'demo-ref', status: 404 }),
      ]);
    });
  });

  it('résume un rapport stockable dans Supabase', async () => {
    const { summarizeReferenceAuditReport, buildReferenceAuditReportRow } = await loadAuditModule();
    const report = {
      ok: false,
      bindingCount: 444,
      referencedUrlCount: 173,
      stale: { bindings: [{ claimKey: 'a' }], references: [{ id: 'b' }] },
      liveness: {
        checked: 173,
        failures: [{ id: 'dead' }],
        blocked: [{ id: 'blocked' }],
        inconclusive: [{ id: 'later' }],
        warnings: ['warning'],
      },
      db: { findings: ['db finding'], warnings: [] },
      warnings: ['warning'],
      errors: ['erreur'],
    };

    const summary = summarizeReferenceAuditReport(report);
    const row = buildReferenceAuditReportRow(report, {
      source: 'github_actions',
      workflowName: 'Settings reference audit',
      githubRunId: '123',
      githubRunAttempt: '1',
      commitSha: 'abc',
      repository: 'florentbebin-gif/ser1-site-frontend',
      runUrl: 'https://github.com/florentbebin-gif/ser1-site-frontend/actions/runs/123',
    });

    expect(summary).toMatchObject({
      requiresAction: true,
      staleBindingCount: 1,
      staleReferenceCount: 1,
      urlFailureCount: 1,
      urlBlockedCount: 1,
      urlInconclusiveCount: 1,
      dbFindingCount: 1,
      warningCount: 1,
      errorCount: 1,
    });
    expect(row).toMatchObject({
      ok: false,
      requires_action: true,
      binding_count: 444,
      referenced_url_count: 173,
      stale_binding_count: 1,
      stale_reference_count: 1,
      url_failure_count: 1,
      source: 'github_actions',
      github_run_id: '123',
    });
    expect(row.report).toBe(report);
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
