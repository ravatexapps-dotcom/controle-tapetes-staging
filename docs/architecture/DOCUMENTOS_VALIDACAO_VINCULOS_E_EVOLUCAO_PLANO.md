# PLANO MESTRE — DOCUMENTOS, VALIDAÇÃO HUMANA, VÍNCULOS E EVOLUÇÃO

**Projeto:** Ravatex — Controle de Tapetes / Documents Ingestor  
**Status do plano:** rascunho arquitetural para revisão do IAlead  
**Fase ativa:** consolidação de sequência, governança e backlog  
**Último marco técnico aceito:** G27 — reconhecimento documental endurecido, publicado em `staging/work/app-next`, CI verde  
**G28-A:** diagnóstico parcial em HOLD; não aprovado como contrato final de domínio, schema ou migration

---

## 1. OBJETIVO

Organizar a evolução da frente de Documentos sem quebrar a arquitetura já consolidada, preservando:

- fontes de verdade reais;
- separação entre detecção técnica, validação humana, vínculo operacional e decisão administrativa;
- integração canônica com Pedido e OP;
- continuidade visual do app;
- operação completa mesmo sem participação ativa de fornecedores;
- sequência de implementação auditável;
- backlog futuro de acesso, backup e colaboração externa.

Este plano deve ser lido em conjunto com:

- `PROJECT_STATE.md`;
- `AGENT_HANDOFF.md`;
- `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`;
- documentos de arquitetura referenciados por esses arquivos;
- contrato visual versionado, quando criado;
- skills e instruções relevantes existentes em `.claude/`.

---

# CAMADA 0 — GOVERNANÇA OBRIGATÓRIA

## 0.1 Fontes canônicas

Antes de qualquer diagnóstico, implementação, migration, UI ou integração, a IAsup deve ler:

