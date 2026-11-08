import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer } from './helpers/componentRenderer.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('CustomTextInput delimita o campo e expõe estados explícitos de foco e erro', async () => {
  const renderer = createRenderer();
  const CustomTextInput = renderer.load('src/components/CustomTextInput/index.js').default;
  const componentSource = read('src/components/CustomTextInput/index.js');
  const stylesSource = read('src/components/CustomTextInput/styles.js');
  const textValue = { current: '' };
  let focusCount = 0;
  let blurCount = 0;

  renderer.mount(CustomTextInput, {
    placeholder: 'E-mail',
    textValue,
    value: '',
    onFocus: () => { focusCount += 1; },
    onBlur: () => { blurCount += 1; },
    errorMessage: 'E-mail inválido',
  });

  const input = () => renderer.nodes((node) => node.type === 'TextInput')[0].props;
  assert.match(componentSource, /placeholderTextColor \|\| COLORS\.dadoUm/);
  assert.match(stylesSource, /borderWidth: 1/);
  assert.match(stylesSource, /inputFocused: \{[\s\S]*COLORS\.cadCaixaPreferenciasBorda/);
  assert.match(stylesSource, /inputError: \{[\s\S]*COLORS\.buttonDangerBorder/);

  input().onFocus({ nativeEvent: {} });
  await renderer.flush();
  assert.equal(focusCount, 1);

  input().onBlur({ nativeEvent: {} });
  await renderer.flush();
  assert.equal(blurCount, 1);
});

test('Login e recuperação mantêm o formulário rolável com o teclado aberto', () => {
  const login = read('src/pages/LoginScreen/index.js');
  const forgot = read('src/pages/ForgotPasswordScreen/index.js');

  for (const source of [login, forgot]) {
    assert.match(source, /<KeyboardAvoidingView[\s\S]*behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/);
    assert.match(source, /<ScrollView[\s\S]*keyboardShouldPersistTaps="handled"/);
    assert.match(source, /keyboardDismissMode="on-drag"/);
  }
});

test('Preferências usa a paleta existente no placeholder do campo numérico', () => {
  const source = read('src/components/PreferencesForm/index.js');
  assert.match(source, /placeholderTextColor=\{COLORS\.dadoUm\}/);
  assert.doesNotMatch(source, /placeholderTextColor=\{['"]rgba\(0,0,0,0\.4\)/);
});

test('campos diretos de formulários mantêm placeholder e delimitação explícitos', () => {
  const questionario = read('src/pages/QuestionarioScreen/styles.js');
  const questionarioScreen = read('src/pages/QuestionarioScreen/index.js');
  const metaForm = read('src/components/Metas/MetaFormSheet/index.js');
  const movementForm = read('src/pages/MetaDetailsScreen/index.js');
  const purchaseManagement = read('src/components/PurchaseComponents/GerenciarCompra.js');

  assert.match(questionario, /stepThreeInput:[\s\S]*borderWidth: 1/);
  assert.match(questionarioScreen, /stepThreeInputFocused/);
  assert.equal((metaForm.match(/placeholderTextColor=\{COLORS\.dadoUm\}/g) || []).length, 3);
  assert.match(movementForm, /placeholder="Ex\.: 150,00" placeholderTextColor=\{COLORS\.dadoUm\}/);
  assert.equal((purchaseManagement.match(/placeholderTextColor=\{COLORS\.dadoUm\}/g) || []).length, 2);
});

test('MetaFormSheet reduz a área do modal no Android e mantém ações dentro da rolagem', () => {
  const source = read('src/components/Metas/MetaFormSheet/index.js');
  assert.match(source, /behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/);
  assert.match(source, /keyboardDismissMode="on-drag"/);
  assert.ok(source.indexOf('<View style={styles.actions}>') < source.indexOf('</ScrollView>'));
});
