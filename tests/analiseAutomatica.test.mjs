import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {
  validarAnaliseAutomatica,
  consultarAnaliseAutomatica,
} from '../src/services/analiseAutomaticaService.js';
import { createRenderer } from './helpers/componentRenderer.mjs';
import { apresentarIndisponibilidades } from '../src/utils/analiseAutomaticaPresentation.js';
const text = (n) =>
  n == null || typeof n === 'boolean'
    ? ''
    : typeof n === 'object'
      ? (n.props?.children ?? []).map(text).join('')
      : String(n);
const evidence = (extra = {}) => ({
  indicador: 'V01',
  familia: 'VALORES',
  regra: 'TUKEY',
  sinal: true,
  amostra: 6,
  observado: 45000,
  referencia: 7000,
  unidade: 'CENTAVOS',
  ...extra,
});
const response = (extra = {}) => ({
  versaoContrato: 1,
  versaoMotor: 'automatico-1',
  compraId: 1,
  escopo: 'COMPRA',
  estado: 'SINAIS_RELEVANTES',
  classificacaoAutomaticaDefinitiva: false,
  persistido: false,
  qualidadeDados: { registrosElegiveis: 6, criteriosIndisponiveis: [] },
  evidencias: [evidence()],
  descobertas: [
    {
      tipo: 'OBSERVACAO_AUTOMATICA',
      titulo: 'Valor diferente das referências disponíveis',
      mensagem: 'Isso não determina impulsividade.',
    },
  ],
  limitacoes: [],
  janela: {
    inicio: '2026-04-01T00:00:00Z',
    fimExclusivo: '2026-10-15T00:00:00Z',
  },
  dependencias: { fontesHash: 'a'.repeat(64) },
  ...extra,
});
function session() {
  const c = new AbortController();
  return {
    c,
    s: { id: 3, signal: c.signal },
    storage: {
      assertSession() {
        if (c.signal.aborted) throw Error('SESSION');
      },
    },
  };
}
test('automatic endpoint captures user session, identity and no write is performed', async () => {
  const { s, storage } = session(),
    calls = [];
  const result = await consultarAnaliseAutomatica({
    compraId: 1,
    session: s,
    storage,
    client: {
      get: async (...args) => {
        calls.push(args);
        return { data: response() };
      },
    },
  });
  assert.equal(result.persistido, false);
  assert.equal(calls[0][0], '/analises/compras/1/automatica');
  assert.equal(calls[0][1].usageMonitoringSessionId, 3);
  assert.equal(calls[0][1].signal, s.signal);
});
test('malformed versions, foreign purchase, fabricated diagnosis and conflicting states fail closed', () => {
  for (const d of [
    {},
    response({ versaoMotor: 'other' }),
    response({ compraId: 2 }),
    response({ classificacaoAutomaticaDefinitiva: true }),
    response({ estado: 'SEM_SINAIS_RELEVANTES' }),
    response({ estado: 'COMBINACAO_SINAIS_RELEVANTES' }),
    response({ dependencias: { fontesHash: 'invalid' } }),
  ])
    assert.throws(() => validarAnaliseAutomatica(d, 1));
});
test('unknown and absence of identified signals remain different valid states', () => {
  assert.equal(
    validarAnaliseAutomatica(
      response({
        estado: 'DADOS_INSUFICIENTES',
        evidencias: [],
        descobertas: [],
      }),
      1,
    ).estado,
    'DADOS_INSUFICIENTES',
  );
  assert.equal(
    validarAnaliseAutomatica(
      response({
        estado: 'SEM_SINAIS_RELEVANTES',
        evidencias: [evidence({ sinal: false })],
        descobertas: [],
      }),
      1,
    ).estado,
    'SEM_SINAIS_RELEVANTES',
  );
});
test('late response after session revocation is never displayed', async () => {
  const { c, s, storage } = session();
  await assert.rejects(
    consultarAnaliseAutomatica({
      compraId: 1,
      session: s,
      storage,
      client: {
        get: async () => {
          c.abort();
          return { data: response() };
        },
      },
    }),
    /SESSION/,
  );
});
test('network failure and unexpected API response never become absence of signs', async () => {
  for (const get of [
    async () => {
      throw Error('Network Error');
    },
    async () => ({ data: {} }),
  ]) {
    const { s, storage } = session();
    await assert.rejects(
      consultarAnaliseAutomatica({
        compraId: 1,
        session: s,
        storage,
        client: { get },
      }),
    );
  }
});
const native = Object.fromEntries(
  ['ActivityIndicator', 'Pressable', 'Text', 'View'].map((k) => [k, k]),
);
native.StyleSheet={create:v=>v};
function screen(data, fail = false) {
  const { c, s, storage } = session();
  let version = data;
  const r = createRenderer({
    'react-native': native,
    '../../api/client': {
      apiClient: {
        get: async () => {
          if (fail) throw Error('Network Error');
          return { data: version };
        },
      },
    },
    '../../api/tokenStorage': {
      tokenStorage: { ...storage, captureSession: async () => s },
    },
    '../ReadingDetails': {
      __esModule: true,
      default: ({ children }) => ({ type: 'View', props: { children } }),
    },
  });
  const props = { compraId: 1, revisao: 0, refreshKey: 0 };
  r.mount(
    r.load('src/components/PurchaseComponents/AnaliseAutomatica.js').default,
    props,
  );
  return {
    r,
    c,
    change(value) {
      version = value;
      r.update({ ...props, refreshKey: 1 });
    },
  };
}
for (const [estado, fragment] of [
  ['SINAIS_RELEVANTES', 'Valor diferente'],
  ['COMBINACAO_SINAIS_RELEVANTES', 'Valor diferente'],
  ['DADOS_INSUFICIENTES', 'Ainda não há dados para comparar'],
  ['SEM_SINAIS_RELEVANTES', 'regras disponíveis'],
])
  test(
    'Mobile presents ' +
      estado +
      ' independently of the optional questionnaire',
    async () => {
      const evidencias =
        estado === 'DADOS_INSUFICIENTES'
          ? []
          : estado === 'SEM_SINAIS_RELEVANTES'
            ? [evidence({ sinal: false })]
            : estado === 'COMBINACAO_SINAIS_RELEVANTES'
              ? [
                  evidence(),
                  evidence({
                    indicador: 'F04',
                    familia: 'FREQUENCIA',
                    unidade: 'COMPRAS',
                    observado: 10,
                    referencia: 4,
                  }),
                ]
              : [evidence()];
      const s = screen(
        response({
          estado,
          evidencias,
          descobertas: [
            'DADOS_INSUFICIENTES',
            'SEM_SINAIS_RELEVANTES',
          ].includes(estado)
            ? []
            : response().descobertas,
        }),
      );
      await s.r.flush();
      if (estado === 'SEM_SINAIS_RELEVANTES') {
        assert.equal(s.r.nodes((n) => n.type === 'Text' && text(n).includes(fragment)).length, 0);
      } else {
        assert.ok(
          s.r.nodes((n) => n.type === 'Text' && text(n).includes(fragment))
            .length,
        );
      }
      assert.equal(
        s.r.nodes((n) => n.props.accessibilityRole === 'radio').length,
        0,
      );
      s.r.unmount();
    },
  );
