import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Keep the service-role factory independent from the package .env loaded by src/config.ts.
vi.mock('../src/config.js', () => ({
  config: {
    supabaseUrl: '',
    supabaseServiceRoleKey: '',
    supabaseProjectRef: '',
    supabaseWriterEnabled: false,
  },
}));

import {
  createServiceRoleEntityCnpjReaderClient,
  loadServiceRoleReaderConfig,
  type CreateReaderClientOptions,
} from '../src/supabase/serviceRoleReaderClient.js';
import { loadRegisteredEntityCnpjs, type SupabaseReaderClient } from '../src/core/entityCnpjReader.js';
import { loadServiceRoleConfig } from '../src/supabase/serviceRoleClient.js';

const SUPABASE_ENV_KEYS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_PROJECT_REF'] as const;

function mockEnv(base: string, key: string, ref: string): Record<string, string> {
  return {
    SUPABASE_URL: `https://${base}.supabase.co`,
    SUPABASE_SERVICE_ROLE_KEY: key,
    SUPABASE_PROJECT_REF: ref,
  };
}

const VALID_ENV = mockEnv('testproject', 'not-a-real-service-role-key', 'testproject');
const originalEnv = new Map<string, string | undefined>();

beforeEach(() => {
  for (const key of SUPABASE_ENV_KEYS) originalEnv.set(key, process.env[key]);
  Object.assign(process.env, VALID_ENV);
  vi.stubGlobal('fetch', vi.fn(() => {
    throw new Error('Network access is forbidden in service-role reader tests.');
  }));
});

