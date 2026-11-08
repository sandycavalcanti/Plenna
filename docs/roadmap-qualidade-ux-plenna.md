# Roadmap de qualidade UX do Plenna

Data da auditoria: 2026-11-08  
Escopo: frontend React Native/Expo em `Plenna`  
Status: diagnóstico concluído; correções da Parte B ainda não implementadas.

## A. Resumo executivo

Foi feita uma auditoria estática do frontend inteiro, com inventário das 18 telas em
`src/pages`, 133 componentes em `src/components` e 14 hooks em `src/hooks`. Também
foram inspecionados os fluxos de Login, recuperação de senha, formulários, modais,
monitoramento, mensagens, navegação e proteção local por PIN.

O frontend já possui uma base consistente em partes recentes do produto: há um
`AppScreenHeader` compartilhado, `CustomTextInput`, modais roláveis, `adjustResize`
no Android e uma sessão protegida mantida somente em memória. A consistência ainda
é incompleta porque telas antigas e novas convivem com estilos próprios e padrões
de feedback diferentes.

Os achados mais importantes são:

- **Risco funcional confirmado:** uma senha inválida no Login chega como erro 401,
  mas a tela apenas chama `logApiErrors`; o toast está desativado e não há estado
  de erro renderizado no Login. O usuário pode não receber feedback visível.
- **Risco de segurança/UX confirmado por inspeção:** as telas protegidas invalidam
  a sessão de PIN ao perder foco. Assim, uma navegação interna como Compras →
  Recorrências/Detalhes pode pedir o PIN novamente, embora o requisito seja manter
  o desbloqueio durante a área protegida.
- **Risco alto dependente de aparelho:** Login e recuperação de senha usam
  `KeyboardAvoidingView`, mas não possuem uma rolagem própria para os conteúdos e
  ações. Em telas Android menores, teclado grande ou fonte ampliada, o campo ou a
  ação inferior pode ficar encoberto.
- **Inconsistência de manutenção:** foram encontrados 609 usos de hexadecimais,
  179 valores hexadecimais distintos e 53 usos de `rgb/rgba` em 78 arquivos de
  `src`. Existe uma paleta em `src/constants/colors.js`, mas ainda há tonalidades
  repetidas e equivalentes hardcoded.
- **Inconsistência visual:** inputs compartilhados dependem principalmente de
  preenchimento, sem borda/foco explícitos no `CustomTextInput`; placeholders
  também possuem fallback hardcoded. Isso pode variar perceptivelmente entre
  aparelhos Android.

Não foi usado emulador nem aparelho Android físico nesta auditoria. Portanto,
nenhum comportamento foi declarado como validado em dispositivo real. Os riscos
que dependem de renderização, teclado, contraste ou sistema operacional estão
explicitamente marcados como pendentes de validação manual.

## B. Inventário dos problemas

### UX-001 — Login sem caminho de rolagem com teclado

- **Área:** teclado e formulários
- **Tela/componente:** Login, `LoginScreen`
- **Arquivo:** `src/pages/LoginScreen/index.js:61-81`
- **Evidência:** a tela usa `KeyboardAvoidingView` com `behavior="padding"`, mas
  renderiza logo, campos, links e botão sem `ScrollView`/`FlatList`.
- **Impacto:** em Android com `adjustResize`, o conteúdo pode ser comprimido ou o
  botão/links inferiores podem ficar inacessíveis quando o teclado está aberto.
- **Severidade:** alta; **complexidade:** baixa/média.
- **Classificação:** risco confirmado na estrutura; comportamento visual exato
  depende do aparelho e do tamanho da tela.
- **Solução recomendada:** testar primeiro com Android pequeno, teclado numérico e
  fonte ampliada; depois adotar rolagem controlada ou um layout equivalente apenas
  nesta tela, preservando o foco e as áreas seguras.
- **Testes:** foco em e-mail e senha, teclado aberto, botão Entrar, links,
  landscape não aplicável por orientação portrait, fonte grande.
- **Status:** `ABERTO — validação física necessária`.

### UX-002 — Recuperação de senha sem rolagem do conteúdo principal

