# AGENT HANDOFF

## Branch/HEAD/Status
### documentos-ingestor (este repositório)
- Branch: master
- HEAD: `956682d` — G12-B folder taxonomy path builders + tests (patch pequeno, sem ativação no fluxo real)

### Controle de Tapetes (staging/work/app-next)
- HEAD canônico: `997486a`

## Fase concluída
RAVATEX-DOCUMENTS-G12-B-FOLDER-TAXONOMY-PATHS

## Fase anterior
G12-A — Design da taxonomia futura de Drive

## Objetivo da fase G12-B
Materializar helpers de paths para a taxonomia futura definida em G12-A, com testes, sem tocar fluxo real (scan, assign, Drive, SQLite, outbox, manifest, export).

### Novos path builders (src/core/paths.ts)
- `taxonomiaDatePath(date?)` — helper que retorna `YYYY/MM/DD` (barras, não hífens)
- `recebidoDrivePath(params)` — path `ROOT/Recebidos/YYYY/MM/DD/tipo/direcao[/filename]`
- `pedidoTaxonomiaDocumentDrivePath(params)` — path `ROOT/Pedidos/PED/YYYY/MM/DD/tipo/direcao/filename`
- `pedidoTaxonomiaFolderDrivePath(params)` — path `ROOT/Pedidos/PED/YYYY/MM/DD/tipo/direcao` (pasta)

### Builders legados preservados e inalterados
- `pendenteDrivePath`, `pedidoDocumentDrivePath`, `pedidoSubfolderDrivePath`, `manifestDrivePath`
- Continuam usando `pendentes`/`pedidos` (lowercase) com `YYYY-MM-DD` (hífens)

### Garantias
- Nenhum scan/assign/sync/link/accept/reject executado
- Google/Drive não chamado
- Nenhum arquivo real movido
- SQLite/schema não alterado
- Outbox não alterado
- Manifest não alterado
- Export package não alterado
- Controle de Tapetes não tocado
- Credenciais não tocadas
- `realScan.ts` e `realAssign.ts` mantêm imports originais de paths legados

### Testes
- `tests/paths.test.ts`: 47 testes (era 15, +32 novos)
- 312 testes totais passando (26 suites)

### Próxima fase recomendada
RAVATEX-DOCUMENTS-G12-C-DRIVE-TAXONOMY-SCAN
Foco: ativar `recebidoDrivePath` no scan real para novos documentos irem para `Recebidos/YYYY/MM/DD/...` em vez de `pendentes/YYYY-MM-DD/...`. Requer smoke/dry-run prévio e verificação de que documentos existentes não são afetados.
