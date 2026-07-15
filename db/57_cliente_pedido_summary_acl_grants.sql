-- ============================================================
-- Fase: CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1
-- Correcao de higiene/seguranca (staging-only, grants-only).
--
-- Evidencia: a ACL ao vivo de public.cliente_pedido_summary(uuid) em
-- staging concede EXECUTE tambem a PUBLIC, anon e service_role, alem de
-- authenticated (achado da mesma classe do db/54). O contrato canonico
-- (D-COS02, docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md)
-- pretende apenas authenticated. Busca no repositorio nao encontrou
-- nenhum consumidor real que exija service_role: nenhuma Edge Function,
-- nenhum script server-side; o unico consumidor e o cliente frontend
-- autenticado em js/screens/cliente-pedido-detail.js
-- (window.supa.rpc('cliente_pedido_summary', ...)).
--
-- Esta migration apenas ajusta grants; nao recria, nao altera corpo,
-- SECURITY DEFINER, volatilidade, search_path, owner, assinatura ou tipo
-- de retorno da funcao. Idempotente: REVOKE/GRANT sem alvo existente nao
-- falham em reexecucao.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.cliente_pedido_summary(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cliente_pedido_summary(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cliente_pedido_summary(UUID) FROM service_role;
GRANT EXECUTE ON FUNCTION public.cliente_pedido_summary(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
