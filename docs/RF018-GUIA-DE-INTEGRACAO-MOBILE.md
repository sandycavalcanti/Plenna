# RF018 — integração Mobile

A branch parte de `origin/develop` (`5b639cf`). Foram preservados OAuth, recorrências, configuração de conexão, coleta de tempo de uso, preferências, gráficos financeiros e dependências dessa base.

## Clientes e sessão

Os serviços `contextoCompraService.js`, `avaliacaoCompraService.js`, `historicoCompraService.js`, `analiseAutomaticaService.js`, `gestaoCompraService.js` e `resumosCompras.js`, em `src/services/`, validam os envelopes da API, a compra e a sessão capturada. Respostas atrasadas não podem restaurar dados de outra sessão. Rascunhos e operações com confirmação incerta ficam somente em memória.

`useEstadoCompra`, em `src/hooks/useEstadoCompra.js`, coordena consulta e invalidação do histórico de gerenciamento. `resumosCompras.js` agrupa consultas em lotes de até 100 IDs e recusa identidades estranhas, duplicadas ou respostas incompletas. Essa última verificação evita o desaparecimento silencioso de compras da listagem.

## Sobre sua compra

A entrada continua dentro do acesso protegido de `src/pages/PurchasesScreen/index.js`. O componente `ContextoCompra`, em `src/components/PurchaseComponents/ContextoCompra/`, apresenta Descobrir, Responder e Explorar. A entrada padrão mostra descobertas antes de qualquer resposta opcional.

- `AnaliseAutomatica.js` e `DescobertasCompra/`: observações fundamentadas, sem classificação automática.
- `AvaliacaoContextual/`: reflexão versionada a partir das declarações.
- `HistoricoConsumo/` e `HistoricoContexto.js`: histórico descritivo e revisões anteriores das respostas.
- `GerenciarCompra.js`: classificação voluntária, ocultação, exclusão e eventos posteriores.
- `ResumoCompra.js`, `ComparacaoFinanceira.js` e `reflexoesVisuais.js`: apresentação dos registros, referências e declarações.

`PurchaseItem/index.js` distingue “Sua classificação” de análise automática. A percepção declarada no questionário não substitui essa classificação. Cancelamento e devolução não são apresentados como reembolso. Ocultar não exclui a compra dos cálculos. O valor registrado e os reembolsos conhecidos permanecem distintos.

O fluxo conserva perguntas opcionais, revisão esperada, UUID idempotente, conflitos 409 e rascunhos em memória vinculados à sessão/compra/revisão. Ausência de resposta não vira uma negativa. As respostas antigas continuam consultáveis quando um item é desativado.

## Home e Dashboard

`src/hooks/useDescobertasResumo.js` consulta `/analises/descobertas`. O seletor `src/utils/selecionarDescobertas.js` aceita tópicos com evidência do período e limita o carrossel a três itens distintos. As telas recebem componentes aditivos: `HomeComponents/DescobertasCarousel.js`, `DashboardComponents/DescobertasDashboard.js` e `DashboardComponents/MovimentacoesCompra.js`.

Os gráficos financeiros e a navegação de recorrências da base permanecem preservados. Os links das descobertas usam o período UTC do contrato RF018, explicitado na apresentação. O refresh de Home/Dashboard atualiza também as descobertas.

## Contratos e atualização

A API deve conter as rotas e contratos desta feature, incluindo `automatico-1` e as avaliações contextuais `contextual-1`/`contextual-2`. Os serviços distinguem respostas ausentes, indisponíveis e desatualizadas. Falha do formulário não deve impedir a leitura automática independente.

Não foi adicionada dependência nativa. No development client, recarregue o bundle. Aplicativos com JavaScript embarcado precisam de nova distribuição para receber a interface. Esta etapa não realiza deploy ou distribuição.

Não se alteram `src/constants/config.js`, `src/api/client.js`, `src/api/tokenStorage.js`, `app.json` ou arquivos Android para transportar esta feature. As proteções de sessão existentes na `develop` já são reutilizáveis pelos novos clientes.

## Verificação

`npm run test:rf018` executa os testes específicos; `npm run test:offline` mantém toda a regressão com bloqueio de rede. `node node_modules/typescript/bin/tsc --noEmit` verifica a configuração TypeScript existente, que não ativa `checkJs` para todos os componentes JavaScript.

O ensaio integrado PostgreSQL é executado no repositório API com `RF018_MOBILE_ROOT` apontando para esta worktree. Ele consulta os clientes reais Mobile contra API e banco sintéticos de loopback, sem carregar `.env`, acessar Neon ou usar dados reais.

Resultados, diferenças em relação à base e pendências estão em [RF018-VALIDACAO-DA-BRANCH.md](RF018-VALIDACAO-DA-BRANCH.md). A suíte integral da base possui falhas reproduzíveis em Home e dashboard; não se apresentam como aprovação integral. TalkBack, biometria física e o fluxo no dispositivo com a API atualizada continuam pendentes.
