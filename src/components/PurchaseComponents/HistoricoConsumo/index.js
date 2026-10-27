import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { criarConsultaHistorico } from '../../../services/historicoCompraService';
import { coberturaRespostas, nomeMes, periodoCivil } from './apresentacao';

const labels = {
  FREQUENCIA: 'Frequência',
  DISTRIBUICAO: 'Datas',
  VALORES: 'Valores',
  CATEGORIAS: 'Categorias',
  PLANEJAMENTO: 'Planejamento',
  PROMOCAO: 'Promoções',
  RECORRENCIAS: 'Recorrências',
};
export default function HistoricoConsumo({
  compraId,
  revisao,
  onRecarregarContexto,
}) {
  const [state, setState] = useState({ status: 'loading', dados: null }),
    [details, setDetails] = useState(false),
    [period, setPeriod] = useState('todos'),
    [topic, setTopic] = useState(null),
    [limits, setLimits] = useState(false);
  const query = useRef(null);
  const [category, setCategory] = useState(null),
    [catMode, setCatMode] = useState('compras');
  useEffect(() => {
    const instance = criarConsultaHistorico({
      compraId,
      revisao,
      client: apiClient,
      storage: tokenStorage,
      onChange: (s) => {
        setState({ ...s, compraId, revisao });
        if (s.status === 'ready') {
          setPeriod('todos');
          setTopic(null);
          setCategory(null);
          setCatMode('compras');
        }
      },
    });
    query.current = instance;
    instance.consultar();
    setDetails(false);
    setLimits(false);
    const listener = AppState?.addEventListener('change', (s) => {
      if (s === 'active') instance.consultar();
      else instance.invalidar();
    });
    return () => {
      listener?.remove();
      instance.dispose();
    };
  }, [compraId, revisao]);
  const current =
      state.compraId === compraId && state.revisao === revisao
        ? state
        : { status: 'loading', dados: null },
    d = current.dados,
    h = d?.historico;
  const total = h ? h.qualidade.comprasAtual + h.qualidade.comprasHistorico : 0;
  const selected = h?.frequencia.periodos.find((p) => p.periodo === period);
  const planningPeriod = h?.planejamento.periodos?.find(
    (p) => p.periodo === period,
  );
  const promotionPeriod = h?.influenciaPromocional.periodos?.find(
    (p) => p.periodo === period,
  );
  const periods = h?.frequencia.periodos.filter((p) => p.compras > 0) || [];
  const available = h?.politicaTemporal?.compras.disponivel;
  const categories = (h?.categorias || []).filter(
    (c) =>
      c.nome &&
      (catMode === 'compras'
        ? c.comprasAtual + c.comprasHistorico > 0
        : c.valores?.comprasAtribuidas > 0 &&
          c.valores.totalLiquidoCentavos > 0),
  );
  const catValue = (c) =>
    catMode === 'compras'
      ? c.comprasAtual + c.comprasHistorico
      : c.valores.totalLiquidoCentavos;
  const selectedCategory = categories.find((c) => c.categoriaId === category);
  const reflection = d?.reflexoesHistoricas.itens.find(
    (i) => i.codigo === topic,
  );
  function metric(icon, value, label) {
    return (
      <View key={label} style={styles.metric}>
        <Ionicons name={icon} size={20} color="#8660A1" />
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.caption}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Seu histórico disponível
      </Text>
      {current.status === 'loading' && (
        <ActivityIndicator
          accessibilityLabel="Carregando histórico de consumo"
          color="#8660A1"
        />
      )}
      {current.status === 'error' && (
        <Text accessibilityRole="alert" style={styles.note}>
          Seu histórico não está disponível agora. O restante continua
          acessível.
        </Text>
      )}
      {current.status === 'session' && (
        <Text style={styles.note}>Entre novamente para ver seu histórico.</Text>
      )}
      {current.status === 'unavailable' && (
        <Text style={styles.note}>
          Esta compra ainda não tem histórico disponível.
        </Text>
      )}
      {current.status === 'conflict' && (
        <>
          <Text style={styles.note}>
            Suas respostas mudaram. Recarregue para continuar.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRecarregarContexto}
            style={styles.action}
          >
            <Text style={styles.link}>Recarregar contexto</Text>
          </Pressable>
        </>
      )}
      {h && (
        <>
          <Text style={styles.note}>
            {selected
              ? `Compras registradas em ${nomeMes(selected.periodo)}`
              : available
                ? `Compras registradas desde ${nomeMes(available.inicio.slice(0, 7))}`
                : 'Compras anteriores registradas'}
          </Text>
          <Text style={styles.caption}>
            Antes desta compra, sem incluir o mesmo dia.
          </Text>
          {total < 2 ? (
            <View style={styles.empty}>
              <Ionicons name="leaf-outline" size={30} color="#8660A1" />
              <Text style={styles.note}>Estamos conhecendo seus hábitos.</Text>
              <Text style={styles.caption}>
                {total} compra(s) anterior(es) registrada(s).
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.metrics}>
                {metric(
                  'bag-outline',
                  selected ? selected.compras : total,
                  'Compras registradas',
                )}
                {selected
                  ? planningPeriod?.conhecidas > 0 &&
                    metric(
                      'calendar-outline',
                      `${planningPeriod.conhecidas} de ${planningPeriod.universo}`,
                      'Planejamento informado',
                    )
                  : h.intervalos.medianaDiasEntreDatas !== null &&
                    metric(
                      'calendar-outline',
                      `${h.intervalos.medianaDiasEntreDatas.toLocaleString('pt-BR')} dias`,
                      'Intervalo entre datas',
                    )}
                {selected
                  ? promotionPeriod?.conhecidas > 0 &&
                    metric(
                      'pricetag-outline',
                      `${promotionPeriod.conhecidas} de ${promotionPeriod.universo}`,
                      'Promoção informada',
                    )
                  : d.comparacaoValorCompra.amostra >= 2 &&
                    d.comparacaoValorCompra.medianaHistoricaCentavos !== null &&
                    metric(
                      'wallet-outline',
                      (
                        d.comparacaoValorCompra.medianaHistoricaCentavos / 100
                      ).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }),
                      'Valor mediano anterior',
                    )}
              </View>
              <Text style={styles.caption}>
                Somente compras registradas. Não indica uma tendência.
              </Text>
            </>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: details }}
            onPress={() => setDetails((v) => !v)}
            style={styles.explore}
          >
            <Text style={styles.link}>
              {details ? 'Recolher histórico' : 'Explorar histórico'}
            </Text>
            <Ionicons
              name={details ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#893467"
            />
          </Pressable>
          {details && (
            <View style={styles.details}>
              <Text accessibilityRole="header" style={styles.subtitle}>
                Seu histórico de consumo
              </Text>
              {total >= 2 && (
                <>
                  <Text style={styles.note}>Compras por período</Text>
                  <View style={styles.chips}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: period === 'todos' }}
                      onPress={() => setPeriod('todos')}
                      style={[
                        styles.chip,
                        period === 'todos' && styles.selected,
                      ]}
                    >
                      <Text style={styles.chipText}>Todo o período</Text>
                    </Pressable>
                    {periods.map((p) => (
                      <Pressable
                        key={p.periodo}
                        accessibilityRole="button"
                        accessibilityState={{ selected: period === p.periodo }}
                        onPress={() => setPeriod(p.periodo)}
                        style={[
                          styles.chip,
                          period === p.periodo && styles.selected,
                        ]}
                      >
                        <Text style={styles.chipText}>
                          {nomeMes(p.periodo)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {selected && (
                    <Text style={styles.caption}>
                      {periodoCivil(selected.inicio, selected.fimExclusivo)}.
                      Não comparamos meses completos com meses incompletos.
                    </Text>
                  )}
                  {periods.length > 1 && (
                    <View style={styles.chart}>
                      {periods.map((p) => (
                        <Pressable
                          key={p.periodo}
                          accessibilityRole="button"
                          accessibilityLabel={`${nomeMes(p.periodo)}: ${p.compras} compras registradas`}
                          onPress={() => setPeriod(p.periodo)}
                          style={styles.barRow}
                        >
                          <Text style={styles.barLabel}>
                            {nomeMes(p.periodo)}
                          </Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.bar,
                                {
                                  width: `${(p.compras / Math.max(1, ...periods.map((p) => p.compras))) * 100}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.chipText}>{p.compras}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              )}
              <Text style={styles.subtitle}>O que você contou</Text>
              {[
                ['Planejamento', h.planejamento],
                ['Promoção', h.influenciaPromocional],
              ].map(([label, indicator]) => {
                const known =
                    indicator.conhecidas + indicator.historico.conhecidas,
                  universe = indicator.universo + indicator.historico.universo;
                if (!known)
                  return (
                    <Text key={label} style={styles.caption}>
                      {label}:{' '}
                      {coberturaRespostas(indicator, indicator.historico)} · sem
                      respostas conhecidas
                    </Text>
                  );
                return (
                  <View key={label} style={styles.reflection}>
                    <Text style={styles.note}>
                      {label}:{' '}
                      {coberturaRespostas(indicator, indicator.historico)}
                    </Text>
                    <View
                      accessibilityLabel={`${known} respostas conhecidas em ${universe} compras`}
                      style={styles.barTrack}
                    >
                      <View
                        style={[
                          styles.bar,
                          {
                            width: `${universe ? (100 * known) / universe : 0}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.chips}>
                      {[
                        ['SIM', 'Sim'],
                        ['PARCIALMENTE', 'Em parte'],
                        ['NAO', 'Não'],
                      ].map(([key, name]) => (
                        <Text key={key} style={styles.chipText}>
                          {name}:{' '}
                          {indicator.contagens[key] +
                            indicator.historico.contagens[key]}
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.caption}>
                      {universe - known} sem resposta conhecida
                    </Text>
                  </View>
                );
              })}
              <Text style={styles.caption}>
                Sem resposta ≠ não planejada. Desconto ≠ influência declarada.
              </Text>
              {h.categorias.some((c) => c.repeticaoObservada) && (
                <Text style={styles.note}>
                  Categorias com repetição:{' '}
                  {h.categorias.filter((c) => c.repeticaoObservada).length}.
                </Text>
              )}
              {(h.recorrencias.cadastradas > 0 ||
                h.recorrencias.comprasVinculadasAtual +
                  h.recorrencias.comprasVinculadasHistorico >
                  0) && (
                <>
                  <Text style={styles.note}>
                    Recorrências cadastradas hoje: {h.recorrencias.cadastradas}.
                    Compras vinculadas:{' '}
                    {h.recorrencias.comprasVinculadasAtual +
                      h.recorrencias.comprasVinculadasHistorico}
                    .
                  </Text>
                  <Text style={styles.caption}>
                    Repetir uma categoria não comprova uma recorrência
                    cadastrada.
                  </Text>
                </>
              )}
              {h.categorias.some((c) => c.nome) && (
                <>
                  <Text style={styles.subtitle}>
                    Categorias dos seus registros
                  </Text>
                  <View style={styles.chips}>
                    {[
                      ['compras', 'Compras'],
                      ['valores', 'Valores conhecidos'],
                    ].map(([mode, label]) => (
                      <Pressable
                        key={mode}
                        accessibilityRole="button"
                        accessibilityState={{ selected: catMode === mode }}
                        onPress={() => {
                          setCatMode(mode);
                          setCategory(null);
                        }}
                        style={[
                          styles.chip,
                          catMode === mode && styles.selected,
                        ]}
                      >
                        <Text style={styles.chipText}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {categories.length ? (
                    categories
                      .slice()
                      .sort((a, b) => catValue(b) - catValue(a))
                      .slice(0, 5)
                      .map((c) => (
                        <Pressable
                          key={c.categoriaId}
                          accessibilityRole="button"
                          accessibilityLabel={`Explorar categoria ${c.nome}`}
                          onPress={() => setCategory(c.categoriaId)}
                          style={styles.barRow}
                        >
                          <Text style={styles.barLabel}>{c.nome}</Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.bar,
                                {
                                  width: `${(100 * catValue(c)) / Math.max(...categories.map(catValue))}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.chipText}>
                            {catMode === 'compras'
                              ? catValue(c)
                              : (catValue(c) / 100).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                          </Text>
                        </Pressable>
                      ))
                  ) : (
                    <Text style={styles.caption}>
                      Ainda não há valores que possam ser atribuídos com
                      segurança.
                    </Text>
                  )}
                  {selectedCategory && (
                    <View style={styles.reflection}>
                      <Text style={styles.subtitle}>
                        {selectedCategory.nome}
                      </Text>
                      <Text style={styles.note}>
                        {selectedCategory.comprasAtual +
                          selectedCategory.comprasHistorico}{' '}
                        compras registradas
                      </Text>
                      <Text style={styles.caption}>
                        {selectedCategory.valores?.comprasAtribuidas ?? 0} com
                        valor atribuído ·{' '}
                        {selectedCategory.valores
                          ?.comprasMulticategoriaSemRateio ?? 0}{' '}
                        com mais de uma categoria
                      </Text>
                    </View>
                  )}
                  {catMode === 'valores' && (
                    <Text style={styles.caption}>
                      Somente compras com uma categoria. Não distribuímos
                      descontos entre categorias.
                    </Text>
                  )}
                </>
              )}
              <Text style={styles.subtitle}>Reflexões do seu histórico</Text>
              {d.reflexoesHistoricas.itens.length ? (
                <>
                  <View style={styles.chips}>
                    {d.reflexoesHistoricas.itens.map((i) => (
                      <Pressable
                        key={i.codigo}
                        accessibilityRole="button"
                        accessibilityState={{ selected: topic === i.codigo }}
                        onPress={() =>
                          setTopic(topic === i.codigo ? null : i.codigo)
                        }
                        style={[
                          styles.chip,
                          topic === i.codigo && styles.selected,
                        ]}
                      >
                        <Text style={styles.chipText}>{labels[i.codigo]}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {reflection && (
                    <View style={styles.reflection}>
                      <Text style={styles.note}>{reflection.observacao}</Text>
                      <Text style={styles.question}>{reflection.reflexao}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.note}>
                  Mais registros podem ajudar nas próximas reflexões.
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: limits }}
                onPress={() => setLimits((v) => !v)}
                style={styles.action}
              >
                <Text style={styles.link}>
                  {limits
                    ? 'Ocultar cuidados com os dados'
                    : 'Sobre os dados e limitações'}
                </Text>
              </Pressable>
              {limits && (
                <>
                  <Text style={styles.caption}>
                    Busca solicitada:{' '}
                    {periodoCivil(h.janelaHistorico.inicio, h.observadoAte)}
                  </Text>
                  <Text style={styles.note}>
                    ✓ Compras ativas e confirmadas
                  </Text>
                  <Text style={styles.note}>
                    ◷ Datas de e-mail podem ser da mensagem
                  </Text>
                  <Text style={styles.note}>
                    ○ Cobertura contínua não comprovada
                  </Text>
                  <Text style={styles.note}>
                    ○ Orçamento histórico desconhecido
                  </Text>
                  <Text style={styles.caption}>
                    {h.valores.atual.semValor + h.valores.historico.semValor}{' '}
                    sem valor · {d.comparacaoValorCompra.amostra} valores na
                    mediana
                  </Text>
                  <Text style={styles.caption}>
                    Consultado em{' '}
                    {new Date(d.consultadoEm).toLocaleString('pt-BR')}. Atualize
                    para ver mudanças posteriores.
                  </Text>
                </>
              )}
            </View>
          )}
        </>
      )}
      {!['loading', 'session', 'conflict'].includes(current.status) && (
        <Pressable
          accessibilityRole="button"
          onPress={() => query.current?.consultar()}
          style={styles.action}
        >
          <Text style={styles.link}>Atualizar histórico</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 25, lineHeight: 32, fontWeight: '700', color: '#594367' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#594367' },
  note: { fontSize: 14, lineHeight: 21, color: '#655A70' },
  caption: { fontSize: 12, lineHeight: 18, color: '#655A70' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: {
    minWidth: 92,
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EEE4F2',
  },
  value: { fontSize: 19, fontWeight: '700', color: '#594367' },
  empty: { padding: 20, borderRadius: 20, backgroundColor: '#EEE4F2', gap: 12 },
  action: { minHeight: 48, justifyContent: 'center' },
  explore: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: { fontSize: 14, fontWeight: '600', color: '#893467' },
  details: { gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8CBDD',
    backgroundColor: '#FFF',
  },
  selected: { backgroundColor: '#EADCF1', borderColor: '#704389' },
  chipText: { fontSize: 13, color: '#594367' },
  chart: { gap: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  barLabel: { width: 105, fontSize: 11, color: '#655A70' },
  barTrack: {
    height: 10,
    flex: 1,
    borderRadius: 5,
    backgroundColor: '#EEE4F2',
    overflow: 'hidden',
  },
  bar: { height: 10, backgroundColor: '#8660A1', borderRadius: 5 },
  reflection: {
    padding: 14,
    gap: 10,
    backgroundColor: '#EEE4F2',
    borderRadius: 18,
  },
  question: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    color: '#594367',
  },
});