- **Área:** teclado e formulários
- **Tela/componente:** `ForgotPasswordScreen`
- **Arquivo:** `src/pages/ForgotPasswordScreen/index.js:119-175`
- **Evidência:** há `SafeAreaView` e `KeyboardAvoidingView`, mas os três passos
  são renderizados em `View`; não existe `ScrollView` para o e-mail, código, nova
  senha, confirmação e ações.
- **Impacto:** o passo de nova senha e seus botões têm risco de ficar cobertos em
  aparelhos menores ou com teclado aberto.
- **Severidade:** alta; **complexidade:** baixa/média.
- **Classificação:** risco confirmado na estrutura; não reproduzido em aparelho.
- **Solução recomendada:** usar uma área rolável que preserve a contagem, o foco,
  o botão Verificar/Reenviar e a área segura.
- **Testes:** passos 1, 2 e 3, teclado aberto, contagem de reenvio, erro de código,
  senha longa e fonte ampliada.
- **Status:** `ABERTO — validação física necessária`.

### UX-003 — Pesquisa do histórico de chat sem tratamento específico de teclado

- **Área:** teclado e formulários
- **Tela/componente:** `HistoricalChatScreen`
- **Arquivo:** `src/pages/HistoricalChatScreen/index.js:119-135`
- **Evidência:** o `TextInput` fica no toolbar de uma tela com `FlatList`; não há
  `KeyboardAvoidingView` nem `keyboardShouldPersistTaps` nessa tela.
- **Impacto:** o campo está no topo e tende a permanecer visível, mas a interação
  com a lista e a barra de navegação durante a pesquisa varia por versão do
  Android.
- **Severidade:** baixa/média; **complexidade:** baixa.
- **Classificação:** suspeita, não defeito confirmado.
- **Solução recomendada:** validar antes de alterar; se necessário, aplicar a
  solução mínima no toolbar/lista, sem impor `KeyboardAvoidingView` globalmente.
- **Status:** `PENDENTE DE REPRODUÇÃO`.

### UX-004 — Estratégias diferentes em modais com campos

- **Área:** teclado e modais
- **Componentes:** `MetaFormSheet`, movimento de meta, `GerenciarCompra`, editor
  de recorrência e `PinModal`
- **Arquivos:**
  `src/components/Metas/MetaFormSheet/index.js:67-146`,
  `src/pages/MetaDetailsScreen/index.js:443-458`,
  `src/components/PurchaseComponents/GerenciarCompra.js:216-333`,
  `src/pages/RecurrencesScreen/index.js:678-824`,
  `src/components/SecurityComponents/PinModal/index.js:127-168`
- **Evidência:** alguns modais combinam `KeyboardAvoidingView` e `ScrollView`,
  enquanto o editor de recorrência possui listas roláveis internas e nem todos os
  estados apresentam a mesma estratégia de ajuste vertical.
- **Impacto:** botões de confirmação podem ficar abaixo do teclado em combinações
  específicas de tamanho de tela, teclado e conteúdo.
- **Severidade:** média/alta; **complexidade:** média.
- **Classificação:** risco de matriz de dispositivos; não confirmado em hardware.
- **Solução recomendada:** uma matriz de testes por modal antes de padronizar;
  corrigir somente os modais reproduzidos.
- **Status:** `ABERTO — validação física necessária`.

### UX-005 — Delimitação e foco dos inputs não são uniformes

- **Área:** aparência e legibilidade dos inputs
- **Componente:** `CustomTextInput`, reutilizado por Login, cadastro, perfil,
  recorrências e outros formulários
- **Arquivos:** `src/components/CustomTextInput/index.js:36-45` e
  `src/components/CustomTextInput/styles.js:9-30`
- **Evidência:** o estilo base usa fundo e `borderRadius`, mas não define
  `borderWidth`, `borderColor` ou um estado de foco. O placeholder usa fallback
  `rgba(0,0,0,0.4)` e o texto força `COLORS.cadTextInputTexto || '#000'`.
- **Impacto:** a identificação do campo depende do fundo nativo/da tela e pode
  variar entre aparelhos; foco e erro não têm uma apresentação comum.
