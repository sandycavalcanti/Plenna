import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from '@babel/core';

async function ambiente() {
  const state = {
    memoryConsent: false,
    personalizationConsent: false,
    proactivityConsent: false,
    failConsent: false,
    memories: [{ memoria_id: 1, conteudo: 'Preferência própria.', origem: 'DECLARADA' }],
    consentCalls: [],
    listCalls: 0,
    deleteCalls: [],
    captureCalls: 0,
    effects: [],
    states: [],
    refs: [],
    hookIndex: 0,
    alert: null,
  };
  const session = { id: 1, signal: new AbortController().signal };
  const context = vm.createContext({ AbortController, console, __DEV__: false });
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useEffect: effect => state.effects.push(effect),
    useRef: initial => {
      const index = state.hookIndex++;
      if (!(index in state.refs)) state.refs[index] = { current: initial };
      return state.refs[index];
    },
    useState: initial => {
      const index = state.hookIndex++;
      if (!(index in state.states)) state.states[index] = initial;
      return [state.states[index], next => {
        state.states[index] = typeof next === 'function' ? next(state.states[index]) : next;
      }];
    },
  };
  const api = {
    listarConsentimentos: async () => [
      { consentimento_tipo_codigo: 'MONITORAMENTO_TEMPO_USO', consentimento_status: false },
      { consentimento_tipo_codigo: 'IA_MEMORIA', consentimento_status: state.memoryConsent },
      { consentimento_tipo_codigo: 'IA_PERSONALIZACAO', consentimento_status: state.personalizationConsent },
      { consentimento_tipo_codigo: 'IA_PROATIVIDADE', consentimento_status: state.proactivityConsent },
    ],
    registrarConsentimento: async (codigo, status) => {
      state.registrarEntered = true;
      state.consentCalls.push({ codigo, status });
      if (state.failConsent) throw Object.assign(new Error('falha simulada'), { code: 'ERR_BAD_RESPONSE', response: { status: 503 } });
      if (codigo === 'IA_MEMORIA') state.memoryConsent = status;
      if (codigo === 'IA_PERSONALIZACAO') state.personalizationConsent = status;
      if (codigo === 'IA_PROATIVIDADE') state.proactivityConsent = status;
      return { consentimento_status: status };
    },
  };
  const memoria = {
    listarMemorias: async () => {
      state.listCalls++;
      return { itens: state.memories, proximo_cursor: null };
    },
    criarMemoria: async texto => ({ memoria: { memoria_id: 2, conteudo: texto, origem: 'DECLARADA' } }),
    excluirMemoria: async id => {
      state.deleteCalls.push(id);
      state.memories = state.memories.filter(item => item.memoria_id !== id);
      return { memoria_id: id, excluida: true };
    },
  };
  const mocks = {
    react: { ...react, default: react },
    'react-native': {
      View: 'View', Text: 'Text', Switch: 'Switch', Pressable: 'Pressable', TextInput: 'TextInput',
      ActivityIndicator: 'ActivityIndicator',
      Alert: { alert: (...args) => { state.alert = args; } },
      AppState: { addEventListener: () => ({ remove() {} }) },
    },
    'src/components/ProfileComponents/ProfileCard.js': { default: 'ProfileCard' },
    'src/components/ProfileComponents/Permissions/styles.js': { default: {} },
    'modules/plenna-usage-stats.js': {
      getModuleStatus: async () => ({ available: true }),
      hasUsageAccess: async () => false,
      openUsageAccessSettings: async () => false,
    },
    'src/api/consentimento.js': api,
    'src/api/memoria.js': memoria,
    'src/api/tokenStorage.js': {
      tokenStorage: {
        captureSession: async () => { state.captureCalls++; return session; },
        assertSession: () => {},
      },
    },
    'src/utils/error.js': { logApiErrors: () => {} },
  };
  const base = new URL('../', import.meta.url);
  const cache = new Map();

  async function load(name) {
    if (cache.has(name)) return cache.get(name);
    let module;
    if (mocks[name]) {
      const values = mocks[name];
      module = new vm.SyntheticModule(Object.keys(values), function setExports() {
        for (const [key, value] of Object.entries(values)) this.setExport(key, value);
      }, { context, identifier: name });
    } else {
      let source = await readFile(new URL(name, base), 'utf8');
      if (name.includes('/Permissions/')) {
        source = transformSync(source, {
          filename: name,
          configFile: false,
          babelrc: false,
          plugins: ['@babel/plugin-transform-react-jsx'],
        }).code;
      }
      module = new vm.SourceTextModule(source, { context, identifier: name });
    }
    cache.set(name, module);
    await module.link((specifier, parent) => {
      if (!specifier.startsWith('.')) return load(specifier);
      let resolved = new URL(specifier, new URL(parent.identifier, base)).href.slice(base.href.length);
      if (!resolved.endsWith('.js')) resolved += '.js';
      return load(resolved);
    });
    if (module.status !== 'evaluated') await module.evaluate();
    return module;
  }

  const component = (await load('src/components/ProfileComponents/Permissions/index.js')).namespace.default;
  const render = () => {
    state.hookIndex = 0;
    return component({});
  };
  const settle = async () => {
    for (let index = 0; index < 20; index++) await new Promise(resolve => setImmediate(resolve));
  };
  return { state, render, settle };
}

