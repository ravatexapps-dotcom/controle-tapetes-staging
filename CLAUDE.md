# Controle de Tapetes — Ravatex

## Leitura obrigatória ANTES de qualquer implementação

- `PROJECT_STATE.md` — estado vigente; único dono do estado operacional atual.
- `AGENT_HANDOFF.md` — continuidade da próxima sessão.
- `docs/architecture/CODE_HEALTH_RULES.md` — 18 regras vinculantes de saúde
  arquitetural (modularização); nenhum código novo pode violá-las.
- `docs/governance/DOCUMENTATION_MODEL.md` e `docs/DOCUMENTATION_INDEX.md` —
  modelo de governança documental e árbitro de autoridade/classificação.

## Regras operacionais (resumo-ponteiro; detalhe nos canônicos)

- Toda fase exige autorização explícita do arquiteto; fases não se encadeiam
  automaticamente.
- Ambiente staging-only: Supabase `ucrjtfswnfdlxwtmxnoo`; produção **PROIBIDA**
  sem autorização explícita separada.
- Git: staging seletivo por caminho literal; sem push sem autorização
  explícita; proibidos sem autorização: `add -A`/`add .`, `reset`, `rebase`,
  force push, `merge`, `tag`, `amend`.
- Toda fase fecha com closeout documental (`PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, ledger da frente).
- Tarefa sem documentação atualizada é tarefa não concluída.

## Em caso de conflito

Este arquivo **não é autoridade** — é um ponteiro. Em divergência entre este
resumo e os documentos canônicos, os canônicos prevalecem: interromper e
reportar, não seguir este resumo.
