import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import PurchaseHero from '../../components/PurchaseHero';
import { COLORS } from '../../constants/colors';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import AlertasHabito from '../../components/DashboardComponents/AlertasHabito';
import { getUnreadCount, waitForPendingNotificationReads } from '../../services/notifications/notificationApi';
import { getUnreadBadgeLabel } from '../../services/notifications/notificationPresentation';

export default function HomeScreen({ navigation }) {
  const { fetchCompras, fetchUsuario } = useDataRefresh();
  const [compras, setCompras] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFocused = useIsFocused();
  const bellRotation = useRef(new Animated.Value(0)).current;
  const bellAnimationRef = useRef(null);

  const refetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [comprasData, usuarioData] = await Promise.all([fetchCompras(), fetchUsuario()]);

      setCompras(comprasData.compras);
      setUsuario(usuarioData);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCompras, fetchUsuario]);

  const refetchUnreadCount = useCallback(async () => {
    try {
      await waitForPendingNotificationReads();
      setUnreadCount(await getUnreadCount());
    } catch {
      // O sino continua funcional mesmo quando a consulta do contador falha.
    }
  }, []);

  useEffect(() => {
    refetchAllData();
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, marginTop: 10 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAllData} tintColor={COLORS.dadoUm} />}>
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

        <PurchaseHero />
        <GastosTotais compras={compras} meta={usuario?.usuario_meta_valor_mensal} />

        <AlertasHabito />

        {/* <Text style={{ marginVertical: 20, color: COLORS.cadTitulo, fontSize: 18, textAlign: 'center' }} onPress={() => navigation.navigate('Login')}>
          Voltar para Login
        </Text> */}
      </ScrollView>
    </SafeAreaView>
  );
}
