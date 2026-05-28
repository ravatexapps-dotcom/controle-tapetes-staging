# QA — Fase 5a: Tecelagem (parte de cima)

Pré-requisitos: OP `em_producao` com fornecedor de tecelagem atribuído (`op_fornecedores` etapa='cima').

## Cálculo (automatizado — `node --test tests/calculo-op.test.js`)
- [x] 1. `totalEntregueCimaPorItem` soma metros sem defeito.
- [x] 2. Defeitos são ignorados na soma (ficam só no banco).
- [x] 3. Arredondamento a 2 casas.
- [x] 4. Linhas sem `op_item_id` são ignoradas.
- [x] 5. Lista vazia retorna `{}`.

## Roteamento por tipo de fornecedor
- [ ] 6. Admin → cai em `#/painel`.
- [ ] 7. Fornecedor de algodão/poliéster → cai em `#/fornecedor/ordens` (Fase 4).
- [ ] 8. Fornecedor de tecelagem → cai em `#/fornecedor/entregas`.

## Fornecedor (manual, logado como tecelagem)
- [ ] 9. Lista as OPs em produção atribuídas; mostra Pedido/Ajustado/Entregue/Falta por item.
- [ ] 10. "+ Nova entrega" abre form inline; salvar grava `entregas` + `entrega_itens`.
- [ ] 11. Linha marcada como defeito grava no banco mas NÃO soma em "Entregue".
- [ ] 12. Excesso de metros entregue → "Falta" mostra valor negativo (sem bloqueio).
- [ ] 13. Histórico lista entregas próprias com botões Editar / Excluir.
- [ ] 14. Editar carrega valores existentes; salvar substitui as `entrega_itens` corretamente.
- [ ] 15. Excluir pede confirmação e remove a entrega (cascade nas `entrega_itens`).
- [ ] 16. Usuário sem `fornecedor_id` vinculado vê estado vazio amigável.

## Admin (manual, logado como admin)
- [ ] 17. Bloco "Entregas tecelagem" aparece no detalhe da OP em `em_producao`.
- [ ] 18. Resumo por item bate com o que o tecelagem vê.
- [ ] 19. Admin "+ Nova entrega" grava em nome do tecelagem (`fornecedor_id` = `op_fornecedores.cima`).
- [ ] 20. Admin consegue editar/excluir qualquer entrega da OP.
- [ ] 21. Em OP `finalizada` (quando existir, Fase 5b), o bloco é só leitura (sem botões).

## Resultado
(preencher após execução: X/21)
