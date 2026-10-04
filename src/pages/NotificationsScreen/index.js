import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import PinModal from '../../components/SecurityComponents/PinModal';
import { PROTECTED_ACCESS_STATES, useProtectedAccess } from '../../hooks/useProtectedAccess';
import { COLORS } from '../../constants/colors';
import { getNotifications, markNotificationAsRead } from '../../services/notifications/notificationApi';
import {
  formatNotificationDate,
  getNotificationPresentation,
  isNotificationUnread,
  markNotificationAsReadLocally,
} from '../../services/notifications/notificationPresentation';
import { styles } from './styles';

function NotificationsHeader({ navigation, subtitle }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityLabel="Voltar"
        accessibilityRole="button"
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={23} color={COLORS.cadTitulo} />
      </TouchableOpacity>
      <View style={styles.headerIconBox}>
        <MaterialCommunityIcons name="bell-outline" size={23} color={COLORS.cadTitulo} />
      </View>
      <View style={styles.headerTextGroup}>
        <Text style={styles.title}>Notificações</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function renderSecurityState(protectedAccess, navigation) {
  const isBusy = [PROTECTED_ACCESS_STATES.CHECKING, PROTECTED_ACCESS_STATES.BIOMETRIC].includes(protectedAccess.status);
  const message = protectedAccess.status === PROTECTED_ACCESS_STATES.ERROR
    ? protectedAccess.errorMessage
    : protectedAccess.status === PROTECTED_ACCESS_STATES.BIOMETRIC
      ? 'Confirme sua identidade no aviso do aparelho.'
      : protectedAccess.status === PROTECTED_ACCESS_STATES.LOCKOUT
        ? protectedAccess.errorMessage
        : 'Suas notificações ficam protegidas por uma confirmação local.';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NotificationsHeader navigation={navigation} subtitle="Confirmação necessária para continuar" />
      <View style={styles.stateContainer}>
        {isBusy ? <ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} /> : null}
        <Text style={styles.stateText}>{message}</Text>
        {protectedAccess.status === PROTECTED_ACCESS_STATES.BIOMETRIC ? (
          <TouchableOpacity style={styles.retryButton} onPress={protectedAccess.usePinFallback}>
            <Text style={styles.retryButtonText}>Usar PIN</Text>
          </TouchableOpacity>
        ) : null}
        {protectedAccess.status === PROTECTED_ACCESS_STATES.ERROR ? (
          <TouchableOpacity style={styles.retryButton} onPress={protectedAccess.beginAccess}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <PinModal
        visible={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP || protectedAccess.status === PROTECTED_ACCESS_STATES.PIN}
        mode={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP ? 'setup' : 'unlock'}
        errorMessage={protectedAccess.errorMessage}
        onSubmit={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP ? protectedAccess.completeSetup : protectedAccess.submitPin}
        onCancel={protectedAccess.cancelAccess}
      />
    </SafeAreaView>
  );
}

export default function NotificationsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const protectedAccess = useProtectedAccess();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [readingIds, setReadingIds] = useState({});
  const handledIntentId = useRef(null);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      setNotifications(await getNotifications());
    } catch {
      setErrorMessage('Não foi possível carregar suas notificações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      protectedAccess.beginAccess();

      return () => {
        protectedAccess.cancelAccess();
        setNotifications([]);
        setLoading(true);
        setErrorMessage(null);
        setReadingIds({});
        handledIntentId.current = null;
      };
    }, [protectedAccess.beginAccess, protectedAccess.cancelAccess]),
  );

  useEffect(() => {
    if (!isFocused || protectedAccess.status !== PROTECTED_ACCESS_STATES.UNLOCKED) return;
    loadNotifications();
  }, [isFocused, loadNotifications, protectedAccess.lifecycleRevision, protectedAccess.status]);

  const handleNotificationPress = useCallback(async (notification) => {
    if (!isNotificationUnread(notification) || readingIds[notification.notificacao_id]) return;

    const notificationId = notification.notificacao_id;
    setReadingIds((current) => ({ ...current, [notificationId]: true }));
    try {
      const updatedNotification = await markNotificationAsRead(notificationId);
      const readAt = updatedNotification?.notificacao_lida_em || new Date().toISOString();
      setNotifications((current) => markNotificationAsReadLocally(current, notificationId, readAt));
    } catch {
      // A falha mantém o item não lido para permitir nova tentativa futura.
    } finally {
      setReadingIds((current) => {
        const next = { ...current };
        delete next[notificationId];
        return next;
      });
    }
  }, [readingIds]);

  const notificationId = route.params?.notificationId;
  useEffect(() => {
    if (!notificationId || !notifications.length || handledIntentId.current === String(notificationId)) return;

    const notification = notifications.find((item) => String(item.notificacao_id) === String(notificationId));
    if (!notification) return;

    handledIntentId.current = String(notificationId);
    handleNotificationPress(notification);
  }, [handleNotificationPress, notificationId, notifications]);

  if (protectedAccess.status !== PROTECTED_ACCESS_STATES.UNLOCKED) {
    return renderSecurityState(protectedAccess, navigation);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <NotificationsHeader navigation={navigation} subtitle="Acompanhe os alertas do seu planejamento" />
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} />
          <Text style={styles.stateText}>Carregando notificações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <NotificationsHeader navigation={navigation} subtitle="Acompanhe os alertas do seu planejamento" />
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadNotifications()}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NotificationsHeader navigation={navigation} subtitle="Acompanhe os alertas do seu planejamento" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.notificacao_id)}
        contentContainerStyle={notifications.length ? styles.listContent : styles.emptyContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor={COLORS.dadoUm} />}
        ListEmptyComponent={(
          <View style={styles.stateContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={38} color={COLORS.dadoUm} />
            <Text style={styles.stateText}>Você ainda não possui notificações.</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const presentation = getNotificationPresentation(item.notificacao_tipo);
          const unread = isNotificationUnread(item);

          return (
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.card, unread ? styles.unreadCard : null]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.85}
              disabled={Boolean(readingIds[item.notificacao_id])}
            >
              <View style={styles.cardIconBox}>
                <MaterialCommunityIcons name={presentation.icon} size={21} color={COLORS.cadTitulo} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.typeLabel}>{presentation.label}</Text>
                  {unread ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={[styles.cardTitle, unread ? styles.unreadTitle : null]}>{item.notificacao_titulo || 'Alerta do Plenna'}</Text>
                <Text style={styles.cardMessage}>{item.notificacao_mensagem || 'Você tem um novo alerta no seu planejamento.'}</Text>
                <Text style={styles.cardDate}>{formatNotificationDate(item.notificacao_data_criacao)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
