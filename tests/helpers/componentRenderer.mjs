import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');

// Renderizador de eventos e hooks para testes Node, sem carregar módulos nativos.
// Não simula o teclado/cursor Android; esses continuam na validação em dispositivo.
export function createRenderer(mocks = {}) {
  let active, root, props, output, queued = false;
  const instances = new Map();
  const nativeStates = new Map();
  const modules = new Map();
  const alerts = [];
  const React = {
    Fragment: 'Fragment',
    createElement(type, props, ...children) {
      return { type, props: { ...props, children: children.flat(Infinity) } };
    },
    useState(initial) {
      const instance = active;
      const index = instance.index++;
      if (!(index in instance.hooks)) instance.hooks[index] = typeof initial === 'function' ? initial() : initial;
      return [instance.hooks[index], (next) => {
        const value = typeof next === 'function' ? next(instance.hooks[index]) : next;
        if (Object.is(value, instance.hooks[index])) return;
        instance.hooks[index] = value;
        schedule();
      }];
    },
    useRef(initial) {
      const instance = active, index = instance.index++;
      if (!(index in instance.hooks)) instance.hooks[index] = { current: initial };
      return instance.hooks[index];
    },
    useMemo(factory, deps) {
      const instance = active, index = instance.index++;
      const previous = instance.hooks[index];
      if (!previous || !same(previous.deps, deps)) instance.hooks[index] = { deps, value: factory() };
      return instance.hooks[index].value;
    },
    useCallback(callback, deps) { return React.useMemo(() => callback, deps); },
    useLayoutEffect(effect, deps) {
      const instance = active, index = instance.index++;
      const previous = instance.hooks[index];
      if (!previous || !same(previous.deps, deps)) {
        instance.effects.push(() => {
          previous?.cleanup?.();
          instance.hooks[index] = { deps, cleanup: effect() };
        });
      }
    },
    useEffect(effect, deps) { React.useLayoutEffect(effect, deps); },
  };
  function same(a, b) { return a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i])); }
  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; render(); });
  }
  function visit(element, path, effects) {
    if (!element || typeof element !== 'object') return element;
    if (typeof element.type === 'function') {
      let instance = instances.get(path);
      if (!instance || instance.type !== element.type) {
        instance = { type: element.type, hooks: [], effects: [] };
        instances.set(path, instance);
      }
      instance.visited = true;
      instance.index = 0;
      instance.effects = [];
      active = instance;
      const child = element.type(element.props);
      const result = visit(child, path + '/component', effects);
      effects.push(...instance.effects);
      return result;
    }
    const children = (element.props.children || []).map((child, i) =>
      visit(child, `${path}/${child?.props?.key ?? i}`, effects));
    const node = { ...element, props: { ...element.props, children } };
    if (element.props.ref) {
      if (!nativeStates.has(path)) nativeStates.set(path, {});
      node.nativeProps = nativeStates.get(path);
      element.props.ref.current = {
        blur() { node.props.onBlur?.(); },
        setNativeProps(props) { Object.assign(node.nativeProps, props); },
      };
    }
    return node;
  }
  function render() {
    if (!root) return;
    for (const instance of instances.values()) instance.visited = false;
    const effects = [];
    output = visit(React.createElement(root, props), 'root', effects);
    for (const [key, instance] of instances) {
      if (!instance.visited) {
        instance.hooks.forEach((hook) => hook?.cleanup?.());
        instances.delete(key);
      }
    }
    effects.forEach((effect) => effect());
  }
  function load(file) {
    const path = resolve(file);
    if (modules.has(path)) return modules.get(path).exports;
    const source = readFileSync(path, 'utf8');
    const module = { exports: {} };
    modules.set(path, module);
    const code = transformSync(source, {
      filename: path, babelrc: false, configFile: false,
      plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
    }).code;
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === 'react') return React;
      if (name === 'react-native') return {
        ...Object.fromEntries(['View', 'Text', 'TextInput', 'ScrollView', 'Modal', 'Pressable', 'FlatList',
          'TouchableOpacity', 'ActivityIndicator', 'Image', 'KeyboardAvoidingView'].map((key) => [key, key])),
        Alert: { alert: (...args) => alerts.push(args) },
        BackHandler: { addEventListener: () => ({ remove() {} }) },
      };
      if (name === '@react-native-community/slider') return 'Slider';
      if (name === '@expo/vector-icons') return { MaterialCommunityIcons: 'Icon', Ionicons: 'Icon' };
      if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
      if (name === '@react-navigation/native') return { useNavigation: () => ({ goBack() {}, navigate() {} }) };
      if (name === 'expo-web-browser') return { maybeCompleteAuthSession() {} };
      if (name === 'expo-linking') return { addEventListener: () => ({ remove() {} }) };
      if (name.endsWith('/services/security/protectedSession')) return { invalidateProtectedSession() {} };
      if (name.endsWith('/api/tokenStorage')) return { tokenStorage: { async setToken() {} } };
      if (name.endsWith('/components/CustomTextInput')) return { __esModule: true, default: 'CustomTextInput' };
      if (name.includes('constants')) return { COLORS: {} };
      if (name.endsWith('/styles')) return { styles: {} };
      if (name.includes('CustomButton')) return { __esModule: true, default: 'Button' };
      if (name.includes('ProfileCard')) return { __esModule: true, default: 'ProfileCard' };
      if (name.endsWith('utils/error')) return { logApiErrors: (...args) => { throw args[0]; } };
      if (name.endsWith('api/client')) return { apiClient: { get: async () => ({ data: [] }) } };
      if (name.endsWith('.png')) return name;
      const target = resolve(dirname(path), name);
      if (name.endsWith('.js')) return load(target);
      if (existsSync(target + '.js')) return load(target + '.js');
      return load(resolve(target, 'index.js'));
    };
    new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
    return module.exports;
  }
  function nodes(predicate) {
    const found = [];
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (predicate(node)) found.push(node);
      (node.props.children || []).forEach(walk);
    }
    walk(output);
    return found;
  }
  return {
    React, load, alerts, nodes,
    mount(component, initialProps = {}) { root = component; props = initialProps; render(); },
    async flush() { await new Promise((resolve) => setImmediate(resolve)); },
    update(next) { props = { ...props, ...next }; render(); },
    unmount() {
      root = null;
      for (const instance of instances.values()) instance.hooks.forEach((hook) => hook?.cleanup?.());
      instances.clear();
    },
  };
}