1. `PROJECT_STATE.md`;
2. `AGENT_HANDOFF.md`;
3. `services/documents-ingestor/PROJECT_STATE.md`;
4. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`;
5. este plano;
6. demais documentos de arquitetura diretamente referenciados;
7. instruções e skills visuais aplicáveis em `.claude/`.

Nenhuma ordem deve depender apenas de memória de conversa ou relatório anterior.

## 0.2 Invariantes estruturais

### Entidades e CNPJ

- `clientes.cnpj` é a fonte direta de CNPJ de Cliente.
- `fornecedores.cnpj` é a fonte direta de CNPJ de Fornecedor.
- Cliente e Fornecedor permanecem independentes.
- O mesmo CNPJ pode existir legitimamente nas duas categorias.
- É proibido reintroduzir:
  - `parceiros`;
  - `parceiro_id`;
  - `parceiro_cnpjs`;
  - entidade empresarial genérica obrigatória;
  - dupla escrita;
  - fallback silencioso;
  - sincronização paralela;
  - fonte de verdade concorrente;
  - camada temporária que esconda arquitetura incorreta.

### Pedido, OP e documentos

- Pedido e OP são entidades operacionais reais.
- Documento deve se vincular diretamente às entidades canônicas aplicáveis.
- Nenhuma abstração de UI pode esconder entidade intermediária desnecessária.
- Nenhum vínculo genérico opaco deve substituir relações reais sem justificativa arquitetural aprovada.

### Separação de conceitos

Devem permanecer separados:

1. detecção técnica;
2. classificação sugerida;
3. evidência técnica;
4. validação humana;
5. vínculo com Pedido/OP;
6. estado operacional;
7. decisão administrativa;
8. duplicidade;
9. origem e autoria;
10. histórico e versão.

Uma decisão humana não pode apagar a evidência técnica original.

## 0.3 Regra estrutural de NF-e

A análise deve ser orientada pela direção e pela contraparte relevante.

### NF de entrada

- emitente = Fornecedor esperado;
- destinatário = CNPJ próprio da Ravatex.

### NF de saída

- emitente = CNPJ próprio da Ravatex;
- destinatário = Cliente esperado.

Não exigir match de Cliente/Fornecedor nos dois lados da nota.

## 0.4 Gate visual

Antes de alterar UI, modal, lista, tabela, card, navegação ou interação, a IAsup e a IAexec devem consultar:

- `.claude/`;
- skills visuais aplicáveis;
- instruções de UI;
- componentes existentes;
- padrões de modal, formulário, tabela e navegação;
- telas reais de Pedido e OP;
- referências de aceite visual.

Preservar:

- linguagem visual já consolidada;
- cantos com pouca curvatura;
- ausência de pílulas e sombras pesadas sem necessidade;
- terminologia PT-BR já aprovada;
- consistência entre Documentos, Pedido e OP;
- componentes e fluxos canônicos;
- responsividade e acessibilidade;
- proibição de réplicas simplificadas que não atendam ao requisito real.

## 0.5 Papel da pasta `.claude`

A pasta `.claude` deve ser inventariada antes da primeira implementação visual relevante.

Separar:

- skills operacionais;
- instruções visuais permanentes;
- configurações locais;
- exemplos e referências;
- arquivos específicos de máquina;
- conteúdo que precisa ser promovido para documentação versionada.

Regra:

- `.claude/skills` pode ensinar agentes a aplicar padrões;
- regras permanentes de produto e UI não podem existir somente em `.claude`;
- deve ser criado ou consolidado um contrato visual versionado, preferencialmente:
  - `docs/architecture/UI_VISUAL_CONTRACT.md`.

## 0.6 Gate obrigatório de conformidade

Todo relatório técnico deve incluir:

### STRUCTURAL POLICY COMPLIANCE

- arquivos canônicos lidos;
- invariantes aplicáveis;
- como foram preservadas;
- propostas rejeitadas;
- conflitos encontrados;
- decisões reservadas ao arquiteto.

Toda fase de UI deve incluir também:

### VISUAL POLICY COMPLIANCE

- arquivos e skills consultados;
- padrões reutilizados;
- desvios visuais;
- evidência de aderência;
- validação visual necessária.

Sem essas seções, a fase não pode ser aceita.

---

# CAMADA 1 — DOCUMENTOS

Esta é a frente ativa e prioritária.

## 1.1 Objetivo da primeira entrega operacional

Habilitar a seção de Documentos para que o sistema:

1. detecte arquivos candidatos;
2. apresente a sugestão técnica;
3. permita validação humana;
4. vincule corretamente a Pedido e OP;
5. mostre o documento nas superfícies corretas;
6. preserve histórico, autoria e evidência;
7. funcione de ponta a ponta em staging;
8. seja publicado para o cliente acompanhar.

Não haverá autoaceite nesta primeira versão.

---

## 1.2 Fluxo alvo

```text
Entrada do documento
→ detecção técnica
→ fila de validação
→ modal “Validar e vincular”
→ vínculos canônicos
→ exibição em Documentos / Pedido / OP
→ correção e auditoria
→ validação em staging
→ publicação para o cliente acompanhar
```

### Origens previstas

- Gmail;
- upload manual interno;
- futuramente upload do fornecedor;
- futuramente integrações externas.

Toda entrada deve registrar origem e autoria.

---

## 1.3 Detecção técnica

Registrar, quando aplicável:

- formato;
- assinatura do arquivo;
- tipo provável;
- estrutura NF-e;
- CNPJ de emitente e destinatário;
- validade de cada CNPJ;
- direção provável;
- contraparte provável;
- possíveis matches de Cliente/Fornecedor;
- conflito MIME/extensão;
- duplicidade;
- razões técnicas da sugestão.

A detecção é uma hipótese técnica, não uma decisão administrativa.

---

## 1.4 Fila de validação humana

A seção central de Documentos deve permitir:

- listar candidatos;
- filtrar pendentes;
- abrir o arquivo;
- visualizar evidência;
- visualizar alertas;
- identificar duplicidade;
- abrir validação;
- consultar vínculos;
- consultar histórico.

Estados visuais esperados, sem fechar ainda o schema:

- aguardando validação;
- validado;
- rejeitado;
- ignorado;
- validação revogada;
- duplicidade detectada;
- conflito técnico;
- registry indisponível;
- documento desconhecido.

---

## 1.5 Modal “Validar e vincular”

A ação principal recomendada é:

```text
Validar e vincular
```

O modal deve exibir:

### Evidência técnica

- nome do arquivo;
- origem;
- remetente;
- data;
- formato;
- tipo sugerido;
- direção sugerida;
- CNPJs;
- Cliente/Fornecedor possíveis;
- motivos da sugestão;
- avisos;
- preview ou acesso ao arquivo.

### Campos humanos

- tipo real;
- subtipo, quando aplicável;
- direção;
- Cliente ou Fornecedor;
- número/chave/data, quando aplicável;
- Pedido;
- OP ou OPs;
- observação;
- motivo de rejeição ou ignorar.

Os campos devem aparecer conforme o tipo selecionado.

### Ações

- validar e vincular;
- rejeitar;
- ignorar;
- cancelar;
- futuramente corrigir ou revogar.

---

## 1.6 Regras por tipo

### NF-e XML

Confirmar:

- entrada ou saída;
- emitente;
- destinatário;
- contraparte esperada;
- Pedido;
- OPs;
- número/chave/data, quando extraíveis.

### NF em PDF

- tipo apenas provável;
- confirmação humana obrigatória;
- nunca autoaceitar;
- contraparte e vínculos confirmados manualmente.

### Romaneio

Confirmar:

- Fornecedor;
- Pedido;
- OP;
- etapa ou movimento relacionado;
- data;
- observação.

### Documento desconhecido

Permitir:

- escolher tipo;
- classificar manualmente;
- vincular;
- rejeitar;
- ignorar com justificativa.

### Duplicidade

Mostrar:

- documento canônico;
- ocorrência anterior;
- vínculos existentes;
- opção de manter nova ocorrência;
- opção de reutilizar vínculos;
- opção de tratar como diferente com justificativa.

---

## 1.7 Efeitos proibidos no modal

Validar documento não deve automaticamente:

- receber material;
- concluir transferência;
- aceitar OP;
- alterar status de produção;
- movimentar estoque;
- concluir Pedido;
- gerar financeiro;
- substituir documento anterior.

Essas ações devem permanecer explícitas e separadas.

---

## 1.8 Vínculos canônicos

Primeiro escopo:

```text
Documento ↔ Pedido
Documento ↔ OP
```

Futuro, somente quando o processo exigir:

```text
Documento ↔ recebimento
Documento ↔ transferência
Documento ↔ expedição
Documento ↔ ordem de compra
```

Evitar relação genérica opaca `target_type/target_id` como atalho arquitetural.

---

## 1.9 Superfícies de exibição

Depois de validado, o documento deve aparecer em:

- tela central de Documentos;
- detalhe do Pedido;
- detalhe da OP;
- timeline/histórico aplicável;
- buscas e filtros;
- futuramente área do fornecedor.

Todas as telas devem consumir o mesmo vínculo canônico.

---

## 1.10 Correção, revogação e auditoria

Permitir:

- corrigir tipo;
- trocar contraparte;
- trocar Pedido;
- adicionar/remover OP;
- rejeitar;
- ignorar;
- revogar validação;
- restaurar;
- consultar versões;
- identificar ator e timestamp.

Nunca sobrescrever histórico silenciosamente.

---

# SEQUÊNCIA DE IMPLEMENTAÇÃO — DOCUMENTOS

## G28-P0 — Consolidação do plano e gates

Objetivo:

- aprovar este plano;
- inventariar `.claude`;
- consolidar contrato estrutural;
- consolidar contrato visual;
- registrar fontes canônicas;
- corrigir o diagnóstico G28-A.

Sem código, migration ou UI.

## G28-B1 — Contrato de domínio documental

Definir tipos puros para:

- evidência técnica;
- sugestão;
- revisão humana;
- contraparte;
- direção;
- duplicidade;
- vínculo;
- razões;
- origem;
- autoria;
- versão.

Sem persistência.

## G28-B2 — Persistência local e histórico

Persistir em SQLite:

- evidência técnica;
- estado de revisão;
- versão;
- razões;
- origem;
- autoria;
- relação de duplicidade;
- histórico.

Sem inventar dados legados.

## G28-B3 — Eventos, export e Supabase

Propagar:

```text
SQLite
→ eventos/outbox
→ JSONL
→ exportPackage
→ writer
→ Supabase
→ reader do Controle
```

Migration somente aditiva e validada primeiro em staging.

## G28-B4 — Fila de Documentos

Implementar:

- listagem;
- filtros;
- alertas;
- acesso ao arquivo;
- indicação de vínculos;
- indicação de duplicidade;
- ação de validação.

## G28-B5 — Modal de validação humana

Implementar o modal dinâmico e os contratos de ação.

## G28-B6 — Vínculos Pedido/OP

Implementar relações canônicas e regras de integridade.

## G28-B7 — Exibição nas superfícies

Exibir em:

- Documentos;
- Pedido;
- OP;
- timeline;
- buscas.

## G28-B8 — Correção, revogação e auditoria

Implementar:

- reclassificação;
- alteração de vínculos;
- revogação;
- restauração;
- histórico;
- autoria.

## G28-C — Validação real em staging

Cenários mínimos:

- NF entrada;
- NF saída;
- XML;
- PDF;
- romaneio;
- desconhecido;
- duplicidade;
- conflito MIME/extensão;
- CNPJ inválido;
- registry indisponível;
- Cliente/Fornecedor não encontrado;
- Pedido;
- OP;
- correção;
- revogação.

## G28-D — Publicação para o cliente acompanhar

Critérios:

- identificação funcional;
- validação humana;
- vínculos corretos;
- exibição nas telas;
- correção e auditoria;
- staging validado;
- CI verde;
- nenhum efeito operacional implícito.

Marco:

```text
DOCUMENTOS — CLIENT OBSERVATION RELEASE
```

Depois da publicação:

- observar uso real;
- corrigir fricções;
- medir falsos positivos;
- ajustar modal;
- validar onde os usuários procuram documentos.

---

# CAMADA 2 — ADMINISTRAÇÃO DE USUÁRIOS E ACESSOS

Frente futura, deferida até Documentos estabilizar.

## Objetivos

- listar usuários;
- criar ou convidar;
- definir perfil;
- definir permissões;
- habilitar/bloquear acesso;
- resetar senha;
- exigir troca de senha;
- consultar último acesso;
- revogar sessões, se suportado;
- auditar alterações;
- futuramente vincular usuário externo diretamente a Fornecedor.

## Política de senha

Evitar senha padrão compartilhada.

Preferir:

- senha temporária com troca obrigatória; ou
- convite para definição da primeira senha.

A senha temporária deve:

- expirar;
- ser de uso único;
- não ser recuperável;
- não ser reutilizada entre usuários.

## Sequência futura

```text
A1 — diagnóstico da autenticação
A2 — papéis e permissões
A3 — administração de usuários
A4 — convite/senha inicial
A5 — reset, bloqueio e reativação
A6 — auditoria
A7 — preparação para usuários externos
```

---

# CAMADA 3 — BACKUP EM NUVEM

Frente futura e independente.

Existe outro app com infraestrutura e frontend reaproveitáveis, mas a adaptação exige auditoria porque o app de origem usa SQLite e esta aplicação possui outra arquitetura de persistência.

## Diagnóstico obrigatório

Mapear:

- o que é copiado;
- origem dos dados;
- destino;
- criptografia;
- retenção;
- versionamento;
- agendamento;
- logs;
- checksums;
- restauração;
- tratamento de falha;
- permissões.

## Seção de backup

Exibir:

- último backup;
- próximo backup;
- tamanho;
- destino;
- retenção;
- histórico;
- falhas;
- backup manual;
- integridade;
- restauração controlada.

## Regra

Backup sem restauração testada não é considerado confiável.

Fluxo mínimo:

```text
backup
→ armazenamento
→ checksum
→ retenção
→ teste de restauração
→ auditoria
```

## Sequência futura

```text
BK1 — auditoria do app existente
BK2 — mapeamento para Ravatex
BK3 — contrato de backup
BK4 — backend
BK5 — adaptação do frontend
BK6 — retenção e histórico
BK7 — restauração controlada
BK8 — teste real de recuperação
```

---

# CAMADA 4 — PARTICIPAÇÃO FUTURA DE FORNECEDORES

A aplicação interna deve continuar funcional sem participação ativa do fornecedor.

## Princípio

Usuário externo deve se vincular diretamente a `fornecedor_id`.

Não criar parceiro genérico.

## Evolução

### F0 — preparação estrutural

Prever:

- origem;
- autoria;
- fornecedor direto;
- permissões futuras;
- histórico de submissão.

### F1 — portal somente leitura

Fornecedor pode:

- ver suas OPs;
- ver documentos autorizados;
- ver pendências;
- acompanhar transferências/recebimentos aplicáveis;
- baixar documentos permitidos.

### F2 — upload de documentos

Fornecedor pode enviar:

- NF;
- romaneio;
- comprovante;
- laudo;
- outros tipos autorizados.

Todo upload entra na mesma fila humana.

### F3 — respostas e correções

Fornecedor pode:

- responder pendência;
- substituir arquivo;
- corrigir metadados;
- receber rejeição;
- reenviar.

### F4 — participação operacional controlada

Futuramente:

- informar envio;
- confirmar expedição;
- propor transferência;
- informar quantidade;
- informar previsão;
- anexar documento de movimento.

Inicialmente, toda ação crítica exige aceite interno.

### F5 — colaboração ampliada

- notificações;
- comentários;
- SLA;
- divergências;
- aceite bilateral;
- histórico de comunicação;
- API.

---

# BACKLOG PRIORIZADO

## P0 — obrigatório antes de nova implementação

- [ ] Aprovar este plano.
- [ ] Corrigir formalmente a arquitetura proposta em G28-A.
- [ ] Inventariar `.claude`.
- [ ] Criar/consolidar contrato visual versionado.
- [ ] Tornar gates estrutural e visual obrigatórios.
- [ ] Confirmar regra de NF por direção e contraparte.
- [ ] Separar qualificação, revisão, duplicidade, vínculo e decisão.

## P1 — documentos, entrega principal

- [ ] Contrato de domínio.
- [ ] Persistência local.
- [ ] Histórico.
- [ ] Eventos/export.
- [ ] Supabase.
- [ ] Reader.
- [ ] Fila de Documentos.
- [ ] Modal Validar e vincular.
- [ ] Vínculos Pedido/OP.
- [ ] Exibição nas superfícies.
- [ ] Correção/revogação.
- [ ] Staging real.
- [ ] Publicação para cliente acompanhar.

## P2 — estabilização pós-publicação

- [ ] Observar uso real.
- [ ] Ajustar falsos positivos.
- [ ] Ajustar UX.
- [ ] Melhorar filtros.
- [ ] Melhorar histórico.
- [ ] Tratar documentos legados.
- [ ] Refinar duplicidade.

## P3 — administração

- [ ] Usuários.
- [ ] Papéis.
- [ ] Permissões.
- [ ] Senha inicial.
- [ ] Reset.
- [ ] Bloqueio.
- [ ] Auditoria.

## P4 — backup

- [ ] Auditar app existente.
- [ ] Adaptar backend.
- [ ] Adaptar frontend.
- [ ] Agendamento.
- [ ] Retenção.
- [ ] Integridade.
- [ ] Restauração testada.

## P5 — fornecedor

- [ ] Portal read-only.
- [ ] OPs.
- [ ] Documentos.
- [ ] Pendências.
- [ ] Upload.
- [ ] Correções.
- [ ] Transferências.
- [ ] Participação operacional controlada.

---

# ITENS EXPLICITAMENTE DIFERIDOS

- autoaceite de documentos;
- movimentação automática por documento;
- portal do fornecedor;
- upload externo;
- alteração operacional direta por fornecedor;
- administração completa de usuários;
- backup em nuvem;
- restauração;
- correção dos oito erros TypeScript históricos;
- vulnerabilidades npm;
- limpeza de worktrees;
- metadata órfã;
- acumulação remota de manifest.

Esses itens devem ter fases próprias.

---

# HARD STOPS

Parar e retornar ao arquiteto se:

- proposta contrariar fonte canônica;
- surgir entidade intermediária;
- houver dupla escrita ou fallback;
- for necessário misturar validação com movimentação;
- UI esconder arquitetura incorreta;
- migration preceder contrato aprovado;
- fornecedor virar dependência do fluxo interno;
- autoaceite for introduzido;
- acesso, backup ou portal contaminarem a cadeia documental ativa;
- `.claude` ou contrato visual não forem consultados em fase de UI;
- houver conflito entre documentos canônicos.

---

# ACOMPANHAMENTO PERMANENTE E MATRIZ DE FASES

> **Registro documental IAexec — fase `G28-P0`.** Esta seção foi acrescentada
> durante o registro de governança (`G28-P0`). Não substitui nenhuma decisão do
> IAlead: apenas materializa o rastreamento permanente e a governança de
> atualização exigidos para acompanhar as fases. O conteúdo arquitetural
> original acima permanece inalterado.

## Estados permitidos

`PLANNED` · `AUTHORIZED` · `IN_PROGRESS` · `TECHNICALLY_ACCEPTED` · `PUBLISHED` ·
`BLOCKED` · `REJECTED` · `DEFERRED` · `CLOSED` · `SUPERSEDED`.

## Matriz de fases

| ID | Fase | Estado | Dependências | Branch / workspace | Commit / HEAD | Evidência | Próximo passo |
|---|---|---|---|---|---|---|---|
| G28-P0 | Consolidação do plano, mapa de ativos e gates | IN_PROGRESS | G27 CLOSED/publicado | `work/g28-document-qualification` @ `controle-tapetes-g28` | `247345c8` | Este commit docs-only; plano, `CLAUDE_PROJECT_ASSET_MAP.md` e `UI_VISUAL_CONTRACT.md` registrados | Aceite do IAlead ao plano, mapa e contrato visual |
| G28-A | Diagnóstico de schema/domínio documental | HOLD / DIAGNOSTIC INPUT | G28-P0 | — | — | Diagnóstico não versionado; `db/49`, `qualified`, `duplicate` como estado e matriz de qualificação **não aprovados** | Decisão arquitetural do IAlead antes de qualquer contrato |
| G28-B1 | Contrato de domínio documental (tipos puros) | PLANNED | G28-P0 aceito + G28-A resolvido | a definir | — | — | Aguarda aceite estrutural |
| G28-B2 | Persistência local e histórico (SQLite) | PLANNED | G28-B1 | a definir | — | — | Aguarda G28-B1 |
| G28-B3 | Eventos, export e Supabase | PLANNED | G28-B2 | a definir | — | — | Migration apenas aditiva, validada em staging |
| G28-B4 | Fila de Documentos | PLANNED | G28-B3 | a definir | — | — | Aguarda G28-B3 |
| G28-B5 | Modal “Validar e vincular” | PLANNED | G28-B4 | a definir | — | — | Gate visual obrigatório |
| G28-B6 | Vínculos Pedido/OP | PLANNED | G28-B5 | a definir | — | — | Aguarda G28-B5 |
| G28-B7 | Exibição nas superfícies | PLANNED | G28-B6 | a definir | — | — | Aguarda G28-B6 |
| G28-B8 | Correção, revogação e auditoria | PLANNED | G28-B7 | a definir | — | — | Aguarda G28-B7 |
| G28-C | Validação real em staging | PLANNED | G28-B8 | a definir | — | — | Cenários mínimos da Camada 1 |
| G28-D | Publicação para o cliente acompanhar | PLANNED | G28-C | a definir | — | — | Marco `DOCUMENTOS — CLIENT OBSERVATION RELEASE` |
| CAMADA 2 (A1–A7) | Administração de usuários e acessos | DEFERRED | Documentos estabilizado | — | — | — | Só após Camada 1 publicada |
| CAMADA 3 (BK1–BK8) | Backup em nuvem e restauração testada | DEFERRED | Frente independente | — | — | — | Auditoria do app de origem |
| CAMADA 4 (F0–F5) | Participação futura de fornecedores | DEFERRED | Documentos publicado | — | — | — | Operação interna nunca depende do fornecedor |

## Governança de atualização (regra permanente)

Documentação canônica **não deve** ser atualizada antes do aceite técnico da
fase. Após cada fase **tecnicamente aceita**, e somente então, o executor deve,
em ordem:

1. atualizar este plano (matriz de fases + decisões novas);
2. atualizar `PROJECT_STATE.md` (raiz);
3. atualizar `AGENT_HANDOFF.md` (raiz);
4. atualizar o estado do serviço afetado (ex.: `services/documents-ingestor/PROJECT_STATE.md`);
5. registrar commit, evidência e próximo passo;
6. somente então encerrar (`CLOSED`) ou publicar (`PUBLISHED`) a fase.

Enquanto uma fase estiver `IN_PROGRESS`, `HOLD`, `PLANNED` ou `BLOCKED`, o
registro canônico deve refletir esse estado, sem antecipar aceite.

---

# CRITÉRIO DE FECHAMENTO DO PLANO

Este plano só passa a estado aprovado quando:

- IAlead revisar a sequência;
- arquiteto fechar as decisões em aberto;
- fontes canônicas estiverem referenciadas;
- inventário de `.claude` estiver previsto;
- backlog estiver ordenado;
- nenhum item futuro tiver sido confundido com escopo ativo;
- não houver contradição com `PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`.

---

# PRÓXIMA AÇÃO APÓS APROVAÇÃO

Criar fase documental controlada para:

```text
G28-P0 — CONSOLIDAÇÃO DO PLANO MESTRE E GATES ESTRUTURAIS/VISUAIS
```

Sem implementação funcional, sem migration e sem UI.
