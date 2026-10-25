import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import CardFinanceiroHome from '../../components/HomeComponents/CardFinanceiroHome';
import MetasHome from '../../components/HomeComponents/MetasHome';
import { useMetasHome } from '../../hooks/useMetasHome';
import { destaquesHome } from '../../utils/destaquesHome';
import { resumirTempoHoje, formatarTempoUso } from '../../utils/resumoTempoUso';
import SeletorMensalHome from '../../components/HomeComponents/SeletorMensalHome';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useResumoHome } from '../../hooks/useResumoHome';
import { useTempoUsoHome } from '../../hooks/useTempoUsoHome';
import { periodoMensalUTC } from '../../utils/resumoFinanceiro';
import PurchaseHero from '../../components/PurchaseHero';
import { COLORS } from '../../constants/colors';
import { useDataRefresh } from '../../hooks/useDataRefresh';

import { getUnreadCount, waitForPendingNotificationReads } from '../../services/notifications/notificationApi';
import { getUnreadBadgeLabel } from '../../services/notifications/notificationPresentation';
import { useRecomendacoesHome } from '../../hooks/useRecomendacoesHome';
import { obterContextoRecomendacao } from '../../api/recomendacoes';

export default function HomeScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { fetchUsuario } = useDataRefresh();
  const [periodo,setPeriodo] = useState(() => periodoMensalUTC());
  const financeiro = useResumoHome(periodo);
  const tempo = useTempoUsoHome(true);
  const metas = useMetasHome();
  const recomendacoes = useRecomendacoesHome();
  const [usuario, setUsuario] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFocused = useIsFocused();
  const bellRotation = useRef(new Animated.Value(0)).current;
  const bellAnimationRef = useRef(null);

  const refetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      setUsuario(await fetchUsuario());
    } finally {
      setRefreshing(false);
    }
  }, [fetchUsuario]);

  const refetchUnreadCount = useCallback(async () => {
    try {
      await waitForPendingNotificationReads();
      setUnreadCount(await getUnreadCount());
    } catch {
      // O sino continua funcional mesmo quando a consulta do contador falha.
    }
  }, []);



  useFocusEffect(
    useCallback(() => {
      refetchAllData();
      refetchUnreadCount();
    }, [refetchAllData, refetchUnreadCount]),
  );

  useEffect(() => {
    const shouldAnimate = isFocused && unreadCount > 0;

    if (!shouldAnimate) {
      bellAnimationRef.current?.stop();
      bellAnimationRef.current = null;
      bellRotation.stopAnimation();
      bellRotation.setValue(0);
      return undefined;
    }

    const shake = Animated.sequence([
      Animated.timing(bellRotation, { toValue: -20, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 20, duration: 140, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 0, duration: 90, useNativeDriver: true }),
      Animated.delay(2000),
    ]);
    const loop = Animated.loop(shake, { resetBeforeIteration: false });
    bellAnimationRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      if (bellAnimationRef.current === loop) bellAnimationRef.current = null;
      bellRotation.stopAnimation();
      bellRotation.setValue(0);
    };
  }, [bellRotation, isFocused, unreadCount]);

  const openNotifications = useCallback(() => {
    const parentNavigation = navigation.getParent?.();
    (parentNavigation || navigation).navigate('Notifications');
  }, [navigation]);
  const unreadBadgeLabel = getUnreadBadgeLabel(unreadCount);
  const destaques = destaquesHome(financeiro.loading || financeiro.error ? null : financeiro.dados, metas.loading || metas.error ? [] : metas.metas, unreadCount);
  const conversarSobreRecomendacao = useCallback(async (item) => {
    try { await recomendacoes.updateStatus(item.id, 'VISUALIZADA'); } catch { /* fallback local seguro */ }
    let contexto = `Quero conversar sobre a recomendação "${item.titulo}". ${item.texto}`;
    try {
      const resposta = await obterContextoRecomendacao(item.id);
      if (typeof resposta?.contexto === 'string' && resposta.contexto.trim()) contexto = resposta.contexto;
    } catch { /* o texto do card permanece disponível */ }
    navigation.navigate('Chat', { mode: 'new', recommendationContext: contexto.slice(0, 800) });
  }, [navigation, recomendacoes]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, marginTop: 10, paddingBottom: tabBarHeight + 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { financeiro.refresh(); metas.refresh(); tempo.refresh(); refetchAllData(); }} tintColor={COLORS.dadoUm} />}>
        <View style={styles.topBar}>
          <View style={styles.topBarTextBlock}>
            <Text style={styles.greeting}>Olá, {usuario?.usuario_nome}!</Text>
            <Text style={styles.subtitle}>Vamos ter um mês mais consciente?</Text>
          </View>

          <TouchableOpacity style={[styles.notificationButton, unreadCount > 0 ? styles.notificationButtonPending : null]} onPress={openNotifications} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ rotate: bellRotation.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) }] }}>
              <MaterialCommunityIcons name="bell-outline" size={26} color={unreadCount > 0 ? '#C02C7A' : COLORS.dadoUm} />
            </Animated.View>
            {unreadBadgeLabel ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadBadgeLabel}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <SeletorMensalHome periodo={periodo} limites={financeiro.dados?.seletor} loading={financeiro.loading} error={financeiro.error} onChange={setPeriodo} />
        <PurchaseHero />
        <View style={{marginHorizontal:18,marginBottom:14}}><CardFinanceiroHome dados={financeiro.dados} loading={financeiro.loading} error={financeiro.error} onRetry={financeiro.refresh}/></View>
        <MetasHome {...metas} onRetry={metas.refresh} onCreate={() => navigation.navigate('EditProfile',{mode:'goals'})}/>
        <View style={{marginHorizontal:18,padding:16,marginBottom:14,borderRadius:18,backgroundColor:'#FFFFFF',gap:8}}><Text style={{fontSize:18,fontWeight:'700',color:'#594367'}}>Tempo em aplicativos · hoje</Text><Text style={{fontSize:24,fontWeight:'700',color:'#893467'}}>{tempo.estado==='CARREGANDO'?'Carregando':tempo.estado==='ERRO'?'Indisponível':tempo.estado==='SEM_CONSENTIMENTO'?'Não autorizado':resumirTempoHoje(tempo.registros)>0?formatarTempoUso(resumirTempoHoje(tempo.registros)):'Sem registros hoje'}</Text><Text>{tempo.estado==='SEM_CONSENTIMENTO'?'Monitoramento não autorizado. Consulte o Perfil.':'Somente registros deste celular; tempo de uso não comprova compras.'}</Text><TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Dashboard', { indicador:'tempo' })} style={{minHeight:48,justifyContent:'center'}}><Text style={{color:'#893467',fontWeight:'600'}}>Entender meu tempo</Text></TouchableOpacity></View>
        {destaques.length>0&&<View style={{marginHorizontal:18,marginBottom:14,gap:10}}><Text style={{fontSize:18,fontWeight:'700',color:'#594367'}}>Para você</Text>{destaques.map(d=><TouchableOpacity key={d.codigo} accessibilityRole="button" onPress={() => d.acao==='notificacoes'?openNotifications():d.acao==='metas'?navigation.navigate('EditProfile',{mode:'goals'}):navigation.navigate('Dashboard',{indicador:'gastos'})} style={{padding:16,minHeight:48,borderRadius:18,backgroundColor:'#FFFFFF',gap:6}}><Text style={{fontSize:16,fontWeight:'600',color:'#594367'}}>{d.titulo}</Text><Text style={{color:'#655A70',lineHeight:19}}>{d.mensagem}</Text></TouchableOpacity>)}</View>}


        {/* <Text style={{ marginVertical: 20, color: COLORS.cadTitulo, fontSize: 18, textAlign: 'center' }} onPress={() => navigation.navigate('Login')}>
          Voltar para Login
        </Text> */}
        {(recomendacoes.loading || recomendacoes.error || recomendacoes.consentimentoAtivo === false || recomendacoes.itens.length > 0) && <View style={{marginHorizontal:18,marginBottom:14,gap:10}}><Text style={{fontSize:18,fontWeight:'700',color:'#594367'}}>Recomendações para você</Text>{recomendacoes.loading ? <Text style={{color:'#655A70'}}>Carregando recomendações...</Text> : recomendacoes.error ? <TouchableOpacity onPress={recomendacoes.refresh} accessibilityRole="button"><Text style={{color:'#893467'}}>Não foi possível carregar recomendações. Tentar novamente</Text></TouchableOpacity> : recomendacoes.consentimentoAtivo === false ? <Text style={{color:'#655A70'}}>Ative as recomendações personalizadas no Perfil para receber sugestões baseadas nos seus dados.</Text> : recomendacoes.itens.map(item => <View key={`recomendacao-${item.id}`} style={{padding:16,minHeight:48,borderRadius:18,backgroundColor:'#FFFFFF',gap:8}}><Text style={{fontSize:16,fontWeight:'600',color:'#594367'}}>{item.titulo}</Text><Text style={{color:'#655A70',lineHeight:19}}>{item.texto}</Text><View style={{flexDirection:'row',gap:16,alignItems:'center'}}><TouchableOpacity accessibilityRole="button" onPress={() => conversarSobreRecomendacao(item)}><Text style={{color:'#893467',fontWeight:'600'}}>Conversar sobre isso</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => recomendacoes.updateStatus(item.id, 'DESCARTADA')}><Text style={{color:'#655A70'}}>Dispensar</Text></TouchableOpacity></View></View>)}</View>}
        {!recomendacoes.loading && !recomendacoes.error && recomendacoes.consentimentoAtivo && recomendacoes.itens.length === 0 && <View style={{marginHorizontal:18,marginBottom:14,padding:16,borderRadius:18,backgroundColor:'#FFFFFF'}}><Text style={{fontSize:16,fontWeight:'600',color:'#594367'}}>Nenhuma recomendação no momento</Text><Text style={{color:'#655A70',marginTop:5}}>Continue acompanhando seus dados para receber sugestões baseadas em evidências.</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}