- **Severidade:** média/alta; **complexidade:** média.
- **Classificação:** problema confirmado no código; contraste real exige medição
  e inspeção no aparelho.
- **Solução recomendada:** definir tokens semânticos de texto, placeholder, borda,
  foco, erro e desabilitado no componente compartilhado; manter exceções explícitas
  para Chat, Questionário e Histórico de chat.
- **Testes:** contraste, foco, erro, desabilitado, tema/versão Android, TalkBack e
  fontes ampliadas.
- **Status:** `ABERTO`.

### UX-006 — Senha inválida no Login pode não gerar feedback visível

- **Área:** mensagens, alertas e autenticação
- **Tela/componente:** `LoginScreen`
- **Arquivos:** `src/pages/LoginScreen/index.js:35-58` e `src/utils/error.js:1-24`
- **Evidência:** o backend lança `AppError("Credenciais inválidas", 401)` em
  `Plenna-API/src/modules/auth/auth.service.ts:57-72` e o controller responde
  pelo `handleError`. No frontend, o `catch` chama somente
  `logApiErrors(error, 'Erro ao realizar login')`. O helper tem `toast = false` e
  não há `Alert`, estado de erro ou texto de erro no JSX do Login.
- **Impacto:** o usuário pode tocar em Entrar e permanecer na tela sem saber que
  a senha foi rejeitada; isso é especialmente perceptível no aparelho físico.
- **Severidade:** crítica para UX de autenticação; **complexidade:** baixa.
- **Classificação:** defeito confirmado por inspeção estática; ainda não testado
  contra uma API em execução neste ambiente.
- **Solução recomendada:** tratar o 401 no Login com feedback persistente e seguro,
  sem expor detalhes de enumeração; manter o log apenas com metadados seguros.
- **Testes:** 401, erro de rede, 429/5xx, sucesso, duplo toque, teclado aberto,
  mensagem acessível e limpeza após nova tentativa.
- **Status:** `CRÍTICO — primeira correção recomendada na Fase 3`.

### UX-007 — Sistema de mensagens fragmentado

- **Área:** feedback global
- **Arquivos principais:** `src/utils/error.js`, páginas em `src/pages` e
  componentes em `src/components`
- **Evidência:** foram encontradas 189 ocorrências de alertas/estados de erro e
  mecanismos de feedback. Há uso amplo de `Alert.alert`, mensagens inline,
  banners locais e logging; `ToastAndroid` está presente no helper, mas desligado.
- **Impacto:** duração, posicionamento, acessibilidade e estilo variam entre
  fluxos; mensagens importantes podem desaparecer ou nunca ser renderizadas.
- **Severidade:** alta; **complexidade:** média/alta.
- **Solução recomendada:** definir matriz semântica (inline para erros do campo,
  banner para erros persistentes, toast apenas para feedback curto e diálogo para
  confirmação/destruição), criar um componente compartilhado somente após mapear
  os contratos existentes.
- **Status:** `ABERTO`.

### UX-008 — Cores hardcoded espalhadas

- **Área:** identidade visual e manutenção
- **Arquivo de referência:** `src/constants/colors.js`
- **Evidência:** a busca estática encontrou 609 ocorrências hexadecimais, 179
  valores hexadecimais únicos, 53 ocorrências `rgb/rgba` e 78 arquivos com cores
  literais. Exemplos: `src/components/PreferencesForm/styles.js`,
  `src/pages/SignUpScreen/styles.js`, `src/pages/EditProfileScreen/styles.js`,
  `src/pages/RecurrencesScreen/styles.js`, `src/pages/MetaDetailsScreen/styles.js`
  e `src/components/ProfileComponents/Permissions/index.js`.
- **Impacto:** alterações de identidade e verificação de contraste ficam difíceis;
  cores equivalentes podem divergir entre telas.
- **Severidade:** média; **complexidade:** média/alta.
- **Solução recomendada:** migração gradual para poucos tokens semânticos
  (`background`, `surface`, `textPrimary`, `textSecondary`, `border`, `primary`,
  `success`, `warning`, `danger`), começando por componentes compartilhados e
  sem alterar tons aprovados.