function findAll(node, type, result = []) {
  if (Array.isArray(node)) {
    for (const child of node) findAll(child, type, result);
    return result;
  }
  if (!node || typeof node !== 'object') return result;
  if (node.type === type) result.push(node);
  for (const child of node.children ?? []) findAll(child, type, result);
  return result;
}

test('Perfil ativa, revoga e exclui memória própria já carregada', async () => {
  const { state, render, settle } = await ambiente();
  const initial = render();
  state.effects[0]();
  await settle();

  let switches = findAll(render(), 'Switch');
  const memorySwitch = switches.at(-1);
  memorySwitch.props.onValueChange(true);
  await settle();
  assert.deepEqual(state.consentCalls, [{ codigo: 'IA_MEMORIA', status: true }]);
  assert.equal(state.listCalls, 1);

  switches = findAll(render(), 'Switch');
  await switches.at(-1).props.onValueChange(false);
  assert.equal(state.alert[0], 'Revogar memória da IA');
  await state.alert[2][1].onPress();
  await settle();
  assert.deepEqual(state.consentCalls, [
    { codigo: 'IA_MEMORIA', status: true },
    { codigo: 'IA_MEMORIA', status: false },
  ]);

  assert.deepEqual(state.states.find(value => Array.isArray(value)), state.memories);
  const renderedAfterRevoke = render();
  const deleteButton = findAll(renderedAfterRevoke, 'Pressable').find(node =>
    JSON.stringify(node).includes('Excluir'));
  assert.ok(deleteButton);
  await deleteButton.props.onPress();
  await state.alert[2][1].onPress();
  await settle();
  assert.deepEqual(state.deleteCalls, [1]);
  assert.deepEqual(state.memories, []);
  void initial;
});

test('Perfil reflete e altera os três consentimentos de IA separadamente', async () => {
  const { state, render, settle } = await ambiente();
  render();
  state.effects[0]();
  await settle();

  let switches = findAll(render(), 'Switch');
  assert.equal(switches.at(-3).props.value, false);
  assert.equal(switches.at(-2).props.value, false);
  assert.equal(switches.at(-1).props.value, false);

  switches.at(-3).props.onValueChange(true);
  switches.at(-2).props.onValueChange(true);
  switches.at(-1).props.onValueChange(true);
  await settle();

  assert.deepEqual(state.consentCalls, [
    { codigo: 'IA_PERSONALIZACAO', status: true },
    { codigo: 'IA_PROATIVIDADE', status: true },
    { codigo: 'IA_MEMORIA', status: true },
  ]);
  switches = findAll(render(), 'Switch');
  assert.equal(switches.at(-3).props.value, true);
  assert.equal(switches.at(-2).props.value, true);
  assert.equal(switches.at(-1).props.value, true);
});

test('falha ao persistir consentimento mantém o switch desligado', async () => {
  const { state, render, settle } = await ambiente();
  render();
  state.effects[0]();
  await settle();
  state.failConsent = true;

  const memorySwitch = findAll(render(), 'Switch').at(-1);
  memorySwitch.props.onValueChange(true);
  await settle();

  assert.deepEqual(state.consentCalls, [{ codigo: 'IA_MEMORIA', status: true }]);
  assert.equal(findAll(render(), 'Switch').at(-1).props.value, false);
});
