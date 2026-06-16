-- ============================================================
-- RESET DE PRODUÇÃO — começar a usar o sistema 100%
-- ============================================================
-- ESCOPO escolhido: "Limpar quase tudo"
--   APAGA: movimento (ops, lotes, entregas, compras, saldos)
--          + clientes + cores + modelos + fornecedores + preços
--   MANTÉM: usuarios (logins admin/fornecedor) e parametros_largura
--   RESETA: todas as numerações (sequences) voltam a contar do 1
--
-- ⚠️  IRREVERSÍVEL. FAÇA UM BACKUP ANTES (veja docs/HANDOFF ou o passo 0).
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
-- UNION ALL SELECT 'ordens_compra_fio', count(*) FROM ordens_compra_fio
-- UNION ALL SELECT 'entregas', count(*) FROM entregas
-- UNION ALL SELECT 'entrega_itens', count(*) FROM entrega_itens
-- UNION ALL SELECT 'saldo_fios', count(*) FROM saldo_fios
-- UNION ALL SELECT 'saldo_fios_op', count(*) FROM saldo_fios_op
-- UNION ALL SELECT 'clientes', count(*) FROM clientes
-- UNION ALL SELECT 'cores', count(*) FROM cores
-- UNION ALL SELECT 'modelos', count(*) FROM modelos
-- UNION ALL SELECT 'fornecedores', count(*) FROM fornecedores
-- UNION ALL SELECT 'precos_terceirizada', count(*) FROM precos_terceirizada
-- UNION ALL SELECT 'usuarios (MANTÉM)', count(*) FROM usuarios
-- UNION ALL SELECT 'parametros_largura (MANTÉM)', count(*) FROM parametros_largura;

-- ------------------------------------------------------------
-- PASSO 2: o reset. Rode tudo daqui pra baixo de uma vez.
-- ------------------------------------------------------------
BEGIN;

-- 2.1 Deleção em ordem filho -> pai (respeitando as FKs RESTRICT)
DELETE FROM saldo_fios_op;
DELETE FROM saldo_fios;
DELETE FROM entrega_itens;
DELETE FROM ordens_compra_fio;
DELETE FROM op_fornecedores;
DELETE FROM entregas;
DELETE FROM op_itens;
DELETE FROM ops;                 -- self-refs origem_op_id/origem_entrega_id são ON DELETE SET NULL
DELETE FROM lotes;
DELETE FROM clientes;
DELETE FROM precos_terceirizada;
DELETE FROM modelos;             -- referencia cores (RESTRICT) -> antes de cores
DELETE FROM fornecedores;        -- usuarios.fornecedor_id vira NULL (ON DELETE SET NULL)
DELETE FROM cores;

-- 2.2 Reset das numerações automáticas (próximo id = 1)
SELECT setval(pg_get_serial_sequence('public.cores',               'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.modelos',             'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.fornecedores',        'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.precos_terceirizada', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.clientes',            'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.lotes',               'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.ops',                 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.op_itens',            'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.op_fornecedores',     'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.ordens_compra_fio',   'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.entregas',            'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.entrega_itens',       'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.saldo_fios_op',       'id'), 1, false);

-- 2.3 Confirme que está tudo zerado (deve retornar 0 em todas, exceto os MANTÉM)
SELECT 'ops' t, count(*) FROM ops
UNION ALL SELECT 'clientes', count(*) FROM clientes
UNION ALL SELECT 'cores', count(*) FROM cores
UNION ALL SELECT 'modelos', count(*) FROM modelos
UNION ALL SELECT 'fornecedores', count(*) FROM fornecedores
UNION ALL SELECT 'usuarios (MANTÉM)', count(*) FROM usuarios
UNION ALL SELECT 'parametros_largura (MANTÉM)', count(*) FROM parametros_largura;

-- Se as contagens acima estiverem certas, confirme:
COMMIT;
-- Se algo parecer errado, rode:  ROLLBACK;

-- ============================================================
-- PASSO 3 (depois): recriar fornecedores e RE-VINCULAR logins
-- ============================================================
-- Como os fornecedores foram apagados, cada login do tipo 'fornecedor'
-- ficou com usuarios.fornecedor_id = NULL. Depois de recadastrar os
-- fornecedores (pela tela do admin), re-vincule cada login assim:
--
--   UPDATE usuarios
--   SET fornecedor_id = (SELECT id FROM fornecedores WHERE nome = 'NOME DO FORNECEDOR')
--   WHERE email = 'login-do-fornecedor@exemplo.com';
--
-- Confira quais logins precisam de re-vínculo:
--   SELECT email, nome, tipo, fornecedor_id FROM usuarios WHERE tipo = 'fornecedor';
