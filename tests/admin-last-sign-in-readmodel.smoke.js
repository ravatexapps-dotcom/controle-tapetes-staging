const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SQL = path.join(ROOT, 'db', '59_admin_last_sign_in_readmodel.sql');
const FN = 'public.admin_usuarios_last_sign_in()';

function readOrFail(p) {
  assert.ok(fs.existsSync(p), 'arquivo nao encontrado: ' + p);
  return fs.readFileSync(p, 'utf8');
}

const sql = readOrFail(SQL);
const lower = sql.toLowerCase();

test('SQL59: migration existe e referencia CAMADA2-LAST-ACCESS-RPC', () => {
  assert.ok(fs.existsSync(SQL));
  assert.match(sql, /CAMADA2-LAST-ACCESS-RPC/);
});

test('SQL59: cria a funcao com a assinatura esperada', () => {
  assert.match(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.admin_usuarios_last_sign_in\(\)/i);
});

test('SQL59: retorna TABLE(id UUID, last_sign_in_at TIMESTAMPTZ)', () => {
  assert.match(sql, /RETURNS\s+TABLE\s*\(\s*id\s+UUID\s*,\s*last_sign_in_at\s+TIMESTAMPTZ\s*\)/i);
});

test('SQL59: SECURITY DEFINER, STABLE, search_path=public,auth', () => {
  assert.match(sql, /SECURITY\s+DEFINER/i);
  assert.match(sql, /\bSTABLE\b/i);
  assert.match(sql, /SET\s+search_path\s*=\s*public,\s*auth/i);
});

test('SQL59: guarda admin-only via is_admin() com RAISE EXCEPTION 42501', () => {
  assert.match(sql, /IF\s+NOT\s+public\.is_admin\(\)\s+THEN/i);
  assert.match(sql, /RAISE\s+EXCEPTION[\s\S]{0,120}USING\s+ERRCODE\s*=\s*'42501'/i);
});

test('SQL59: consulta apenas id e last_sign_in_at de auth.users, sem outras colunas sensiveis', () => {
  const selectBlock = sql.match(/SELECT\s+u\.id,\s*au\.last_sign_in_at[\s\S]*?;/i);
  assert.ok(selectBlock, 'SELECT esperado nao encontrado');
  assert.doesNotMatch(selectBlock[0], /\bemail\b/i);
  assert.doesNotMatch(selectBlock[0], /encrypted_password/i);
  assert.doesNotMatch(selectBlock[0], /raw_user_meta_data/i);
  assert.match(selectBlock[0], /FROM\s+public\.usuarios\s+u/i);
  assert.match(selectBlock[0], /JOIN\s+auth\.users\s+au\s+ON\s+au\.id\s*=\s*u\.id/i);
});

test('SQL59: grants explicitos — REVOKE de PUBLIC/anon/service_role, GRANT apenas a authenticated', () => {
  const fnLower = FN.toLowerCase();
  assert.ok(lower.includes(`revoke execute on function ${fnLower} from public`), 'deve revogar PUBLIC');
  assert.ok(lower.includes(`revoke execute on function ${fnLower} from anon`), 'deve revogar anon');
  assert.ok(lower.includes(`revoke execute on function ${fnLower} from service_role`), 'deve revogar service_role');
  assert.ok(lower.includes(`grant execute on function ${fnLower} to authenticated`), 'deve conceder authenticated');
});

test('SQL59: sem DDL destrutivo, sem alteracao de outras tabelas', () => {
  const executableSql = sql.replace(/^\s*--.*$/gm, '');
  assert.doesNotMatch(executableSql, /DROP\s+TABLE/i);
  assert.doesNotMatch(executableSql, /DELETE\s+FROM/i);
  assert.doesNotMatch(executableSql, /UPDATE\s+public\./i);
  assert.doesNotMatch(executableSql, /ALTER\s+TABLE/i);
});

test('SQL59: termina com reload do schema cache', () => {
  assert.match(sql, /NOTIFY\s+pgrst,\s*'reload\s+schema'/i);
});
