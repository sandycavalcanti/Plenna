import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import Categoria from '../../components/DashboardComponents/Categoria';
import TempoApp from '../../components/DashboardComponents/TempoApp';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import AlertasHabito from '../../components/DashboardComponents/AlertasHabito';
import { styles } from './styles';
import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { CatchError } from '../../api/constants';
import Impulsividade from '../../components/DashboardComponents/Impulsividade';
import FormaPagamento from '../../components/DashboardComponents/FormaPagamento';

export default function DashboardScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [tempoUso, setTempoUso] = useState([]);
  const [compras, setCompras] = useState([]);
  const [itens, setItens] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [gastosCategoria, setGastosCategoria] = useState([]);
  const [impulsividade, setImpulsividade] = useState(null);
  const [gastosFormaPagamento, setGastosFormaPagamento] = useState(null);
  const [limiteCompra, setLimiteCompra] = useState(null);

  useEffect(() => {
    selecionarTempoUso();
    selecionarCompras();
    selecionarUsuario();
    GastoCategoria();
    SelecionarImpulsividade();
    SelecionarFormaPagamento();
    SelecionarLimiteCompra();
  }, []);

  function selecionarTempoUso() {
    apiClient
      .get('/tempo-uso')
      .then((response) => {
        setTempoUso(response.data);
      })
      .catch(CatchError);
  }

  function selecionarCompras() {
    apiClient
      .get('/compras')
      .then((response) => {
        const data = response.data || [];
        const items = data.flatMap((c) => (Array.isArray(c.tb_compra_item) ? c.tb_compra_item.map((item) => ({ ...item, compra_id: c.compra_id })) : []));
        setCompras(data);
        setItens(items);
      })
      .catch(CatchError);
  }

  function selecionarUsuario() {
    apiClient
      .get('/users/user')
      .then((response) => {
        setUsuario(response.data);
      })
      .catch(CatchError);
  }

  function GastoCategoria() {
    apiClient
      .get('/dashboard/gastos-categoria')
      .then((response) => {
        setGastosCategoria(response.data);
      })
      .catch(CatchError);
  }

  function SelecionarImpulsividade() {
    apiClient
      .get('/dashboard/impulsividade')
      .then((response) => {
        setImpulsividade(response.data);
      })
      .catch(CatchError);
  }

  function SelecionarFormaPagamento() {
    apiClient
      .get('/dashboard/gastos-forma-pagamento')
      .then((response) => {
        setGastosFormaPagamento(response.data);
      })
      .catch(CatchError);
  }

  function SelecionarLimiteCompra() {
    apiClient
      .get('/dashboard/limite-compras')
      .then((response) => {
        setLimiteCompra(response.data);
      })
      .catch(CatchError);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.monthChip} onPress={() => {}}>
          <MaterialIcons name="calendar-month" size={20} color={COLORS.dashboardChipMesTexto} />

          <Text style={styles.monthChipText}>Janeiro</Text>
        </TouchableOpacity>

        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.iconAction} onPress={() => {}}>
            <MaterialIcons name="add" size={30} color={COLORS.dashboardIconeBotaoCanto} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconAction} onPress={() => {}}>
            <Feather name="filter" size={28} color={COLORS.dashboardIconeBotaoCanto} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]} showsVerticalScrollIndicator={false}>
        <GastosTotais compras={compras} meta={usuario?.usuario_meta_valor_mensal} />
        <Categoria gastosCategoria={gastosCategoria} />
        <Impulsividade data={impulsividade} />
        <TempoApp tempoUso={tempoUso} />
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
        <FormaPagamento gastosFormaPagamento={gastosFormaPagamento} />
      </ScrollView>
    </SafeAreaView>
  );
}
