-- ============================================================
-- RESET DE OPs / PRODUÇÃO — recomeçar a produção do zero
-- ============================================================
-- ESCOPO escolhido: "Só OPs + movimento"
--   APAGA: ops, op_itens, op_fornecedores, lotes,
--          entregas, entrega_itens, ordens_compra_fio,
--          saldo_fios, saldo_fios_op
--   MANTÉM: clientes, cores, modelos, fornecedores,
--           precos_terceirizada, parametros_largura, usuarios (logins)
--   RESETA: as numerações (sequences) das tabelas apagadas voltam a contar do 1
--
-- ⚠️  IRREVERSÍVEL. FAÇA UM BACKUP ANTES.
-- ⚠️  Rode no SQL Editor do Supabase. É uma transação única:
--     se algo der errado, NADA é apagado (ROLLBACK automático).
-- ============================================================

-- ------------------------------------------------------------
-- PASSO 1 (opcional): confira o que será apagado ANTES de rodar.
-- Selecione só este bloco e rode para ver as contagens atuais.
-- ------------------------------------------------------------
-- SELECT 'ops' t, count(*) FROM ops
-- UNION ALL SELECT 'op_itens', count(*) FROM op_itens
-- UNION ALL SELECT 'op_fornecedores', count(*) FROM op_fornecedores
-- UNION ALL SELECT 'lotes', count(*) FROM lotes
-- UNION ALL SELECT 'entregas', count(*) FROM entregas
-- UNION ALL SELECT 'entrega_itens', count(*) FROM entrega_itens
-- UNION ALL SELECT 'ordens_compra_fio', count(*) FROM ordens_compra_fio
-- UNION ALL SELECT 'saldo_fios', count(*) FROM saldo_fios
-- UNION ALL SELECT 'saldo_fios_op', count(*) FROM saldo_fios_op
-- UNION ALL SELECT 'clientes (MANTÉM)', count(*) FROM clientes
-- UNION ALL SELECT 'cores (MANTÉM)', count(*) FROM cores
-- UNION ALL SELECT 'modelos (MANTÉM)', count(*) FROM modelos
-- UNION ALL SELECT 'fornecedores (MANTÉM)', count(*) FROM fornecedores;

-- ------------------------------------------------------------
-- PASSO 2: o reset. Rode tudo daqui pra baixo de uma vez.
-- ------------------------------------------------------------
BEGIN;

-- 2.1 Deleção em ordem filho -> pai (respeitando as FKs RESTRICT)
DELETE FROM saldo_fios_op;
DELETE FROM saldo_fios;
DELETE FROM entrega_itens;       -- RESTRICT em op_id / op_item_id -> antes de ops e op_itens
DELETE FROM ordens_compra_fio;
DELETE FROM op_fornecedores;
DELETE FROM entregas;
DELETE FROM op_itens;
DELETE FROM ops;                 -- lote_id e self-refs origem_* são ON DELETE SET NULL
DELETE FROM lotes;               -- referencia clientes (RESTRICT); clientes é MANTIDO

-- 2.2 Reset das numerações automáticas (próximo id = 1) das tabelas apagadas
SELECT setval(pg_get_serial_sequence('public.lotes',             'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.ops',               'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.op_itens',          'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.op_fornecedores',   'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.ordens_compra_fio', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.entregas',          'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.entrega_itens',     'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.saldo_fios_op',     'id'), 1, false);

-- 2.3 Confirme que está tudo zerado (deve retornar 0 nas apagadas; cadastros mantidos)
SELECT 'ops' t, count(*) FROM ops
UNION ALL SELECT 'op_itens', count(*) FROM op_itens
UNION ALL SELECT 'lotes', count(*) FROM lotes
UNION ALL SELECT 'entregas', count(*) FROM entregas
UNION ALL SELECT 'ordens_compra_fio', count(*) FROM ordens_compra_fio
UNION ALL SELECT 'saldo_fios', count(*) FROM saldo_fios
UNION ALL SELECT 'clientes (MANTÉM)', count(*) FROM clientes
UNION ALL SELECT 'cores (MANTÉM)', count(*) FROM cores
UNION ALL SELECT 'modelos (MANTÉM)', count(*) FROM modelos
UNION ALL SELECT 'fornecedores (MANTÉM)', count(*) FROM fornecedores;

-- Se as contagens acima estiverem certas, confirme:
COMMIT;
-- Se algo parecer errado, rode:  ROLLBACK;
