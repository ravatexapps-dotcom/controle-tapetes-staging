# G26-C-D — FINAL MONOREPO CLOSEOUT DOCUMENTATION

PROJETO: Ravatex — Controle de Tapetes (monorepo)
WORKSPACE: D:\OneDrive\Programação\Ravatex\controle-tapetes
BRANCH INTEGRADA: work/app-next
HEAD FINAL LOCAL/REMOTO: 8f1df9b6d9e80444b31ed69f3187fa52183023fb
FASE: G26-C CLOSED — STAGING CI VALIDADO

## RESULTADO

- O Documents Ingestor foi incorporado em `services/documents-ingestor`.
- `work/app-next` recebeu a integracao somente por fast-forward e foi publicado exclusivamente em `staging/work/app-next`.
- O remoto staging e a branch local terminaram no mesmo HEAD (`8f1df9b`), com divergencia `0 0`.
- Nenhum push usou `origin`; nenhum force push foi usado.
- O repositorio antigo `D:\OneDrive\Programação\Ravatex\documents-ingestor` permanece preservado para consulta e transicao, sem novos commits.

## VALIDACAO

- Suite limpa local: 39 arquivos, 673/673 testes.
- Primeiro Actions run: `29157931768`, falhou. Causas comprovadas: `tsx.cmd` hardcoded nos testes CLI e uso de `os.devNull` como manifest, que no Linux le `/dev/null` vazio.
- Correcao: `8f1df9b Fix ingestor CI cross-platform tests`; seleciona `tsx` por plataforma e envia o documento no payload do manifest sem dispositivo nulo.
- Actions final: run `29158174870`, evento `push`, SHA `8f1df9b`, conclusao `success`; executou os 39 arquivos / 673 testes.
- O aviso de deprecacao do runtime Node 20 interno de `actions/checkout@v4` e `actions/setup-node@v4` nao bloqueou o CI.

## DEBITOS

- 4 vulnerabilidades moderadas reportadas por `npm audit`.
- Metadata orfa `.git/worktrees/baseline-worktree`.
- Acumulacao do manifest remoto e debito separado: a correcao de CI garante o payload de um documento, nao implementa leitura-modificacao-escrita remota.
- Projecao futura de sha256 e attachment_id.

## PROXIMO PASSO

G26 esta fechado. Tratar os debitos separados por prioridade; nao apagar a branch `work/documents-ingestor-monorepo` nem o repositorio antigo nesta fase.
