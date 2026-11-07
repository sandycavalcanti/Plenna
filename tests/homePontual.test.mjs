import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Home keeps fixed budget and metas independent from the selected month', async () => {
  const home = await read('src/pages/HomeScreen/index.js');
  const chart = await read('src/utils/meiaLuaHome.js');

  assert.match(home, /useRecomendacoesHome\(periodo\)/);
  assert.match(home, /useMetasHome\(\)/);
  assert.match(home, /orcamentoFixo=\{usuario\?\.usuario_meta_valor_mensal\}/);
  assert.match(chart, /orcamentoFixoCentavos/);
  assert.match(chart, /hasFixedBudget/);
});

test('Home sends the selected month to recommendation listing and removes orphan time CTA', async () => {
  const home = await read('src/pages/HomeScreen/index.js');
  const hook = await read('src/hooks/useRecomendacoesHome.js');

  assert.match(hook, /listarRecomendacoes\(\{ limite: 10, periodo \}\)/);
  assert.match(hook, /\}, \[periodo\]\)/);
  assert.match(home, /const tempoTemDados = tempo\.estado === 'DISPONIVEL'/);
  assert.match(home, /\{tempoTemDados \? <TouchableOpacity/);
  assert.doesNotMatch(home, /<Text style=\{styles\.timeLinkText\}>Entender meu tempo<\/Text>\s*<\/TouchableOpacity>\s*<\/View>/);
});

test('empty consumption and meta form do not keep redundant copy', async () => {
  const consumption = await read('src/components/DashboardComponents/AnaliseComportamento/index.js');
  const form = await read('src/components/Metas/MetaFormSheet/index.js');

  assert.doesNotMatch(consumption, /Nenhuma compra confirmada registrada neste per\u00edodo/);
  assert.doesNotMatch(consumption, /Sem orienta\u00e7\u00f5es dispon\u00edveis neste m\u00eas/);
  assert.doesNotMatch(form, /mode === 'edit' \? 'Editar meta'/);
  assert.match(form, /Ajuste seu objetivo/);
});

test('PIN cancel button has an explicit centered touch target without changing behavior', async () => {
  const styles = await read('src/components/SecurityComponents/PinModal/styles.js');
  const modal = await read('src/components/SecurityComponents/PinModal/index.js');

  assert.match(styles, /cancel:[\s\S]*?alignSelf: 'center'/);
  assert.match(styles, /cancel:[\s\S]*?alignItems: 'center'/);
  assert.match(styles, /cancel:[\s\S]*?justifyContent: 'center'/);
  assert.match(styles, /cancel:[\s\S]*?minHeight: 48/);
  assert.match(modal, /title="Cancelar" variant="secondary"/);
  assert.match(modal, /onPress=\{handleCancel\}/);
});

test('fixed budget preserves zero progress and computes historical period values', async () => {
  const source = await read('src/utils/meiaLuaHome.js');
  const moneySource = await read('src/utils/metaMoney.js');
  const { valorRealParaCentavos } = await import(`data:text/javascript;base64,${Buffer.from(moneySource).toString('base64')}`);
  const { apresentarMeiaLua } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const dados = {
    financeiro: { qualidade: 'COMPLETO', cobertura: 'COMPLETA', totalConhecidoCentavos: 0 },
    orcamento: { disponibilidade: 'INDISPONIVEL', motivo: 'ORCAMENTO_HISTORICO_NAO_COMPROVADO', valorCentavos: null },
  };

  assert.equal(valorRealParaCentavos('500,00'), 50000);
  assert.equal(valorRealParaCentavos(500), 50000);
  const zero = apresentarMeiaLua(dados, valorRealParaCentavos('500,00'));
  assert.equal(zero.orcamento, 50000);
  assert.equal(zero.percentual, 0);
  assert.equal(zero.progresso, 0);
  assert.equal(zero.restante, 50000);

  const exceeded = apresentarMeiaLua({
    financeiro: { qualidade: 'COMPLETO', cobertura: 'COMPLETA', totalConhecidoCentavos: 75000 },
    orcamento: { disponibilidade: 'INDISPONIVEL', motivo: 'ORCAMENTO_HISTORICO_NAO_COMPROVADO' },
  }, valorRealParaCentavos('500,00'));
  assert.equal(exceeded.percentual, 150);
  assert.equal(exceeded.progresso, 1);
  assert.equal(exceeded.excesso, 25000);
});
