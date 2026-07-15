const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SQL = path.join(ROOT, 'db', '57_cliente_pedido_summary_acl_grants.sql');
const FN = 'public.cliente_pedido_summary(UUID)';

function readOrFail(p) {
  assert.ok(fs.existsSync(p), 'arquivo nao encontrado: ' + p);
  return fs.readFileSync(p, 'utf8');
}

const sql = readOrFail(SQL);
const lower = sql.toLowerCase();

test('SQL57: migration existe como correcao de grants aditiva', () => {
  assert.ok(fs.existsSync(SQL));
  assert.match(sql, /CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1/i);
});

test('SQL57: alveja exatamente a assinatura public.cliente_pedido_summary(UUID)', () => {
  const fnLower = FN.toLowerCase();
  assert.ok(lower.includes(`revoke execute on function ${fnLower} from public`), 'deve revogar PUBLIC na assinatura exata');
  assert.ok(lower.includes(`revoke execute on function ${fnLower} from anon`), 'deve revogar anon na assinatura exata');
  assert.ok(lower.includes(`revoke execute on function ${fnLower} from service_role`), 'deve revogar service_role na assinatura exata');
  assert.ok(lower.includes(`grant execute on function ${fnLower} to authenticated`), 'deve conceder authenticated na assinatura exata');
});

test('SQL57: PUBLIC perde EXECUTE', () => {
  assert.match(sql, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.cliente_pedido_summary\(UUID\)\s+FROM\s+PUBLIC/i);
});

test('SQL57: anon perde EXECUTE', () => {
  assert.match(sql, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.cliente_pedido_summary\(UUID\)\s+FROM\s+anon/i);
});

test('SQL57: authenticated recebe/mantem EXECUTE', () => {
  assert.match(sql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.cliente_pedido_summary\(UUID\)\s+TO\s+authenticated/i);
});

test('SQL57: service_role nao recebe grant (preflight nao encontrou consumidor aprovado)', () => {
  assert.match(sql, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.cliente_pedido_summary\(UUID\)\s+FROM\s+service_role/i);
  assert.doesNotMatch(sql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.cliente_pedido_summary\(UUID\)\s+TO\s+service_role/i);
});

test('SQL57: nao redefine nem recria a funcao', () => {
  const executableSql = sql.replace(/^\s*--.*$/gm, '');
  assert.doesNotMatch(executableSql, /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i);
  assert.doesNotMatch(executableSql, /ALTER\s+FUNCTION/i);
  assert.doesNotMatch(executableSql, /DROP\s+FUNCTION/i);
});

test('SQL57: nao contem DDL/DML sobre outro objeto', () => {
  const executableSql = sql.replace(/^\s*--.*$/gm, '');
  const grantRevokeLines = executableSql
    .split('\n')
    .filter((line) => /\b(REVOKE|GRANT)\b/i.test(line));
  assert.ok(grantRevokeLines.length > 0, 'deve haver ao menos uma linha REVOKE/GRANT');
  for (const line of grantRevokeLines) {
    assert.match(line, /cliente_pedido_summary\(UUID\)/i, 'toda linha REVOKE/GRANT deve mirar cliente_pedido_summary(UUID): ' + line);
  }
  assert.doesNotMatch(executableSql, /DELETE\s+FROM/i);
  assert.doesNotMatch(executableSql, /UPDATE\s+/i);
  assert.doesNotMatch(executableSql, /INSERT\s+INTO/i);
  assert.doesNotMatch(executableSql, /DROP\s+TABLE/i);
  assert.doesNotMatch(executableSql, /ALTER\s+TABLE/i);
});

test('SQL57: termina com reload do schema cache (idempotente, sem apply de db/30)', () => {
  assert.match(sql, /NOTIFY\s+pgrst,\s*'reload\s+schema'/i);
  assert.doesNotMatch(sql, /30_cliente_pedido_summary_readmodel/i);
});