test('Mobile clears previous assessment when session is revoked', async () => {
  const s = screen(response());
  await s.r.flush();
  assert.ok(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('Valor diferente'))
      .length,
  );
  s.c.abort();
  await s.r.flush();
  assert.equal(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('Valor diferente'))
      .length,
    0,
  );
  s.r.unmount();
});
test('new revision/refresh reprocesses without retaining a prior signal as current', async () => {
  const s = screen(response());
  await s.r.flush();
  s.change(
    response({
      estado: 'DADOS_INSUFICIENTES',
      evidencias: [],
      descobertas: [],
    }),
  );
  await s.r.flush();
  assert.equal(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('Valor diferente'))
      .length,
    0,
  );
  assert.ok(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('Ainda não há dados para comparar'))
      .length,
  );
  s.r.unmount();
});
test('unavailable automatic service does not fabricate a clinical or normal result', async () => {
  const s = screen(null, true);
  await s.r.flush();
  assert.ok(
    s.r.nodes(
      (n) => n.type === 'Text' && text(n).includes('indisponível agora'),
    ).length,
  );
  assert.equal(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('não identificaram'))
      .length,
    0,
  );
  s.r.unmount();
});

test('critério sem diferença continua explicado e não vira classificação negativa', async () => {
  const s=screen(response({estado:'SEM_SINAIS_RELEVANTES',evidencias:[evidence({sinal:false})],descobertas:[]}));
  await s.r.flush();
  const displayed=s.r.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed,/Sem diferença por este critério/);
  assert.doesNotMatch(displayed,/Compra não impulsiva|Sem risco|Classificação automática/);
  s.r.unmount();
});

