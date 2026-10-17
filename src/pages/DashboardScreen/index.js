import { observarAtualizacaoTempoUso } from '../../utils/tempoUsoAtualizacao';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import Categoria from '../../components/DashboardComponents/Categoria';
import TempoApp from '../../components/DashboardComponents/TempoApp';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import { styles } from './styles';
import { COLORS } from '../../constants/colors';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import Impulsividade from '../../components/DashboardComponents/Impulsividade';
import FormaPagamento from '../../components/DashboardComponents/FormaPagamento';
import AnimatedSection from '../../components/AnimatedSection';
import { useResumoMensal } from '../../hooks/useResumoMensal';
import { periodoMensalUTC } from '../../utils/resumoFinanceiro';
import { useAnaliseComportamento } from '../../hooks/useAnaliseComportamento';
import AnaliseComportamento from '../../components/DashboardComponents/AnaliseComportamento';

export default function DashboardScreen({ navigation, route }) {
  const tabBarHeight = useBottomTabBarHeight();
  const scroll = useRef(null);
  const positions = useRef({});
  const incomingPeriod = route?.params?.periodo;
  const indicador = route?.params?.indicador;
  const pendingScroll = useRef(Boolean(indicador));
  useEffect(() => {
    if (typeof incomingPeriod === 'string' && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(incomingPeriod) && incomingPeriod <= periodoMensalUTC()) setDataSelecionada(new Date(`${incomingPeriod}-01T00:00:00Z`));
  }, [incomingPeriod]);
  const section = indicador === 'tempo' ? 'tempo' : ['categorias','compras','orientacoes'].includes(indicador) ? 'rf018' : 'financeiro';
  useEffect(() => { pendingScroll.current = Boolean(indicador); if (pendingScroll.current && positions.current[section] !== undefined) { scroll.current?.scrollTo({ y: positions.current[section], animated: true }); pendingScroll.current = false; } }, [indicador, incomingPeriod, section]);
  const mark = key => event => { positions.current[key] = event.nativeEvent.layout.y; if (pendingScroll.current && key === section) { scroll.current?.scrollTo({ y: event.nativeEvent.layout.y, animated: true }); pendingScroll.current = false; } };
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const financeiro = useResumoMensal(periodoMensalUTC(dataSelecionada));
  const comportamento = useAnaliseComportamento(periodoMensalUTC(dataSelecionada));
  const mudarMes = (offset) => setDataSelecionada(current => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1)));
  const { loading, setLoading, fetchTempoUso, fetchGastosCategoria, fetchImpulsividade, fetchGastosFormaPagamento, fetchLimiteCompra } = useDataRefresh();

  const [tempoUso, setTempoUso] = useState([]);
  const [gastosCategoria, setGastosCategoria] = useState([]);
  const [impulsividade, setImpulsividade] = useState(null);
  const [gastosFormaPagamento, setGastosFormaPagamento] = useState(null);
  const [limiteCompra, setLimiteCompra] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const request = useRef(0);
  const [graficosError, setGraficosError] = useState(false);
  const [tempoUsoError, setTempoUsoError] = useState(false);
  const refetchAllData = useCallback(async () => {
    const id = ++request.current;
    setRefreshing(true);
    setGraficosError(false);
    setTempoUsoError(false);
    setTempoUso([]); setGastosCategoria([]); setImpulsividade(null);
    setGastosFormaPagamento(null); setLimiteCompra(null);
    try {
      const periodo = periodoMensalUTC(dataSelecionada);
      const options = { throwOnError: true };
      const [tempo, categorias, classificacoes, pagamentos, limites] = await Promise.all([
        fetchTempoUso(options).catch(() => { if (id === request.current) setTempoUsoError(true); return []; }),
        fetchGastosCategoria(periodo, options),
        fetchImpulsividade(periodo, options),
        fetchGastosFormaPagamento(periodo, options),
        fetchLimiteCompra(periodo, options),
      ]);
      if (id !== request.current) return;
      setTempoUso(tempo); setGastosCategoria(categorias); setImpulsividade(classificacoes);
      setGastosFormaPagamento(pagamentos); setLimiteCompra(limites);
    } catch {
      if (id === request.current) setGraficosError(true);
    } finally {
      if (id === request.current) setRefreshing(false);
    }
  }, [dataSelecionada, fetchTempoUso, fetchGastosCategoria, fetchImpulsividade, fetchGastosFormaPagamento, fetchLimiteCompra]);

  useFocusEffect(useCallback(() => {
    refetchAllData();
    let active = true;
    const unsubscribe = observarAtualizacaoTempoUso(async () => {
      const id = request.current;
      try {
        const registros = await fetchTempoUso({ throwOnError: true });
        if (active && id === request.current) { setTempoUso(registros); setTempoUsoError(false); }
      } catch { if (active && id === request.current) { setTempoUso([]); setTempoUsoError(true); } }
    });
    return () => { active = false; request.current++; unsubscribe(); };
  }, [refetchAllData, fetchTempoUso]));
  const mesAtual = dataSelecionada
    .toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .replace(/^./, (letra) => letra.toUpperCase());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mes anterior" onPress={() => mudarMes(-1)}><Text>‹</Text></TouchableOpacity>
        <View style={styles.monthChip}>
          <MaterialIcons name="calendar-month" size={20} color={COLORS.dashboardChipMesTexto} />

          <Text style={styles.monthChipText}>{mesAtual}</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Proximo mes" disabled={periodoMensalUTC(dataSelecionada) >= periodoMensalUTC()} onPress={() => mudarMes(1)}><Text>›</Text></TouchableOpacity>

        <View style={styles.topBarActions}>
          {/*
            Botão de acesso ao histórico: reutiliza exatamente o container visual
            do filtro e apenas adiciona a navegação para a nova tela.
          */}
          <TouchableOpacity style={styles.iconAction} onPress={() => navigation.navigate('Purchases')}>
            <Feather name="shopping-bag" size={28} color={COLORS.dashboardIconeBotaoCanto} />
          </TouchableOpacity>

          {/* O filtro existente permanece sem alteração de comportamento. */}
          <TouchableOpacity style={styles.iconAction} onPress={() => {}}>
            <Feather name="filter" size={28} color={COLORS.dashboardIconeBotaoCanto} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scroll}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { financeiro.refresh(); comportamento.refresh(); refetchAllData(); }} tintColor={COLORS.dashboardChipMesTexto} />}>
        <View onLayout={mark('financeiro')}><AnimatedSection delay={0}>
          <GastosTotais
             resumo={financeiro.resumo}
             resumoLoading={financeiro.loading}
             resumoError={financeiro.error}
             cobertura={comportamento.dados?.analise?.qualidade.cobertura}
             tempoUso={tempoUso}
          />
        </AnimatedSection></View>

        <View onLayout={mark('rf018')}><AnaliseComportamento dados={comportamento.dados} loading={comportamento.loading} error={comportamento.error} onRetry={comportamento.refresh} /></View>
        <Text style={{ color: '#655A70', marginHorizontal: 18, marginBottom: 8 }}>Gráficos financeiros: {mesAtual}. Tempo de uso: hoje.</Text>
        {graficosError && <TouchableOpacity accessibilityRole="button" onPress={refetchAllData} style={{ padding: 16 }}><Text>Não foi possível atualizar os gráficos. Toque para tentar novamente.</Text></TouchableOpacity>}
        {refreshing && <ActivityIndicator accessibilityLabel="Carregando gráficos do mês" />}
        {!refreshing && !graficosError && <AnimatedSection delay={100}>
          <Categoria gastosCategoria={gastosCategoria} />
          <Text style={{marginHorizontal:18,color:'#655A70',fontSize:13,lineHeight:19}}>Valores dos itens; descontos podem fazer o total da compra ser diferente.</Text>
        </AnimatedSection>}

        {!refreshing && !graficosError && <AnimatedSection delay={200}>
          <Impulsividade data={impulsividade} />
        </AnimatedSection>}

        <View onLayout={mark('tempo')}><AnimatedSection delay={300}>
          <TempoApp tempoUso={tempoUso} loading={refreshing} error={tempoUsoError} />
        </AnimatedSection></View>

        {!refreshing && !graficosError && <AnimatedSection delay={400}>
          <Impulsividade
            data={limiteCompra}
            title="Compras acima do limite"
            emptyMessage="Nenhuma compra disponível para análise"
            centerLabel="acima do limite"
            centerValueMode="quantity"
            infoTitle="Limite de compras"
            highLabel="Acima do limite"
            mediumLabel="Próximo do limite"
            lowLabel="Dentro do limite"
            highDescription="Existem compras acima do valor limite definido para o período."
            mediumDescription="O volume de compras já está se aproximando do limite definido."
            lowDescription="As compras estão dentro do limite definido para o período."
            totalKey="acima_limite"
          />
        </AnimatedSection>}

        {!refreshing && !graficosError && <AnimatedSection delay={500}>
          <FormaPagamento gastosFormaPagamento={gastosFormaPagamento} />
        </AnimatedSection>}
      </ScrollView>
    </SafeAreaView>
  );
}