- **Status:** `CONFIRMADO — refatoração futura controlada`.

### UX-009 — Tema do Dashboard ainda mistura tokens e literais

- **Área:** cores de gráficos e Dashboard
- **Arquivo:** `src/constants/dashboardTheme.js:3-31`
- **Evidência:** `DASHBOARD_THEME` reutiliza `COLORS` em parte, mas mantém
  `body`, `muted`, `track`, `accentSoft`, `positive`, `caution`, `dangerSurface`,
  `hero` e `shadowColor` como literais.
- **Impacto:** o Dashboard possui um segundo nível de paleta que pode divergir do
  restante do app; gráficos e estados podem perder coerência.
- **Severidade:** média; **complexidade:** baixa/média.
- **Solução recomendada:** manter o tema local como camada semântica, mas derivar
  as tonalidades de constantes centrais quando o significado for compartilhado.
- **Status:** `CONFIRMADO`.

### UX-010 — Cabeçalhos têm padrões corretos, mas não uma cobertura uniforme

- **Área:** títulos e cabeçalhos
- **Componente:** `AppScreenHeader`
- **Arquivos:** `src/components/Common/AppScreenHeader/index.js:8-38` e
  `src/components/Common/AppScreenHeader/styles.js:4-54`
- **Evidência:** o componente compartilhado define ícone, título acessível,
  subtítulo, retorno e ação lateral, e é usado em Compras, Recorrências,
  Notificações, Memórias, MetaDetails, CreateCompra, Perfil/edição e Preferências.
  Login, Cadastro, Recuperação, Questionário e partes do Dashboard usam cabeçalhos
  próprios, com escalas diferentes; `LoginScreen/styles.js:23-28` inclusive declara
  `fontSize` duas vezes, prevalecendo 60 sobre 24.
- **Impacto:** há diferenças intencionais entre autenticação e telas internas, mas
  também há divergências difíceis de manter e risco de títulos desproporcionais.
- **Severidade:** média; **complexidade:** média.
- **Solução recomendada:** documentar três contextos (autenticação, interno,
  seção/modal), comparar cada exceção e só então reutilizar o componente onde não
  houver perda de hierarquia.
- **Status:** `CONFIRMADO — separar intenção de inconsistência real`.

### UX-011 — Fundos equivalentes usam constantes e literais diferentes

- **Área:** fundos de telas, cards e formulários
- **Arquivos:** `src/constants/colors.js` e estilos de telas/componentes
- **Evidência:** existem `COLORS.fundoPrincipal`, `COLORS.surface`,
  `COLORS.surfaceMuted` e fundos específicos, mas também `#FFFFFF`, `#F7F2FA`,
  `#FCFAFD` e outros literais em Preferences, Cadastro, Perfil, MetaDetails,
  Recorrências e modais. A análise encontrou 78 arquivos com cores literais.
- **Impacto:** superfícies que deveriam ser equivalentes podem ter tonalidades ou
  contraste ligeiramente diferentes; exceções intencionais não estão sempre
  documentadas.
- **Severidade:** média; **complexidade:** média.
- **Solução recomendada:** classificar cada fundo como background, surface,
  surfaceMuted, overlay ou semântico e migrar por contexto, preservando modais,
  autenticação e destaques intencionais.
- **Status:** `CONFIRMADO`.

### UX-012 — PIN é invalidado ao trocar entre telas protegidas

- **Área:** segurança e navegação protegida
- **Telas:** Compras, Recorrências, Notificações e Memórias; Perfil usa o mesmo hook
  para alteração de PIN
- **Arquivos:**
  `src/hooks/useProtectedAccess.js:26-252`,
  `src/services/security/protectedSession.js:1-46`,
  `src/pages/PurchasesScreen/index.js:273-302`,
  `src/pages/RecurrencesScreen/index.js:201-219`,
  `src/pages/NotificationsScreen/index.js:136-153`,
  `src/pages/MemoryListScreen/index.js:121-135`
- **Evidência:** cada tela chama `beginAccess()` no foco e
  `cancelAccess()` no cleanup do `useFocusEffect`. `cancelAccess()` chama
  `invalidateProtectedSession()`. A sessão desbloqueada é global em memória e
  não existe um navegador/escopo explícito para a área protegida.