test('análise compacta atualiza avaliação por ação explícita, sem reprocessar fontes históricas independentes', async () => {
  let loads=0,updates=0,automaticMounts=0;
  const resultado=JSON.parse(readFileSync(new URL('./fixtures/contextualRefinamento.json',import.meta.url),'utf8'));
  const dados=()=>({versaoContrato:1,compraId:1,atualidade:'VIGENTE',avaliacaoId:4+updates,criadaEm:'2026-10-30T12:00:00Z',motivos:[],resultado});
  const r = createRenderer({
    'react-native': { ...native, StyleSheet: { create: (v) => v } },
    '../AnaliseAutomatica': {
      __esModule: true,
      default: () => {automaticMounts++;return null;},
    },
    '../../../api/client': { apiClient: {} },
    '../../../api/tokenStorage': { tokenStorage: {} },
    '../../../services/avaliacaoCompraService': {
      criarConsultaAvaliacao: ({ onChange }) => ({
        consultar() {
          loads++;
          onChange({ status: 'ready', dados: dados() });
        },
        dispose() {},
        invalidar() {},
        calcular(){updates++;onChange({status:'ready',dados:dados()});},
      }),
    },
  });
  r.mount(
    r.load('src/components/PurchaseComponents/DescobertasCompra/index.js')
      .default,
    { compraId: 1, revisao: 1, compact: true, refreshKey: 3 },
  );
  await r.flush();
  r.nodes(
    (n) => n.type==='Pressable'&&text(n)==='Atualizar reflexão',
  )[0].props.onPress();
  await r.flush();
  assert.equal(loads,1);assert.equal(updates,1);assert.ok(automaticMounts>0);
  r.unmount();
});