afterEach(() => {
  for (const key of SUPABASE_ENV_KEYS) {
    const value = originalEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  originalEnv.clear();
  vi.unstubAllGlobals();
});

type FakeResult = { data: unknown[] | null; error: { message: string } | null };

function makeFakeInner(results: Partial<Record<string, FakeResult>> = {}) {
  const calls: Array<{ table: string; columns: string; notCol: string; notOp: string; notVal: unknown }> = [];
  const from = (table: string) => ({
    select(columns: string) {
      return {
        not(column: string, operator: string, value: unknown) {
          calls.push({ table, columns, notCol: column, notOp: operator, notVal: value });
          return Promise.resolve(results[table] ?? { data: [], error: null });
        },
      };
    },
  });
  return { from, calls };
}

function makeOptions(fakeInner = makeFakeInner()): CreateReaderClientOptions {
  return { _createClient: () => fakeInner };
}

describe('loadServiceRoleReaderConfig', () => {
  it('validates an explicit valid environment', () => {
    expect(loadServiceRoleReaderConfig(VALID_ENV)).toEqual({
      url: 'https://testproject.supabase.co',
      serviceRoleKey: 'not-a-real-service-role-key',
      projectRef: 'testproject',
    });
  });

  it.each([
    ['missing project ref', { SUPABASE_PROJECT_REF: '' }, 'supabase_project_ref_required'],
    ['mismatched project ref', { SUPABASE_PROJECT_REF: 'differentref' }, 'supabase_project_ref_mismatch'],
    ['invalid URL', { SUPABASE_URL: 'not-a-url' }, 'supabase_url_invalid'],
    ['missing service-role key', { SUPABASE_SERVICE_ROLE_KEY: '' }, '[entityCnpjReader] SUPABASE_SERVICE_ROLE_KEY is required'],
  ])('fails closed for %s', (_name, override, message) => {
    expect(() => loadServiceRoleReaderConfig({ ...VALID_ENV, ...override })).toThrow(message);
  });
});

describe('createServiceRoleEntityCnpjReaderClient', () => {
  it('creates a read-only facade with the configured URL and key', () => {
    const fakeInner = makeFakeInner();
    let captured: [string, string] | undefined;
    const client = createServiceRoleEntityCnpjReaderClient({
      _createClient: (url, key) => {
        captured = [url, key];
        return fakeInner;
      },
    });

    expect(typeof client.from).toBe('function');
    expect(captured).toEqual([VALID_ENV.SUPABASE_URL, VALID_ENV.SUPABASE_SERVICE_ROLE_KEY]);
    expect(Object.keys(client)).not.toContain('serviceRoleKey');
  });

  it('delegates allowed cliente and fornecedor reads to the fake client', async () => {
    const fakeInner = makeFakeInner();
    const client = createServiceRoleEntityCnpjReaderClient(makeOptions(fakeInner));

    await client.from('clientes').select('id, nome, cnpj').not('cnpj', 'is', null);
    await client.from('fornecedores').select('id, nome, tipo, cnpj').not('cnpj', 'is', null);

    expect(fakeInner.calls).toEqual([
      { table: 'clientes', columns: 'id, nome, cnpj', notCol: 'cnpj', notOp: 'is', notVal: null },
      { table: 'fornecedores', columns: 'id, nome, tipo, cnpj', notCol: 'cnpj', notOp: 'is', notVal: null },
    ]);
  });

  it('rejects non-registry tables before the fake client is called', () => {
    const fakeInner = makeFakeInner();
    const client = createServiceRoleEntityCnpjReaderClient(makeOptions(fakeInner));

    expect(() => client.from('pedidos')).toThrow('Table is not allowed for entity CNPJ registry reads');
    expect(fakeInner.calls).toHaveLength(0);
  });

  it('fails before client construction when process env is absent', () => {
    for (const key of SUPABASE_ENV_KEYS) delete process.env[key];
    const createClient = vi.fn(() => makeFakeInner());

    expect(() => createServiceRoleEntityCnpjReaderClient({ _createClient: createClient })).toThrow(
      '[entityCnpjReader] SUPABASE_URL is required',
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it('maps normalized registry rows from fake Supabase responses', async () => {
    const client = createServiceRoleEntityCnpjReaderClient(makeOptions(makeFakeInner({
      clientes: { data: [{ id: 1, nome: 'Cliente', cnpj: '11.222.333/0001-81' }], error: null },
      fornecedores: { data: [{ id: 2, nome: 'Fornecedor', tipo: 'tecidos', cnpj: '11.444.777/0001-61' }], error: null },
    })));

    const registry = await loadRegisteredEntityCnpjs(client);

    expect(registry.entries).toEqual([
      { entityType: 'cliente', entityId: 1, entityName: 'Cliente', cnpj: '11222333000181' },
      { entityType: 'fornecedor', entityId: 2, entityName: 'Fornecedor', cnpj: '11444777000161', supplierType: 'tecidos' },
    ]);
  });

  it('returns fake client errors without making a network request', async () => {
    const client = createServiceRoleEntityCnpjReaderClient(makeOptions(makeFakeInner({
      clientes: { data: null, error: { message: 'reader unavailable 12345678901234' } },
    })));

    const registry = await loadRegisteredEntityCnpjs(client);

    expect(registry).toMatchObject({ loaded: false, entries: [], error: 'entityCnpjReader: reader unavailable **************' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('public facade has no mutation methods', () => {
  it('exposes only from', () => {
    const client: SupabaseReaderClient = createServiceRoleEntityCnpjReaderClient(makeOptions());
    expect(Object.keys(client)).toEqual(['from']);
    for (const method of ['insert', 'update', 'delete', 'upsert', 'rpc', 'auth', 'storage']) {
      expect((client as Record<string, unknown>)[method]).toBeUndefined();
    }
  });
});

describe('reader config vs writer config', () => {
  it('does not require the writer flag', () => {
    expect(loadServiceRoleReaderConfig(VALID_ENV).projectRef).toBe('testproject');
    expect(() => loadServiceRoleConfig(VALID_ENV)).toThrow('SUPABASE_WRITER_ENABLED');
    expect(loadServiceRoleConfig({ ...VALID_ENV, SUPABASE_WRITER_ENABLED: 'true' }).projectRef).toBe('testproject');
  });
});
