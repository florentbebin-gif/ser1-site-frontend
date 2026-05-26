import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/admin';

interface TestResponse {
  headers: Record<string, string>;
  statusCode: number;
  body: unknown;
  setHeader: (_name: string, _value: string) => void;
  status: (_code: number) => TestResponse;
  json: (_body: unknown) => void;
  send: (_body: string) => void;
  end: () => void;
}

function createResponse(): TestResponse {
  const response: TestResponse = {
    headers: {},
    statusCode: 0,
    body: null,
    setHeader(name, value) {
      response.headers[name] = value;
    },
    status(code) {
      response.statusCode = code;
      return response;
    },
    json(body) {
      response.body = body;
    },
    send(body) {
      response.body = body;
    },
    end() {
      response.body = '';
    },
  };
  return response;
}

describe('api/admin proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('ne journalise pas le préfixe apikey transmis au proxy', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://supabase.test');
    vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key-fallback');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = createResponse();
    await handler(
      {
        method: 'POST',
        headers: {
          origin: 'http://localhost:5173',
          authorization: 'Bearer test-token',
          apikey: 'secret-api-key-value',
          'x-request-id': 'rid-test',
        },
        body: { action: 'status' },
      },
      res,
    );

    const logs = logSpy.mock.calls.flat().join('\n');
    expect(logs).not.toContain('secret-api');
    expect(logs).not.toContain(['api', 'key'].join('') + '=');
    expect(res.statusCode).toBe(200);
  });
});