- **Impacto:** ao sair de Compras para Recorrências ou para outra tela interna,
  o blur cancela a sessão e o próximo foco abre o gate novamente. Isso gera
  solicitações repetitivas e não implementa o conceito de “área protegida”.
- **Severidade:** alta; **complexidade:** média/alta.
- **Classificação:** defeito confirmado por fluxo de código; ainda não executado
  no emulador.
- **Solução recomendada:** introduzir um escopo de sessão protegida associado à
  entrada/saída da área, não ao blur de cada tela. A sessão deve ser limpa ao sair
  da área, ir para background, fazer logout, trocar de usuário ou expirar por
  política aprovada. Deep links devem sempre passar pelo gate.
- **Testes:** Home→Compras, Compras→Recorrências, detalhes, retorno, aba, back do
  Android, background, logout, troca de usuário, deep link e expiração.
- **Status:** `CRÍTICO DE SEGURANÇA/UX — primeira fase recomendada`.

### UX-013 — Limites da área protegida não estão formalizados

- **Área:** segurança e navegação
- **Evidência:** as rotas são registradas diretamente no `Stack.Navigator` em
  `src/routes.js:320-390`; não há um navigator filho para o conjunto protegido.
  `MetaDetailsScreen` não usa `useProtectedAccess`, enquanto é aberto por Home,
  Perfil e gerenciamento de metas.
- **Impacto:** fica difícil provar quais telas pertencem ao mesmo perímetro e
  quais devem solicitar PIN. Uma alteração futura pode proteger ou desproteger
  uma rota sem uma política central.
- **Severidade:** alta; **complexidade:** média.
- **Solução recomendada:** documentar a classificação de cada rota e decidir,
  explicitamente, se Metas/MetaDetails pertencem ao mesmo perímetro ou não. Só
  depois escolher a implementação de escopo; não ampliar proteção por suposição.
- **Status:** `DECISÃO DE PRODUTO/SEGURANÇA PENDENTE`.

## C. Organização por fases

### Fase 1 — Segurança e navegação protegida

Itens: `UX-012` e `UX-013`.

1. Definir o perímetro protegido e a duração da sessão desbloqueada.
2. Criar um único coordenador de entrada/saída ou navigator protegido, evitando
   `cancelAccess()` em todo blur interno.
3. Manter invalidação imediata em background, logout, troca de usuário, expiração
   e cancelamento explícito.
4. Garantir que deep links e rotas internas não contornem o gate.

Dependência: decisão sobre se MetaDetails e outras telas financeiras pertencem ao
mesmo perímetro.

### Fase 2 — Inputs e teclado

Itens: `UX-001` a `UX-005`.

1. Reproduzir a matriz em Android pequeno, médio e aparelho físico da equipe.
2. Corrigir primeiro Login e recuperação de senha.
3. Auditar cada modal com input sem aplicar `KeyboardAvoidingView` em massa.
4. Padronizar estados visuais do input compartilhado e documentar exceções.

Dependência: a solução de rolagem deve ser definida antes de consolidar campos
reutilizáveis; o contrato funcional dos formulários não deve mudar.

### Fase 3 — Feedback e mensagens

Itens: `UX-006` e `UX-007`.

1. Corrigir o feedback visível de 401 no Login sem revelar se uma conta existe.
2. Mapear mensagens de rede, validação, permissão, confirmação e sucesso.
3. Definir quando usar inline, banner, toast ou diálogo nativo.
4. Criar um componente compartilhado somente para padrões comprovadamente comuns.
5. Migrar primeiro autenticação e fluxos de maior risco; depois telas restantes.

Dependência: os estados de foco/teclado da Fase 2 devem estar estáveis para que
mensagens inline não sejam ocultadas pelo teclado.

### Fase 4 — Identidade visual e consistência

Itens: `UX-008` a `UX-011`.

1. Catalogar tokens existentes e duplicatas sem mudar os tons aprovados.
2. Migrar componentes compartilhados e depois telas de maior reutilização.
3. Consolidar fundos equivalentes e manter exceções documentadas.
4. Formalizar os contextos de cabeçalho e revisar somente as divergências reais.
5. Validar Dashboard, Home, Compras, Perfil, Metas e autenticação por regressão
   visual.

