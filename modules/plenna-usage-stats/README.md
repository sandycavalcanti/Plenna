# RF017 — interface nativa Android

Este módulo local expõe diagnóstico, verificação/abertura de Usage Access e
consultas de eventos e duração em primeiro plano. Não armazena dados nem chama
a API. Consentimento, catálogo e sincronização são tratados pelos consumidores.

O autolinking do Expo procura módulos locais em `modules/`. O plugin
`expo-module-gradle-plugin` instalado fornece Kotlin, expo-modules-core e as
configurações Android herdadas do projeto, sem fixar novas versões aqui.

Uso sob demanda:

```ts
import { getModuleStatus } from './modules/plenna-usage-stats';

const status = await getModuleStatus();
```

Em Android com o módulo instalado, retorna:
`{ available: true, platform: 'android', module: 'plenna-usage-stats' }`.
Não há resolução de `PlennaUsageStats` nem chamada aos seus métodos durante o
import, inclusive pelo `index.ts`. Cada função verifica `Platform.OS` e resolve
o módulo sob demanda com `requireOptionalNativeModule` de `expo-modules-core`.
Não Android não tenta resolver o módulo. Falhas de resolução são capturadas.

| Função | Módulo ausente, plataforma não Android ou método faltante |
| --- | --- |
| `getModuleStatus()` | `{ available: false, platform, module, reason }` |
| `hasUsageAccess()` | `false` |
| `openUsageAccessSettings()` | `false` |
| `getUsageEvents(startTime, endTime)` | `[]` |
| `getForegroundUsage(startTime, endTime)` | `[]` |

O diagnóstico retorna `unsupported_platform`, `native_module_unavailable`,
`native_module_incompatible` (binário sem alguma das cinco funções) ou
`native_diagnostic_failed` (falha de resolução/diagnóstico ou resposta inválida).
Em binários parciais, funções presentes continuam disponíveis individualmente.

No Android com método instalado, argumentos, contexto e resultados são
preservados. Exceto pelo diagnóstico, rejeições operacionais nativas continuam
sendo propagadas ao chamador; não são convertidas em uso zero.
As consultas recebem milissegundos desde epoch. Eventos retornam `packageName`,
`timestamp` e `eventType`; duração retorna `packageName` e `durationSeconds`.

Expo Go não contém este Kotlin personalizado. Uma resposta simulada de testes
JavaScript não comprova carregamento nativo. É necessário compilar um binário
próprio; mudanças Kotlin exigem recompilação.

## Development build

Com SDK/NDK/JDK compatíveis e aparelho/emulador disponíveis, revisar e executar:

```sh
npx expo prebuild --platform android --no-install
npx expo run:android
npx expo start --dev-client
```

O prebuild gera a árvore `android/` (ignorada pelo Git) e pode atualizar scripts
e dependências em package.json. Revisar esses efeitos antes de executá-lo.
Não usar `prebuild --clean` nem o script `npm run build`, que executa o
`buildScript.js` do projeto e pode alterar a configuração local.

Alternativa, somente com autorização para build remoto:
`eas build --platform android --profile development`. O perfil já existe.

Teste da interface pública com Expo/RN simulados, sem carregar Kotlin:

```sh
node --experimental-vm-modules --test tests/tempoUsoNative.test.mjs
```

Os testes JS não substituem compilação e execução em Android.

## Sessões que atravessam o início da janela

`getForegroundUsage` consulta até 24 horas antes de `startTime` para reconstruir
o estado inicial. Esse prefixo permanece apenas na memória nativa: não é retornado
nem somado à duração. Toda sessão é recortada para `[startTime, endTime]`.

`ForegroundUsageAccumulator` acompanha classes de Activities ativas por package.
Enquanto pelo menos uma estiver ativa, o intervalo do package permanece aberto;
sobreposições não são somadas duas vezes. `PAUSED` e `STOPPED` encerram a classe
correspondente. Bloqueio, tela não interativa e desligamento fecham os intervalos;
um evento de startup descarta aberturas sem fechamento conhecido. Ligar a tela
ou desbloquear não inicia uma sessão sem novo `RESUMED`.

Milissegundos são somados antes da divisão inteira por 1000, preservando segundos
inteiros. Uma sessão comprovadamente aberta sem fechamento é limitada ao fim da
janela. Um `PAUSED` sem abertura conhecida é ignorado, sem presumir uso desde a
meia-noite.

Limitações: histórico indisponível/truncado ou abertura anterior ao prefixo de
24 horas impedem reconstrução garantida. Uma saída perdida pode superestimar uso
até o próximo fechamento conhecido ou fim da janela; uma retomada perdida pode
subestimá-lo. A API pública fornece classe, não identidade individual de cada
instância: múltiplas instâncias da mesma classe e classes ausentes são ambíguas.
Não se presume que um novo package em foreground encerra outro, pois há cenários
de múltiplas janelas. A reconstrução não corrige timezone de viagem.

Referências: [UsageEvents.Event](https://developer.android.com/reference/android/app/usage/UsageEvents.Event)
e [UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager).

Teste JVM do acumulador real, sem Android, Expo ou banco (com `kotlinc` e Java):

```sh
kotlinc modules/plenna-usage-stats/android/src/main/java/expo/modules/plennausagestats/ForegroundUsageAccumulator.kt tests/native/ForegroundUsageAccumulatorTest.kt -include-runtime -d /tmp/plenna-foreground-tests.jar
java -jar /tmp/plenna-foreground-tests.jar
```

No Windows, usar um caminho temporário equivalente. O teste não comprova a entrega
dos eventos por um aparelho; mudanças Kotlin exigem recompilar o development build.