const unavailable = (extra = {}) => response({estado:'DADOS_INSUFICIENTES',evidencias:[],descobertas:[],...extra});
const codes = [
  'V01:AMOSTRA_MENOR_QUE_QUATRO',
  'V01_CATEGORIA:CATEGORIA_INCOMPLETA_OU_MULTIPLA',
  'F05:COBERTURA_OU_JANELA_INSUFICIENTE',
  'F04:DIAS_HISTORICOS_OU_DISPERSAO_INSUFICIENTES',
  'V03:VIGENCIA_HISTORICA_NAO_COMPROVADA',
];
test('motivos reais aparecem em linguagem comum, com três principais e demais nos detalhes',async()=>{
  const s=screen(unavailable({qualidadeDados:{registrosElegiveis:3,criteriosIndisponiveis:codes}}));
  await s.r.flush();
  const displayed=s.r.nodes(n=>n.type==='Text').map(text).join(' ');
  const reasons=apresentarIndisponibilidades(codes);
  assert.equal(reasons.principais.length,3);assert.equal(reasons.adicionais.length,2);
  for(const message of [...reasons.principais,...reasons.adicionais])assert.ok(displayed.includes(message));
  assert.match(displayed,/3 registro\(s\) anterior\(es\) elegível\(is\)/);
  assert.doesNotMatch(displayed,/V01|F05|V03|limite inexistente|Compra não impulsiva/);
  assert.equal(s.r.nodes(n=>n.props.accessibilityRole==='header'&&text(n)==='Por quê?').length,1);
  s.r.unmount();
});
test('sem códigos conhecidos não inventa causa, e valor ausente não se confunde com histórico pequeno',async()=>{
  assert.deepEqual(apresentarIndisponibilidades(['NOVO:DESCONHECIDO','__proto__','constructor',null]),{principais:[],adicionais:[]});
  const reasons=apresentarIndisponibilidades(['V01:VALOR_AUSENTE','V01_CATEGORIA:VALOR_AUSENTE','V01:VALOR_AUSENTE']);
  assert.deepEqual(reasons,{principais:['O valor da compra não está disponível para comparação.'],adicionais:[]});
  const s=screen(unavailable({qualidadeDados:{registrosElegiveis:0,criteriosIndisponiveis:['NOVO:DESCONHECIDO']}}));
  await s.r.flush();
  const displayed=s.r.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed,/Ainda não há dados para comparar/);
  assert.doesNotMatch(displayed,/Por quê\?|menos de quatro|limite comprovado|NOVO/);
  s.r.unmount();
});
test('limite atual é observação separada e não gera sinal, pergunta reflexiva ou classificação',async()=>{
  const s=screen(unavailable({referenciasFinanceiras:{limiteAtualCentavos:10000,limiteHistoricoCentavos:null,referenciaAtualParticipaDosSinais:false}}));
  await s.r.flush();
  const displayed=s.r.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed,/Limite atual por compra:/);assert.match(displayed,/não usada na comparação histórica/);
  assert.doesNotMatch(displayed,/Diferença observada|O que pode ter contribuído|Principais fatores considerados/);
  assert.match(displayed,/Ainda não há dados para comparar/);s.r.unmount();
});
test('uma evidência válida permanece visível com os demais critérios indisponíveis',async()=>{
  const s=screen(response({qualidadeDados:{registrosElegiveis:6,criteriosIndisponiveis:codes.slice(1)}}));
  await s.r.flush();
  const displayed=s.r.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed,/Valor diferente/);assert.match(displayed,/Diferença observada/);
  assert.doesNotMatch(displayed,/Ainda não há dados para comparar|Por quê\?/);s.r.unmount();
});
test('troca de compra e saída da aba cancelam consulta e descartam resposta atrasada',async()=>{
  const {s,storage}=session(),pending=[];
  const r=createRenderer({
    'react-native':native,
    '../../api/client':{apiClient:{get:async(path,options)=>new Promise(resolve=>pending.push({path,options,resolve}))}},
    '../../api/tokenStorage':{tokenStorage:{...storage,captureSession:async()=>s}},
    '../ReadingDetails':{__esModule:true,default:({children})=>({type:'View',props:{children}})},
  });
  const Component=r.load('src/components/PurchaseComponents/AnaliseAutomatica.js').default;
  r.mount(Component,{compraId:1,active:true});await r.flush();assert.equal(pending.length,1);
  r.update({compraId:2,active:true});await r.flush();assert.equal(pending[0].options.signal.aborted,true);
  pending[0].resolve({data:unavailable({qualidadeDados:{registrosElegiveis:1,criteriosIndisponiveis:codes}})});
  await r.flush();assert.equal(r.nodes(n=>n.type==='Text'&&text(n).includes('menos de quatro')).length,0);
  r.update({compraId:2,active:false});await r.flush();assert.equal(pending[1].options.signal.aborted,true);
  pending[1].resolve({data:response({compraId:2})});await r.flush();assert.equal(r.nodes(n=>n.type==='Text').length,0);
  r.update({compraId:2,active:true});await r.flush();assert.equal(pending.length,3);
  pending[2].resolve({data:unavailable({compraId:2})});await r.flush();
  assert.ok(r.nodes(n=>n.type==='Text'&&text(n).includes('Ainda não há dados para comparar')).length);
  assert.equal(r.nodes(n=>n.type==='Text'&&text(n).includes('Valor diferente')).length,0);r.unmount();
});