Dependência: feedbacks e estados de erro devem estar definidos para que tokens de
erro/alerta não sejam criados de forma incompatível.

## D. Critérios de conclusão por fase

### Fase 1

- Navegar Home → Compras solicita PIN quando a política exigir.
- Depois do desbloqueio, Compras → Recorrências → detalhes não solicita PIN de
  novo enquanto o usuário permanece no perímetro.
- Sair do perímetro e entrar novamente solicita PIN.
- Background, logout, troca de usuário, expiração e deep link não reutilizam um
  desbloqueio indevido.
- Testes automatizados cobrem sucesso, cancelamento, PIN incorreto, lockout e
  invalidação.
- Fluxo validado em pelo menos um Android físico.

### Fase 2

- Todos os campos listados permanecem visíveis com teclado aberto em aparelho
  pequeno e médio.
- Botões Salvar, Entrar, Verificar, Confirmar e ações de modal podem ser tocados.
- Erros e foco têm contraste suficiente com fonte padrão e ampliada.
- Modais longos mantêm rolagem e não perdem o campo focado.
- Testes Android físico e emulador cobrem teclado, back do teclado, rotação não
  aplicável e área segura.

### Fase 3

- Senha inválida mostra mensagem legível e persistente o suficiente no Login.
- Falhas de rede, 401, 4xx de validação e 5xx não são confundidas com sucesso.
- Confirmações destrutivas continuam usando diálogo explícito.
- Mensagens importantes têm `accessibilityLiveRegion`/papel adequado quando
  aplicável.
- Não há vazamento de tokens, senhas, códigos ou detalhes internos.

### Fase 4

- Componentes compartilhados usam tokens semânticos para cores equivalentes.
- A comparação visual não mostra regressões nos tons aprovados.
- Cada exceção de cor/fundo/cabeçalho possui motivo documentado.
- Contraste de texto, placeholder, erro e controles é validado com acessibilidade.
- Home, Dashboard, Compras, Perfil, Metas, autenticação e monitoramento passam por
  regressão visual manual.

## E. Plano de testes

### Automatizados

- Testes de componente para inputs: valor, placeholder, foco, erro, disabled,
  cursor/seleção e acessibilidade.
- Testes de autenticação: sucesso, senha inválida, e-mail inválido, rede caída,
  resposta 401/429/5xx e mensagens renderizadas.
- Testes de navegação protegida: entrada, navegação interna, saída, background,
  logout, troca de usuário, deep link e expiração.
- Testes de modais: abertura, fechamento, rolagem, teclado e confirmação.
- Testes de regressão para Login, recuperação, Cadastro, Compras, Recorrências,
  Chat, Perfil, Permissões e Metas.
- Lint estático de cores literais e verificação de que tokens novos não duplicam
  valores existentes sem justificativa.

### Emulador

- Android API usada pela equipe, telas pequenas e médias, teclado padrão e
  teclado com sugestões.
- Fonte e tamanho de exibição ampliados.
- Back do teclado e back do Android.
- Permissões de uso, biometria/PIN, background e retorno ao app.
- Login com senha inválida e erro de rede.

### Android físico

Não podem ser garantidos apenas por inspeção estática:

- se o teclado cobre campos ou ações;
- contraste e bordas efetivos de `TextInput` em versões diferentes do Android;
- comportamento do `adjustResize` com teclado do fabricante;
- biometria, retorno de background e deep link;
- tamanho/posição real de `Alert`, toast e banners;
- leitura por TalkBack e foco acessível;
- aparência de gráficos e fontes em densidades diferentes.

## Estado da auditoria

- Parte B: concluída como investigação; nenhuma correção da auditoria foi
  implementada.
- Parte A: implementada apenas em Permissões, com modal de privacidade do
  monitoramento e aviso final atualizado.
- Backend: não modificado.
- Banco/migrations: não modificados.
- Monitoramento Android: não modificado.
- Testes de aparelho físico: pendentes.
