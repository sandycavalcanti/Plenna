import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import Categoria from '../../components/DashboardComponents/Categoria';
import TempoApp from '../../components/DashboardComponents/TempoApp';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import AlertasHabito from '../../components/DashboardComponents/AlertasHabito';
import { styles } from './styles';
import { COLORS } from '../../constants/colors';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import Impulsividade from '../../components/DashboardComponents/Impulsividade';
import FormaPagamento from '../../components/DashboardComponents/FormaPagamento';
import AnimatedSection from '../../components/AnimatedSection';

export default function DashboardScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { loading, setLoading, fetchTempoUso, fetchCompras, fetchUsuario, fetchGastosCategoria, fetchImpulsividade, fetchGastosFormaPagamento, fetchLimiteCompra } = useDataRefresh();

  const [tempoUso, setTempoUso] = useState([]);
  const [compras, setCompras] = useState([]);
  const [itens, setItens] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [gastosCategoria, setGastosCategoria] = useState([]);
  const [impulsividade, setImpulsividade] = useState(null);
  const [gastosFormaPagamento, setGastosFormaPagamento] = useState(null);
  const [limiteCompra, setLimiteCompra] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Função que busca todos os dados em paralelo
  const refetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [tempoUsoData, comprasData, usuarioData, gastosCategoriaData, impulsividadeData, gastosFormaPagamentoData, limiteCompraData] = await Promise.all([
        fetchTempoUso(),
        fetchCompras(),
        fetchUsuario(),
        fetchGastosCategoria(),
        fetchImpulsividade(),
        fetchGastosFormaPagamento(),
        fetchLimiteCompra(),
      ]);

      setTempoUso(tempoUsoData);
      setCompras(comprasData.compras);
      setItens(comprasData.itens);
      setUsuario(usuarioData);
      setGastosCategoria(gastosCategoriaData);
      setImpulsividade(impulsividadeData);
      setGastosFormaPagamento(gastosFormaPagamentoData);
      setLimiteCompra(limiteCompraData);
    } finally {
      setRefreshing(false);
    }
  }, [fetchTempoUso, fetchCompras, fetchUsuario, fetchGastosCategoria, fetchImpulsividade, fetchGastosFormaPagamento, fetchLimiteCompra]);

  // Buscar dados na primeira renderização
  useEffect(() => {
    refetchAllData();
  }, []);

  // Refetch quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      refetchAllData();
    }, [refetchAllData]),
  );
  const [dataSelecionada, setDataSelecionada] = useState(new Date());

  const mesAtual = dataSelecionada
    .toLocaleDateString('pt-BR', {
      month: 'long',
    })
    .replace(/^./, (letra) => letra.toUpperCase());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.monthChip} onPress={() => {}}>
          <MaterialIcons name="calendar-month" size={20} color={COLORS.dashboardChipMesTexto} />

          <Text style={styles.monthChipText}>{mesAtual}</Text>
        </TouchableOpacity>

        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.iconAction} onPress={() => {}}>
            <Feather name="filter" size={28} color={COLORS.dashboardIconeBotaoCanto} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAllData} tintColor={COLORS.dashboardChipMesTexto} />}>
        <AnimatedSection delay={0}>
          <GastosTotais compras={compras} meta={usuario?.usuario_meta_valor_mensal} />
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <Categoria gastosCategoria={gastosCategoria} />
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <Impulsividade data={impulsividade} />
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <TempoApp tempoUso={tempoUso} />
        </AnimatedSection>

        <AnimatedSection delay={400}>
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
        </AnimatedSection>

        <AnimatedSection delay={500}>
          <FormaPagamento gastosFormaPagamento={gastosFormaPagamento} />
        </AnimatedSection>
      </ScrollView>
    </SafeAreaView>
  );
}
