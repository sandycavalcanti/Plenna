import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';

const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) : node?.props?.children?.map(text).join(' ') || '';
const data = () => ({ financeiro: { totalConhecidoCentavos: 3000, qualidade: 'COMPLETO', comprasSemValor: 0 }, orcamento: { disponibilidade: 'REFERENCIA_ATUAL', valorCentavos: 10000, percentualConhecido: 30, excessoConhecidoCentavos: 0 } });
function mount(props) {
  const renderer = createRenderer();
  renderer.mount(renderer.load('src/components/DashboardComponents/ResumoFinanceiroPeriodo.js').default, props);
  return renderer;
}
const visible = renderer => renderer.nodes(node => node.type === 'Text').map(text).join(' ');

test('resumo financeiro usa valores conhecidos e apresenta percentual e orçamento', () => {
  const renderer = mount({ dados: data() });
  assert.match(visible(renderer), /30\s*%/);
  assert.match(visible(renderer), /30,00/);
  assert.equal(renderer.nodes(node => node.props.accessibilityRole === 'progressbar').length, 2);
  renderer.unmount();
});

test('carregamento e erro não reutilizam gastos anteriores; erro oferece nova tentativa', async () => {
  let retries = 0;
  const renderer = mount({ dados: data(), loading: true });
  assert.doesNotMatch(visible(renderer), /30%|30,00/);
  renderer.update({ dados: data(), loading: false, error: true, onRetry: () => retries++ });
  await renderer.flush();
  assert.match(visible(renderer), /Erro ao carregar/);
  renderer.nodes(node => node.type === 'Pressable')[0].props.onPress();
  assert.equal(retries, 1);
  renderer.unmount();
});

test('orçamento histórico ausente não transforma o orçamento atual em referência do mês', () => {
  const dados = data(); dados.orcamento = { disponibilidade: 'INDISPONIVEL', valorCentavos: null, percentualConhecido: null };
  const renderer = mount({ dados });
  assert.match(visible(renderer), /não disponível/);
  assert.doesNotMatch(visible(renderer), /30%/);
  assert.equal(renderer.nodes(node => node.props.accessibilityRole === 'progressbar').length, 0);
  renderer.unmount();
});

test('valores desconhecidos não viram gasto zero nem percentual de utilização', () => {
  const dados = data(); dados.financeiro = { qualidade: 'INSUFICIENTE', totalConhecidoCentavos: null };
  const renderer = mount({ dados });
  assert.match(visible(renderer), /Valor não informado/);
  assert.doesNotMatch(visible(renderer), /30%|0,00 gastos/);
  renderer.unmount();
});

test('referência observada é identificada como histórico parcial', () => {
  const dados = data(); Object.assign(dados.orcamento, { disponibilidade: 'REFERENCIA_HISTORICA', vigencia: 'REFERENCIA_OBSERVADA' });
  const renderer = mount({ dados });
  assert.match(visible(renderer), /Referência observada no mês.*histórico parcial/);
  renderer.unmount();
});

test('excesso conhecido permanece explícito com cobertura parcial', () => {
  const dados = data(); Object.assign(dados.financeiro, { qualidade: 'PARCIAL', totalConhecidoCentavos: 12000 }); Object.assign(dados.orcamento, { percentualConhecido: 120, excessoConhecidoCentavos: 2000 });
  const renderer = mount({ dados });
  assert.match(visible(renderer), /120\s*%/);
  assert.match(visible(renderer), /20,00\s+acima do orçamento/);
  renderer.unmount();
});
