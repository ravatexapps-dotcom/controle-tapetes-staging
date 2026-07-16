const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SQL = path.join(ROOT, 'db', '58_admin_usuarios_senha_temporaria.sql');

function readOrFail(p) {
  assert.ok(fs.existsSync(p), 'arquivo nao encontrado: ' + p);
  return fs.readFileSync(p, 'utf8');
}

const sql = readOrFail(SQL);

test('SQL58: migration existe e referencia a fase A4.1', () => {
  assert.ok(fs.existsSync(SQL));
  assert.match(sql, /A4\.1/);
});

test('SQL58: adiciona usuarios.senha_temporaria BOOLEAN NOT NULL DEFAULT FALSE', () => {
  assert.match(
    sql,
    /ADD COLUMN IF NOT EXISTS senha_temporaria\s+BOOLEAN\s+NOT NULL DEFAULT FALSE/i,
  );
});

test('SQL58: adiciona usuarios.senha_gerada_em TIMESTAMPTZ NULL', () => {
  assert.match(
    sql,
    /ADD COLUMN IF NOT EXISTS senha_gerada_em\s+TIMESTAMPTZ\s+NULL/i,
  );
});

test('SQL58: usa IF NOT EXISTS (idempotente)', () => {
  const alterBlock = sql.match(/ALTER TABLE public\.usuarios[\s\S]*?;/i);
  assert.ok(alterBlock, 'bloco ALTER TABLE nao encontrado');
  assert.doesNotMatch(alterBlock[0], /ADD COLUMN(?! IF NOT EXISTS)/i);
});

test('SQL58: alveja exclusivamente public.usuarios (sem outras tabelas)', () => {
  const executableSql = sql.replace(/^\s*--.*$/gm, '');
  const alterTables = executableSql.match(/ALTER\s+TABLE\s+(\S+)/gi) || [];
  for (const a of alterTables) {
    assert.match(a, /public\.usuarios/i, 'ALTER TABLE apenas em public.usuarios: ' + a);
  }
});

test('SQL58: sem DDL/DML destrutivo', () => {
  const executableSql = sql.replace(/^\s*--.*$/gm, '');
  assert.doesNotMatch(executableSql, /DROP\s+TABLE/i);
  assert.doesNotMatch(executableSql, /DROP\s+COLUMN/i);
  assert.doesNotMatch(executableSql, /DELETE\s+FROM/i);
  assert.doesNotMatch(executableSql, /TRUNCATE/i);
  assert.doesNotMatch(executableSql, /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i);
});

test('SQL58: termina com reload do schema cache', () => {
  assert.match(sql, /NOTIFY\s+pgrst,\s*'reload\s+schema'/i);
});
